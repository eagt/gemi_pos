import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { KitchenDisplayView } from './kitchen-display-view'

export default async function KitchenDisplayPage({
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

    // Fetch kitchen orders with items (new, accepted, in_preparation, ready)
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
        .in('status', ['new', 'accepted', 'in_preparation', 'ready'])
        .order('created_at', { ascending: true })

    return <KitchenDisplayView shopId={shopId} shopName={shop.name} initialOrders={orders || []} />
}
