# Restaurant Staff System - Testing Checklist

Use this checklist to verify all features of the restaurant staff system are working correctly.

## 📋 Pre-Testing Setup

- [ ] Migration `migration_restaurant_staff_system.sql` has been run successfully in Supabase
- [ ] All tables created: `shop_staff`, `order_status_changes`
- [ ] Columns added to existing tables: `shops.business_type`, `orders.table_number`, `orders.notes`, `orders.last_changed_by`
- [ ] RLS policies are active
- [ ] Triggers are created and working
- [ ] Development server is running (`npm run dev`)

## 🏢 Business Creation & Manager Setup

### Create Table Order Business
- [ ] Navigate to `/dashboard/shops/new/business-type`
- [ ] See two beautiful cards: Quick Checkout and Table Order
- [ ] Click "Table Order POS" card
- [ ] Fill in business details
- [ ] Submit form successfully
- [ ] Verify `shop_staff` record created automatically
- [ ] Verify role is 'manager'
- [ ] Verify `user_id` is linked to current user

### Set Manager PIN
- [ ] After business creation, see "Set Your PIN" modal
- [ ] Modal cannot be dismissed (no close button)
- [ ] Choose PIN length (4-6 digits)
- [ ] Enter PIN
- [ ] Confirm PIN
- [ ] Test mismatch: Enter different PIN → See error
- [ ] Enter matching PIN → Success
- [ ] Verify PIN is encrypted in database (not plain text)
- [ ] Redirected to dashboard

## 👥 Staff Invitation (Manager Only)

### Access Staff Management
- [ ] Navigate to `/dashboard/shops/[shopId]/staff`
- [ ] See "Staff Management" page
- [ ] See current staff list (at least manager)
- [ ] See "Invite Staff" button

### Invite Staff Member
- [ ] Click "Invite Staff"
- [ ] See invitation modal
- [ ] Fill in: Name, Email, Role (choose Waiter)
- [ ] Submit invitation
- [ ] See success toast
- [ ] Verify new staff appears in list with "Pending" status
- [ ] Verify `shop_staff` record created with `user_id = null`

### Invite Multiple Roles
- [ ] Invite a Chef
- [ ] Invite a Runner
- [ ] Invite another Waiter
- [ ] Verify all appear in staff list
- [ ] Verify each has correct role badge

### Test Duplicate Email
- [ ] Try to invite same email again
- [ ] See error: "This email has already been invited"

### Remove Staff
- [ ] Click delete button on a pending invitation
- [ ] Confirm deletion
- [ ] Verify staff removed from list
- [ ] Verify record deleted from database

## 📧 Staff Invitation Acceptance

### Check Pending Invitations
- [ ] Open new incognito/private browser window
- [ ] Navigate to `/invitations`
- [ ] See "Enter Your Email" form
- [ ] Enter invited email address
- [ ] Click "Check Invitations"
- [ ] See list of pending invitations
- [ ] Verify shop name, role, invited by name shown
- [ ] Verify invitation date displayed

### Accept Invitation (Existing User)
- [ ] If user already has account, log in first
- [ ] Navigate to `/invitations`
- [ ] Enter email
- [ ] See pending invitations
- [ ] Click "Accept" on one invitation
- [ ] See "Set Your PIN" modal
- [ ] Set PIN (4-6 digits)
- [ ] Confirm PIN
- [ ] See success message
- [ ] Verify redirected to shop dashboard
- [ ] Verify `user_id` linked in database
- [ ] Verify `accepted_at` timestamp set
- [ ] Verify PIN encrypted in database

### Accept Invitation (New User)
- [ ] Use email without existing account
- [ ] Navigate to `/invitations`
- [ ] Enter email
- [ ] See pending invitations
- [ ] Click "Accept"
- [ ] If email confirmation is ON: Check email for magic link
- [ ] If email confirmation is OFF: Auto sign-up
- [ ] Complete authentication
- [ ] See "Set Your PIN" modal
- [ ] Set PIN
- [ ] Verify account created and linked

## 🔐 Daily Staff Login

### Staff Selection Grid
- [ ] Navigate to business as authenticated user
- [ ] System detects `business_type = 'table_order'`
- [ ] Redirected to `/dashboard/shops/[shopId]/staff-login`
- [ ] See beautiful grid of all staff members
- [ ] Verify each staff has:
  - [ ] Name
  - [ ] Role badge with correct color
  - [ ] Role icon (Shield/User/Chef/Truck)
  - [ ] Avatar or colored circle

