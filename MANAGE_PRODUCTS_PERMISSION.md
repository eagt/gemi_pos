# Manage Products Permission Implementation

## Overview
Implemented a flexible permission system for "Manage Products" (create, edit, delete products) that can be toggled for different roles while maintaining top-level control.

## Database Changes

### Migration: `migration_permission_overrides.sql`
- Added `permission_overrides` JSONB column to `shop_staff` table
- Stores custom permission grants/revokes per staff member
- Format: `{"permission.key": true/false}`
- Created GIN index for efficient querying

## Permission System

### Default Permissions
- **Table Order (Restaurant)**: Manager role has `products.manage` by default
- **Quick Checkout**: Administrator role has `products.manage` by default
- **Other roles**: No access by default (can be granted)

### Permission Key
- `products.manage` - Covers create, edit, and delete operations

### Authorization Rules
1. **Can Grant/Revoke**: Only Manager (table_order) or Administrator (quick_checkout)
2. **Cannot Toggle**: Manager and Administrator always have the permission (locked)
3. **Can Toggle**: All other roles (Waiter, Chef, Runner, Cashier, Supervisor no, Manager)

## Code Structure

### Files Created

1. **`lib/permissions/permission-checker.ts`**
   - `hasPermission()` - Check if user has a permission (considers overrides)
   - `canManagePermissions()` - Check if user can modify others' permissions
   - `canTogglePermission()` - Check if a permission can be toggled for a role
   - `getDefaultPermissionState()` - Get default state for a role

2. **`app/dashboard/shops/[shopId]/settings/staff/permission-actions.ts`**
   - `updateStaffPermissions()` - Server action to update permission overrides
   - `getStaffPermissions()` - Fetch current permissions for a staff member

3. **`components/staff/permission-manager.tsx`**
   - UI component for managing permissions
   - Shows toggle with current state
   - Disables toggle for non-authorized users
   - Shows "Save Changes" button when modified
   - Displays appropriate messages for locked/disabled states

## Usage

### In Staff Management Pages

```tsx
import { PermissionManager } from '@/components/staff/permission-manager'
import { canManagePermissions } from '@/lib/permissions/permission-checker'

// In your staff detail/edit page
const canManage = canManagePermissions(
    shop.business_type,
    currentUserRole,
    currentUserQuickCheckoutRole
)

<PermissionManager
    shopId={shopId}
    staffId={staffMember.id}
    staffName={staffMember.name}
    role={staffMember.role}
    quickCheckoutRole={staffMember.quick_checkout_role}
    businessType={shop.business_type}
    permissionOverrides={staffMember.permission_overrides}
    canManage={canManage}
/>
```

### Checking Permissions in Code

```tsx
import { hasPermission, MANAGE_PRODUCTS_PERMISSION } from '@/lib/permissions/permission-checker'

const canManageProducts = hasPermission(
    businessType,
    userRole,
    userQuickCheckoutRole,
    MANAGE_PRODUCTS_PERMISSION,
    permissionOverrides
)

if (canManageProducts) {
    // Show create/edit/delete buttons
}
```

## UI Features

1. **Permission Card**
   - Shows staff member name
   - Displays "Manage Products" toggle
   - Lock icon for non-toggleable permissions
   - Description of what the permission allows

2. **States**
   - **Enabled & Togglable**: Green switch, can be changed
   - **Disabled & Togglable**: Gray switch, can be changed
   - **Locked (Always On)**: Green switch with lock icon, disabled
   - **Locked (Always Off)**: Gray switch with lock icon, disabled
   - **No Permission**: "You don't have permission to change this setting"

3. **Save Workflow**
   - Changes are tracked locally
   - "Save Changes" button appears when modified
   - Blue info banner shows unsaved changes
   - Success/error toasts on save

## Next Steps

To integrate this into your existing staff management pages:

1. **Quick Checkout Staff Page** (`app/dashboard/shops/[shopId]/staff-qc/page.tsx`)
   - Add`PermissionManager` component to staff detail view
   - Fetch `permission_overrides` in staff query
   - Pass current user's authorization status

2. **Table Order Staff Page** (`app/dashboard/shops/[shopId]/settings/staff/page.tsx`)
   - Same as above for table order businesses

3. **Product Pages** (Create/Edit/Delete)
   - Add permission check before allowing operations
   - Hide/disable buttons for unauthorized users
   - Show appropriate error messages

4. **Update StaffList Components**
   - Include `permission_overrides` in queries
   - Optionally show permission status badges

## Example Integration

```tsx
// In staff-qc/page.tsx or settings/staff/page.tsx

// Update the query to include permission_overrides
const { data: staff } = await supabase
    .from('shop_staff')
    .select('*, permission_overrides')
    .eq('shop_id', shopId)

// When rendering staff detail/edit view
<PermissionManager
    shopId={shopId}
    staffId={selectedStaff.id}
    staffName={selectedStaff.name}
    role={selectedStaff.role}
    quickCheckoutRole={selectedStaff.quick_checkout_role}
    businessType={shop.business_type}
    permissionOverrides={selectedStaff.permission_overrides}
    canManage={isManagerOrAdmin}
/>
```

## Security Notes

- All permission updates go through server actions with authorization checks
- Database column uses JSONB for flexibility and performance
- GIN index enables fast permission lookups
- Permission checks are centralized in `permission-checker.ts`
- Always verify permissions server-side before sensitive operations
