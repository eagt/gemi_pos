'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(fullName: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
    })

    if (error) {
        return { error: error.message }
    }

    // Also update profile table
    await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id)

    revalidatePath('/user-settings')
    return { success: true }
}

export async function updatePassword(currentPassword: string, newPassword: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword
    })

    if (signInError) {
        return { error: 'Current password is incorrect' }
    }

    // Update to new password
    const { error } = await supabase.auth.updateUser({
        password: newPassword
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}

import { hash, compare } from 'bcryptjs'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function getUserShopPins() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // Get user's shop_staff entries
    const { data: staffEntries } = await supabase
        .from('shop_staff')
        .select('shop_id, pin')
        .eq('user_id', user.id)

    if (!staffEntries || staffEntries.length === 0) return []

    // Use service role to fetch shop names (bypasses RLS)
    const serviceClient = createServiceRoleClient()
    const shopIds = staffEntries.map(e => e.shop_id)

    const { data: shops } = await serviceClient
        .from('shops')
        .select('id, name')
        .in('id', shopIds)

    const shopMap = new Map(shops?.map((s: any) => [s.id, s.name]) || [])

    return staffEntries.map(entry => ({
        shopId: entry.shop_id,
        shopName: shopMap.get(entry.shop_id) || 'Unknown Shop',
        hasPin: !!entry.pin
    }))
}

export async function updateUserShopPin(shopId: string, currentPin: string, newPin: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Get current PIN hash
    const { data: staff } = await supabase
        .from('shop_staff')
        .select('pin')
        .eq('shop_id', shopId)
        .eq('user_id', user.id)
        .single()

    if (!staff) return { error: 'Staff record not found' }

    // If PIN exists, verify current PIN
    if (staff.pin) {
        if (!currentPin) return { error: 'Current PIN is required' }
        const isValid = await compare(currentPin, staff.pin)
        if (!isValid) return { error: 'Incorrect current PIN' }
    }

    // Hash new PIN
    const hashedPin = await hash(newPin, 10)

    // Update PIN
    const { error } = await supabase
        .from('shop_staff')
        .update({ pin: hashedPin })
        .eq('shop_id', shopId)
        .eq('user_id', user.id)

    if (error) return { error: 'Failed to update PIN' }

    revalidatePath(`/dashboard/shops/${shopId}/user-settings`)
    return { success: true }
}
