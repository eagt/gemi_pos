# Database Migration Guide

## 🎯 Overview

This guide walks you through applying the restaurant staff system database migration to your Supabase project.

## ⚠️ Important Notes

- **Backup First**: Always backup your database before running migrations
- **Idempotent**: This migration is safe to run multiple times
- **No Downtime**: Migration can be applied to production without downtime
- **Backward Compatible**: Existing data and functionality remain unchanged

## 📋 Prerequisites

- Supabase project with existing schema
- Access to Supabase SQL Editor
- Existing tables: `shops`, `orders`, `order_items`, `profiles`

## 🚀 Migration Steps

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase dashboard
2. Navigate to: **SQL Editor**
3. Click **New Query**

### Step 2: Copy Migration SQL

1. Open `migration_restaurant_staff_system.sql` in your code editor
2. Copy the entire contents (Ctrl+A, Ctrl+C)

### Step 3: Run Migration

1. Paste the SQL into the Supabase SQL Editor
2. Review the SQL (optional but recommended)
3. Click **Run** button
4. Wait for completion (should take 5-10 seconds)

### Step 4: Verify Migration

Run these verification queries:

```sql
-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('shop_staff', 'order_status_changes');

-- Check new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'shops' 
AND column_name = 'business_type';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('table_number', 'notes', 'last_changed_by');

-- Check triggers exist
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Check RLS policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('shop_staff', 'order_status_changes');
```

Expected results:
- ✅ 2 new tables: `shop_staff`, `order_status_changes`
- ✅ 1 new column in `shops`: `business_type`
- ✅ 3 new columns in `orders`: `table_number`, `notes`, `last_changed_by`
- ✅ 2 triggers: `on_table_order_shop_created`, `on_order_status_changed`
- ✅ Multiple RLS policies for new tables

## 📊 What Gets Created

### New Tables

#### shop_staff
```sql
- id (uuid, primary key)
- shop_id (uuid, foreign key → shops)
- user_id (uuid, foreign key → auth.users)
- email (text, for invitations)
- role (text: manager|waiter|chef|runner)
- name (text)
- pin (text, encrypted)
- avatar_url (text, optional)
- created_at (timestamptz)
- invited_by (uuid, foreign key → shop_staff)
- accepted_at (timestamptz, optional)
```

#### order_status_changes
```sql
- id (uuid, primary key)
- order_id (uuid, foreign key → orders)
- changed_by (uuid, foreign key → shop_staff)
- old_status (text)
- new_status (text)
- changed_at (timestamptz)
```

### Updated Tables

#### shops
- Added: `business_type` (text, default: 'quick_checkout')

#### orders
- Added: `table_number` (text, optional)
- Added: `notes` (text, optional)
- Added: `last_changed_by` (uuid, foreign key → shop_staff)
- Updated: `status` check constraint (added restaurant statuses)

### Triggers

1. **on_table_order_shop_created**
   - Automatically creates manager staff record when table_order business is created
   
2. **on_order_status_changed**
   - Automatically logs all order status changes to audit trail

### Functions

1. **create_manager_for_table_order_shop()**
   - Creates manager staff record on business creation
   
2. **log_order_status_change()**
   - Logs status changes to order_status_changes table
   
3. **get_pending_invitations(user_email)**
   - Returns pending staff invitations for an email

### RLS Policies

**shop_staff table:**
- Staff can view their shop's staff
- Managers can invite staff
- Staff can update their own record
- Managers can update any staff
- Managers can delete staff

**order_status_changes table:**
- Staff can view status changes for their shop's orders
- Staff can insert status changes

**orders table (updated):**
- Extended to include staff access
- Staff can view/insert/update orders from their shop

## 🔍 Troubleshooting

### Error: "relation already exists"
**Solution**: Tables already created. Safe to ignore or drop and recreate.

### Error: "column already exists"
**Solution**: Column already added. Safe to ignore.

### Error: "constraint already exists"
**Solution**: Constraint already created. Safe to ignore.

### Error: "permission denied"
**Solution**: Ensure you're using the Supabase service role or have sufficient permissions.

### Error: "function does not exist"
**Solution**: Check that `uuid_generate_v4()` extension is enabled:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## 🔄 Rollback (If Needed)

If you need to rollback the migration:

```sql
-- Drop new tables
DROP TABLE IF EXISTS order_status_changes CASCADE;
DROP TABLE IF EXISTS shop_staff CASCADE;

-- Remove new columns
ALTER TABLE shops DROP COLUMN IF EXISTS business_type;
ALTER TABLE orders DROP COLUMN IF EXISTS table_number;
ALTER TABLE orders DROP COLUMN IF EXISTS notes;
ALTER TABLE orders DROP COLUMN IF EXISTS last_changed_by;

-- Drop triggers
DROP TRIGGER IF EXISTS on_table_order_shop_created ON shops;
DROP TRIGGER IF EXISTS on_order_status_changed ON orders;

-- Drop functions
DROP FUNCTION IF EXISTS create_manager_for_table_order_shop();
DROP FUNCTION IF EXISTS log_order_status_change();
DROP FUNCTION IF EXISTS get_pending_invitations(text);

-- Restore original status constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded'));
```

**⚠️ Warning**: Rollback will delete all staff and audit data!

## 📈 Post-Migration Steps

1. **Test the migration**
   ```sql
   -- Create a test table_order business
   INSERT INTO shops (name, owner_id, business_type)
   VALUES ('Test Restaurant', 'your-user-id', 'table_order');
   
   -- Verify manager was created
   SELECT * FROM shop_staff WHERE shop_id = 'new-shop-id';
   ```

2. **Update existing shops (if needed)**
   ```sql
   -- Set business_type for existing shops
   UPDATE shops 
   SET business_type = 'quick_checkout' 
   WHERE business_type IS NULL;
   ```

3. **Verify RLS policies**
   ```sql
   -- Test as different users
   -- Ensure staff can only see their shop's data
   ```

## ✅ Success Criteria

Migration is successful when:
- [x] All tables created without errors
- [x] All columns added successfully
- [x] All triggers created and active
- [x] All RLS policies in place
- [x] Test business creation works
- [x] Manager auto-created on table_order business
- [x] Status changes logged automatically
- [x] No errors in Supabase logs

## 📞 Support

If you encounter issues:
1. Check Supabase logs for detailed error messages
2. Verify your schema matches expected structure
3. Ensure all prerequisite tables exist
4. Review RLS policies are enabled
5. Contact support with error details

## 🎉 Next Steps

After successful migration:
1. ✅ Test creating a table_order business
2. ✅ Verify manager creation
3. ✅ Test staff invitation flow
4. ✅ Test PIN login
5. ✅ Test order status changes
6. ✅ Verify audit trail
7. ✅ Deploy to production

---

**Migration File**: `migration_restaurant_staff_system.sql`  
**Version**: 1.0.0  
**Last Updated**: 2025-11-25  
**Estimated Time**: 5-10 seconds  
**Downtime Required**: None
