'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function updatePassword(formData: FormData) {
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    const returnUrl = formData.get('returnUrl') as string

    if (password !== confirmPassword) {
        return { error: 'Passwords do not match' }
    }

    if (password.length < 6) {
        return { error: 'Password must be at least 6 characters' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
        return { error: error.message }
    }

    // Update profile to clear has_temporary_password
    const admin = createServiceRoleClient()
    await admin
        .from('profiles')
        .update({ has_temporary_password: false })
        .eq('id', user.id)

    if (returnUrl) {
        redirect(returnUrl)
    } else {
        redirect('/dashboard')
    }
}
