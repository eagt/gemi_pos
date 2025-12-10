'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useStaffStore } from '@/store/staff-store'
import { formatCurrency } from '@/lib/utils'
import { Clock, Check, ChefHat, Flame } from 'lucide-react'
import { toast } from 'sonner'
import { OrderStatus } from '@/lib/types/database.types'

interface OrderItem {
    id: string
    quantity: number
    unit_price_cents: number
    products: { name: string } | null
}

interface Order {
    id: string
    table_number: string | null
    total_cents: number
    status: OrderStatus
    created_at: string
    notes: string | null
    order_items: OrderItem[]
}

const statusConfig = {
    new: {
        label: 'New Orders',
        color: 'bg-orange-500',
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-700',
        borderColor: 'border-orange-300',
        nextAction: 'Accept',
        nextStatus: 'accepted' as OrderStatus,
    },
    accepted: {
        label: 'Accepted',
        color: 'bg-yellow-500',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-300',
        nextAction: 'Start Cooking',
        nextStatus: 'in_preparation' as OrderStatus,
    },
    in_preparation: {
        label: 'Cooking',
        color: 'bg-blue-500',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-300',
        nextAction: 'Mark Ready',
        nextStatus: 'ready' as OrderStatus,
    },
    ready: {
        label: 'Ready for Pickup',
        color: 'bg-emerald-500',
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-700',
        borderColor: 'border-emerald-300',
        nextAction: null,
        nextStatus: null,
    },
}

export default function KitchenDisplayPage() {
    const params = useParams()
    const shopId = params.shopId as string
    const session = useStaffStore((state) => state.session)

    const [orders, setOrders] = useState<Order[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadOrders()

        // Set up real-time subscription
        const supabase = createClient()
        const channel = supabase
            .channel('kitchen-orders')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `shop_id=eq.${shopId}`,
                },
                () => {
                    loadOrders()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [shopId])

    const loadOrders = async () => {
        const supabase = createClient()

        const { data, error } = await supabase
            .from('orders')
            .select(`
        *,
        order_items(
          *,
          products(name)
        )
      `)
            .eq('shop_id', shopId)
            .in('status', ['new', 'accepted', 'in_preparation', 'ready'])
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Error loading orders:', error)
            toast.error('Failed to load orders')
        } else {
            setOrders(data as Order[])
        }

        setIsLoading(false)
    }

    const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
        const supabase = createClient()

        const { error } = await supabase
            .from('orders')
            .update({
                status: newStatus,
                last_changed_by: session?.staffId,
            })
            .eq('id', orderId)

        if (error) {
            console.error('Error updating order:', error)
            toast.error('Failed to update order')
        } else {
            toast.success('Order updated')
            loadOrders()
        }
    }

    const getTimeSince = (date: string) => {
        const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
        if (minutes < 1) return 'Just now'
        if (minutes < 60) return `${minutes}m`
        const hours = Math.floor(minutes / 60)
        return `${hours}h ${minutes % 60}m`
    }

    const getUrgencyColor = (createdAt: string) => {
        const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
        if (minutes > 30) return 'text-red-600'
        if (minutes > 15) return 'text-orange-600'
        return 'text-slate-600'
    }

    // Group orders by status
    const ordersByStatus = orders.reduce((acc, order) => {
        const status = order.status as keyof typeof statusConfig
        if (!acc[status]) {
            acc[status] = []
        }
        acc[status].push(order)
        return acc
    }, {} as Record<keyof typeof statusConfig, Order[]>)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white">Loading kitchen display...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-900 p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                            <ChefHat className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Kitchen Display</h1>
                            <p className="text-slate-400">
                                {orders.length} active order{orders.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-bold text-white">
                            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-slate-400">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Orders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(['new', 'accepted', 'in_preparation', 'ready'] as const).map((status) => {
                    const config = statusConfig[status]
                    const statusOrders = ordersByStatus[status] || []

                    return (
                        <div key={status} className="space-y-4">
                            {/* Column Header */}
                            <div className="bg-slate-800 rounded-lg p-4 border-2 border-slate-700">
                                <div className="flex items-center justify-between">
                                    <h2 className="font-bold text-white text-lg">{config.label}</h2>
                                    <Badge className={`${config.bgColor} ${config.textColor} border-0 text-lg px-3 py-1`}>
                                        {statusOrders.length}
                                    </Badge>
                                </div>
                            </div>

                            {/* Orders */}
                            <div className="space-y-4">
                                {statusOrders.map((order) => {
                                    const timeSince = getTimeSince(order.created_at)
                                    const urgencyColor = getUrgencyColor(order.created_at)

                                    return (
                                        <Card
                                            key={order.id}
                                            className={`border-4 ${config.borderColor} ${config.bgColor} shadow-lg`}
                                        >
                                            <CardHeader className="pb-3">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <CardTitle className="text-2xl font-bold">
                                                            {order.table_number ? `Table ${order.table_number}` : `Order #${order.id.slice(0, 6)}`}
                                                        </CardTitle>
                                                        <div className={`flex items-center gap-1 text-sm font-semibold mt-1 ${urgencyColor}`}>
                                                            <Clock className="h-4 w-4" />
                                                            {timeSince}
                                                        </div>
                                                    </div>
                                                    <Badge className={`${config.color} text-white border-0 text-sm px-3 py-1`}>
                                                        {config.label}
                                                    </Badge>
                                                </div>
                                            </CardHeader>

                                            <CardContent className="space-y-4">
                                                {/* Order Items */}
                                                <div className="space-y-2">
                                                    {order.order_items.map((item) => (
                                                        <div
                                                            key={item.id}
                                                            className="flex items-start justify-between bg-white rounded-lg p-3 border border-slate-200"
                                                        >
                                                            <div className="flex-1">
                                                                <div className="font-semibold text-lg">
                                                                    {item.quantity}x {item.products?.name || 'Unknown Item'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Notes */}
                                                {order.notes && (
                                                    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3">
                                                        <div className="text-xs font-semibold text-yellow-800 mb-1">NOTES:</div>
                                                        <div className="text-sm text-yellow-900">{order.notes}</div>
                                                    </div>
                                                )}

                                                {/* Action Button */}
                                                {config.nextAction && config.nextStatus && (
                                                    <Button
                                                        onClick={() => handleStatusChange(order.id, config.nextStatus!)}
                                                        className={`w-full ${config.color} hover:opacity-90 text-white text-lg py-6`}
                                                    >
                                                        {status === 'new' && <Check className="w-5 h-5 mr-2" />}
                                                        {status === 'accepted' && <Flame className="w-5 h-5 mr-2" />}
                                                        {status === 'in_preparation' && <Check className="w-5 h-5 mr-2" />}
                                                        {config.nextAction}
                                                    </Button>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )
                                })}

                                {statusOrders.length === 0 && (
                                    <div className="text-center py-12 text-slate-500 bg-slate-800 rounded-lg border-2 border-dashed border-slate-700">
                                        <p className="text-lg">No orders</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