### PIN Entry
- [ ] Click on staff member
- [ ] See PIN entry modal
- [ ] See staff avatar/icon
- [ ] See "Enter your PIN to continue"
- [ ] See 4 PIN input boxes (or 6 if they chose 6-digit)
- [ ] Enter wrong PIN
- [ ] See error: "Incorrect PIN. Please try again."
- [ ] PIN inputs clear automatically
- [ ] Enter correct PIN
- [ ] See success toast: "Welcome back, [Name]!"
- [ ] Session stored in localStorage

### Role-Based Redirect
- [ ] Login as Chef → Redirected to Kitchen Display Screen
- [ ] Login as Waiter → Redirected to Active Orders
- [ ] Login as Runner → Redirected to Active Orders
- [ ] Login as Manager → Redirected to Active Orders

### Session Persistence
- [ ] Login as staff member
- [ ] Refresh page
- [ ] Verify still logged in (session persists)
- [ ] Navigate to different pages
- [ ] Verify session maintained
- [ ] Close browser and reopen
- [ ] Verify session still active

## 🍳 Kitchen Display Screen (Chef)

### Access KDS
- [ ] Login as Chef
- [ ] See Kitchen Display Screen automatically
- [ ] Or navigate to `/dashboard/shops/[shopId]/restaurant/kitchen`

### KDS Layout
- [ ] See 4 columns: New, Accepted, Cooking, Ready
- [ ] Each column shows order count
- [ ] See current time in header
- [ ] See total active orders count

### Order Cards
- [ ] Create test order (status: new)
- [ ] See order appear in "New" column
- [ ] Verify card shows:
  - [ ] Table number or Order ID
  - [ ] Time since creation
  - [ ] All order items with quantities
  - [ ] Order notes (if any)
  - [ ] Status badge
  - [ ] Action button

### Status Transitions
- [ ] Click "Accept" on new order
- [ ] Order moves to "Accepted" column
- [ ] Click "Start Cooking"
- [ ] Order moves to "Cooking" column
- [ ] Click "Mark Ready"
- [ ] Order moves to "Ready" column
- [ ] Verify no action button in "Ready" column

### Real-Time Updates
- [ ] Open KDS in two browser windows
- [ ] Update status in one window
- [ ] Verify other window updates automatically
- [ ] No page refresh needed

### Urgency Indicators
- [ ] Wait 15+ minutes on an order
- [ ] Time indicator turns orange
- [ ] Wait 30+ minutes
- [ ] Time indicator turns red

## 📋 Active Orders View

### Access Active Orders
- [ ] Login as Waiter/Runner/Manager
- [ ] See Active Orders view
- [ ] Or navigate to `/dashboard/shops/[shopId]/restaurant`

### Orders Display
- [ ] See orders grouped by status
- [ ] Each status column shows count
- [ ] Orders sorted by creation time
- [ ] See "Kitchen Display" button in header

### Order Cards
- [ ] Each order card shows:
  - [ ] Order ID or table number
  - [ ] Time since creation
  - [ ] Number of items
  - [ ] Total amount
  - [ ] Status badge with correct color

### Click Order
- [ ] Click on an order card
- [ ] Redirected to order detail page

## 📄 Order Detail Page

### Order Information
- [ ] See table number or order ID
- [ ] See creation date/time
- [ ] See current status badge
- [ ] See all order items with quantities
- [ ] See item prices
- [ ] See total amount
- [ ] See order notes (if any)

### Status History
- [ ] See "Status History" section
- [ ] See "Order Created" entry
- [ ] See all status changes in chronological order
- [ ] Each change shows:
  - [ ] New status
  - [ ] Staff member name and role
  - [ ] Timestamp
  - [ ] Color-coded dot

### Status Actions (Role-Based)
- [ ] Login as Waiter
- [ ] See only allowed status transitions
- [ ] Cannot see chef-only transitions
- [ ] Login as Chef
- [ ] See only kitchen transitions
- [ ] Login as Manager
- [ ] See all possible transitions

### Update Status
- [ ] Click status transition button
- [ ] See success toast
- [ ] Order updates immediately
- [ ] New entry added to status history
- [ ] Staff name recorded correctly

### Manager Void
- [ ] Login as Manager
- [ ] See "Manager Actions" section
- [ ] See "Void Order" button (red)
- [ ] Click "Void Order"
- [ ] See confirmation dialog
- [ ] Confirm void
- [ ] Order status changes to "void"
- [ ] Recorded in status history

### Non-Manager Void Attempt
- [ ] Login as Waiter/Chef/Runner
- [ ] Try to void order
- [ ] See error: "Only managers can void orders"

## 🔒 Permission Testing

### Manager Permissions
- [ ] Can access Staff Management
- [ ] Can invite staff
- [ ] Can remove staff
- [ ] Can void orders
- [ ] Can perform all status transitions
- [ ] Can view all orders

