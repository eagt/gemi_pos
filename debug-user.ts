import { createServiceRoleClient } from './lib/supabase/server'

async function debugUser() {
    const client = createServiceRoleClient()
    const { data: profile } = await client
        .from('profiles')
        .select('*')
        .eq('email', 'k@k.com')
        .single()

    console.log('Profile for k@k.com:', profile)

    const { data: staff } = await client
        .from('shop_staff')
        .select('*')
        .eq('email', 'k@k.com')

    console.log('Staff entries for k@k.com:', staff)
}
