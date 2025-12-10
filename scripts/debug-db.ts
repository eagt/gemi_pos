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
    console.log('Reproducing error...')

    const shopId = 'f04f7aa4-0645-4c88-894f-e24fd2d8e038' // From logs

    const { data: selection, error: selectionError } = await supabase
        .from('selected_shops')
        .select('user_id, shop_id')
        .eq('shop_id', shopId)
        .eq('status', 'clocked_in')
        .limit(1)
        .single()

    if (selectionError) {
        console.log('Error:', selectionError)
    } else {
        console.log('Selection:', selection)
    }
}

main()
