'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { QuickCheckoutRole, roleHasPermission } from '@/lib/permissions/quick-checkout-permissions'

// Get staff list for quick_checkout business
export async function getQuickCheckoutStaff(shopId: string) {
    const supabase = await createClient()

    const { data: staff, error } = await supabase
        .from('shop_staff')
        .select(`
            *,
            invited_by_staff:shop_staff!invited_by (name)
        `)
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching staff:', error)
        return []
    }

    return staff
}

// Invite staff member for quick_checkout
export async function inviteQuickCheckoutStaff(
    shopId: string,
    name: string,
    email: string,
    phone: string | null,
    role: QuickCheckoutRole
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Verify inviter has permission
    const hasPermission = await checkPermission(shopId, user.id, 'staff.invite')
    if (!hasPermission) {
        return { error: 'You do not have permission to invite staff' }
    }

    // Get inviter's staff ID
    const { data: inviter } = await supabase
        .from('shop_staff')
        .select('id')
        .eq('shop_id', shopId)
        .eq('user_id', user.id)
        .single()

    if (!inviter) return { error: 'Inviter not found' }

    // Generate temporary password
    const tempPassword = process.env.NODE_ENV === 'production'
        ? generateSecurePassword()
        : 'temp123456'

    // Create Supabase Auth user using service role client (admin API)
    const serviceClient = createServiceRoleClient()
    const { data: authUser, error: authError } = await serviceClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
            full_name: name
        }
    })

    if (authError || !authUser.user) {
        console.error('Error creating auth user:', authError)
        return { error: 'Failed to create user account: ' + (authError?.message || 'Unknown error') }
    }

    // Create shop_staff entry with user_id
    const { error: staffError } = await supabase
        .from('shop_staff')
        .insert({
            shop_id: shopId,
            user_id: authUser.user.id,
            restaurant_role: 'waiter', // Default placeholder
            name,
            email,
            phone,
            quick_checkout_role: role,
            invited_by: inviter.id,
            // accepted_at is NULL for invited staff (Pending status)
        })

    if (staffError) {
        console.error('Error creating staff:', staffError)
        // Clean up auth user if staff creation fails
        await serviceClient.auth.admin.deleteUser(authUser.user.id)
        return { error: 'Failed to create staff member' }
    }

    revalidatePath(`/dashboard/shops/${shopId}/staff-qc`)
    return {
        success: true,
        credentials: {
            email,
            password: tempPassword
        }
    }
}

// Helper function to generate secure password
function generateSecurePassword(): string {
    const length = 16
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
}

// Update staff role
export async function updateStaffRole(
    shopId: string,
    staffId: string,
    newRole: QuickCheckoutRole
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Verify permission
    const hasPermission = await checkPermission(shopId, user.id, 'staff.edit')
    if (!hasPermission) {
        return { error: 'You do not have permission to edit staff' }
    }

    // Get old role for audit
    const { data: oldStaff } = await supabase
        .from('shop_staff')
        .select('quick_checkout_role')
        .eq('id', staffId)
        .single()

    // Update role
    const { error } = await supabase
        .from('shop_staff')
        .update({ quick_checkout_role: newRole })
        .eq('id', staffId)
        .eq('shop_id', shopId)

    if (error) {
        console.error('Error updating role:', error)
        return { error: 'Failed to update role' }
    }

    // Log the change
    await supabase
        .from('staff_permission_audit')
        .insert({
            staff_id: staffId,
            changed_by_user_id: user.id,
            change_type: 'role_change',
            old_value: oldStaff?.quick_checkout_role || null,
            new_value: newRole
        })

    revalidatePath(`/dashboard/shops/${shopId}/staff-qc`)
    return { success: true }
}

// Toggle individual permission
export async function togglePermission(
    shopId: string,
    staffId: string,
    permissionKey: string,
    isGranted: boolean
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Verify permission
    const hasPermission = await checkPermission(shopId, user.id, 'staff.manage_permissions')
    if (!hasPermission) {
        return { error: 'You do not have permission to manage permissions' }
    }

    // Upsert permission override
    const { error } = await supabase
        .from('staff_permission_overrides')
        .upsert({
            staff_id: staffId,
            permission_key: permissionKey,
            is_granted: isGranted,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'staff_id,permission_key'
        })

    if (error) {
        console.error('Error toggling permission:', error)
        return { error: 'Failed to update permission' }
    }

    // Log the change
    await supabase
        .from('staff_permission_audit')
        .insert({
            staff_id: staffId,
            changed_by_user_id: user.id,
            change_type: 'permission_toggle',
            permission_key: permissionKey,
            new_value: isGranted ? 'granted' : 'revoked'
        })

    revalidatePath(`/dashboard/shops/${shopId}/staff-qc`)
    return { success: true }
}

