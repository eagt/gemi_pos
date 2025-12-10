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
import { ShoppingCart, Calendar, User, CreditCard, Banknote } from 'lucide-react'
import Link from 'next/link'

import { generateInvoiceNumber, getBasePrefix } from '@/lib/utils'

export default async function ShopOrdersPage({
    params,
}: {
    params: Promise<{ shopId: string }>
}) {
    const { shopId } = await params
    const supabase = await createClient()

    // Fetch orders with their items and shop details
    const { data: orders } = await supabase
        .from('orders')
        .select(`
      *,
      shops (name, settings),
      order_items (
        *,
        products (name)
      )
    `)
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })

    return (
        <div className="h-full flex flex-col p-4 md:p-8 overflow-y-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold">Orders History</h1>
                <p className="text-slate-500">View and manage your sales</p>
            </div>

            <div className="grid gap-6">
                {orders?.map((order) => {
                    const shopSettings = order.shops?.settings as any
                    const prefix = shopSettings?.prefix || getBasePrefix(order.shops?.name || 'SHOP')

                    return (
                        <Link key={order.id} href={`/dashboard/shops/${shopId}/orders/${order.id}`}>
                            <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                                <CardHeader className="bg-white p-3 sm:p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 sm:gap-4">

                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <CardTitle className="text-base truncate">
                                                        {generateInvoiceNumber(prefix, order.created_at)}
                                                    </CardTitle>
                                                    <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className="shrink-0 capitalize">
                                                        {order.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 mt-1">
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

                                            <span className="text-lg font-bold">
                                                £{(order.total_cents / 100).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        </Link>
                    )
                })}

                {orders?.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500 border rounded-lg border-dashed">
                        <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
                        <p>No orders found yet.</p>
                        <p className="text-sm">Complete a sale in the POS to see it here.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
