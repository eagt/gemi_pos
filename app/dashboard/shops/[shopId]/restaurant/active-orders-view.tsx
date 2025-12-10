'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ORDER_STATUSES, OrderStatus, KITCHEN_STATUSES } from '@/lib/order-status'
import { Database } from '@/lib/types/database.types'
import { formatCurrency } from '@/lib/utils'
import { Clock, ChefHat } from 'lucide-react'
import Link from 'next/link'

type Order = Database['public']['Tables']['orders']['Row']
type OrderItem = Database['public']['Tables']['order_items']['Row']

type OrderWithItems = Omit<Order, 'status'> & {
    status: OrderStatus
    order_items: (OrderItem & {
        products: { name: string } | null
    })[]
}

interface ActiveOrdersViewProps {
    shopId: string
    shopName: string
    initialOrders: OrderWithItems[]
}

export function ActiveOrdersView({ shopId, shopName, initialOrders }: ActiveOrdersViewProps) {
    const [orders, setOrders] = useState<OrderWithItems[]>(initialOrders)

    // Group orders by status
    const ordersByStatus = orders.reduce((acc, order) => {
        const status = (order.status || 'new') as OrderStatus
        if (!acc[status]) {
            acc[status] = []
        }
        acc[status].push(order)
        return acc
    }, {} as Record<OrderStatus, OrderWithItems[]>)

    // Kitchen statuses to display
    const displayStatuses: OrderStatus[] = ['new', 'accepted', 'in_preparation', 'ready', 'served', 'payment_requested', 'paid']

    const getTimeSince = (date: string) => {
        const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
        if (minutes < 1) return 'Just now'
        if (minutes < 60) return `${minutes}m ago`
        const hours = Math.floor(minutes / 60)
        return `${hours}h ${minutes % 60}m ago`
    }

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Active Orders</h1>
                        <p className="text-slate-500 mt-1">{shopName} - Restaurant Mode</p>
                    </div>
                    <Link href={`/dashboard/shops/${shopId}/restaurant/kds`}>
                        <Button className="bg-purple-600 hover:bg-purple-700">
                            <ChefHat className="mr-2 h-4 w-4" />
                            Kitchen Display
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Orders Grid */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {displayStatuses.map((status) => {
                        const statusOrders = ordersByStatus[status] || []
                        const config = ORDER_STATUSES[status]

                        return (
                            <div key={status} className="space-y-4">
                                {/* Status Header */}
                                <div className="flex items-center justify-between">
                                    <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${config.color}`}></div>
                                        {config.label}
                                    </h2>
                                    <Badge variant="secondary" className="rounded-full">
                                        {statusOrders.length}
                                    </Badge>
                                </div>

                                {/* Orders */}
                                <div className="space-y-3">
                                    {statusOrders.map((order) => (
                                        <Link key={order.id} href={`/dashboard/shops/${shopId}/restaurant/orders/${order.id}`}>
                                            <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-purple-300">
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <CardTitle className="text-lg">
                                                                Order #{order.id.slice(0, 8)}
                                                            </CardTitle>
                                                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                                                <Clock className="h-3 w-3" />
                                                                {getTimeSince(order.created_at)}
                                                            </div>
                                                        </div>
                                                        <Badge className={`${config.bgColor} ${config.textColor} border-0`}>
                                                            {config.label}
                                                        </Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-2">
                                                        <div className="text-sm text-slate-600">
                                                            {order.order_items?.length || 0} items
                                                        </div>
                                                        <div className="text-lg font-bold text-slate-900">
                                                            {formatCurrency(order.total_cents)}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    ))}

                                    {statusOrders.length === 0 && (
                                        <div className="text-center py-8 text-slate-400 text-sm">
                                            No orders
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
