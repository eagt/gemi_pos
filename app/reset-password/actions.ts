'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function updatePassword(password: string) {
    try {
        const supabase = await createClient()

        const { error } = await supabase.auth.updateUser({
            password: password
        })

        if (error) {
            console.error('Password update error:', error)
            return { error: error.message }
        }

        return { success: true }
    } catch (error) {
        console.error('Password update error:', error)
        return { error: 'Failed to update password' }
    }
}
