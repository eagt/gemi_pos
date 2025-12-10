'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ORDER_STATUSES, OrderStatus } from '@/lib/order-status'
import { Database } from '@/lib/types/database.types'
import { ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useStaffSession } from '@/components/staff/staff-session-provider'
import { updateOrderStatus } from '../actions'

type Order = Database['public']['Tables']['orders']['Row']
type OrderItem = Database['public']['Tables']['order_items']['Row']

type OrderWithItems = Omit<Order, 'status'> & {
    status: OrderStatus
    order_items: (OrderItem & {
        products: { name: string } | null
    })[]
}

interface KitchenDisplayViewProps {
    shopId: string
    shopName: string
    initialOrders: OrderWithItems[]
}

export function KitchenDisplayView({ shopId, shopName, initialOrders }: KitchenDisplayViewProps) {
    const [orders, setOrders] = useState<OrderWithItems[]>(initialOrders)
    const [updating, setUpdating] = useState<string | null>(null)
    const supabase = createClient()

    // Group orders by status
    const ordersByStatus = orders.reduce((acc, order) => {
        const status = (order.status || 'new') as OrderStatus
        if (!acc[status]) {
            acc[status] = []
        }
        acc[status].push(order)
        return acc
    }, {} as Record<OrderStatus, OrderWithItems[]>)

    const kitchenStatuses: OrderStatus[] = ['new', 'accepted', 'in_preparation', 'ready']

    const getTimeSince = (date: string) => {
        const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
        if (minutes < 1) return 'Just now'
        if (minutes < 60) return `${minutes}m`
        const hours = Math.floor(minutes / 60)
        return `${hours}h ${minutes % 60}m`
    }

    const { staff } = useStaffSession() || {}

    const updateOrderStatusHandler = async (orderId: string, newStatus: OrderStatus, currentStatus: OrderStatus) => {
        if (!staff) {
            toast.error('You must be logged in')
            return
        }

        // Permission check
        const role = staff.role
        const allowed =
            role === 'manager' ||
            (role === 'chef' && ['accepted', 'in_preparation', 'ready'].includes(newStatus)) ||
            (role === 'runner' && ['served'].includes(newStatus)) ||
            (role === 'waiter' && ['accepted', 'served'].includes(newStatus)) // Waiters can also accept/serve if needed

        if (!allowed) {
            toast.error(`As a ${role}, you cannot move orders to ${ORDER_STATUSES[newStatus].label}`)
            return
        }

        setUpdating(orderId)
        try {
            const result = await updateOrderStatus(shopId, orderId, newStatus, staff.id, currentStatus)

            if (result.error) throw new Error(result.error)

            // Update local state
            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, status: newStatus } : o
            ))

            toast.success(`Order moved to ${ORDER_STATUSES[newStatus].label}`)
        } catch (error) {
            toast.error('Failed to update order status')
        } finally {
            setUpdating(null)
        }
    }

    const getNextAction = (status: OrderStatus) => {
        switch (status) {
            case 'new':
                return { label: 'Accept', nextStatus: 'accepted' as OrderStatus }
            case 'accepted':
                return { label: 'Start Prep', nextStatus: 'in_preparation' as OrderStatus }
            case 'in_preparation':
                return { label: 'Mark Ready', nextStatus: 'ready' as OrderStatus }
            case 'ready':
                return { label: 'Served', nextStatus: 'served' as OrderStatus }
            default:
                return null
        }
    }

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(async () => {
            const { data } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items (
                        *,
                        products (name)
                    )
                `)
                .eq('shop_id', shopId)
                .in('status', kitchenStatuses)
                .order('created_at', { ascending: true })

            if (data) {
                setOrders(data)
            }
        }, 30000)

        return () => clearInterval(interval)
    }, [shopId])

    return (
        <div className="flex flex-col h-screen bg-slate-900">
            {/* Header */}
            <div className="bg-slate-800 border-b border-slate-700 px-8 py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/dashboard/shops/${shopId}/restaurant`}>
                            <Button variant="ghost" size="sm" className="text-white hover:bg-slate-700">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Kitchen Display</h1>
                            <p className="text-slate-400 mt-1">{shopName}</p>
                        </div>
                    </div>
                    <div className="text-white text-2xl font-mono">
                        {new Date().toLocaleTimeString()}
                    </div>
                </div>
            </div>

            {/* Kitchen Board */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-4 gap-6 h-full">
                    {kitchenStatuses.map((status) => {
                        const statusOrders = ordersByStatus[status] || []
                        const config = ORDER_STATUSES[status]

                        return (
                            <div key={status} className="flex flex-col">
                                {/* Column Header */}
                                <div className={`${config.color} text-white px-6 py-4 rounded-t-xl`}>
                                    <div className="flex items-center justify-between">
                                        <h2 className="font-bold text-xl">{config.label}</h2>
                                        <Badge className="bg-white/20 text-white text-lg px-3 py-1">
                                            {statusOrders.length}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Orders */}
                                <div className="flex-1 bg-slate-800 rounded-b-xl p-4 space-y-4 overflow-y-auto">
                                    {statusOrders.map((order) => {
                                        const nextAction = getNextAction(status)
                                        const items = order.order_items || []

                                        return (
                                            <Card key={order.id} className="bg-white border-2 border-slate-300">
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <CardTitle className="text-2xl font-bold">
                                                                #{order.id.slice(0, 8).toUpperCase()}
                                                            </CardTitle>
                                                            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                                                <Clock className="h-4 w-4" />
                                                                <span className="font-semibold">
                                                                    {getTimeSince(order.created_at)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    {/* Items */}
                                                    <div className="space-y-2">
                                                        {items.map((item: any, idx: number) => (
                                                            <div key={idx} className="flex justify-between text-lg">
                                                                <span className="font-medium">
                                                                    {item.quantity}x {item.products?.name || 'Unknown Item'}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Action Button */}
                                                    {nextAction && (
                                                        <Button
                                                            onClick={() => updateOrderStatusHandler(order.id, nextAction.nextStatus, order.status)}
                                                            disabled={updating === order.id}
                                                            className="w-full bg-purple-600 hover:bg-purple-700 text-white text-lg py-6"
                                                        >
                                                            {updating === order.id ? 'Updating...' : nextAction.label}
                                                        </Button>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        )
                                    })}

                                    {statusOrders.length === 0 && (
                                        <div className="text-center py-12 text-slate-500">
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
