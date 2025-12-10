'use server'

import { createClient } from '@/lib/supabase/server'
import { compare } from 'bcryptjs'
import { StaffRole } from '@/lib/types/database.types'
import { cookies } from 'next/headers'
import { createClient as createVanillaClient } from '@supabase/supabase-js'

export async function verifyStaffPin(shopId: string, staffId: string, pin: string) {
    const supabase = await createClient()

    // Get staff member with PIN
    // We use createClient() which uses the user's session if available, 
    // but for PIN login we might be unauthenticated.
    // However, we need to read the PIN hash which is sensitive.
    // The 'shop_staff' table should be readable by authenticated users (managers).
    // But here we are logging in as a staff member who might not be authenticated yet.
    // So we might need to use Service Role to fetch the PIN hash for verification.
    // BUT, we must be careful not to expose the PIN hash to the client.

    // Since we are in a Server Action, we can use Service Role safely as long as we don't return sensitive data.
    const { createServiceRoleClient } = await import('@/lib/supabase/server')
    const serviceClient = createServiceRoleClient()

    const { data: staffData, error } = await serviceClient
        .from('shop_staff')
        .select('*')
        .eq('id', staffId)
        .eq('shop_id', shopId)
        .single()

    if (error || !staffData) {
        return { error: 'Staff member not found' }
    }

    if (!staffData.pin) {
        return {
            needsSetup: true,
            staff: {
                id: staffData.id,
                shop_id: staffData.shop_id,
                role: staffData.role as StaffRole,
                name: staffData.name,
                user_id: staffData.user_id,
                avatar_url: staffData.avatar_url,
                quick_checkout_role: staffData.quick_checkout_role
            }
        }
    }

    // Verify PIN using bcrypt
    const isValid = await compare(pin, staffData.pin)

    if (!isValid) {
        return { error: 'Incorrect PIN' }
    }

    // ROSTER-BASED MODEL: Update working_shop for the STAFF MEMBER (not the browser user)
    // This ensures the correct person is marked as clocked in
    if (staffData.user_id) {
        const { error: updateError } = await serviceClient
            .from('working_shop')
            .update({
                clocked_in: true,
                clocked_out: false,
                updated_at: new Date().toISOString()
            })
            .eq('shop_id', shopId)
            .eq('user_id', staffData.user_id)

        if (updateError) {
            console.error('Error updating working_shop:', updateError)
            return { error: 'Failed to start session' }
        }

        // Create secure session cookie for POS access
        const cookieStore = await cookies()
        cookieStore.set('pos_staff_session', JSON.stringify({ userId: staffData.user_id, shopId }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 12 // 12 hours
        })
    }

    // Check if user needs to change password
    if (staffData.user_id) {
        const { data: profile } = await serviceClient
            .from('profiles')
            .select('has_temporary_password')
            .eq('id', staffData.user_id)
            .single()

        if (profile?.has_temporary_password) {
            return {
                success: true,
                mustChangePassword: true,
                staff: {
                    id: staffData.id,
                    shop_id: staffData.shop_id,
                    role: staffData.role as StaffRole,
                    name: staffData.name,
                    user_id: staffData.user_id,
                    avatar_url: staffData.avatar_url,
                    quick_checkout_role: staffData.quick_checkout_role
                }
            }
        }
    }

    return {
        success: true,
        staff: {
            id: staffData.id,
            shop_id: staffData.shop_id,
            role: staffData.role as StaffRole,
            name: staffData.name,
            user_id: staffData.user_id,
            avatar_url: staffData.avatar_url,
            quick_checkout_role: staffData.quick_checkout_role
        }
    }
}

