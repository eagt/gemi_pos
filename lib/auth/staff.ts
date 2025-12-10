import { createClient } from '@/lib/supabase/server'
import { StaffRole } from '@/lib/types/database.types'
import crypto from 'crypto'

// Encrypt PIN using SHA-256
export function encryptPin(pin: string): string {
    return crypto.createHash('sha256').update(pin).digest('hex')
}

// Verify PIN
export function verifyPin(pin: string, hashedPin: string): boolean {
    return encryptPin(pin) === hashedPin
}

// Get current staff session from cookies
export interface StaffSession {
    staffId: string
    shopId: string
    role: StaffRole
    name: string
    userId: string | null
}

// Store staff session in cookie (client-side will handle this)
export function createStaffSessionData(staff: {
    id: string
    shop_id: string
    role: StaffRole
    name: string
    user_id: string | null
}): StaffSession {
    return {
        staffId: staff.id,
        shopId: staff.shop_id,
        role: staff.role,
        name: staff.name,
        userId: staff.user_id,
    }
}

// Check if user has permission for an action
export function hasPermission(role: StaffRole, action: string): boolean {
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
    }

    const rolePermissions = permissions[role]

    // Manager has all permissions
    if (rolePermissions.includes('*')) {
        return true
    }

    return rolePermissions.includes(action)
}

// Get allowed status transitions for a role
export function getAllowedStatusTransitions(role: StaffRole): Record<string, string[]> {
    const transitions: Record<StaffRole, Record<string, string[]>> = {
        manager: {
            // Manager can do any transition
            new: ['accepted', 'void'],
            accepted: ['in_preparation', 'void'],
            in_preparation: ['ready', 'void'],
            ready: ['served', 'void'],
            served: ['payment_requested', 'void'],
            payment_requested: ['paid', 'void'],
            paid: ['completed'],
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
    }

    return transitions[role] || {}
}

// Check if a status transition is allowed for a role
export function canTransitionStatus(
    role: StaffRole,
    currentStatus: string,
    newStatus: string
): boolean {
    const allowedTransitions = getAllowedStatusTransitions(role)
    const allowed = allowedTransitions[currentStatus] || []
    return allowed.includes(newStatus)
}

// Get staff by shop and user
export async function getStaffByShopAndUser(shopId: string, userId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('shop_staff')
        .select('*')
        .eq('shop_id', shopId)
        .eq('user_id', userId)
        .single()

    if (error) {
        return null
    }

    return data
}

// Get all staff for a shop
export async function getShopStaff(shopId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('shop_staff')
        .select(`
      *,
      invited_by_staff:shop_staff!shop_staff_invited_by_fkey(name)
    `)
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching shop staff:', error)
        return []
    }

    return data || []
}

// Get pending invitations for an email
export async function getPendingInvitations(email: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .rpc('get_pending_invitations', { user_email: email })

    if (error) {
        console.error('Error fetching pending invitations:', error)
        return []
    }

    return data || []
}

// Accept invitation and link to user
export async function acceptInvitation(staffId: string, userId: string, pin: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('shop_staff')
        .update({
            user_id: userId,
            pin: encryptPin(pin),
            accepted_at: new Date().toISOString(),
        })
        .eq('id', staffId)
        .select()
        .single()

    if (error) {
        console.error('Error accepting invitation:', error)
        return null
    }

    return data
}

// Verify staff PIN and return staff data
export async function verifyStaffPin(shopId: string, staffId: string, pin: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('shop_staff')
        .select('*')
        .eq('shop_id', shopId)
        .eq('id', staffId)
        .single()

    if (error || !data) {
        return null
    }

    // Check if PIN is set
    if (!data.pin) {
        return null
    }

    // Verify PIN
    if (!verifyPin(pin, data.pin)) {
        return null
    }

    return data
}

// Create staff invitation
export async function createStaffInvitation(
    shopId: string,
    invitedBy: string,
    staffData: {
        name: string
        email: string
        role: StaffRole
    }
) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('shop_staff')
        .insert({
            shop_id: shopId,
            name: staffData.name,
            email: staffData.email,
            role: staffData.role,
            invited_by: invitedBy,
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating staff invitation:', error)
        return null
    }

    return data
}

// Update staff PIN
export async function updateStaffPin(staffId: string, newPin: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('shop_staff')
        .update({
            pin: encryptPin(newPin),
        })
        .eq('id', staffId)
        .select()
        .single()

    if (error) {
        console.error('Error updating staff PIN:', error)
        return null
    }

    return data
}

// Get order status history
export async function getOrderStatusHistory(orderId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('order_status_changes')
        .select(`
      *,
      staff:shop_staff(name, role)
    `)
        .eq('order_id', orderId)
        .order('changed_at', { ascending: true })

    if (error) {
        console.error('Error fetching order status history:', error)
        return []
    }

    return data || []
}
