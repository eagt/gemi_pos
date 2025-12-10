
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

async function checkUser() {
    const email = 'c@c.com'
    console.log('Checking user:', email)

    // 1. Check Profiles
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single()

    console.log('\n--- Profile ---')
    if (profileError) console.log('Error/Not Found:', profileError.message)
    else console.log('Found:', profile)

    // 2. Check Auth (via listUsers hack or just try to create to see if it fails)
    // We can't list by email directly easily, but we can try to create and see the error
    // OR we can just list the first 50 users and see if it's there (unreliable but maybe works for small dev db)

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

    console.log('\n--- Auth Users (First 50) ---')
    if (listError) console.error(listError)

    const authUser = users.find((u: any) => u.email === email)
    if (authUser) {
        console.log('Found in Auth:', authUser.id, authUser.email)
        // 3. Check Shop Staff
        const { data: staff, error: staffError } = await supabase
            .from('shop_staff')
            .select('*')
            .eq('user_id', authUser?.id)

        console.log('\n--- Shop Staff ---')
        if (staffError) console.error(staffError)
        console.log(staff)
    } else {
        console.log('Not found in first 50 auth users')
    }
}

checkUser()
