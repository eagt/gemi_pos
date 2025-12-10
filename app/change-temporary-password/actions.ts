'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function completeSetup(password: string, shopId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // 1. Update Password
    const { error: passwordError } = await supabase.auth.updateUser({
        password: password
    })

    if (passwordError) {
        return { error: passwordError.message }
    }

    // 2. Mark invitation as accepted
    const { error: staffError } = await supabase
        .from('shop_staff')
        .update({ accepted_at: new Date().toISOString() })
        .eq('shop_id', shopId)
        .eq('user_id', user.id)

    if (staffError) {
        console.error('Error accepting invitation:', staffError)
        return { error: 'Failed to accept invitation' }
    }

    revalidatePath('/dashboard')
    return { success: true }
}
