// Permission matrix for quick_checkout businesses
// 9 categories with 40+ permissions

export type QuickCheckoutRole = 'cashier' | 'supervisor' | 'manager' | 'administrator'

export interface Permission {
    key: string
    label: string
    description: string
    category: PermissionCategory
}

export type PermissionCategory =
    | 'sales'
    | 'products'
    | 'inventory'
    | 'reports'
    | 'customers'
    | 'discounts'
    | 'staff'
    | 'settings'
    | 'financial'

export const PERMISSION_CATEGORIES: Record<PermissionCategory, { label: string; icon: string }> = {
    sales: { label: 'Sales & Transactions', icon: 'ShoppingCart' },
    products: { label: 'Product Management', icon: 'Package' },
    inventory: { label: 'Inventory Control', icon: 'Boxes' },
    reports: { label: 'Reports & Analytics', icon: 'BarChart3' },
    customers: { label: 'Customer Management', icon: 'Users' },
    discounts: { label: 'Discounts & Pricing', icon: 'Tag' },
    staff: { label: 'Staff Management', icon: 'UserCog' },
    settings: { label: 'Business Settings', icon: 'Settings' },
    financial: { label: 'Financial Operations', icon: 'DollarSign' }
}

export const ALL_PERMISSIONS: Permission[] = [
    // Sales & Transactions (8 permissions)
    { key: 'sales.create', label: 'Create Sales', description: 'Process new transactions', category: 'sales' },
    { key: 'sales.void', label: 'Void Sales', description: 'Cancel/void transactions', category: 'sales' },
    { key: 'sales.refund', label: 'Process Refunds', description: 'Issue refunds to customers', category: 'sales' },
    { key: 'sales.view_all', label: 'View All Sales', description: 'See all store transactions', category: 'sales' },
    { key: 'sales.view_own', label: 'View Own Sales', description: 'See only own transactions', category: 'sales' },
    { key: 'sales.edit', label: 'Edit Sales', description: 'Modify transaction details', category: 'sales' },
    { key: 'sales.apply_discount', label: 'Apply Discounts', description: 'Add discounts to sales', category: 'sales' },
    { key: 'sales.override_price', label: 'Override Prices', description: 'Change item prices at checkout', category: 'sales' },

    // Product Management (7 permissions)
    { key: 'products.create', label: 'Create Products', description: 'Add new products', category: 'products' },
    { key: 'products.edit', label: 'Edit Products', description: 'Modify product details', category: 'products' },
    { key: 'products.delete', label: 'Delete Products', description: 'Remove products', category: 'products' },
    { key: 'products.view', label: 'View Products', description: 'See product catalog', category: 'products' },
    { key: 'products.manage_categories', label: 'Manage Categories', description: 'Create/edit categories', category: 'products' },
    { key: 'products.manage_pricing', label: 'Manage Pricing', description: 'Set product prices', category: 'products' },
    { key: 'products.import_export', label: 'Import/Export', description: 'Bulk product operations', category: 'products' },

    // Inventory Control (6 permissions)
    { key: 'inventory.adjust', label: 'Adjust Stock', description: 'Modify stock levels', category: 'inventory' },
    { key: 'inventory.view', label: 'View Inventory', description: 'See stock levels', category: 'inventory' },
    { key: 'inventory.receive', label: 'Receive Stock', description: 'Process incoming inventory', category: 'inventory' },
    { key: 'inventory.transfer', label: 'Transfer Stock', description: 'Move stock between locations', category: 'inventory' },
    { key: 'inventory.count', label: 'Stock Counting', description: 'Perform stock takes', category: 'inventory' },
    { key: 'inventory.alerts', label: 'Manage Alerts', description: 'Set low stock alerts', category: 'inventory' },

    // Reports & Analytics (5 permissions)
    { key: 'reports.sales', label: 'Sales Reports', description: 'View sales analytics', category: 'reports' },
    { key: 'reports.inventory', label: 'Inventory Reports', description: 'View stock reports', category: 'reports' },
    { key: 'reports.staff', label: 'Staff Reports', description: 'View staff performance', category: 'reports' },
    { key: 'reports.financial', label: 'Financial Reports', description: 'View financial summaries', category: 'reports' },
    { key: 'reports.export', label: 'Export Reports', description: 'Download report data', category: 'reports' },

    // Customer Management (4 permissions)
    { key: 'customers.create', label: 'Create Customers', description: 'Add new customers', category: 'customers' },
    { key: 'customers.edit', label: 'Edit Customers', description: 'Modify customer details', category: 'customers' },
    { key: 'customers.view', label: 'View Customers', description: 'See customer list', category: 'customers' },
    { key: 'customers.delete', label: 'Delete Customers', description: 'Remove customers', category: 'customers' },

    // Discounts & Pricing (4 permissions)
    { key: 'discounts.create', label: 'Create Discounts', description: 'Set up discount rules', category: 'discounts' },
    { key: 'discounts.edit', label: 'Edit Discounts', description: 'Modify discounts', category: 'discounts' },
    { key: 'discounts.delete', label: 'Delete Discounts', description: 'Remove discounts', category: 'discounts' },
    { key: 'discounts.view', label: 'View Discounts', description: 'See active discounts', category: 'discounts' },

    // Staff Management (5 permissions)
    { key: 'staff.invite', label: 'Invite Staff', description: 'Add new team members', category: 'staff' },
    { key: 'staff.edit', label: 'Edit Staff', description: 'Modify staff details', category: 'staff' },
    { key: 'staff.remove', label: 'Remove Staff', description: 'Deactivate staff accounts', category: 'staff' },
    { key: 'staff.view', label: 'View Staff', description: 'See staff list', category: 'staff' },
    { key: 'staff.manage_permissions', label: 'Manage Permissions', description: 'Change staff permissions', category: 'staff' },

    // Business Settings (4 permissions)
    { key: 'settings.view', label: 'View Settings', description: 'See business settings', category: 'settings' },
    { key: 'settings.edit_basic', label: 'Edit Basic Settings', description: 'Modify basic info', category: 'settings' },
    { key: 'settings.edit_advanced', label: 'Edit Advanced Settings', description: 'Modify system settings', category: 'settings' },
    { key: 'settings.integrations', label: 'Manage Integrations', description: 'Connect external services', category: 'settings' },

    // Financial Operations (4 permissions)
    { key: 'financial.view_cash', label: 'View Cash Drawer', description: 'See cash drawer balance', category: 'financial' },
    { key: 'financial.open_close_drawer', label: 'Open/Close Drawer', description: 'Manage cash drawer', category: 'financial' },
    { key: 'financial.cash_in_out', label: 'Cash In/Out', description: 'Add/remove cash', category: 'financial' },
    { key: 'financial.end_of_day', label: 'End of Day', description: 'Close daily operations', category: 'financial' },
]

