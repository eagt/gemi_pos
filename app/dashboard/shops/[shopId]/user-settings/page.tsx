import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UserSettingsClient from './user-settings-client'

export default async function UserSettingsPage({ params }: { params: Promise<{ shopId: string }> }) {
    const { shopId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Check if user is authenticated with a real Supabase session
    if (!user) {
        redirect('/login')
    }

    // SECURITY CHECK: Verify that the current Supabase auth user
    // matches any staff record they might be accessing
    // This prevents users from seeing other users' settings when PIN-logged-in
    const serviceClient = createServiceRoleClient()
    const { data: staffRecords } = await serviceClient
        .from('shop_staff')
        .select('user_id')
        .eq('shop_id', shopId)
        .eq('user_id', user.id)
        .limit(1)

    // If user doesn't have a staff record for this shop with matching user_id,
    // they shouldn't access user settings from this shop context
    if (!staffRecords || staffRecords.length === 0) {
        redirect(`/dashboard/shops/${shopId}/pos`)
    }

    return (
        <UserSettingsClient
            userEmail={user.email || ''}
            userFullName={user.user_metadata?.full_name || ''}
            shopId={shopId}
        />
    )
}
