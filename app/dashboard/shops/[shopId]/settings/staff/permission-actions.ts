'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { canManagePermissions } from '@/lib/permissions/permission-checker'

/**
 * Update permission overrides for a staff member
 * Only managers/administrators can update permissions
 */
export async function updateStaffPermissions(
    shopId: string,
    staffId: string,
    permissionKey: string,
    value: boolean
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Get shop info
    const { data: shop } = await supabase
        .from('shops')
        .select('business_type')
        .eq('id', shopId)
        .single()

    if (!shop) {
        return { error: 'Shop not found' }
    }

    // Get current user's role
    const { data: currentUserStaff } = await supabase
        .from('shop_staff')
        .select('role, quick_checkout_role')
        .eq('shop_id', shopId)
        .eq('user_id', user.id)
        .single()

    if (!currentUserStaff) {
        return { error: 'You are not a staff member of this shop' }
    }

    // Check if user can manage permissions
    const canManage = canManagePermissions(
        shop.business_type,
        currentUserStaff.role,
        currentUserStaff.quick_checkout_role
    )

    if (!canManage) {
        return { error: 'You do not have permission to manage staff permissions' }
    }

    // Get the target staff member's current overrides
    const { data: targetStaff } = await supabase
        .from('shop_staff')
        .select('permission_overrides')
        .eq('id', staffId)
        .single()

    if (!targetStaff) {
        return { error: 'Staff member not found' }
    }

    // Update permission overrides
    const currentOverrides = (targetStaff.permission_overrides as Record<string, boolean>) || {}
    const newOverrides = {
        ...currentOverrides,
        [permissionKey]: value
    }

    // Save to database
    const { error } = await supabase
        .from('shop_staff')
        .update({ permission_overrides: newOverrides })
        .eq('id', staffId)

    if (error) {
        console.error('Error updating permissions:', error)
        return { error: 'Failed to update permissions' }
    }

    revalidatePath(`/dashboard/shops/${shopId}/settings/staff`)
    revalidatePath(`/dashboard/shops/${shopId}/staff-qc`)

    return { success: true }
}

/**
 * Get permission overrides for a staff member
 */
export async function getStaffPermissions(staffId: string) {
    const supabase = await createClient()

    const { data: staff, error } = await supabase
        .from('shop_staff')
        .select('permission_overrides, role, quick_checkout_role')
        .eq('id', staffId)
        .single()

    if (error || !staff) {
        return { permissions: {}, role: null, quickCheckoutRole: null }
    }

    return {
        permissions: (staff.permission_overrides as Record<string, boolean>) || {},
        role: staff.role,
        quickCheckoutRole: staff.quick_checkout_role
    }
}
