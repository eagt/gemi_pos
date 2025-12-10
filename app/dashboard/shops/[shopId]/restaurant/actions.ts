'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { OrderStatus } from '@/lib/order-status'

export async function updateOrderStatus(
    shopId: string,
    orderId: string,
    newStatus: OrderStatus,
    staffId: string,
    oldStatus?: OrderStatus
) {
    const supabase = await createClient()

    // 1. Update order status
    const { error: updateError } = await supabase
        .from('orders')
        .update({
            status: newStatus as any, // Cast because DB type might be stricter than UI type
            last_changed_by: staffId
        })
        .eq('id', orderId)
        .eq('shop_id', shopId)

    if (updateError) {
        console.error('Update error:', updateError)
        return { error: 'Failed to update order status' }
    }

    // 2. Insert audit log
    const { error: auditError } = await supabase
        .from('order_status_changes')
        .insert({
            order_id: orderId,
            changed_by: staffId,
            old_status: oldStatus,
            new_status: newStatus
        })

    if (auditError) {
        console.error('Audit log failed:', auditError)
        // Don't fail the whole operation if audit fails, but log it
    }

    revalidatePath(`/dashboard/shops/${shopId}/restaurant`)
    revalidatePath(`/dashboard/shops/${shopId}/restaurant/kds`)
    revalidatePath(`/dashboard/shops/${shopId}/restaurant/orders/${orderId}`)

    return { success: true }
}
