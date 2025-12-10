'use client'

import { useState } from 'react'
import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EditProductDialog } from '../products/edit-product-dialog'

interface AlertRowProps {
    product: any
    shopId: string
}

export function AlertRow({ product, shopId }: AlertRowProps) {
    const [editOpen, setEditOpen] = useState(false)

    return (
        <>
            <TableRow
                className={cn(
                    "cursor-pointer transition-colors",
                    product.stock <= 0 ? "bg-red-50/50 hover:bg-red-50" : "hover:bg-slate-50"
                )}
                onClick={() => setEditOpen(true)}
            >
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>
                    <span className={product.stock <= 0 ? "text-red-600 font-bold" : "text-amber-600 font-medium"}>
                        {product.stock}
                    </span>
                </TableCell>
                <TableCell>
                    <Badge
                        variant={product.stock <= 0 ? "destructive" : "secondary"}
                        className={product.stock <= 0 ? "hover:bg-red-600 capitalize" : "bg-amber-100 text-amber-800 hover:bg-amber-100 capitalize"}
                    >
                        {product.stock <= 0 ? 'Out of Stock' : 'Low Stock'}
                    </Badge>
                </TableCell>
                <TableCell>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation()
                            setEditOpen(true)
                        }}
                        className="h-8 w-8 p-0"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                </TableCell>
            </TableRow>

            <EditProductDialog
                shopId={shopId}
                product={product}
                open={editOpen}
                onOpenChange={setEditOpen}
            />
        </>
    )
}
