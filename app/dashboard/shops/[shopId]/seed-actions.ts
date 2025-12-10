'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function seedSampleProducts(shopId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Verify shop ownership
    const { data: shop } = await supabase
        .from('shops')
        .select('id')
        .eq('id', shopId)
        .eq('owner_id', user.id)
        .single()

    if (!shop) {
        return { error: 'Shop not found or unauthorized' }
    }

    const sampleProducts = [
        { name: 'Coca Cola 330ml', price_cents: 150, cost_cents: 80, stock: 50, category: 'Beverages' },
        { name: 'Pepsi 330ml', price_cents: 150, cost_cents: 80, stock: 45, category: 'Beverages' },
        { name: 'Water 500ml', price_cents: 100, cost_cents: 50, stock: 100, category: 'Beverages' },
        { name: 'Orange Juice 1L', price_cents: 250, cost_cents: 150, stock: 30, category: 'Beverages' },
        { name: 'Chocolate Bar', price_cents: 120, cost_cents: 60, stock: 75, category: 'Snacks' },
        { name: 'Crisps', price_cents: 99, cost_cents: 45, stock: 60, category: 'Snacks' },
        { name: 'Sandwich', price_cents: 350, cost_cents: 180, stock: 25, category: 'Food' },
        { name: 'Apple', price_cents: 80, cost_cents: 40, stock: 40, category: 'Fruit' },
        { name: 'Banana', price_cents: 60, cost_cents: 30, stock: 50, category: 'Fruit' },
        { name: 'Energy Drink', price_cents: 200, cost_cents: 110, stock: 35, category: 'Beverages' },
        { name: 'Coffee', price_cents: 250, cost_cents: 120, stock: 40, category: 'Beverages' },
        { name: 'Muffin', price_cents: 180, cost_cents: 90, stock: 20, category: 'Food' },
    ]

    const productsWithShopId = sampleProducts.map(p => ({
        ...p,
        shop_id: shopId,
    }))

    const { error } = await supabase
        .from('products')
        .insert(productsWithShopId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/dashboard/shops/${shopId}/pos`)

    return { success: true }
}
