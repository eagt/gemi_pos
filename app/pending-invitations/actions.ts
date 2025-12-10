'use server'

import { createClient, createServiceRoleClient } from '../../lib/supabase/server'

export async function getPendingInvitations() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // Use service role client to bypass RLS on shops table
    // This allows us to fetch the shop name even if the user isn't an owner
    const admin = createServiceRoleClient()

    const { data, error } = await admin
        .from('shop_staff')
        .select(`
      id,
      shop_id,
      created_at,
      accepted_at,
      role,
      quick_checkout_role,
      user_id,
      shop_id,
      shops (
        id,
        name
      )
    `)
        .eq('user_id', user.id) // IMPORTANT: Explicitly filter by user_id
        .is('accepted_at', null)

    if (error) {
        console.log('[pending invitations]', error)
    }

    console.log('Pending invitations fetched:', JSON.stringify(data, null, 2))
    return data ?? []
}

export async function acceptInvitation(invitationId: string, shopId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        // This should be handled by middleware usually, but safe to redirect
        // We can't redirect from here easily without importing redirect
        // But since this is a server action called from a form, we can throw or return error
        // However, the original code used redirect, so let's import it.
        const { redirect } = await import('next/navigation')
        redirect('/login')
    }

    await supabase
        .from('shop_staff')
        .update({
            user_id: user!.id,
            accepted_at: new Date().toISOString(),
        })
        .eq('id', invitationId)
        .eq('shop_id', shopId)
        .is('accepted_at', null)

    const { redirect } = await import('next/navigation')
    redirect(`/setup-pin/${shopId}`)
}