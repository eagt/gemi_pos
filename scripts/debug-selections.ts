
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugSelections() {
    console.log('Checking staff_shop_selections...')

    const { data: selections, error } = await supabase
        .from('staff_shop_selections')
        .select('*')

    if (error) {
        console.error('Error fetching selections:', error)
        return
    }

    console.log('Found selections:', selections?.length)
    console.log(JSON.stringify(selections, null, 2))
}

debugSelections()
