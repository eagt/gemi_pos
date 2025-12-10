'use client'

import { useState } from 'react'
import { createProduct } from './actions'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
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
import { Plus, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
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

export function AddProductDialog({ shopId }: { shopId: string }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isPreOrder, setIsPreOrder] = useState(false)
    const [allowOverselling, setAllowOverselling] = useState(false)

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
        setLoading(true)

        // Append switch values manually if needed (though form data usually handles checkboxes/switches if checked)
        // Switches in shadcn/ui might not submit standard form data if not using a hidden input or controlled state correctly in a form
        // But we are using name prop on Switch, which usually doesn't work like a native checkbox in FormData without a hidden input.
        // Let's ensure we append the correct values.

        // Actually, shadcn Switch doesn't create a hidden input by default. We need to handle this.
        // We'll append them to formData.
        if (isPreOrder) formData.set('isPreOrder', 'on')
        if (allowOverselling) formData.set('allowOverselling', 'on')

        const result = await createProduct(shopId, formData)

        if (result?.error) {
            toast.error(typeof result.error === 'string' ? result.error : 'Invalid input')
        } else {
            toast.success('Product created successfully')
            setOpen(false)
            // Reset state
            setIsPreOrder(false)
            setAllowOverselling(false)
        }
        setLoading(false)
    }

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Product
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add New Product</DialogTitle>
                        <DialogDescription>Add a new item to your shop's inventory.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleFormSubmit} className="grid gap-6 py-4">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Product Name</Label>
                                <Input id="name" name="name" required placeholder="e.g. Wireless Headphones" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Price (£)</Label>
                                    <Input id="price" name="price" type="number" step="0.01" min="0" required placeholder="0.00" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select name="category">
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
                                            min="0"
                                            defaultValue="0"
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
                                                defaultValue="0"
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
                                            defaultValue="5"
                                            required
                                            className="bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Product'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

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
