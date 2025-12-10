'use server'

import { createClient } from '@/lib/supabase/server'
import { hash } from 'bcryptjs'
import { revalidatePath } from 'next/cache'

export async function acceptInvitation(invitationId: string, pin: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }
    if (!pin || pin.length < 4) return { error: 'PIN must be at least 4 digits' }

    // Hash the PIN
    const hashedPin = await hash(pin, 10)

    // Update the staff member
    const { error } = await supabase
        .from('shop_staff')
        .update({
            user_id: user.id,
            pin: hashedPin,
            accepted_at: new Date().toISOString()
        })
        .eq('id', invitationId)
        // Ensure the invitation is actually pending (user_id is null)
        .is('user_id', null)

    if (error) {
        console.error('Error accepting invitation:', error)
        return { error: 'Failed to accept invitation' }
    }

    return { success: true }
}
