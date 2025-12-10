# Idle Timeout Auto-Logout Implementation

## Overview
Complete implementation of soft idle timeout with pre-expiry warning modal that auto-logs out inactive users while preserving shop context.

## Features Implemented

### 1. **Configurable Idle Timeout**
- Default: 5 minutes
- Options: 3, 5, 7, or 10 minutes (stored in `shops.idle_timeout_minutes`)
- Database migration: `migration_idle_timeout_setting.sql`

### 2. **Idle Detection**
- Tracks: mouse move, mouse down, clicks, touches, keypresses, and scrolls
- Resets timer on any genuine user activity
- Does NOT reset on background events

### 3. **Warning Modal**
- Shows exactly **90 seconds** before timeout expires
- Title: "Session expiring soon"
- Message: "You will be logged out in X seconds due to inactivity"
- Live countdown display
- Two buttons:
  - **"Continue Working"** (Primary/Purple) - Resets timer completely
  - **"Log out now"** (Secondary) - Performs immediate soft logout

### 4. **Soft Logout Behavior**
- Clears staff session from sessionStorage
- Navigates to `/dashboard/shops/[shopId]/staff-login`
- Preserves current shop context (stays in same shop)
- User selects their card and enters PIN to continue
- Returns to exactly where they were

### 5. **Chef Exception**
- **Completely disabled** for Chef role in `table_order` businesses
- No timer, no warning modal for Chefs
- All other roles in both business types have idle timeout active

## Files Created

### 1. **Database Migration**
`migration_idle_timeout_setting.sql`
- Adds `idle_timeout_minutes` column to shops table
- Default value: 5
- Constraint: Only allows 3, 5, 7, or 10

### 2. **Idle Timer Hook**
`hooks/use-idle-timer.ts`
- Custom React hook managing idle detection
- Tracks user activity across multiple event types
- Manages warning and logout timers
- Handles cleanup on unmount
- Respects Chef exception rule

### 3. **Warning Modal Component**
`components/idle-warning-modal.tsx`
- Clean AlertDialog-based modal
- Live countdown from 90 seconds
- Two action buttons with proper styling
- Amber/warning theme

### 4. **Idle Timer Provider**
`components/idle-timer-provider.tsx`
- Wrapper component coordinating hook and modal
- Handles "Continue Working" → resets timer
- Handles "Log out now" → immediate soft logout
- Doesn't render if disabled (Chef exception)

### 5. **Shop Layout Integration**
`app/dashboard/shops/[shopId]/layout.tsx`
- Fetches `idle_timeout_minutes` from database
- Determines if user is Chef in table_order business
- Renders `IdleTimerProvider` with correct props
- Applies to all routes under `/dashboard/shops/[shopId]/*`

## Behavior Flow

```
User Activity Detected
    ↓
Timer Resets (e.g., 5 minutes)
    ↓
User Goes Idle
    ↓
(3.5 minutes pass)
    ↓
Warning Modal Shows (90 seconds remaining)
    ↓
User Has 2 Options:
    ├─→ "Continue Working" → Timer fully resets
    └─→ "Log out now" OR no action → Soft logout
        ↓
    Clear sessionStorage
        ↓
    Navigate to /dashboard/shops/[shopId]/staff-login
        ↓
    User selects card, enters PIN
        ↓
    Returns to previous location
```

## Configuration

### To Change Idle Timeout for a Shop:
```sql
UPDATE shops
SET idle_timeout_minutes = 7  -- or 3, 5, 10
WHERE id = '{shop_id}';
```

### To Apply Migration:
Run in Supabase SQL Editor:
```sql
-- See migration_idle_timeout_setting.sql
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS idle_timeout_minutes INTEGER DEFAULT 5;

ALTER TABLE shops
ADD CONSTRAINT idle_timeout_minutes_check 
CHECK (idle_timeout_minutes IN (3, 5, 7, 10));
```

## Testing Checklist

- [ ] Warning modal appears 90 seconds before timeout
- [ ] "Continue Working" button resets timer completely
- [ ] "Log out now" performs immediate soft logout
- [ ] Auto-logout after 90 seconds if no action
- [ ] Redirects to correct staff login screen
- [ ] Preserves shop context (same shop ID)
- [ ] After PIN entry, returns to previous page
- [ ] Chef role in table_order: NO idle timeout
- [ ] Chef role in table_order: NO warning modal
- [ ] All other roles: idle timeout active
- [ ] Quick_checkout roles: idle timeout active
- [ ] Mouse/keyboard/touch activity resets timer
- [ ] Background events do NOT reset timer

## User Experience

1. **Normal Usage**: Users work without interruption
2. **Extended Idle**: After configured time minus 90 seconds, warning appears
3. **Active User**: Clicks "Continue Working" → seamlessly continues
4. **Inactive User**: Modal automatically closes → returns to login screen
5. **Quick Re-entry**: Select card, enter PIN → back to work
6. **Chef Workflow**: Chefs in restaurants never experience timeout (kitchen workflow uninterrupted)

## Security Benefits

- Prevents unauthorized access if user walks away
- Maintains session security in shared terminals
- Shop-specific timeout configuration
- No hard logout (Supabase session preserved)
- Soft logout (staff selection cleared)

## Notes

- Idle timeout applies to ALL pages under `/dashboard/shops/[shopId]/*`
- Does not apply to main dashboard (`/dashboard`)
- Does not apply to login/auth pages
- Timer managed entirely client-side for performance
- No server polling required
- Minimal performance impact (event throttling inherent to setTimeout)

## Future Enhancements (Optional)

- [ ] Add settings UI in Business Settings for idle timeout
- [ ] Add "Remember this device" option to extend timeout
- [ ] Add analytics tracking for timeout frequency
- [ ] Add customizable warning time (currently fixed at 90 seconds)
- [ ] Add role-based timeout overrides beyond Chef exception
