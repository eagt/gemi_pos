import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Simple .env.local parser
try {
    const envFile = readFileSync(join(__dirname, '.env.local'), 'utf8')
    envFile.split('\n').forEach(line => {
        const [key, value] = line.split('=')
        if (key && value) {
            process.env[key.trim()] = value.trim().replace(/"/g, '')
        }
    })
} catch (e) {
    console.log('No .env.local file found or error reading it')
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Error: Missing Supabase credentials')
    process.exit(1)
}

const migrationFile = process.argv[2]
if (!migrationFile) {
    console.error('❌ Error: Please provide a migration file path')
    process.exit(1)
}

const migrationPath = join(__dirname, migrationFile)
let migrationSQL

try {
    migrationSQL = readFileSync(migrationPath, 'utf8')
    console.log(`✅ Loaded ${migrationFile}`)
} catch (error) {
    console.error('❌ Error reading migration file:', error.message)
    process.exit(1)
}

console.log('🚀 Running SQL...')

// We need to use a workaround because Supabase JS client doesn't support raw SQL execution directly
// We'll try to use the `rpc` method if a function exists, or just warn the user.
// Actually, the previous script used a direct fetch to /rest/v1/rpc/exec_sql which is a common pattern if that function exists.
// Let's assume `exec_sql` exists (it often does in these setups) or we might fail.
// If `exec_sql` doesn't exist, we can't run raw SQL from the client easily without the dashboard.

// Let's try the fetch method used in the other script.
try {
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
        // If exec_sql doesn't exist, this will fail.
        // In that case, we might need to instruct the user to run it manually.
        const text = await response.text()
        throw new Error(`HTTP error! status: ${response.status} - ${text}`)
    }

    console.log('✅ SQL executed successfully!')
} catch (error) {
    console.error('\n❌ Execution failed:', error.message)
    console.error('\n📝 Manual execution required:')
    console.error('1. Open Supabase Dashboard → SQL Editor')
    console.error(`2. Copy contents of ${migrationFile}`)
    console.error('3. Paste and run\n')
    process.exit(1)
}
