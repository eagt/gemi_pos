import { redirect } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase/server'

export default async function ShopIndexPage({ params }: { params: Promise<{ shopId: string }> }) {
    const { shopId } = await params
    const supabase = createServiceRoleClient()

    const { data: shop } = await supabase
        .from('shops')
        .select('business_type')
        .eq('id', shopId)
        .single()

    if (shop?.business_type === 'table_order') {
        redirect(`/dashboard/shops/${shopId}/restaurant`)
    } else {
        // Default to POS for quick_checkout or others
        redirect(`/dashboard/shops/${shopId}/pos`)
    }
}
