
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8')
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
            const key = match[1].trim()
            const value = match[2].trim().replace(/^["'](.*)["']$/, '$1')
            process.env[key] = value
        }
    })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
    console.log('Checking schema for selected_shops...')

    // Get columns
    const { data: columns, error: colError } = await supabase
        .rpc('get_columns', { table_name: 'selected_shops' })
    // RPC might not exist, let's try direct query if we can, but we can't easily query information_schema via JS client unless exposed.
    // Instead, let's just select * limit 1 and look at the object keys.

    const { data: sample, error: sampleError } = await supabase
        .from('selected_shops')
        .select('*')
        .limit(1)

    if (sampleError) {
        console.log('Error selecting *:', sampleError)
    } else {
        console.log('Sample row keys:', sample && sample[0] ? Object.keys(sample[0]) : 'No rows')
    }

    // Check for foreign keys using a raw query if possible? 
    // We can't run raw SQL with supabase-js easily unless we have an RPC for it.
    // But we can try to inspect the error behavior.

    console.log('Testing query with intentional join to shop_staff...')
    const { error: joinError } = await supabase
        .from('selected_shops')
        .select('*, shop_staff(*)')
        .limit(1)

    console.log('Join error (expected):', joinError)

    console.log('Testing query with intentional join to shops...')
    const { error: shopJoinError } = await supabase
        .from('selected_shops')
        .select('*, shops(*)')
        .limit(1)

    console.log('Shop Join error (should be null):', shopJoinError)

}

main()