### Waiter Permissions
- [ ] Cannot access Staff Management
- [ ] Can take orders (new → accepted)
- [ ] Can mark served (ready → served)
- [ ] Can request payment (served → payment_requested)
- [ ] Can process payment (payment_requested → paid)
- [ ] Cannot perform chef transitions

### Chef Permissions
- [ ] Cannot access Staff Management
- [ ] Can accept orders (new → accepted)
- [ ] Can start preparation (accepted → in_preparation)
- [ ] Can mark ready (in_preparation → ready)
- [ ] Cannot mark served
- [ ] Cannot process payments

### Runner Permissions
- [ ] Cannot access Staff Management
- [ ] Can mark served (ready → served)
- [ ] Cannot perform other transitions
- [ ] Cannot process payments

## 🔄 Order Flow Testing

### Complete Order Flow
- [ ] Create new order (status: new)
- [ ] Chef accepts (new → accepted)
- [ ] Chef starts cooking (accepted → in_preparation)
- [ ] Chef marks ready (in_preparation → ready)
- [ ] Runner marks served (ready → served)
- [ ] Waiter requests payment (served → payment_requested)
- [ ] Waiter processes payment (payment_requested → paid)
- [ ] Verify each transition logged
- [ ] Verify correct staff recorded for each change

### Invalid Transitions
- [ ] Try to skip a status (new → ready)
- [ ] See error or button disabled
- [ ] Try unauthorized transition for role
- [ ] See error: "You do not have permission"

## 🛡️ Security Testing

### PIN Security
- [ ] Verify PINs are hashed in database
- [ ] Cannot see plain text PIN in database
- [ ] Cannot login with wrong PIN
- [ ] PIN comparison works correctly

### RLS Policies
- [ ] Staff can only see orders from their shop
- [ ] Staff can only see staff from their shop
- [ ] Cannot access other shops' data via API
- [ ] Shop owner maintains full access

### Session Security
- [ ] Session stored in localStorage
- [ ] Session includes: staffId, shopId, role, name
- [ ] Session cleared on logout
- [ ] Cannot forge session data

## 🔄 Backward Compatibility

### Quick Checkout Businesses
- [ ] Create or access quick_checkout business
- [ ] No staff login required
- [ ] No PIN prompt
- [ ] No role restrictions
- [ ] Original POS workflow unchanged
- [ ] No restaurant features visible
- [ ] Uses original order statuses (pending, completed, etc.)

### Existing Data
- [ ] All existing shops default to quick_checkout
- [ ] Existing orders unaffected
- [ ] Existing users can access their shops
- [ ] No breaking changes

## 🎨 UI/UX Testing

### Design Consistency
- [ ] All pages match existing design system
- [ ] Colors consistent (purple, blue, orange, green)
- [ ] Glassmorphism effects work
- [ ] Animations smooth
- [ ] Mobile responsive

### Staff Grid
- [ ] Grid layout responsive
- [ ] Hover effects work
- [ ] Role colors distinct
- [ ] Icons clear and recognizable

### PIN Input
- [ ] Auto-focus on first input
- [ ] Auto-advance to next input
- [ ] Backspace works correctly
- [ ] Paste support works
- [ ] Error state clear

### Kitchen Display
- [ ] Large, readable cards
- [ ] High contrast for kitchen environment
- [ ] Urgency colors clear
- [ ] Action buttons prominent

## 📱 Mobile Testing

- [ ] Test on mobile device or emulator
- [ ] Staff grid responsive
- [ ] PIN input works on mobile keyboard
- [ ] Kitchen display readable on tablet
- [ ] Active orders scrollable
- [ ] Touch targets adequate size

## 🐛 Error Handling

### Network Errors
- [ ] Disconnect internet
- [ ] Try to update order status
- [ ] See appropriate error message
- [ ] Reconnect and retry

### Invalid Data
- [ ] Try to invite with invalid email
- [ ] See validation error
- [ ] Try to set 3-digit PIN
- [ ] See validation error

### Database Errors
- [ ] Simulate database error (if possible)
- [ ] See user-friendly error message
- [ ] No app crash

## ✅ Final Verification

- [ ] All tables created successfully
- [ ] All triggers working
- [ ] All RLS policies active
- [ ] All pages accessible
- [ ] All components rendering
- [ ] All permissions enforced
- [ ] All status transitions working
- [ ] All audit logs recording
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] App compiles successfully
- [ ] Quick checkout businesses unaffected

---

## 📊 Test Results Summary

**Date Tested**: _______________
**Tester**: _______________
**Environment**: _______________

**Total Tests**: _____ / _____
**Passed**: _____
**Failed**: _____
**Blocked**: _____

**Critical Issues**: _____
**Minor Issues**: _____

**Notes**:
_________________________________
_________________________________
_________________________________

**Sign-off**: _______________
