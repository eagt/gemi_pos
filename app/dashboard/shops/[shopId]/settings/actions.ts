'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

export async function inviteStaff(shopId: string, name: string, email: string, role: string) {
    const client = createServiceRoleClient()

    // Check if user exists
    const { data: existingId } = await client.rpc('get_user_id_by_email', { user_email: email.toLowerCase().trim() })

    let userId
    let tempPass = null

    if (existingId) {
        userId = existingId
    } else {
        tempPass = 'temp' + Math.floor(100000 + Math.random() * 900000)
        const { data: newUser, error } = await client.auth.admin.createUser({
            email: email.toLowerCase().trim(),
            password: tempPass,
            email_confirm: true,
            user_metadata: { needs_password_change: true }
        })
        if (error) throw error
        userId = newUser.user.id
    }

    // THIS LINE WAS MISSING — name field
    const { error: insertError } = await client
        .from('shop_staff')
        .insert({
            shop_id: shopId,
            user_id: userId,
            name: name.trim(),
            role,
            accepted_at: null,
            is_active: true
        })

    if (insertError) {
        console.error('INVITE FAILED:', insertError)
        throw insertError
    }

    return tempPass ? { email, tempPassword: tempPass } : null
}

export async function setStaffPin(shopId: string, formData: FormData) {
    const pin = formData.get('pin')?.toString().trim()
    if (!pin || pin.length !== 4) throw new Error('Invalid PIN')

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const admin = createServiceRoleClient()
    const hash = await bcrypt.hash(pin, 10)

    await admin
        .from('shop_staff')
        .update({ pin: hash, accepted_at: new Date() })
        .eq('shop_id', shopId)
        .eq('user_id', user.id)

    await admin
        .from('working_shop')
        .upsert({
            shop_id: shopId,
            user_id: user.id,
            clocked_in: false,
            clocked_out: true,
        }, { onConflict: 'shop_id,user_id' })

    redirect(`/staff-login/${shopId}`)
}

// Keep the other functions if you need them — or leave them minimal
export async function getStaffList() { return [] }
export async function updateStaffRole() { }
export async function deactivateStaffMember() { }

// Shop settings functions
export async function updateShopSettings(shopId: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const name = formData.get('name')?.toString().trim()
    const description = formData.get('description')?.toString().trim()
    const currency = formData.get('currency')?.toString().trim()
    const taxRate = parseFloat(formData.get('taxRate')?.toString() || '0')
    const idleTimeoutMinutes = parseInt(formData.get('idleTimeoutMinutes')?.toString() || '5')

    const admin = createServiceRoleClient()
    const { error } = await admin
        .from('shops')
        .update({
            name,
            description,
            currency,
            tax_rate: taxRate,
            idle_timeout_minutes: idleTimeoutMinutes,
            updated_at: new Date().toISOString()
        })
        .eq('id', shopId)

    if (error) {
        console.error('Error updating shop settings:', error)
        return { error: 'Failed to update settings' }
    }

    revalidatePath(`/dashboard/shops/${shopId}/settings`)
    return { success: true }
}

export async function deleteShop(shopId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Verify ownership
    const admin = createServiceRoleClient()
    const { data: shop } = await admin
        .from('shops')
        .select('owner_id')
        .eq('id', shopId)
        .single()

    if (shop?.owner_id !== user.id) {
        return { error: 'Only the owner can delete this shop' }
    }

    // Delete shop (cascades should handle related data)
    const { error } = await admin
        .from('shops')
        .delete()
        .eq('id', shopId)

    if (error) {
        console.error('Error deleting shop:', error)
        return { error: 'Failed to delete shop' }
    }

    redirect('/dashboard')
}