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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingCart, Calendar, User, CreditCard, ArrowLeft, Banknote } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { notFound } from 'next/navigation'
import { generateInvoiceNumber, getBasePrefix } from '@/lib/utils'

export default async function OrderDetailsPage({
    params,
}: {
    params: Promise<{ shopId: string; orderId: string }>
}) {
    const { shopId, orderId } = await params
    const supabase = await createClient()

    const { data: order } = await supabase
        .from('orders')
        .select(`
      *,
      shops (name, settings),
      order_items (
        *,
        products (name)
      )
    `)
        .eq('id', orderId)
        .eq('shop_id', shopId)
        .single()

    if (!order) {
        notFound()
    }

    const shopSettings = order.shops?.settings as any
    const prefix = shopSettings?.prefix || getBasePrefix(order.shops?.name || 'SHOP')

    return (
        <div className="h-full flex flex-col p-8 overflow-y-auto">
            <div className="mb-8">
                <Link href={`/dashboard/shops/${shopId}/orders`} className="inline-flex items-center text-sm text-slate-500 hover:text-purple-600 mb-4 transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Orders
                </Link>
            </div>

            <div className="grid gap-6">
                <Card className="overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold">Order Details</h1>
                            <p className="text-slate-500">
                                {generateInvoiceNumber(prefix, order.created_at)}
                            </p>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">

                                <div>
                                    <div className="flex items-center gap-4 text-sm text-slate-500">
                                        <span>
                                            {new Date(order.created_at).toLocaleString()}
                                        </span>

                                        <span className="capitalize">
                                            {order.payment_method}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className="capitalize">
                                    {order.status}
                                </Badge>
                                <span className="text-lg font-bold">
                                    £{(order.total_cents / 100).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead className="pl-6 w-[40%] font-bold text-slate-900">Item</TableHead>
                                    <TableHead className="w-[20%] font-bold text-slate-900">Qty</TableHead>
                                    <TableHead className="w-[20%] font-bold text-slate-900">Price</TableHead>
                                    <TableHead className="w-[20%] font-bold text-slate-900">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {order.order_items.map((item: any) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="pl-6 font-medium">
                                            {item.products?.name || 'Unknown Product'}
                                        </TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>
                                            £{(item.unit_price_cents / 100).toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            £{((item.quantity * item.unit_price_cents) / 100).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
