'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const productSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    price: z.coerce.number().min(0, 'Price must be positive'),
    stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
    lowStockThreshold: z.coerce.number().int().min(0).default(5),
    isPreOrder: z.boolean().default(false),
    allowOverselling: z.boolean().default(false),
    preOrderStock: z.coerce.number().int().min(0).default(0),
    category: z.string().optional(),
})

export async function createProduct(shopId: string, formData: FormData) {
    const validated = productSchema.safeParse({
        name: formData.get('name'),
        price: formData.get('price'),
        stock: formData.get('stock'),
        lowStockThreshold: formData.get('lowStockThreshold'),
        isPreOrder: formData.get('isPreOrder') === 'on',
        allowOverselling: formData.get('allowOverselling') === 'on',
        preOrderStock: formData.get('preOrderStock'),
        category: formData.get('category'),
    })

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Verify ownership
    const { data: shop } = await supabase
        .from('shops')
        .select('id')
        .eq('id', shopId)
        .eq('owner_id', user.id)
        .single()

    if (!shop) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('products')
        .insert({
            shop_id: shopId,
            name: validated.data.name,
            price_cents: Math.round(validated.data.price * 100), // Convert to cents
            stock: validated.data.stock,
            low_stock_threshold: validated.data.lowStockThreshold,
            is_pre_order: validated.data.isPreOrder,
            allow_overselling: validated.data.allowOverselling,
            pre_order_stock: validated.data.preOrderStock,
            category: validated.data.category || 'Uncategorized',
        })

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/shops/${shopId}/products`)
    revalidatePath(`/dashboard/shops/${shopId}/pos`)

    return { success: true }
}

export async function updateProduct(shopId: string, productId: string, formData: FormData) {
    const validated = productSchema.safeParse({
        name: formData.get('name'),
        price: formData.get('price'),
        stock: formData.get('stock'),
        lowStockThreshold: formData.get('lowStockThreshold'),
        isPreOrder: formData.get('isPreOrder') === 'on',
        allowOverselling: formData.get('allowOverselling') === 'on',
        preOrderStock: formData.get('preOrderStock'),
        category: formData.get('category'),
    })

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Verify ownership
    const { data: shop } = await supabase
        .from('shops')
        .select('id')
        .eq('id', shopId)
        .eq('owner_id', user.id)
        .single()

    if (!shop) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('products')
        .update({
            name: validated.data.name,
            price_cents: Math.round(validated.data.price * 100),
            stock: validated.data.stock,
            low_stock_threshold: validated.data.lowStockThreshold,
            is_pre_order: validated.data.isPreOrder,
            allow_overselling: validated.data.allowOverselling,
            pre_order_stock: validated.data.preOrderStock,
            category: validated.data.category || 'Uncategorized',
        })
        .eq('id', productId)
        .eq('shop_id', shopId)

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/shops/${shopId}/products`)
    revalidatePath(`/dashboard/shops/${shopId}/pos`)

    return { success: true }
}

export async function deleteProduct(shopId: string, productId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Verify ownership
    const { data: shop } = await supabase
        .from('shops')
        .select('id')
        .eq('id', shopId)
        .eq('owner_id', user.id)
        .single()

    if (!shop) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('shop_id', shopId)

    if (error) {
        // Handle foreign key constraint (e.g. order items)
        if (error.code === '23503') { // Foreign key violation
            return { error: 'Cannot delete product because it has been sold. Archive it instead (coming soon).' }
        }
        return { error: error.message }
    }

    revalidatePath(`/dashboard/shops/${shopId}/products`)
    revalidatePath(`/dashboard/shops/${shopId}/pos`)

    return { success: true }
}
