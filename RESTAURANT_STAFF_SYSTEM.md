# Restaurant Staff System Implementation Guide

## Overview
This implementation adds a complete Table Order / Restaurant POS staff system with role-based access, PIN login, staff invitations, and full audit trails. The system is **completely conditional** - it only activates for businesses with `business_type = 'table_order'`. Quick checkout businesses remain 100% unchanged.

## Database Migration

Run the migration file to set up all required tables and triggers:

```bash
# Apply the migration in your Supabase SQL editor
cat migration_restaurant_staff_system.sql
```

### New Tables Created:
1. **shop_staff** - Staff members with roles and PIN authentication
2. **order_status_changes** - Complete audit trail of all status changes

### Updated Tables:
1. **shops** - Added `business_type` column
2. **orders** - Added `table_number`, `notes`, `last_changed_by`, and expanded status values

## Staff Roles & Permissions

### Manager
- **Full Access** - Can do everything
- Invite and manage staff
- Void orders
- All status transitions
- Access to staff management page

### Waiter
- Take orders
- Mark orders as served
- Request payment
- Process payments
- View active orders

### Chef
- View kitchen display
- Accept new orders
- Start preparation
- Mark orders as ready
- Kitchen-only workflow

### Runner
- View ready orders
- Mark orders as served
- Delivery-focused role

## User Flows

### 1. Creating a Table Order Business

When a user creates a new business with `business_type = 'table_order'`:
1. A `shop_staff` record is automatically created with `role = 'manager'`
2. The user is prompted to set a 4-6 digit PIN
3. PIN is encrypted using SHA-256 before storage

### 2. Staff Invitation Flow (Manager Only)

**Manager invites staff:**
1. Navigate to `/dashboard/shops/[shopId]/staff`
2. Click "Invite Staff"
3. Enter: Name, Email, Role
4. System creates `shop_staff` record with `user_id = null`, `pin = null`

**Staff accepts invitation:**
1. Staff opens app and navigates to `/invitations`
2. Enters their email to check for pending invitations
3. Sees list of all pending invitations
4. Clicks "Accept" on desired invitation
5. If no account: Auto sign-up via magic link (respects Supabase email confirmation settings)
6. System links `auth.user.id` to `shop_staff.user_id`
7. Staff is forced to set a 4-6 digit PIN
8. Invitation is marked as accepted with `accepted_at` timestamp

### 3. Daily PIN Login (Table Order Businesses Only)

**Staff login flow:**
1. User navigates to business
2. System detects `business_type = 'table_order'`
3. Redirects to `/dashboard/shops/[shopId]/staff-login`
4. Beautiful grid shows all staff members (with avatars/role icons)
5. Staff taps their name
6. Enters PIN in modal
7. PIN is verified (SHA-256 hash comparison)
8. Session is stored in Zustand with localStorage persistence
9. Redirected based on role:
   - **Chef** → Kitchen Display Screen
   - **Others** → Active Orders

### 4. Order Status Flow

**Restaurant order statuses:**
```
new → accepted → in_preparation → ready → served → payment_requested → paid
```

**Status transitions by role:**
- **Manager**: All transitions + void
- **Waiter**: new→accepted, served→payment_requested, payment_requested→paid
- **Chef**: new→accepted, accepted→in_preparation, in_preparation→ready
- **Runner**: ready→served

**Audit trail:**
- Every status change is logged in `order_status_changes`
- Includes: staff member, old status, new status, timestamp
- Displayed in order detail page

## Key Pages & Components

### Pages
1. `/dashboard/shops/[shopId]/staff-login` - Staff selection grid with PIN entry
2. `/dashboard/shops/[shopId]/staff` - Staff management (manager only)
3. `/dashboard/shops/[shopId]/restaurant` - Active orders view
4. `/dashboard/shops/[shopId]/restaurant/kitchen` - Kitchen Display Screen (KDS)
5. `/dashboard/shops/[shopId]/restaurant/orders/[orderId]` - Order detail with history
6. `/invitations` - Pending invitations acceptance

