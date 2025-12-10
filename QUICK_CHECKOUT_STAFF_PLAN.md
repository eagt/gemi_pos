# Quick Checkout Staff Management System - Implementation Plan

## Overview
Complete role-based + individual permission system EXCLUSIVELY for `business_type: "quick_checkout"`.
**CRITICAL**: Do NOT touch `business_type: "table_order"` - that system is final.

## Files Created

### 1. Database Migration
- `migration_quick_checkout_staff.sql` - Adds quick_checkout columns and permission tables

### 2. Permission System
- `lib/permissions/quick-checkout-permissions.ts` - 47 permissions across 9 categories

### 3. Server Actions (TO CREATE)
- `app/dashboard/shops/[shopId]/staff-qc/actions.ts` - All server-side logic

### 4. UI Components (TO CREATE)
- `app/dashboard/shops/[shopId]/staff-qc/page.tsx` - Main staff page for quick_checkout
- `components/staff-qc/staff-list-qc.tsx` - Staff list component
- `components/staff-qc/invite-staff-dialog-qc.tsx` - Invitation dialog
- `components/staff-qc/permission-editor.tsx` - Permission toggle UI
- `components/staff-qc/role-selector.tsx` - Role dropdown
- `components/staff-qc/audit-log.tsx` - Permission change history

### 5. Navigation Update
- Update `components/shop/shop-sidebar.tsx` to add "Staff" link for quick_checkout

## Implementation Steps

### Step 1: Run Migration ✅
```sql
-- Run migration_quick_checkout_staff.sql in Supabase
```

### Step 2: Create Server Actions
- Staff CRUD operations
- Permission checking/granting
- Audit logging
- Role management

### Step 3: Build UI Components
- Copy table_order staff page as template (DO NOT MODIFY ORIGINAL)
- Adapt for quick_checkout with 4 roles
- Add permission editor with 9 collapsible categories
- Add search/filter for permissions

### Step 4: Add Navigation
- Add "Staff" menu item for quick_checkout businesses only

### Step 5: Testing
- Test all 4 roles
- Test individual permission overrides
- Test audit logging
- Verify table_order is untouched

## Key Features

1. **4 Roles**: Cashier, Supervisor, Manager, Administrator
2. **47 Permissions** across 9 categories
3. **Individual Overrides**: Any permission can be toggled ON/OFF per user
4. **Audit Trail**: Every change logged
5. **Search**: Find permissions quickly
6. **Visual Indicators**: Show role-granted vs individually added permissions

## Next Steps

Would you like me to:
1. Continue building the server actions?
2. Build the UI components?
3. Update the navigation first?

Let me know and I'll proceed with the implementation!
