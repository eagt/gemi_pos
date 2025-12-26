'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export async function logout() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Delete working_shop record if exists
    if (user) {
        await supabase
            .from('working_shop')
            .delete()
            .eq('user_id', user.id)
    }

    // Sign out from Supabase auth
    await supabase.auth.signOut()
    redirect('/login')
}

/**
 * This function is now ONLY responsible for selecting a shop.
 * It does NOT redirect anywhere anymore.
 * All invitation acceptance logic has been moved to pending-invitations/actions.ts
 */
export async function selectShop(shopId: string, force: boolean = false) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check for existing working_shop record
    const { data: existingSession } = await supabase
        .from('working_shop')
        .select('shop_id, shops(name)')
        .eq('user_id', user.id)
        .single()

    // If there is an existing session for a DIFFERENT shop, and we are not forcing a switch
    if (existingSession && existingSession.shop_id !== shopId && !force) {
        return {
            confirmationNeeded: true,
            previousShopId: existingSession.shop_id,
            previousShopName: (existingSession.shops as any)?.name || 'Unknown Shop'
        }
    }

    // Upsert working_shop record for the new shop
    const { error } = await supabase
        .from('working_shop')
        .upsert({
            shop_id: shopId,
            user_id: user.id,
            clocked_in: false,
            clocked_out: true,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'shop_id,user_id'
        })

    // Terminate previous session if we are forcing a switch
    if (force && existingSession && existingSession.shop_id !== shopId) {
        await supabase
            .from('working_shop')
            .update({ clocked_in: false, clocked_out: true })
            .eq('shop_id', existingSession.shop_id)
            .eq('user_id', user.id)
    }

    if (error) {
        console.error('Error selecting shop:', error)
        throw new Error('Failed to select shop')
    }

    // NO REDIRECT HERE ANYMORE
    // The caller (usually a client component) will decide where to go
    // (e.g. to /staff-login/${shopId} or stay on the businesses page)
}

export async function clockOut(shopId: string, staffUserId?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // ROSTER-BASED MODEL: Use the staff member's user_id if provided,
    // otherwise fall back to the browser's authenticated user
    // BUT with Terminal Mode, we should check the cookie first if staffUserId is not provided
    let targetUserId = staffUserId

    if (!targetUserId) {
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get('pos_staff_session')
        if (sessionCookie) {
            try {
                const session = JSON.parse(sessionCookie.value)
                targetUserId = session.userId
            } catch (e) {
                // Invalid cookie
            }
        }
    }

    // Fallback to auth user if still no target (e.g. manager clocking out themselves without cookie?)
    if (!targetUserId) {
        targetUserId = user.id
    }

    const { error } = await supabase
        .from('working_shop')
        .update({
            clocked_in: false,
            clocked_out: true,
            updated_at: new Date().toISOString()
        })
        .eq('shop_id', shopId)
        .eq('user_id', targetUserId)

    if (error) console.error('clockOut error:', error)

    // Clear local session
    const cookieStore = await cookies()
    cookieStore.delete('pos_staff_session')

    redirect(`/staff-login/${shopId}`)
}

export async function fetchActiveSession(shopId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('pos_staff_session')
    let targetUserId = user.id

    if (sessionCookie) {
        try {
            const session = JSON.parse(sessionCookie.value)
            if (session.userId) {
                targetUserId = session.userId
            }
        } catch (e) { }
    }

    // 1. Check if this specific user is clocked in
    const { data: workingShop } = await supabase
        .from('working_shop')
        .select('clocked_in')
        .eq('shop_id', shopId)
        .eq('user_id', targetUserId)
        .single()

    // If not clocked in, return null (important for safety)
    if (!workingShop || !workingShop.clocked_in) {
        return null
    }

    // 2. Fetch staff details for the target user
    const { data: staff } = await supabase
        .from('shop_staff')
        .select('*')
        .eq('shop_id', shopId)
        .eq('user_id', targetUserId)
        .single()

    if (!staff) return null

    return {
        staffId: staff.id,
        shopId: staff.shop_id,
        restaurantRole: staff.restaurant_role,
        name: staff.name,
        userId: staff.user_id,
        avatarUrl: staff.avatar_url,
        quickCheckoutRole: staff.quick_checkout_role
    }
}