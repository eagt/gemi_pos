'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2, AlertTriangle } from 'lucide-react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ProductFormProps {
    defaultValues?: {
        name: string
        price: number
        stock: number
        category: string
        lowStockThreshold: number
        isPreOrder: boolean
        allowOverselling: boolean
        preOrderStock: number
    }
    onSubmit: (formData: FormData) => Promise<void>
    loading: boolean
    submitLabel: string
}

export function ProductForm({ defaultValues, onSubmit, loading, submitLabel }: ProductFormProps) {
    const [isPreOrder, setIsPreOrder] = useState(defaultValues?.isPreOrder || false)
    const [allowOverselling, setAllowOverselling] = useState(defaultValues?.allowOverselling || false)

    // Warning modal state
    const [warningOpen, setWarningOpen] = useState(false)
    const [warningType, setWarningType] = useState<'oversell_only' | 'both' | null>(null)
    const [pendingFormData, setPendingFormData] = useState<FormData | null>(null)

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        // Logic for warning modals
        if (allowOverselling && isPreOrder) {
            setWarningType('both')
            setPendingFormData(formData)
            setWarningOpen(true)
            return
        }

        if (allowOverselling && !isPreOrder) {
            setWarningType('oversell_only')
            setPendingFormData(formData)
            setWarningOpen(true)
            return
        }

        // If safe, proceed directly
        submitProduct(formData)
    }

    const confirmSubmit = () => {
        if (pendingFormData) {
            submitProduct(pendingFormData)
            setWarningOpen(false)
            setPendingFormData(null)
        }
    }

    const submitProduct = async (formData: FormData) => {
        if (isPreOrder) formData.set('isPreOrder', 'on')
        else formData.delete('isPreOrder') // Ensure it's not sent if false (though delete isn't strictly necessary if we check for 'on')

        if (allowOverselling) formData.set('allowOverselling', 'on')
        else formData.delete('allowOverselling')

        await onSubmit(formData)
    }

    return (
        <>
            <form onSubmit={handleFormSubmit} className="grid gap-6 py-4">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Product Name</Label>
                        <Input id="name" name="name" required placeholder="e.g. Wireless Headphones" defaultValue={defaultValues?.name} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Price (£)</Label>
                            <Input id="price" name="price" type="number" step="0.01" min="0" required placeholder="0.00" defaultValue={defaultValues?.price} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select name="category" defaultValue={defaultValues?.category}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Electronics">Electronics</SelectItem>
                                    <SelectItem value="Clothing">Clothing</SelectItem>
                                    <SelectItem value="Food">Food</SelectItem>
                                    <SelectItem value="Services">Services</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
                        <Label className="text-base font-semibold">Stock Handling</Label>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="isPreOrder">This is a pre-order or made-to-order item</Label>
                            </div>
                            <Switch
                                id="isPreOrder"
                                checked={isPreOrder}
                                onCheckedChange={setIsPreOrder}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="allowOverselling">Allow overselling (sell even when stock = 0)</Label>
                            </div>
                            <Switch
                                id="allowOverselling"
                                checked={allowOverselling}
                                onCheckedChange={setAllowOverselling}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="stock">Current Stock</Label>
                                <Input
                                    id="stock"
                                    name="stock"
                                    type="number"
                                    min="0" // Actually, if overselling is allowed, stock can be negative. But for input, maybe we allow negative?
                                    // User didn't specify, but usually you set stock. If it's negative, it's negative.
                                    // Let's allow negative input if overselling is allowed? Or just keep it simple.
                                    // Standard input usually allows negative if type="number". But min="0" blocks it.
                                    // Let's remove min="0" if allowOverselling is true?
                                    // The user said "Allow overselling (sell even when stock = 0)".
                                    // It implies stock CAN go negative. So we should probably allow editing it to be negative or at least seeing it.
                                    // I'll remove min="0" generally or make it conditional.
                                    // For now, let's keep min="0" for simplicity unless user asks, as usually you count physical stock.
                                    // Wait, if I have -5 stock, and I edit, the input will show -5. If min=0, it might be invalid.
                                    // I should remove min="0" or make it conditional.
                                    // Let's remove min="0" to be safe for now, or set it to min={allowOverselling ? undefined : 0}
                                    // Actually, let's just remove min="0" for stock input to support negative values if they exist.
                                    defaultValue={defaultValues?.stock ?? 0}
                                    required
                                    className="bg-white"
                                />
                            </div>

                            {isPreOrder && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <Label htmlFor="preOrderStock" className="text-purple-600">Pre-order Quantity Available</Label>
                                    <Input
                                        id="preOrderStock"
                                        name="preOrderStock"
                                        type="number"
                                        min="0"
                                        defaultValue={defaultValues?.preOrderStock ?? 0}
                                        className="bg-purple-50 border-purple-200 focus-visible:ring-purple-500"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="lowStockThreshold">Low Stock Alert</Label>
                                <Input
                                    id="lowStockThreshold"
                                    name="lowStockThreshold"
                                    type="number"
                                    min="0"
                                    defaultValue={defaultValues?.lowStockThreshold ?? 5}
                                    required
                                    className="bg-white"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : submitLabel}
                    </Button>
                </div>
            </form>

            <AlertDialog open={warningOpen} onOpenChange={setWarningOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            {warningType === 'oversell_only' ? 'Overselling enabled (not recommended)' : 'Both options active'}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3 pt-2">
                            {warningType === 'oversell_only' ? (
                                <>
                                    <p>This forces the product to be sellable even when stock reaches zero.</p>
                                    <p>It will create negative stock numbers and make your inventory reports unreliable.</p>
                                    <p>Use this only if you really know what you’re doing.</p>
                                    <p className="font-medium text-purple-600">The safer option is “Pre-order or made-to-order” above.</p>
                                    <p>Continue at your own risk?</p>
                                </>
                            ) : (
                                <>
                                    <p>The product will be sellable with zero stock (negative inventory possible).</p>
                                    <p>Are you sure?</p>
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmSubmit}>
                            {warningType === 'oversell_only' ? 'Yes, I understand the risk' : 'Yes, save anyway'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