export async function getShopAndStaffForLogin(shopId: string) {
    console.log('[getShopAndStaffForLogin] Starting for shopId:', shopId)

    // Use Service Role Client - NO auth session checks
    const { createServiceRoleClient } = await import('@/lib/supabase/server')
    const serviceClient = createServiceRoleClient()

    try {
        // Load shop info
        const { data: shopData, error: shopError } = await serviceClient
            .from('shops')
            .select('id, name, business_type')
            .eq('id', shopId)
            .single()

        if (shopError) throw shopError
        if (!shopData) return { error: 'Shop not found' }

        // ROSTER-BASED MODEL: Get users who have selected this shop and are clocked out (available)
        const { data: workingShopUsers, error: workingShopError } = await serviceClient
            .from('working_shop')
            .select('user_id')
            .eq('shop_id', shopId)
            .eq('clocked_out', true) // Only get users who are clocked OUT (available to clock in)

        if (workingShopError) {
            console.error('[getShopAndStaffForLogin] Error fetching working_shop:', workingShopError)
            throw workingShopError
        }

        // Extract user_ids who have selected this shop and are clocked out
        const availableUserIds = workingShopUsers?.map(w => w.user_id) || []

        console.log('[getShopAndStaffForLogin] Users on roster (clocked out):', availableUserIds.length)

        // If no users have selected this shop, return empty staff list
        if (availableUserIds.length === 0) {
            console.log('[getShopAndStaffForLogin] No users on roster for this shop')
            return {
                success: true,
                shop: shopData,
                staff: []
            }
        }

        // Get staff members whose user_id is in the available list
        const { data: staffData, error: staffError } = await serviceClient
            .from('shop_staff')
            .select('id, name, role, avatar_url, user_id')
            .eq('shop_id', shopId)
            .not('accepted_at', 'is', null) // Must have accepted invitation
            .in('user_id', availableUserIds) // Must be on the roster
            .order('name', { ascending: true })

        if (staffError) {
            console.error('[getShopAndStaffForLogin] Error fetching staff:', staffError)
            throw staffError
        }

        console.log('[getShopAndStaffForLogin] Staff members to show:', staffData?.length || 0)

        return {
            success: true,
            shop: shopData,
            staff: staffData || []
        }
    } catch (error) {
        console.error('Error loading shop and staff:', error)
        return { error: 'Failed to load shop data' }
    }
}
export async function setPinForStaff(shopId: string, staffId: string, pin: string) {
    const { createServiceRoleClient } = await import('@/lib/supabase/server')
    const serviceClient = createServiceRoleClient()

    // Hash the PIN
    const { hash } = await import('bcryptjs')
    const hashedPin = await hash(pin, 10)

    // Update the staff member's PIN and mark invitation as accepted
    const { error } = await serviceClient
        .from('shop_staff')
        .update({
            pin: hashedPin,
            accepted_at: new Date().toISOString() // Mark as accepted (Active status)
        })
        .eq('id', staffId)
        .eq('shop_id', shopId)

    if (error) {
        console.error('Error setting PIN:', error)
        return { error: 'Failed to set PIN' }
    }

    // Create working_shop record so user appears on the profiles page
    // Use service role client to bypass RLS

    // We need the user_id to insert into working_shop.
    // We can get it from the staff record we just updated.
    const { data: updatedStaff } = await serviceClient
        .from('shop_staff')
        .select('user_id')
        .eq('id', staffId)
        .single()

    if (updatedStaff?.user_id) {
        const { error: workingShopError } = await serviceClient
            .from('working_shop')
            .upsert({
                shop_id: shopId,
                user_id: updatedStaff.user_id,
                clocked_in: false,
                clocked_out: true,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'shop_id,user_id'
            })

        if (workingShopError) {
            console.error('Error creating working_shop record:', workingShopError)
        }
    }

    return { success: true }
}

/**
 * Finish shift for a staff member - requires PIN verification
 * The PIN can be either:
 * 1. The target staff member's own PIN (finishing their own shift)
 * 2. A manager's PIN (manager finishing another staff member's shift)
 */