### Components
1. `components/staff/pin-input.tsx` - Beautiful PIN input with auto-focus
2. `components/staff/staff-selection-grid.tsx` - Staff grid with role colors
3. `components/staff/set-pin-modal.tsx` - Two-step PIN creation modal

### Utilities
1. `lib/auth/staff.ts` - Staff authentication & permission helpers
2. `store/staff-store.ts` - Zustand store for staff sessions
3. `lib/types/database.types.ts` - Updated TypeScript types

## Security Features

### PIN Encryption
- PINs are hashed using SHA-256 before storage
- Never stored in plain text
- Comparison done via hash matching

### Row Level Security (RLS)
- Staff can only view/modify data from their own shops
- Managers have elevated permissions
- Shop owners maintain full access
- All policies enforce role-based access

### Permission Checks
- Client-side: Zustand store methods
- Server-side: RLS policies
- Status transitions validated against role permissions

## Conditional Logic

### Quick Checkout (Unchanged)
- No staff system
- No PIN login
- No role restrictions
- Original workflow preserved
- Uses standard order statuses: pending, completed, cancelled, refunded

### Table Order (New Features)
- Staff system active
- PIN login required
- Role-based permissions
- Restaurant order statuses
- Kitchen Display Screen
- Active orders management
- Full audit trail

## Testing Checklist

### Database
- [ ] Run migration successfully
- [ ] Verify all tables created
- [ ] Test RLS policies
- [ ] Verify triggers work (auto-create manager, log status changes)

### Manager Flow
- [ ] Create table_order business
- [ ] Set initial PIN
- [ ] Invite staff members (waiter, chef, runner)
- [ ] View staff list
- [ ] Remove staff member

### Staff Invitation
- [ ] Receive invitation email (if email confirmation enabled)
- [ ] Check pending invitations at `/invitations`
- [ ] Accept invitation
- [ ] Set PIN
- [ ] Verify account linking

### Staff Login
- [ ] See staff selection grid
- [ ] Enter correct PIN → success
- [ ] Enter wrong PIN → error + retry
- [ ] Session persists across page reloads
- [ ] Role-based redirect works

### Kitchen Display
- [ ] Chef sees KDS automatically
- [ ] Real-time order updates
- [ ] Accept new orders
- [ ] Start preparation
- [ ] Mark ready
- [ ] Urgency indicators work

### Order Management
- [ ] Waiter can take orders
- [ ] Chef can update kitchen statuses
- [ ] Runner can mark served
- [ ] Manager can void orders
- [ ] Status history displays correctly
- [ ] Audit trail shows staff names

### Permissions
- [ ] Waiter cannot access staff management
- [ ] Chef cannot process payments
- [ ] Runner cannot void orders
- [ ] Only manager can invite staff
- [ ] Status transitions respect role limits

## Environment Variables

No additional environment variables required. Uses existing Supabase configuration.

## Deployment Notes

1. **Migration**: Run `migration_restaurant_staff_system.sql` in Supabase SQL editor
2. **Existing Data**: All existing shops default to `business_type = 'quick_checkout'`
3. **Backward Compatibility**: Quick checkout businesses are completely unaffected
4. **No Breaking Changes**: All existing functionality preserved

## Future Enhancements

Potential additions (not implemented):
- Staff scheduling
- Time tracking
- Tips distribution
- Performance analytics per staff member
- Multi-location staff sharing
- Biometric authentication
- Manager PIN override for restricted actions
- Staff permissions customization
- Email notifications for invitations
- SMS-based PIN reset

## Support

For issues or questions:
1. Check database migration completed successfully
2. Verify RLS policies are active
3. Check browser console for errors
4. Verify staff session in localStorage
5. Test with different roles to isolate permission issues

---

**Implementation Status**: ✅ Complete
**Last Updated**: 2025-11-25
**Version**: 1.0.0
