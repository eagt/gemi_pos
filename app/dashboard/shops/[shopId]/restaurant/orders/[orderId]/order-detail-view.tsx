'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { useStaffSession } from '@/components/staff/staff-session-provider'
import { updateOrderStatus } from '../../actions'
import { ArrowLeft, Clock, User, History, CreditCard, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { StaffRole } from '@/lib/types/database.types'
import { ORDER_STATUSES, OrderStatus } from '@/lib/order-status'
import { format } from 'date-fns'

interface OrderItem {
    id: string
    quantity: number
    unit_price_cents: number
    products: { name: string } | null
}

interface StatusChange {
    id: string
    old_status: string | null
    new_status: string | null
    changed_at: string
    staff: { name: string; role: StaffRole } | null
}

interface Order {
    id: string
    shop_id: string
    table_number: string | null
    total_cents: number
    status: OrderStatus
    customer_name: string | null
    payment_method: string | null
    notes: string | null
    created_at: string
    order_items: OrderItem[]
}

interface OrderDetailViewProps {
    shopId: string
    shopName: string
    order: Order
}

export function OrderDetailView({ shopId, shopName, order: initialOrder }: OrderDetailViewProps) {
    const router = useRouter()
    const { staff } = useStaffSession() || {}

    const [order, setOrder] = useState<Order>(initialOrder)
    const [statusHistory, setStatusHistory] = useState<StatusChange[]>([])
    const [isUpdating, setIsUpdating] = useState(false)

    useEffect(() => {
        loadStatusHistory()
    }, [order.id])

    const loadStatusHistory = async () => {
        const supabase = createClient()

        const { data, error } = await supabase
            .from('order_status_changes')
            .select(`
        *,
        staff:shop_staff(name, role)
      `)
            .eq('order_id', order.id)
            .order('changed_at', { ascending: true })

        if (error) {
            console.error('Error loading status history:', error)
        } else {
            setStatusHistory(data as StatusChange[])
        }
    }

    const refreshOrder = async () => {
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
            .eq('id', order.id)
            .single()

        if (!error && data) {
            setOrder(data as Order)
            loadStatusHistory()
        }
    }

    const updateStatusHandler = async (newStatus: OrderStatus) => {
        if (!staff) {
            toast.error('You must be logged in')
            return
        }

        // Permission check
        const role = staff.role
        let allowed = false

        if (role === 'manager') allowed = true
        else if (role === 'chef' && ['accepted', 'in_preparation', 'ready'].includes(newStatus)) allowed = true
        else if (role === 'runner' && ['served'].includes(newStatus)) allowed = true
        else if (role === 'waiter' && ['payment_requested', 'paid', 'served'].includes(newStatus)) allowed = true

        if (!allowed) {
            toast.error(`As a ${role}, you cannot perform this action`)
            return
        }

        setIsUpdating(true)
        try {
            const result = await updateOrderStatus(shopId, order.id, newStatus, staff.id, order.status)

            if (result.error) throw new Error(result.error)

            setOrder({ ...order, status: newStatus })
            toast.success(`Order status updated to ${ORDER_STATUSES[newStatus].label}`)

            // Auto-close after 30 seconds if paid
            if (newStatus === 'paid') {
                setTimeout(async () => {
                    await updateOrderStatus(shopId, order.id, 'closed', staff.id, 'paid')
                    router.push(`/dashboard/shops/${shopId}/restaurant`)
                }, 30000)
            }
        } catch (error) {
            toast.error('Failed to update status')
        } finally {
            setIsUpdating(false)
        }
    }

    const handleVoidOrder = async () => {
        if (!staff || staff.role !== 'manager') {
            toast.error('Only managers can void orders')
            return
        }

        if (!confirm('Are you sure you want to void this order? This action cannot be undone.')) {
            return
        }

        setIsUpdating(true)
        try {
            const result = await updateOrderStatus(shopId, order.id, 'void', staff.id, order.status)

            if (result.error) throw new Error(result.error)

            toast.success('Order voided')
            refreshOrder()
        } catch (error) {
            toast.error('Failed to void order')
        } finally {
            setIsUpdating(false)
        }
    }

    const statusConfig = ORDER_STATUSES[order.status]
    const nextStatuses = statusConfig.nextStatuses || []

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            {/* Header */}
            <div className="mb-6">
                <Button
                    variant="ghost"
                    onClick={() => router.push(`/dashboard/shops/${shopId}/restaurant/active-orders`)}
                    className="mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Active Orders
                </Button>

                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">
                            {order.table_number ? `Table ${order.table_number}` : `Order #${order.id.slice(0, 8)}`}
                        </h1>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            {format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}
                        </div>
                    </div>
                    <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor} border-0 text-lg px-4 py-2`}>
                        {statusConfig.label}
                    </Badge>
                </div>
            </div>

            <div className="grid gap-6">
                {/* Order Items */}
                <Card>
                    <CardHeader>
                        <CardTitle>Order Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {order.order_items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="font-medium">
                                            {item.quantity}x {item.products?.name || 'Unknown Item'}
                                        </div>
                                    </div>
                                    <div className="font-semibold">
                                        {formatCurrency(item.quantity * item.unit_price_cents)}
                                    </div>
                                </div>
                            ))}

                            <Separator />

                            <div className="flex items-center justify-between text-lg font-bold">
                                <span>Total</span>
                                <span>{formatCurrency(order.total_cents)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Notes */}
                {order.notes && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{order.notes}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Status Actions */}
                {nextStatuses.length > 0 && staff && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Update Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {nextStatuses.map((status) => {
                                    const config = ORDER_STATUSES[status]

                                    return (
                                        <Button
                                            key={status}
                                            onClick={() => updateStatusHandler(status)}
                                            disabled={isUpdating}
                                            className={`${config.color} hover:opacity-90 text-white`}
                                        >
                                            {config.label}
                                        </Button>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Manager Actions */}
                {staff?.role === 'manager' && order.status !== 'void' && (
                    <Card className="border-red-200">
                        <CardHeader>
                            <CardTitle className="text-red-700">Manager Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={handleVoidOrder}
                                disabled={isUpdating}
                                variant="destructive"
                                className="w-full"
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Void Order
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Status History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="w-5 h-5" />
                            Status History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Creation */}
                            <div className="flex items-start gap-4">
                                <div className="w-2 h-2 rounded-full bg-slate-400 mt-2"></div>
                                <div className="flex-1">
                                    <div className="font-medium">Order Created</div>
                                    <div className="text-sm text-muted-foreground">
                                        {format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}
                                    </div>
                                </div>
                            </div>

                            {/* Status Changes */}
                            {statusHistory.map((change) => {
                                const newStatusConfig = change.new_status ? ORDER_STATUSES[change.new_status as OrderStatus] : null

                                return (
                                    <div key={change.id} className="flex items-start gap-4">
                                        <div className={`w-2 h-2 rounded-full mt-2 ${newStatusConfig?.color || 'bg-slate-400'}`}></div>
                                        <div className="flex-1">
                                            <div className="font-medium">
                                                Changed to {newStatusConfig?.label || change.new_status}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {change.staff && (
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        {change.staff.name} ({change.staff.role})
                                                    </span>
                                                )}
                                                {format(new Date(change.changed_at), 'MMM d, yyyy h:mm a')}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Info */}
                {order.payment_method && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="w-5 h-5" />
                                Payment Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Method</span>
                                    <span className="font-medium capitalize">{order.payment_method}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Amount</span>
                                    <span className="font-medium">{formatCurrency(order.total_cents)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
