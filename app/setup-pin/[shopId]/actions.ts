'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'

export async function setStaffPin(shopId: string, pin: string) {
    if (!pin || pin.length !== 4) return { error: 'Invalid PIN' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const admin = createServiceRoleClient()
    const hash = await bcrypt.hash(pin, 10)

    const { error } = await admin
        .from('shop_staff')
        .update({ pin: hash, accepted_at: new Date() })
        .eq('shop_id', shopId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error updating staff PIN:', error)
        return { error: 'Failed to update PIN' }
    }

    // Create working_shop record so user appears on the roster
    await admin
        .from('working_shop')
        .upsert({
            shop_id: shopId,
            user_id: user.id,
            clocked_in: false,
            clocked_out: true,
        }, { onConflict: 'shop_id,user_id' })

    return { redirectUrl: `/staff-login/${shopId}` }
}

export async function getUserOtherBusinessPins(shopId: string) {
    const supabase = createServiceRoleClient()
    const supabaseAuth = await createClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) return []

    const { data } = await supabase
        .from('shop_staff')
        .select('id, shop_id, shops(name)')
        .eq('user_id', user.id)
        .neq('shop_id', shopId)
        .not('pin', 'is', null)

    return data || []
}

export async function copyPinFromOtherBusiness(targetShopId: string, sourceStaffId: string) {
    const supabase = createServiceRoleClient()
    const supabaseAuth = await createClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: source } = await supabase
        .from('shop_staff')
        .select('pin')
        .eq('id', sourceStaffId)
        .single()

    if (!source?.pin) return { error: 'No PIN found' }

    const { error } = await supabase
        .from('shop_staff')
        .update({ pin: source.pin, accepted_at: new Date() })
        .eq('shop_id', targetShopId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error copying PIN:', error)
        return { error: 'Failed to copy PIN' }
    }

    // Create working_shop record so user appears on the roster
    await supabase
        .from('working_shop')
        .upsert({
            shop_id: targetShopId,
            user_id: user.id,
            clocked_in: false,
            clocked_out: true,
        }, { onConflict: 'shop_id,user_id' })

    return { redirectUrl: `/staff-login/${targetShopId}` }
}

export async function getShopName(shopId: string) {
    const supabase = createServiceRoleClient()
    const { data } = await supabase
        .from('shops')
        .select('name')
        .eq('id', shopId)
        .single()

    return data?.name || 'Unknown Business'
}
