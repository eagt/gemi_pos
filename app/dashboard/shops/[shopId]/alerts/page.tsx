import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AlertRow } from './alert-row'

export default async function StockAlertsPage({
    params,
    searchParams,
}: {
    params: Promise<{ shopId: string }>
    searchParams: Promise<{ filter?: string }>
}) {
    const { shopId } = await params
    const { filter } = await searchParams
    const supabase = await createClient()

    // Fetch products where stock <= low_stock_threshold
    // Note: Supabase JS client doesn't support comparing two columns directly in a filter easily (like .lte('stock', 'low_stock_threshold'))
    // We might need to fetch all products and filter in JS, or write a raw query, or use a computed column / view.
    // For simplicity and small scale, fetching all products for the shop and filtering in JS is fine.
    // Or better, we can use .rpc if we had a function, but we don't.
    // Actually, we can just fetch all products for the shop. It's unlikely to be thousands for this MVP.

    const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopId)
        .order('stock', { ascending: true })

    // Base set: all products with low stock or out of stock
    const allAlertProducts = products?.filter(p => p.stock <= (p.low_stock_threshold || 5)) || []

    const outOfStockCount = allAlertProducts.filter(p => p.stock <= 0).length
    const lowStockCount = allAlertProducts.filter(p => p.stock > 0).length

    // Apply filter if present
    let displayedProducts = allAlertProducts
    if (filter === 'out_of_stock') {
        displayedProducts = allAlertProducts.filter(p => p.stock <= 0)
    } else if (filter === 'low_stock') {
        displayedProducts = allAlertProducts.filter(p => p.stock > 0)
    }

    return (
        <div className="h-full flex flex-col p-4 md:p-8 overflow-y-auto">
            <div className="flex items-center justify-between mb-6 md:mb-8">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6 text-amber-500" />
                        Stock Alerts
                    </h1>
                    <p className="text-slate-500">Products running low or out of stock</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-4 md:gap-6 mb-6 md:mb-8">
                <Link href={`/dashboard/shops/${shopId}/alerts?filter=out_of_stock`} className="flex-1 min-w-[180px]">
                    <div className={cn(
                        "flex items-center gap-4 p-4 border rounded-xl shadow-sm h-full transition-all hover:shadow-md cursor-pointer",
                        filter === 'out_of_stock'
                            ? "ring-2 ring-red-500 border-transparent bg-red-50"
                            : "bg-red-50 hover:bg-red-100 hover:border-red-200"
                    )}>
                        <div className="h-12 w-12 shrink-0 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-lg">
                            {outOfStockCount}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-red-900">Out of Stock</span>
                            <span className="text-sm text-red-600">Items unavailable</span>
                        </div>
                    </div>
                </Link>

                <Link href={`/dashboard/shops/${shopId}/alerts?filter=low_stock`} className="flex-1 min-w-[180px]">
                    <div className={cn(
                        "flex items-center gap-4 p-4 border rounded-xl shadow-sm h-full transition-all hover:shadow-md cursor-pointer",
                        filter === 'low_stock'
                            ? "ring-2 ring-amber-400 border-transparent bg-amber-50"
                            : "bg-amber-50 hover:bg-amber-100 hover:border-amber-200"
                    )}>
                        <div className="h-12 w-12 shrink-0 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-lg">
                            {lowStockCount}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-amber-900">Low Stock</span>
                            <span className="text-sm text-amber-600">Restock soon</span>
                        </div>
                    </div>
                </Link>

                {filter && (
                    <Link href={`/dashboard/shops/${shopId}/alerts`} className="flex-1 min-w-[180px]">
                        <div className="flex items-center gap-4 p-4 border rounded-xl bg-emerald-100 shadow-sm h-full transition-all hover:shadow-md cursor-pointer hover:bg-emerald-200">
                            <div className="h-12 w-12 shrink-0 rounded-full bg-emerald-200 flex items-center justify-center">
                                <X className="h-6 w-6 text-emerald-700" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold text-emerald-900">Show All</span>
                                <span className="text-sm text-emerald-600">View all alerts</span>
                            </div>
                        </div>
                    </Link>
                )}
            </div>

            <div className="rounded-md border border-slate-200 bg-white overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="font-bold text-slate-900">Product Name</TableHead>
                            <TableHead className="font-bold text-slate-900">Current Stock</TableHead>
                            <TableHead className="font-bold text-slate-900">Status</TableHead>
                            <TableHead className="w-[100px] font-bold text-slate-900">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {displayedProducts.map((product) => (
                            <AlertRow key={product.id} product={product} shopId={shopId} />
                        ))}
                        {displayedProducts.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                                    {filter ? 'No products match this filter.' : 'No stock alerts. Everything looks good!'}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