// Get staff permissions (role + overrides)
export async function getStaffPermissions(staffId: string) {
    const supabase = await createClient()

    // Get staff role
    const { data: staff } = await supabase
        .from('shop_staff')
        .select('quick_checkout_role')
        .eq('id', staffId)
        .single()

    if (!staff?.quick_checkout_role) return { rolePermissions: [], overrides: [] }

    // Get permission overrides
    const { data: overrides } = await supabase
        .from('staff_permission_overrides')
        .select('*')
        .eq('staff_id', staffId)

    return {
        role: staff.quick_checkout_role as QuickCheckoutRole,
        overrides: overrides || []
    }
}

// Check if user has a specific permission
// Check if user has a specific permission
export async function checkPermission(
    shopId: string,
    userId: string,
    permissionKey: string
): Promise<boolean> {
    const supabase = await createClient()

    // 1. Check if user is the Owner of the shop
    const { data: shop } = await supabase
        .from('shops')
        .select('owner_id')
        .eq('id', shopId)
        .single()

    if (shop && shop.owner_id === userId) {
        return true // Owners have all permissions
    }

    // 2. Get staff member
    const { data: staff } = await supabase
        .from('shop_staff')
        .select('id, quick_checkout_role, is_active')
        .eq('shop_id', shopId)
        .eq('user_id', userId)
        .single()

    if (!staff || !staff.is_active) return false

    // 3. Check if role has permission by default
    // If role is null (e.g. old staff), they have no permissions by default
    let hasRolePermission = false
    if (staff.quick_checkout_role) {
        hasRolePermission = roleHasPermission(
            staff.quick_checkout_role as QuickCheckoutRole,
            permissionKey
        )
    }

    // 4. Check for individual override
    const { data: override } = await supabase
        .from('staff_permission_overrides')
        .select('is_granted')
        .eq('staff_id', staff.id)
        .eq('permission_key', permissionKey)
        .single()

    // Override takes precedence
    if (override) {
        return override.is_granted
    }

    // Fall back to role permission
    return hasRolePermission
}

// Get audit log for a staff member
export async function getStaffAuditLog(staffId: string, limit: number = 50) {
    const supabase = await createClient()

    const { data: logs } = await supabase
        .from('staff_permission_audit')
        .select(`
            *,
            changed_by:auth.users!changed_by_user_id(email)
        `)
        .eq('staff_id', staffId)
        .order('created_at', { ascending: false })
        .limit(limit)

    return logs || []
}

// Deactivate staff member
export async function deactivateStaff(shopId: string, staffId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Verify permission
    const hasPermission = await checkPermission(shopId, user.id, 'staff.remove')
    if (!hasPermission) {
        return { error: 'You do not have permission to remove staff' }
    }

    const { error } = await supabase
        .from('shop_staff')
        .update({ is_active: false })
        .eq('id', staffId)
        .eq('shop_id', shopId)

    if (error) {
        console.error('Error deactivating staff:', error)
        return { error: 'Failed to deactivate staff member' }
    }

    revalidatePath(`/dashboard/shops/${shopId}/staff-qc`)
    return { success: true }
}

// Reactivate staff member
export async function reactivateStaff(shopId: string, staffId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Verify permission
    const hasPermission = await checkPermission(shopId, user.id, 'staff.edit')
    if (!hasPermission) {
        return { error: 'You do not have permission to edit staff' }
    }

    const { error } = await supabase
        .from('shop_staff')
        .update({ is_active: true })
        .eq('id', staffId)
        .eq('shop_id', shopId)

    if (error) {
        console.error('Error reactivating staff:', error)
        return { error: 'Failed to reactivate staff member' }
    }

    revalidatePath(`/dashboard/shops/${shopId}/staff-qc`)
    return { success: true }
}
