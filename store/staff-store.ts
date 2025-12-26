'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { StaffRole } from '@/lib/types/database.types'

interface StaffSession {
    staffId: string
    shopId: string
    restaurantRole: StaffRole
    name: string
    userId: string | null
    avatarUrl?: string | null
    quickCheckoutRole?: string | null
}

interface StaffStore {
    session: StaffSession | null
    hasHydrated: boolean
    setSession: (session: StaffSession | null) => void
    clearSession: () => void
    hasPermission: (action: string) => boolean
    canTransitionStatus: (currentStatus: string, newStatus: string) => boolean
}

// Permission definitions
const permissions: Record<StaffRole, string[]> = {
    manager: ['*'], // Full access
    waiter: [
        'take_order',
        'view_orders',
        'mark_served',
        'request_payment',
        'process_payment',
        'view_menu',
    ],
    chef: [
        'view_kitchen_orders',
        'accept_order',
        'start_preparation',
        'mark_ready',
    ],
    runner: [
        'view_ready_orders',
        'mark_served',
    ],
    cashier: [
        'process_payment',
        'view_orders',
    ],
    supervisor: ['*'],
    administrator: ['*'],
}

// Status transition rules
const statusTransitions: Record<StaffRole, Record<string, string[]>> = {
    manager: {
        new: ['accepted', 'void'],
        accepted: ['in_preparation', 'void'],
        in_preparation: ['ready', 'void'],
        ready: ['served', 'void'],
        served: ['payment_requested', 'void'],
        payment_requested: ['paid', 'void'],
        paid: [],
    },
    waiter: {
        new: ['accepted'],
        served: ['payment_requested'],
        payment_requested: ['paid'],
    },
    chef: {
        new: ['accepted'],
        accepted: ['in_preparation'],
        in_preparation: ['ready'],
    },
    runner: {
        ready: ['served'],
    },
    cashier: {
        served: ['payment_requested'],
        payment_requested: ['paid'],
    },
    supervisor: {
        new: ['accepted', 'void'],
        accepted: ['in_preparation', 'void'],
        in_preparation: ['ready', 'void'],
        ready: ['served', 'void'],
        served: ['payment_requested', 'void'],
        payment_requested: ['paid', 'void'],
        paid: [],
    },
    administrator: {
        new: ['accepted', 'void'],
        accepted: ['in_preparation', 'void'],
        in_preparation: ['ready', 'void'],
        ready: ['served', 'void'],
        served: ['payment_requested', 'void'],
        payment_requested: ['paid', 'void'],
        paid: [],
    },
}

export const useStaffStore = create<StaffStore>((set, get) => ({
    session: null,
    // hasHydrated is no longer needed as we don't use persist
    hasHydrated: true,

    setSession: (session) => set({ session }),

    clearSession: () => set({ session: null }),

    hasPermission: (action) => {
        const { session } = get()
        if (!session) return false

        const rolePermissions = permissions[session.restaurantRole]

        // Manager has all permissions
        if (rolePermissions.includes('*')) {
            return true
        }

        return rolePermissions.includes(action)
    },

    canTransitionStatus: (currentStatus, newStatus) => {
        const { session } = get()
        if (!session) return false

        const allowedTransitions = statusTransitions[session.restaurantRole] || {}
        const allowed = allowedTransitions[currentStatus] || []

        return allowed.includes(newStatus)
    },
}))