// Role-based permission matrix (default permissions for each role)
export const ROLE_PERMISSIONS: Record<QuickCheckoutRole, string[]> = {
    cashier: [
        // Sales - basic only
        'sales.create',
        'sales.view_own',
        'sales.apply_discount',

        // Products - view only
        'products.view',

        // Inventory - view only
        'inventory.view',

        // Customers - basic
        'customers.create',
        'customers.view',

        // Financial - basic
        'financial.view_cash',
    ],

    supervisor: [
        // All Cashier permissions
        ...['sales.create', 'sales.view_own', 'sales.apply_discount', 'products.view', 'inventory.view', 'customers.create', 'customers.view', 'financial.view_cash'],

        // Additional Sales
        'sales.void',
        'sales.refund',
        'sales.view_all',

        // Products
        'products.edit',
        'products.manage_pricing',

        // Inventory
        'inventory.adjust',
        'inventory.receive',
        'inventory.count',

        // Reports
        'reports.sales',
        'reports.inventory',

        // Customers
        'customers.edit',

        // Discounts
        'discounts.view',

        // Financial
        'financial.open_close_drawer',
        'financial.cash_in_out',
    ],

    manager: [
        // All Supervisor permissions
        ...['sales.create', 'sales.view_own', 'sales.apply_discount', 'sales.void', 'sales.refund', 'sales.view_all',
            'products.view', 'products.edit', 'products.manage_pricing',
            'inventory.view', 'inventory.adjust', 'inventory.receive', 'inventory.count',
            'reports.sales', 'reports.inventory',
            'customers.create', 'customers.view', 'customers.edit',
            'discounts.view',
            'financial.view_cash', 'financial.open_close_drawer', 'financial.cash_in_out'],

        // Additional Sales
        'sales.edit',
        'sales.override_price',

        // Products
        'products.create',
        'products.delete',
        'products.manage_categories',
        'products.import_export',

        // Inventory
        'inventory.transfer',
        'inventory.alerts',

        // Reports
        'reports.staff',
        'reports.financial',
        'reports.export',

        // Customers
        'customers.delete',

        // Discounts
        'discounts.create',
        'discounts.edit',
        'discounts.delete',

        // Staff
        'staff.view',
        'staff.edit',

        // Settings
        'settings.view',
        'settings.edit_basic',

        // Financial
        'financial.end_of_day',
    ],

    administrator: ALL_PERMISSIONS.map(p => p.key), // All permissions
}

// Helper function to check if a role has a permission by default
export function roleHasPermission(role: QuickCheckoutRole, permissionKey: string): boolean {
    return ROLE_PERMISSIONS[role].includes(permissionKey)
}

// Helper to get all permissions for a role
export function getRolePermissions(role: QuickCheckoutRole): string[] {
    return ROLE_PERMISSIONS[role]
}

// Helper to group permissions by category
export function getPermissionsByCategory(): Record<PermissionCategory, Permission[]> {
    return ALL_PERMISSIONS.reduce((acc, permission) => {
        if (!acc[permission.category]) {
            acc[permission.category] = []
        }
        acc[permission.category].push(permission)
        return acc
    }, {} as Record<PermissionCategory, Permission[]>)
}
