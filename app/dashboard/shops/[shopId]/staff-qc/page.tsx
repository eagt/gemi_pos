import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getQuickCheckoutStaff, checkPermission } from './actions'
import { StaffListQC } from '@/components/staff-qc/staff-list-qc'
import { InviteStaffDialogQC } from '@/components/staff-qc/invite-staff-dialog-qc'

export default async function QuickCheckoutStaffPage({
    params,
}: {
    params: Promise<{ shopId: string }>
}) {
    const { shopId } = await params
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Verify this is a quick_checkout business
    const { data: shop } = await supabase
        .from('shops')
        .select('business_type')
        .eq('id', shopId)
        .single()

    if (!shop || shop.business_type !== 'quick_checkout') {
        redirect(`/dashboard/shops/${shopId}`)
    }

    // Check if user has permission to view staff
    const canView = await checkPermission(shopId, user.id, 'staff.view')
    if (!canView) {
        redirect(`/dashboard/shops/${shopId}`)
    }

    const staffList = await getQuickCheckoutStaff(shopId)
    const canInvite = await checkPermission(shopId, user.id, 'staff.invite')

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Staff Management</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage your team with role-based permissions and individual access controls.
                        </p>
                    </div>
                    {canInvite && <InviteStaffDialogQC shopId={shopId} />}
                </div>

                <StaffListQC staff={staffList} shopId={shopId} currentUserId={user.id} />
            </div>
        </div>
    )
}
