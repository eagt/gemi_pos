'use server'

import { createClient } from '@/lib/supabase/server'

export async function sendPasswordResetEmail(email: string) {
    try {
        const supabase = await createClient()

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
        })

        if (error) {
            console.error('Password reset error:', error)
            return { error: error.message }
        }

        return { success: true }
    } catch (error) {
        console.error('Password reset error:', error)
        return { error: 'Failed to send reset email' }
    }
}
