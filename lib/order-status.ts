export type OrderStatus =
    | 'new'
    | 'accepted'
    | 'in_preparation'
    | 'ready'
    | 'served'
    | 'payment_requested'
    | 'paid'
    | 'closed'
    | 'cancelled'
    | 'void'
    | 'refunded'
    | 'pending'
    | 'completed'

export interface StatusConfig {
    value: OrderStatus
    label: string
    color: string
    bgColor: string
    textColor: string
    nextStatuses?: OrderStatus[]
}

export const ORDER_STATUSES: Record<OrderStatus, StatusConfig> = {
    new: {
        value: 'new',
        label: 'New',
        color: 'bg-orange-500',
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-700',
        nextStatuses: ['accepted', 'cancelled']
    },
    accepted: {
        value: 'accepted',
        label: 'Accepted',
        color: 'bg-yellow-500',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        nextStatuses: ['in_preparation', 'cancelled']
    },
    in_preparation: {
        value: 'in_preparation',
        label: 'In Preparation',
        color: 'bg-blue-500',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        nextStatuses: ['ready', 'cancelled']
    },
    ready: {
        value: 'ready',
        label: 'Ready',
        color: 'bg-emerald-500',
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-700',
        nextStatuses: ['served']
    },
    served: {
        value: 'served',
        label: 'Served',
        color: 'bg-green-700',
        bgColor: 'bg-green-50',
        textColor: 'text-green-800',
        nextStatuses: ['payment_requested']
    },
    payment_requested: {
        value: 'payment_requested',
        label: 'Bill Presented',
        color: 'bg-purple-500',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-700',
        nextStatuses: ['paid', 'cancelled']
    },
    paid: {
        value: 'paid',
        label: 'Paid',
        color: 'bg-gray-500',
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-700',
        nextStatuses: ['closed']
    },
    pending: {
        value: 'pending',
        label: 'Pending',
        color: 'bg-yellow-500',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        nextStatuses: ['completed', 'cancelled']
    },
    completed: {
        value: 'completed',
        label: 'Completed',
        color: 'bg-green-600',
        bgColor: 'bg-green-50',
        textColor: 'text-green-800',
        nextStatuses: []
    },
    closed: {
        value: 'closed',
        label: 'Closed',
        color: 'bg-slate-400',
        bgColor: 'bg-slate-50',
        textColor: 'text-slate-600',
        nextStatuses: []
    },
    cancelled: {
        value: 'cancelled',
        label: 'Cancelled',
        color: 'bg-red-700',
        bgColor: 'bg-red-50',
        textColor: 'text-red-800',
        nextStatuses: []
    },
    void: {
        value: 'void',
        label: 'Void',
        color: 'bg-red-900',
        bgColor: 'bg-red-50',
        textColor: 'text-red-900',
        nextStatuses: []
    },
    refunded: {
        value: 'refunded',
        label: 'Refunded',
        color: 'bg-red-800',
        bgColor: 'bg-red-50',
        textColor: 'text-red-900',
        nextStatuses: []
    }
}

export const KITCHEN_STATUSES: OrderStatus[] = ['new', 'accepted', 'in_preparation', 'ready']

export function getStatusConfig(status: OrderStatus): StatusConfig {
    return ORDER_STATUSES[status]
}

export function canTransitionTo(currentStatus: OrderStatus, nextStatus: OrderStatus): boolean {
    const config = ORDER_STATUSES[currentStatus]
    return config.nextStatuses?.includes(nextStatus) || false
}
