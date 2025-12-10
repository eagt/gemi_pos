'use client'

import { useState } from 'react'
import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2, AlertTriangle, Edit } from 'lucide-react'
import { EditProductDialog } from './edit-product-dialog'
import { deleteProduct } from './actions'
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

interface ProductRowProps {
    product: any
    shopId: string
    canManage: boolean
}

export function ProductRow({ product, shopId, canManage }: ProductRowProps) {
    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const handleDelete = async () => {
        setDeleting(true)
        const result = await deleteProduct(shopId, product.id)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Product deleted')
            setDeleteOpen(false)
        }
        setDeleting(false)
    }

    return (
        <>
            <TableRow
                className={canManage ? "cursor-pointer hover:bg-slate-50" : ""}
                onClick={canManage ? () => setEditOpen(true) : undefined}
            >
                <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-purple-100 flex items-center justify-center text-purple-600">
                            {/* Placeholder icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
                        </div>
                        {product.name}
                    </div>
                </TableCell>
                <TableCell>{product.category || 'Uncategorized'}</TableCell>
                <TableCell>£{(product.price_cents / 100).toFixed(2)}</TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell>
                    <Badge
                        variant={product.stock <= 0 ? "destructive" : "secondary"}
                        className={
                            product.stock <= 0
                                ? "hover:bg-red-600"
                                : product.stock <= (product.low_stock_threshold || 5)
                                    ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                    : "bg-green-100 text-green-800 hover:bg-green-100"
                        }
                    >
                        {product.stock <= 0 ? 'Out of Stock' : product.stock <= (product.low_stock_threshold || 5) ? 'Low Stock' : 'In Stock'}
                    </Badge>
                </TableCell>
                <TableCell className="text-right">
                    {canManage && (
                        <div className="flex items-center justify-end gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-400 hover:text-purple-600 hover:bg-purple-50"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setEditOpen(true)
                                }}
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                onClick={(e) => {
                                    e.stopPropagation() // Prevent row click
                                    setDeleteOpen(true)
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </TableCell>
            </TableRow>

            {canManage && (
                <>
                    <EditProductDialog
                        shopId={shopId}
                        product={product}
                        open={editOpen}
                        onOpenChange={setEditOpen}
                    />

                    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-red-500" />
                                    Delete Product?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete <strong>{product.name}</strong>? This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={(e) => {
                                        e.preventDefault()
                                        handleDelete()
                                    }}
                                    className="bg-red-600 hover:bg-red-700"
                                    disabled={deleting}
                                >
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </>
            )}
        </>
    )
}
