import { create } from 'zustand'
import { Database } from '@/lib/types/database.types'

type Product = Database['public']['Tables']['products']['Row']

export interface CartItem {
    product: Product
    quantity: number
}

interface CartStore {
    items: CartItem[]
    addItem: (product: Product) => void
    removeItem: (productId: string) => void
    updateQuantity: (productId: string, quantity: number) => void
    clearCart: () => void
    getTotal: () => number
    getItemCount: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
    items: [],

    addItem: (product) => {
        const items = get().items
        const existingItem = items.find((item) => item.product.id === product.id)

        if (existingItem) {
            set({
                items: items.map((item) =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                ),
            })
        } else {
            set({ items: [{ product, quantity: 1 }, ...items] })
        }
    },

    removeItem: (productId) => {
        set({ items: get().items.filter((item) => item.product.id !== productId) })
    },

    updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
            get().removeItem(productId)
            return
        }

        set({
            items: get().items.map((item) =>
                item.product.id === productId ? { ...item, quantity } : item
            ),
        })
    },

    clearCart: () => {
        set({ items: [] })
    },

    getTotal: () => {
        return get().items.reduce(
            (total, item) => total + item.product.price_cents * item.quantity,
            0
        )
    },

    getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0)
    },
}))
