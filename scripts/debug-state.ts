
const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkState() {
    const shopId = '550ec1ed-4d1a-4d63-a164-a4b1d09b0414'
    const userId = 'bc56e69c-5291-47c8-885e-de8c256d3678'

    console.log('Checking state for:')
    console.log('Shop ID:', shopId)
    console.log('User ID:', userId)

    // 1. Check shop_staff
    const { data: staff, error: staffError } = await supabase
        .from('shop_staff')
        .select('*')
        .eq('shop_id', shopId)
        .eq('user_id', userId)

    console.log('\n--- Shop Staff ---')
    if (staffError) console.error(staffError)
    console.log(staff)

    // 2. Check working_shop
    const { data: working, error: workingError } = await supabase
        .from('working_shop')
        .select('*')
        .eq('shop_id', shopId)
        .eq('user_id', userId)

    console.log('\n--- Working Shop ---')
    if (workingError) console.error(workingError)
    console.log(working)
}

checkState()
