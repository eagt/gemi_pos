
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugUserShops() {
    const userId = '4cc64ee4-c074-4a26-b19a-0a88b5b1ccc0'
    console.log('Checking shops for user:', userId)

    const { data: staffEntries, error } = await supabase
        .from('shop_staff')
        .select('*')
        .eq('user_id', userId)

    if (error) {
        console.error('Error fetching shop_staff:', error)
        return
    }

    console.log('Found staff entries:', staffEntries?.length)
    console.log(JSON.stringify(staffEntries, null, 2))
}

debugUserShops()
