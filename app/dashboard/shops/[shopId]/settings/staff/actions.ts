'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

// GET STAFF LIST — used by staff/page.tsx
export async function getStaffList(shopId: string) {
    const admin = createServiceRoleClient()

    // Fetch staff list first
    const { data: staffList } = await admin
        .from('shop_staff')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })

    if (!staffList || staffList.length === 0) return []

    // Build a map of staff IDs to names for inviter lookup
    const staffMap = new Map(staffList.map(s => [s.id, s.name]))

    // Add inviter name to each staff member
    return staffList.map(staff => ({
        ...staff,
        invited_by_staff: staff.invited_by
            ? [{ name: staffMap.get(staff.invited_by) || null }]
            : null
    }))
}

// INVITE STAFF — sends invitation + creates shop_staff entry
// INVITE STAFF — sends invitation + creates shop_staff entry
export async function inviteStaff(
    shopId: string,
    name: string,
    email: string,
    role: string,
    inviterStaffId?: string,
    businessType: 'quick_checkout' | 'table_order' = 'table_order'
) {
    const client = createServiceRoleClient()

    // ... (rest of user creation logic) ... (Use a view_file range to skip unchanged parts if possible, but simpler to just replace logic block)
    // Actually, I'll use multi_replace for signature and insert block.
    // Since I'm using replace_file_content, I need to be careful.
    // I will replace the function start and the insert block.

    // START OF FUNCTION REPLACEMENT
    // Query profiles table instead of RPC
    const { data: profile } = await client
        .from('profiles')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .single()

    let userId = profile?.id
    let tempPassword = null

    if (userId) {
        console.log('[inviteStaff] Found existing user:', userId)
    } else {
        console.log('[inviteStaff] Creating new user for:', email)
        tempPassword = 'temp' + Math.floor(100000 + Math.random() * 900000)
        const { data: newUser, error } = await client.auth.admin.createUser({
            email: email.trim().toLowerCase(),
            password: tempPassword,
            email_confirm: true,
            user_metadata: { full_name: name }
        })

        if (error) {
            // ... (keep exact existing user recovery logic)
            if (error.code === 'email_exists' || error.message?.includes('already been registered')) {
                console.log('[inviteStaff] User exists in Auth but not Profiles. Recovering...')
                const { data: { users } } = await client.auth.admin.listUsers({ perPage: 1000 })
                const existingUser = users.find(u => u.email?.toLowerCase() === email.trim().toLowerCase())

                if (existingUser) {
                    userId = existingUser.id
                    tempPassword = null
                } else {
                    console.error('[inviteStaff] Email exists but could not find in listUsers')
                    throw error
                }
            } else {
                console.error('[inviteStaff] Create user error:', error)
                throw error
            }
        } else {
            userId = newUser.user.id
        }

        // Ensure profile exists
        await client.from('profiles').upsert({
            id: userId,
            email: email.trim().toLowerCase(),
            full_name: name,
            has_temporary_password: true,
            updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
    }

    // Check if already staff
    const { data: existingStaff } = await client
        .from('shop_staff')
        .select('id')
        .eq('shop_id', shopId)
        .eq('user_id', userId)
        .single()

    if (existingStaff) {
        return { error: 'User is already a staff member' }
    }

    // Use provided inviterStaffId if available, otherwise try to get from auth user
    let inviterId = inviterStaffId || null
    if (!inviterId) {
        const supabase = await createClient()
        const { data: { user: currentUser } } = await supabase.auth.getUser()

        if (currentUser) {
            const { data: inviter } = await client
                .from('shop_staff')
                .select('id')
                .eq('shop_id', shopId)
                .eq('user_id', currentUser.id)
                .single()
            inviterId = inviter?.id || null
        }
    }

    // Determine roles for DB insertion
    let rRole = 'waiter' // Default restaurant role
    let qcRole = null

    if (businessType === 'quick_checkout') {
        qcRole = role
    } else {
        rRole = role
    }

    const { error: insertError } = await client
        .from('shop_staff')
        .insert({
            shop_id: shopId,
            user_id: userId,
            name: name.trim(),
            restaurant_role: rRole,
            quick_checkout_role: qcRole,
            accepted_at: null,
            is_active: true,
            invited_by: inviterId
        })

    if (insertError) {
        console.error('[inviteStaff] Insert staff error:', insertError)
        throw insertError
    }

    if (tempPassword) {
        return {
            credentials: {
                email,
                password: tempPassword
            }
        }
    }



    return { existingUser: true }
}

// Optional — keep if used elsewhere
// Optional — keep if used elsewhere
export async function updateStaffRole(
    shopId: string,
    staffId: string,
    newRole: string,
    businessType: 'quick_checkout' | 'table_order' = 'table_order'
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check permissions (Owner or Manager)
    const { data: shop } = await supabase
        .from('shops')
        .select('owner_id')
        .eq('id', shopId)
        .single()

    const { data: currentUserStaff } = await supabase
        .from('shop_staff')
        .select('restaurant_role, quick_checkout_role')
        .eq('shop_id', shopId)
        .eq('user_id', user.id)
        .single()

    const isOwner = shop?.owner_id === user.id
    const isManager = currentUserStaff?.restaurant_role === 'manager' || currentUserStaff?.quick_checkout_role === 'manager'

    if (!isOwner && !isManager) {
        return { error: 'Permission denied' }
    }

    // Update the role based on business type
    let updatePayload = {}
    if (businessType === 'quick_checkout') {
        updatePayload = { quick_checkout_role: newRole }
    } else {
        updatePayload = { restaurant_role: newRole }
    }

    const { error } = await supabase
        .from('shop_staff')
        .update(updatePayload)
        .eq('id', staffId)
        .eq('shop_id', shopId)

    if (error) {
        console.error('Error updating staff role:', error)
        return { error: 'Failed to update role' }
    }

    return { success: true }
}
export async function deactivateStaffMember(shopId: string, staffId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check permissions (Owner or Manager)
    const { data: shop } = await supabase
        .from('shops')
        .select('owner_id')
        .eq('id', shopId)
        .single()

    const { data: currentUserStaff } = await supabase
        .from('shop_staff')
        .select('restaurant_role, quick_checkout_role')
        .eq('shop_id', shopId)
        .eq('user_id', user.id)
        .single()

    const isOwner = shop?.owner_id === user.id
    const isManager = currentUserStaff?.restaurant_role === 'manager' || currentUserStaff?.quick_checkout_role === 'manager'

    if (!isOwner && !isManager) {
        return { error: 'Permission denied' }
    }

    // Prevent deactivating yourself
    const { data: targetStaff } = await supabase
        .from('shop_staff')
        .select('user_id')
        .eq('id', staffId)
        .single()

    if (targetStaff?.user_id === user.id) {
        return { error: 'You cannot deactivate yourself' }
    }

    // Delete the staff record
    const { error } = await supabase
        .from('shop_staff')
        .delete()
        .eq('id', staffId)
        .eq('shop_id', shopId)

    if (error) {
        console.error('Error deactivating staff:', error)
        return { error: 'Failed to deactivate staff' }
    }

    // Also remove their working_shop record if it exists
    if (targetStaff?.user_id) {
        const admin = createServiceRoleClient()
        await admin
            .from('working_shop')
            .delete()
            .eq('shop_id', shopId)
            .eq('user_id', targetStaff.user_id)
    }

    return { success: true }
}