import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { getShopAndStaffForLogin } from './actions'
import { StaffLoginClient } from './staff-login-client'

interface StaffLoginPageProps {
    params: Promise<{ shopId: string }>
    searchParams: Promise<{ returnUrl?: string }>
}

export default async function StaffLoginPage({ params, searchParams }: StaffLoginPageProps) {
    const { shopId } = await params
    const { returnUrl } = await searchParams

    // Get current user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Check if current user is a manager for this shop
    let isManager = false
    if (user) {
        const serviceClient = createServiceRoleClient()
        const { data: staffRecord } = await serviceClient
            .from('shop_staff')
            .select('restaurant_role, quick_checkout_role')
            .eq('shop_id', shopId)
            .eq('user_id', user.id)
            .single()

        isManager = staffRecord?.restaurant_role === 'manager' || staffRecord?.quick_checkout_role === 'manager'
    }

    // Proactive check: If user ALREADY has a staff session for this shop, redirect to POS
    const { fetchActiveSession } = await import('@/app/dashboard/actions')
    const session = await fetchActiveSession(shopId)
    if (session) {
        redirect(returnUrl ? decodeURIComponent(returnUrl) : `/dashboard/shops/${shopId}/pos`)
    }

    // Fetch data on the server (no loading spinner!)
    const result = await getShopAndStaffForLogin(shopId)

    if (result.error || !result.success || !result.shop || !result.staff) {
        // If there's an error, redirect to businesses page
        redirect('/dashboard/businesses')
    }

    // Pass the pre-loaded data to the client component
    return (
        <StaffLoginClient
            shop={result.shop}
            staff={result.staff}
            shopId={shopId}
            returnUrl={returnUrl}
            currentUserId={user?.id || null}
            isManager={isManager}
        />
    )
}
