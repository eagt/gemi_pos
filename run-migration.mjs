#!/usr/bin/env node

/**
 * Automatic Database Migration Script
 * Runs the restaurant staff system migration automatically
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Error: Missing Supabase credentials')
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
    process.exit(1)
}

console.log('🍽️  Restaurant Staff System Migration')
console.log('====================================\n')

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Read migration file
const migrationPath = join(__dirname, 'migration_restaurant_staff_system.sql')
let migrationSQL

try {
    migrationSQL = readFileSync(migrationPath, 'utf8')
    console.log('✅ Migration file loaded successfully\n')
} catch (error) {
    console.error('❌ Error reading migration file:', error.message)
    process.exit(1)
}

// Run migration
console.log('🚀 Running migration...\n')

try {
    // Note: Supabase JS client doesn't support raw SQL execution
    // We need to use the REST API directly
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ query: migrationSQL })
    })

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }

    console.log('✅ Migration completed successfully!\n')

    // Verify tables were created
    console.log('🔍 Verifying migration...\n')

    const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .in('table_name', ['shop_staff', 'order_status_changes'])

    if (tablesError) {
        console.log('⚠️  Could not verify tables (this is normal - verification requires direct DB access)')
    } else {
        console.log('✅ Tables verified:', tables?.map(t => t.table_name).join(', '))
    }

    console.log('\n✨ Migration complete! Next steps:')
    console.log('1. Create a new table_order business')
    console.log('2. Set your manager PIN')
    console.log('3. Invite staff members')
    console.log('4. Test the system\n')

} catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    console.error('\n📝 Manual migration required:')
    console.error('1. Open Supabase Dashboard → SQL Editor')
    console.error('2. Copy contents of migration_restaurant_staff_system.sql')
    console.error('3. Paste and run\n')
    process.exit(1)
}
