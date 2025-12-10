import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OrderDetailView } from './order-detail-view'

export default async function RestaurantOrderDetailPage({
    params,
}: {
    params: Promise<{ shopId: string; orderId: string }>
}) {
    const { shopId, orderId } = await params
    const supabase = await createClient()

    // Fetch shop
    const { data: shop } = await supabase
        .from('shops')
        .select('business_type, name')
        .eq('id', shopId)
        .single()

    if (!shop || shop.business_type !== 'table_order') {
        redirect(`/dashboard/shops/${shopId}/orders/${orderId}`)
    }

    // Fetch order with items
    const { data: order } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (
                *,
                products (name)
            )
        `)
        .eq('id', orderId)
        .eq('shop_id', shopId)
        .single()

    if (!order) {
        redirect(`/dashboard/shops/${shopId}/restaurant`)
    }

    return <OrderDetailView shopId={shopId} shopName={shop.name} order={order} />
}
