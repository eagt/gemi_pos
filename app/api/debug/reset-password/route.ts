import { createServiceRoleClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = createServiceRoleClient()
        const email = 'a@cash.com'
        const newPassword = 'password123'

        // 1. Find user
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

        if (listError) {
            return NextResponse.json({ error: 'List users failed: ' + listError.message }, { status: 500 })
        }

        const user = users?.find(u => u.email === email)

        if (!user) {
            return NextResponse.json({ error: 'User not found in Auth' }, { status: 404 })
        }

        // 2. Update password
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: newPassword }
        )

        if (updateError) {
            return NextResponse.json({ error: 'Update failed: ' + updateError.message }, { status: 500 })
        }

        // 3. Check shop_staff
        const { data: staff, error: staffError } = await supabase
            .from('shop_staff')
            .select('*')
            .eq('email', email)
            .single()

        return NextResponse.json({
            success: true,
            message: `Password for ${email} reset to: ${newPassword}`,
            auth_user_id: user.id,
            staff_entry: staff || 'Not found in shop_staff table (Error: ' + staffError?.message + ')'
        })
    } catch (e: any) {
        return NextResponse.json({ error: 'Unexpected error: ' + e.message }, { status: 500 })
    }
}
