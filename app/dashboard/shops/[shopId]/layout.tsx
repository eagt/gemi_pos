import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { ShopSidebar } from '@/components/shop/shop-sidebar'
import { StaffSessionProvider } from '@/components/staff/staff-session-provider'
import { IdleTimerProvider } from '@/components/idle-timer-provider'
import { ManagerNotificationListener } from '@/components/notifications/manager-notification-listener'

export default async function ShopLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ shopId: string }>
}) {
    const { shopId } = await params

    // Use regular client for auth
    const authSupabase = await createClient()
    const { data: { user } } = await authSupabase.auth.getUser()

    // Use service role for data fetching
    const supabase = createServiceRoleClient()

    // Fetch alert counts and shop name (Critical data)
    const { data: shopData } = await supabase
        .from('shops')
        .select('name, business_type, products(stock, low_stock_threshold)')
        .eq('id', shopId)
        .single()

    // Try to fetch idle timeout separately (Optional data)
    // This prevents the whole page from breaking if the migration hasn't been run
    let idleTimeoutMinutes = 5
    try {
        const { data: settings } = await supabase
            .from('shops')
            .select('idle_timeout_minutes')
            .eq('id', shopId)
            .single()

        if (settings?.idle_timeout_minutes) {
            idleTimeoutMinutes = settings.idle_timeout_minutes
        }
    } catch (e) {
        // Ignore error if column doesn't exist yet
        console.warn('Could not fetch idle_timeout_minutes, using default')
    }

    // Fetch user roles
    let restaurantRole = null
    let quickCheckoutRole = null

    if (user) {
        const { data: staff } = await supabase
            .from('shop_staff')
            .select('restaurant_role, quick_checkout_role')
            .eq('shop_id', shopId)
            .eq('user_id', user.id)
            .single()

        if (staff) {
            restaurantRole = staff.restaurant_role
            quickCheckoutRole = staff.quick_checkout_role
        }
    }

    let outOfStock = 0
    let lowStock = 0

    shopData?.products?.forEach((p: any) => {
        if (p.stock <= 0) {
            outOfStock++
        } else if (p.stock <= (p.low_stock_threshold || 5)) {
            lowStock++
        }
    })

    // Determine if current user is a Chef in table_order business
    const isChef = shopData?.business_type === 'table_order' && restaurantRole === 'chef'

    return (
        <div className="flex h-[100dvh] bg-slate-50 overflow-hidden">
            <ShopSidebar
                shopId={shopId}
                shopName={shopData?.name}
                businessType={shopData?.business_type}
                alertCounts={{ outOfStock, lowStock }}
                restaurantRole={restaurantRole}
                quickCheckoutRole={quickCheckoutRole}
            />
            <main className="flex-1 flex flex-col relative overflow-hidden">
                <StaffSessionProvider
                    shopId={shopId}
                    shopName={shopData?.name}
                    businessType={shopData?.business_type}
                >
                    <ManagerNotificationListener
                        shopId={shopId}
                        userId={user?.id || ''}
                        businessType={shopData?.business_type || 'quick_checkout'}
                        restaurantRole={restaurantRole}
                        quickCheckoutRole={quickCheckoutRole}
                    />
                    {children}
                </StaffSessionProvider>
                {/* Idle timeout provider */}
                <IdleTimerProvider
                    shopId={shopId}
                    timeoutMinutes={idleTimeoutMinutes}
                    businessType={shopData?.business_type || 'quick_checkout'}
                />
            </main>
        </div>
    )
}
