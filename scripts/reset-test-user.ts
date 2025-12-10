
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

async function resetUser() {
    const email = 'c@c.com'
    console.log('Resetting user:', email)

    // 1. Get User ID
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    const user = users.find((u: any) => u.email === email)

    if (!user) {
        console.log('User not found in Auth, nothing to do.')
        return
    }

    console.log('Found User ID:', user.id)

    // 2. Delete from shop_staff
    const { error: staffError } = await supabase
        .from('shop_staff')
        .delete()
        .eq('user_id', user.id)

    if (staffError) console.error('Error deleting staff:', staffError)
    else console.log('Deleted from shop_staff')

    // 3. Delete from profiles
    const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

    if (profileError) console.error('Error deleting profile:', profileError)
    else console.log('Deleted from profiles')

    // 4. Delete from Auth
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)

    if (deleteError) console.error('Error deleting auth user:', deleteError)
    else console.log('Deleted from Auth')
}

resetUser()
