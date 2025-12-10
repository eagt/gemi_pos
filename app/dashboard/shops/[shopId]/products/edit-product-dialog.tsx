'use client'

import { useState } from 'react'
import { updateProduct, deleteProduct } from './actions'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { ProductForm } from './product-form'

interface EditProductDialogProps {
    shopId: string
    product: any // Using any for now to avoid complex type imports, but should be typed
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditProductDialog({ shopId, product, open, onOpenChange }: EditProductDialogProps) {
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)
        const result = await updateProduct(shopId, product.id, formData)

        if (result?.error) {
            toast.error(typeof result.error === 'string' ? result.error : 'Invalid input')
        } else {
            toast.success('Product updated successfully')
            onOpenChange(false)
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Product</DialogTitle>
                    <DialogDescription>Update product details and stock settings.</DialogDescription>
                </DialogHeader>
                <ProductForm
                    defaultValues={{
                        name: product.name,
                        price: product.price_cents / 100,
                        stock: product.stock,
                        category: product.category,
                        lowStockThreshold: product.low_stock_threshold,
                        isPreOrder: product.is_pre_order,
                        allowOverselling: product.allow_overselling,
                        preOrderStock: product.pre_order_stock,
                    }}
                    onSubmit={handleSubmit}
                    loading={loading}
                    submitLabel="Save Changes"
                />
            </DialogContent>
        </Dialog>
    )
}