export async function finishForToday(shopId: string, targetUserId: string, pin: string) {
    const { createServiceRoleClient } = await import('@/lib/supabase/server')
    const serviceClient = createServiceRoleClient()

    // Get all staff members for this shop to check PINs
    const { data: allStaff, error: staffError } = await serviceClient
        .from('shop_staff')
        .select('id, user_id, role, pin, name')
        .eq('shop_id', shopId)
        .not('pin', 'is', null)

    if (staffError || !allStaff) {
        return { error: 'Failed to verify credentials' }
    }

    // Find the target staff member
    const targetStaff = allStaff.find(s => s.user_id === targetUserId)
    if (!targetStaff) {
        return { error: 'Staff member not found' }
    }

    // Try to verify PIN against target user first (self-finish)
    let authorized = false
    let authorizerName = ''

    if (targetStaff.pin) {
        const isOwnPin = await compare(pin, targetStaff.pin)
        if (isOwnPin) {
            authorized = true
            authorizerName = targetStaff.name
        }
    }

    // If not own PIN, check if it's a manager's PIN
    if (!authorized) {
        const managers = allStaff.filter(s => s.role === 'manager' && s.pin)
        for (const manager of managers) {
            const isManagerPin = await compare(pin, manager.pin)
            if (isManagerPin) {
                authorized = true
                authorizerName = manager.name
                break
            }
        }
    }

    if (!authorized) {
        return { error: 'Invalid PIN' }
    }

    // Delete the working_shop record for the target user
    const { error: deleteError } = await serviceClient
        .from('working_shop')
        .delete()
        .eq('shop_id', shopId)
        .eq('user_id', targetUserId)

    if (deleteError) {
        console.error('[finishForToday] Error deleting working_shop:', deleteError)
        return { error: 'Failed to end shift' }
    }

    // Sign out the user from Supabase Auth using admin API
    // Note: This will invalidate all their sessions across all devices
    try {
        const { error: signOutError } = await serviceClient.auth.admin.signOut(targetUserId)
        if (signOutError) {
            console.warn('[finishForToday] Warning: Failed to sign out user (session might persist):', signOutError.message)
        }

        // Also clear the local session cookie if it matches the target user
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get('pos_staff_session')
        if (sessionCookie) {
            try {
                const session = JSON.parse(sessionCookie.value)
                if (session.userId === targetUserId) {
                    cookieStore.delete('pos_staff_session')
                }
            } catch (e) {
                // Invalid cookie, just delete it
                cookieStore.delete('pos_staff_session')
            }
        }
    } catch (err) {
        console.warn('[finishForToday] Exception during sign out (ignoring):', err)
    }

    return {
        success: true,
        message: `${targetStaff.name}'s shift has ended`,
        authorizedBy: authorizerName
    }
}

/**
 * Start a new shift - staff logs in with email/password and joins the roster
 */
export async function startShift(shopId: string, email: string, password: string) {
    // Use a temporary client that DOES NOT persist the session
    // This allows us to verify credentials without logging the browser in
    const tempClient = createVanillaClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        }
    )

    // Sign in with email/password
    const { data: authData, error: authError } = await tempClient.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
    })

    if (authError || !authData.user) {
        return { error: authError?.message || 'Login failed' }
    }

    const userId = authData.user.id

    // Check if user is a staff member for this shop
    const { createServiceRoleClient } = await import('@/lib/supabase/server')
    const serviceClient = createServiceRoleClient()

    const { data: staffRecord, error: staffError } = await serviceClient
        .from('shop_staff')
        .select('id, name, role')
        .eq('shop_id', shopId)
        .eq('user_id', userId)
        .not('accepted_at', 'is', null)
        .single()

    if (staffError || !staffRecord) {
        return { error: 'You are not a staff member of this shop' }
    }

    // Create/update working_shop record to add them to the roster
    const { error: workingShopError } = await serviceClient
        .from('working_shop')
        .upsert({
            shop_id: shopId,
            user_id: userId,
            clocked_in: false,
            clocked_out: true,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'shop_id,user_id'
        })

    if (workingShopError) {
        console.error('[startShift] Error creating working_shop:', workingShopError)
        return { error: 'Failed to start shift' }
    }

    return {
        success: true,
        message: `Welcome, ${staffRecord.name}! You are now on the roster.`,
        staff: {
            id: staffRecord.id,
            name: staffRecord.name,
            role: staffRecord.role
        }
    }
}
