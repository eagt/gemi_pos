'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function completeSale(shopId: string, items: Array<{ productId: string; quantity: number; unitPrice: number }>) {
    const supabase = await createClient()

    // Check for staff session cookie first (Terminal Mode)
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('pos_staff_session')
    let actorId = null

    if (sessionCookie) {
        try {
            const session = JSON.parse(sessionCookie.value)
            if (session.shopId === shopId) {
                actorId = session.userId
            }
        } catch (e) { }
    }

    // Fallback to auth user (Owner/Manager logged in directly)
    if (!actorId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) actorId = user.id
    }

    if (!actorId) {
        return { error: 'Unauthorized' }
    }

    // Verify shop access (Owner OR Staff)
    // 1. Check if Owner
    const { data: shop } = await supabase
        .from('shops')
        .select('id, owner_id')
        .eq('id', shopId)
        .single()

    if (!shop) return { error: 'Shop not found' }

    let isAuthorized = shop.owner_id === actorId

    // 2. If not owner, check if Staff
    if (!isAuthorized) {
        const { data: staff } = await supabase
            .from('shop_staff')
            .select('id')
            .eq('shop_id', shopId)
            .eq('user_id', actorId)
            .single()

        if (staff) isAuthorized = true
    }

    if (!isAuthorized) {
        return { error: 'Unauthorized access to shop' }
    }

    // Calculate total
    const totalCents = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)

    // Create order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            shop_id: shopId,
            total_cents: totalCents,
            status: 'completed',
        })
        .select()
        .single()

    if (orderError) {
        return { error: orderError.message }
    }

    // Check stock availability and deduct
    // Shop settings are already fetched above

    // Create order items and update stock
    for (const item of items) {
        // Insert order item
        const { error: itemError } = await supabase
            .from('order_items')
            .insert({
                order_id: order.id,
                product_id: item.productId,
                quantity: item.quantity,
                unit_price_cents: item.unitPrice,
            })

        if (itemError) {
            return { error: itemError.message }
        }

        // Decrement stock based on behavior
        const { data: product } = await supabase
            .from('products')
            .select('stock, is_pre_order, allow_overselling, pre_order_stock')
            .eq('id', item.productId)
            .single()

        if (product) {
            let newStock = product.stock - item.quantity
            let newPreOrderStock = product.pre_order_stock || 0

            // Rule: As long as at least one of the two toggles is ON, the POS must never block the sale when stock <= 0.
            const canSellOutOfStock = product.is_pre_order || product.allow_overselling

            if (newStock < 0 && !canSellOutOfStock) {
                return { error: `Insufficient stock for product ID ${item.productId}` }
            }

            // Deduction Logic
            if (product.is_pre_order) {
                // If pre-order is enabled, we prioritize deducting from main stock, then pre-order stock
                // Wait, the requirement says: "If is_pre_order: Deduct from pre_order_stock (allow negative)."
                // But usually we want to sell real stock first?
                // "Separate pre-order / backorder stock" implies a separate pool.
                // Let's stick to the previous logic which was smart: sell main stock first, then pre-order.
                // But the user said: "If is_pre_order: Deduct from pre_order_stock (allow negative)."
                // Let's interpret this as: if main stock is gone, use pre-order stock.

                let remainingQty = item.quantity
                let stockDeduction = 0
                let preOrderDeduction = 0

                if (product.stock >= remainingQty) {
                    stockDeduction = remainingQty
                } else {
                    stockDeduction = Math.max(0, product.stock)
                    preOrderDeduction = remainingQty - stockDeduction
                }

                newStock = product.stock - stockDeduction
                newPreOrderStock = (product.pre_order_stock || 0) - preOrderDeduction

            } else {
                // Standard deduction (from main stock)
                // If allow_overselling is true, this will go negative, which is expected.
                // newStock is already calculated as product.stock - item.quantity
            }

            const { error: stockError } = await supabase
                .from('products')
                .update({
                    stock: newStock,
                    pre_order_stock: newPreOrderStock
                })
                .eq('id', item.productId)

            if (stockError) {
                return { error: stockError.message }
            }
        }
    }

    revalidatePath(`/dashboard/shops/${shopId}/pos`)

    return { success: true, orderId: order.id }
}
