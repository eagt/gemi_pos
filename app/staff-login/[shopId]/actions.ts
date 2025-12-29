'use server'

import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'
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
                restaurantRole: staffData.restaurant_role as StaffRole,
                name: staffData.name,
                user_id: staffData.user_id,
                avatar_url: staffData.avatar_url,
                quick_checkout_role: staffData.quick_checkout_role
            }
        }
    }

    // Check if user needs to change password - do this BEFORE PIN validation
    // so that the proactive check (empty PIN) can trigger the redirect
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
                    restaurantRole: staffData.restaurant_role as StaffRole,
                    name: staffData.name,
                    user_id: staffData.user_id,
                    avatar_url: staffData.avatar_url,
                    quick_checkout_role: staffData.quick_checkout_role
                }
            }
        }
    }

    // Verify PIN using bcrypt
    const isValid = await bcrypt.compare(pin.trim(), staffData.pin)

    if (!isValid) {
        if (pin !== '') {
            console.log('[verifyStaffPin] PIN comparison failed for staff:', staffId)
        }
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

    return {
        success: true,
        staff: {
            id: staffData.id,
            shop_id: staffData.shop_id,
            restaurantRole: staffData.restaurant_role as StaffRole,
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
            .select('id, name, restaurant_role, avatar_url, user_id, quick_checkout_role, authorization_status')
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
    const hashedPin = await bcrypt.hash(pin.trim(), 10)

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

    let mustChangePassword = false
    if (updatedStaff?.user_id) {
        // Check for temporary password
        const { data: profile } = await serviceClient
            .from('profiles')
            .select('has_temporary_password')
            .eq('id', updatedStaff.user_id)
            .single()

        if (profile?.has_temporary_password) {
            mustChangePassword = true
        }

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

    return { success: true, mustChangePassword }
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
        .select('id, user_id, restaurant_role, pin, name, quick_checkout_role')
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
        const isOwnPin = await bcrypt.compare(pin.trim(), targetStaff.pin)
        if (isOwnPin) {
            authorized = true
            authorizerName = targetStaff.name
        }
    }

    // If not own PIN, check if it's a manager's PIN
    if (!authorized) {
        // Fetch shop type to know which role to check for management
        const { data: shop } = await serviceClient.from('shops').select('business_type').eq('id', shopId).single()

        const managers = allStaff.filter(s => {
            if (shop?.business_type === 'quick_checkout') {
                return (s.quick_checkout_role === 'manager' || s.quick_checkout_role === 'administrator') && s.pin
            } else {
                return (s.restaurant_role === 'manager' || s.restaurant_role === 'administrator') && s.pin
            }
        })

        for (const manager of managers) {
            if (manager.pin) {
                const isManagerPin = await bcrypt.compare(pin.trim(), manager.pin)
                if (isManagerPin) {
                    authorized = true
                    authorizerName = manager.name
                    break
                }
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

    // Reset authorization status to Null (Finish clicked)
    await serviceClient
        .from('shop_staff')
        .update({ authorization_status: null })
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
        message: `${capitalizeName(targetStaff.name)}'s shift has ended`,
        authorizedBy: authorizerName
    }
}

/**
 * Start a new shift - staff logs in with email/password and joins the roster
 */
export async function startShift(shopId: string, email: string, password: string, force: boolean = false) {
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
        .select('id, name, restaurant_role, quick_checkout_role')
        .eq('shop_id', shopId)
        .eq('user_id', userId)
        .not('accepted_at', 'is', null)
        .single()

    if (staffError || !staffRecord) {
        return { error: 'You are not a staff member of this shop' }
    }

    // MULTI-SHOP SESSION HANDOVER: Check if user is on another shop's roster
    const { data: existingSession } = await serviceClient
        .from('working_shop')
        .select('shop_id, shops(name)')
        .eq('user_id', userId)
        .single()

    if (existingSession && existingSession.shop_id !== shopId) {
        if (!force) {
            return {
                confirmationNeeded: true,
                previousShopName: (existingSession.shops as any)?.name || 'Another Shop'
            }
        }

        // Terminate previous session and remove from previous roster
        await serviceClient
            .from('working_shop')
            .delete()
            .eq('shop_id', existingSession.shop_id)
            .eq('user_id', userId)
    }

    // Create/update working_shop record to add them to the roster for THIS shop
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

    // Reset authorization status to Null for the new shift join
    await serviceClient
        .from('shop_staff')
        .update({ authorization_status: null })
        .eq('shop_id', shopId)
        .eq('user_id', userId)

    return {
        success: true,
        message: `Welcome, ${capitalizeName(staffRecord.name)}! You are now on the roster.`,
        staff: {
            id: staffRecord.id,
            name: staffRecord.name,
            restaurant_role: staffRecord.restaurant_role,
            quick_checkout_role: staffRecord.quick_checkout_role
        }
    }
}

function capitalizeName(name: string): string {
    if (!name) return ''
    return name.charAt(0).toUpperCase() + name.slice(1)
}

// --- New Manager Authorization Actions ---

async function verifyPinOnly(shopId: string, staffId: string, pin: string) {
    const { createServiceRoleClient } = await import('@/lib/supabase/server')
    const serviceClient = createServiceRoleClient()

    const { data: staffData } = await serviceClient
        .from('shop_staff')
        .select('*')
        .eq('id', staffId)
        .eq('shop_id', shopId)
        .single()

    if (!staffData || !staffData.pin) {
        console.log('[verifyPinOnly] Staff or PIN missing for ID:', staffId)
        return null
    }

    const isValid = await bcrypt.compare(pin.trim(), staffData.pin)
    if (!isValid) console.log('[verifyPinOnly] PIN comparison failed for ID:', staffId)
    return isValid ? staffData : null
}

export async function requestClockIn(shopId: string, staffId: string, pin: string) {
    const { createServiceRoleClient } = await import('@/lib/supabase/server')
    const serviceClient = createServiceRoleClient()

    // 1. Verify PIN
    const staff = await verifyPinOnly(shopId, staffId, pin)
    if (!staff) return { error: 'Invalid PIN' }



    // Check Status (Auto-approve Managers or already authorized)
    let initialStatus: 'pending' | 'approved' = 'pending'
    let isAlreadyAuthorized = staff.authorization_status === 'yes'

    if (isAlreadyAuthorized) {
        initialStatus = 'approved'
    } else {
        // Fetch shop type
        const { data: shop } = await serviceClient.from('shops').select('business_type').eq('id', shopId).single()
        const rRole = staff.restaurant_role
        const qcRole = staff.quick_checkout_role

        // Managers/Admins bypass authorization for their specific business type
        if (shop?.business_type === 'quick_checkout') {
            if (qcRole === 'manager' || qcRole === 'administrator') {
                initialStatus = 'approved'
            }
        } else {
            if (rRole === 'manager' || rRole === 'administrator') {
                initialStatus = 'approved'
            }
        }
    }

    if (staff.authorization_status === 'no') {
        return { error: 'Access denied by manager' }
    }
    const { data: request, error } = await serviceClient
        .from('clock_in_requests')
        .insert({
            shop_id: shopId,
            staff_user_id: staff.user_id,
            status: initialStatus,
            responded_by_user_id: initialStatus === 'approved' ? staff.user_id : null,
            responded_at: initialStatus === 'approved' ? new Date().toISOString() : null
        })
        .select()
        .single()

    if (error) {
        console.error("Error creating clock-in request:", error)
        return { error: 'Failed to create request' }
    }

    return {
        success: true,
        requestId: request.id,
        status: request.status,
        staffName: staff.name
    }
}

export async function approveClockInRequest(shopId: string, requestId: string, managerPin: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // 1. Verify Manager PIN (Current User)
    // Find manager staff record
    const { createServiceRoleClient } = await import('@/lib/supabase/server')
    const serviceClient = createServiceRoleClient()

    const { data: managerStaff } = await serviceClient
        .from('shop_staff')
        .select('*')
        .eq('shop_id', shopId)
        .eq('user_id', user.id)
        .single()

    if (!managerStaff || !managerStaff.pin) {
        console.log('[approveClockInRequest] Manager staff record or PIN not found for user:', user.id)
        return { error: 'Manager PIN not set' }
    }

    const isValid = await bcrypt.compare(managerPin.trim(), managerStaff.pin)

    if (!isValid) {
        console.log('[approveClockInRequest] PIN comparison failed for manager user:', user.id)
        return { error: 'Invalid Manager PIN' }
    }

    // Check Role Authorization based on business type
    const { data: shop } = await serviceClient.from('shops').select('business_type').eq('id', shopId).single()
    const rRole = managerStaff.restaurant_role
    const qcRole = managerStaff.quick_checkout_role

    let isManager = false
    if (shop?.business_type === 'quick_checkout') {
        isManager = qcRole === 'manager' || qcRole === 'administrator' || qcRole === 'supervisor'
    } else {
        isManager = rRole === 'manager' || rRole === 'administrator' || rRole === 'supervisor'
    }

    if (!isManager) {
        console.log(`[approveClockInRequest] User ${user.id} is not a manager for ${shop?.business_type} shop`)
        return { error: 'Insufficient permissions' }
    }

    // 2. Update Request
    const { error } = await serviceClient
        .from('clock_in_requests')
        .update({
            status: 'approved',
            responded_by_user_id: user.id,
            responded_at: new Date().toISOString()
        })
        .eq('id', requestId)

    if (error) return { error: 'Failed to approve request' }

    // 3. Update Staff Authorization Status
    const { data: requestData } = await serviceClient.from('clock_in_requests').select('staff_user_id').eq('id', requestId).single()
    if (requestData) {
        await serviceClient
            .from('shop_staff')
            .update({ authorization_status: 'yes' })
            .eq('shop_id', shopId)
            .eq('user_id', requestData.staff_user_id)
    }

    return { success: true }
}

export async function denyClockInRequest(shopId: string, requestId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { createServiceRoleClient } = await import('@/lib/supabase/server')
    const serviceClient = createServiceRoleClient()

    // Update Request
    const { error } = await serviceClient
        .from('clock_in_requests')
        .update({
            status: 'denied',
            responded_by_user_id: user.id,
            responded_at: new Date().toISOString()
        })
        .eq('id', requestId)

    if (error) return { error: 'Failed to deny request' }

    // 2. Update Staff Authorization Status
    const { data: requestData } = await serviceClient.from('clock_in_requests').select('staff_user_id').eq('id', requestId).single()
    if (requestData) {
        await serviceClient
            .from('shop_staff')
            .update({ authorization_status: 'no' })
            .eq('shop_id', shopId)
            .eq('user_id', requestData.staff_user_id)
    }

    return { success: true }
}

export async function dismissClockInRequest(requestId: string) {
    const { createServiceRoleClient } = await import('@/lib/supabase/server')
    const serviceClient = createServiceRoleClient()

    const { error } = await serviceClient
        .from('clock_in_requests')
        .update({ is_dismissed: true })
        .eq('id', requestId)

    if (error) {
        console.error('[dismissClockInRequest] Error:', error)
        return { error: 'Failed to dismiss request' }
    }

    return { success: true }
}

export async function completeClockIn(requestId: string) {
    const { createServiceRoleClient } = await import('@/lib/supabase/server')
    const serviceClient = createServiceRoleClient()

    // 1. Fetch Request
    const { data: request } = await serviceClient
        .from('clock_in_requests')
        .select('*')
        .eq('id', requestId)
        .single()

    if (!request) return { error: 'Request not found' }
    if (request.status !== 'approved') return { error: 'Request not approved' }

    // Fetch staff member
    const { data: staffMember } = await serviceClient
        .from('shop_staff')
        .select('*')
        .eq('shop_id', request.shop_id)
        .eq('user_id', request.staff_user_id)
        .single()

    if (!staffMember) return { error: 'Staff member not found' }

    // 1.5 Check for temporary password change requirement
    const { data: profile } = await serviceClient
        .from('profiles')
        .select('has_temporary_password')
        .eq('id', staffMember.user_id)
        .single()

    if (profile?.has_temporary_password) {
        return {
            success: true,
            mustChangePassword: true
        }
    }

    // 2. Create Session (Cookie)
    const sessionData = {
        userId: staffMember.user_id,
        shopId: staffMember.shop_id
    }

    const cookieStore = await cookies()
    cookieStore.set('pos_staff_session', JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 12 // 12 hours
    })

    // 3. Update Working Shop (Clock In)
    await serviceClient
        .from('working_shop')
        .update({
            clocked_in: true,
            clocked_out: false,
            updated_at: new Date().toISOString()
        })
        .eq('shop_id', staffMember.shop_id)
        .eq('user_id', staffMember.user_id)

    // 4. Update Authorization Status to 'yes'
    await serviceClient
        .from('shop_staff')
        .update({ authorization_status: 'yes' })
        .eq('shop_id', staffMember.shop_id)
        .eq('user_id', staffMember.user_id)

    return {
        success: true,
        mustChangePassword: false,
        message: `Welcome back, ${capitalizeName(staffMember.name)}`
    }
}
