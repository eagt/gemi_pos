// Unified permission checking across both business types

import { QuickCheckoutRole, roleHasPermission as qcRoleHasPermission } from './quick-checkout-permissions'

export type TableOrderRole = 'manager' | 'waiter' | 'chef' | 'runner'
export type BusinessType = 'quick_checkout' | 'table_order'

// Define the "Manage Products" permission
export const MANAGE_PRODUCTS_PERMISSION = 'products.manage'

// Table Order default permissions
const TABLE_ORDER_PERMISSIONS: Record<TableOrderRole, string[]> = {
    manager: [
        'products.manage', // Can manage products
        'sales.create',
        'sales.view_all',
        'staff.manage',
        'settings.edit',
    ],
    waiter: [
        'sales.create',
        'sales.view_own',
    ],
    chef: [
        'orders.view',
        'orders.update_status',
    ],
    runner: [
        'orders.view',
        'orders.deliver',
    ],
}

/**
 * Check if a staff member has a specific permission
 * Takes into account:
 * 1. Default role permissions
 * 2. Permission overrides stored in database
 */
export function hasPermission(
    businessType: BusinessType,
    role: string,
    quickCheckoutRole: string | null,
    permissionKey: string,
    permissionOverrides?: Record<string, boolean> | null
): boolean {
    // Check if there's an override first
    if (permissionOverrides && permissionKey in permissionOverrides) {
        return permissionOverrides[permissionKey]
    }

    // Check default permissions based on business type
    if (businessType === 'quick_checkout' && quickCheckoutRole) {
        return qcRoleHasPermission(quickCheckoutRole as QuickCheckoutRole, permissionKey)
    }

    if (businessType === 'table_order' && role) {
        const rolePermissions = TABLE_ORDER_PERMISSIONS[role as TableOrderRole] || []
        return rolePermissions.includes(permissionKey)
    }

    return false
}

/**
 * Check if a user can manage permissions for others
 * Only Managers (table_order) and Administrators (quick_checkout) can manage permissions
 */
export function canManagePermissions(
    businessType: BusinessType,
    role: string,
    quickCheckoutRole: string | null
): boolean {
    if (businessType === 'quick_checkout') {
        return quickCheckoutRole === 'administrator'
    }

    if (businessType === 'table_order') {
        return role === 'manager'
    }

    return false
}

/**
 * Check if a permission can be toggled for a given role
 * Returns false if the permission is always granted/denied for that role
 */
export function canTogglePermission(
    businessType: BusinessType,
    role: string,
    quickCheckoutRole: string | null,
    permissionKey: string
): boolean {
    // Manager/Administrator roles always have products.manage - cannot be toggled
    if (permissionKey === MANAGE_PRODUCTS_PERMISSION) {
        if (businessType === 'table_order' && role === 'manager') {
            return false // Always granted
        }
        if (businessType === 'quick_checkout' && quickCheckoutRole === 'administrator') {
            return false // Always granted
        }
    }

    return true // Can be toggled for other roles
}

/**
 * Get the default state of a permission for a role
 */
export function getDefaultPermissionState(
    businessType: BusinessType,
    role: string,
    quickCheckoutRole: string | null,
    permissionKey: string
): boolean {
    if (businessType === 'quick_checkout' && quickCheckoutRole) {
        return qcRoleHasPermission(quickCheckoutRole as QuickCheckoutRole, permissionKey)
    }

    if (businessType === 'table_order' && role) {
        const rolePermissions = TABLE_ORDER_PERMISSIONS[role as TableOrderRole] || []
        return rolePermissions.includes(permissionKey)
    }

    return false
}
