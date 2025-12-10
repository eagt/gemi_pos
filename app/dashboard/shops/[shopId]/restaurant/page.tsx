import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ActiveOrdersView } from './active-orders-view'

export default async function RestaurantOrdersPage({
    params,
}: {
    params: Promise<{ shopId: string }>
}) {
    const { shopId } = await params
    const supabase = await createClient()

    // Fetch shop to verify it's a table_order business
    const { data: shop } = await supabase
        .from('shops')
        .select('business_type, name')
        .eq('id', shopId)
        .single()

    if (!shop || shop.business_type !== 'table_order') {
        redirect(`/dashboard/shops/${shopId}/orders`)
    }

    // Fetch active orders with items (not closed, cancelled, void, or refunded)
    const { data: orders } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (
                *,
                products (name)
            )
        `)
        .eq('shop_id', shopId)
        .not('status', 'in', '(closed,cancelled,void,refunded)')
        .order('created_at', { ascending: false })

    return <ActiveOrdersView shopId={shopId} shopName={shop.name} initialOrders={orders || []} />
}
