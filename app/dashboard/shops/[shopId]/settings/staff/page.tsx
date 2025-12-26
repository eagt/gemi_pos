import { getStaffList } from '@/app/dashboard/shops/[shopId]/settings/staff/actions'
import { StaffList } from '@/components/staff/staff-list'
import { InviteStaffDialog } from '@/components/staff/invite-staff-dialog'
import { StaffSettingsGuard } from '@/components/staff/staff-settings-guard'
import { createServiceRoleClient } from '@/lib/supabase/server'

export default async function StaffSettingsPage({
    params,
}: {
    params: Promise<{ shopId: string }>
}) {
    const { shopId } = await params

    // We fetch data using Service Role (in actions.ts) so it works for PIN users too.
    // The StaffSettingsGuard ensures only authorized users (Manager/Admin) can see this content.
    const staffList = await getStaffList(shopId)

    // Fetch shop business type
    const supabase = createServiceRoleClient()
    const { data: shop } = await supabase
        .from('shops')
        .select('business_type')
        .eq('id', shopId)
        .single()

    const businessType = shop?.business_type || 'quick_checkout'

    return (
        <StaffSettingsGuard shopId={shopId}>
            <div className="h-full overflow-y-auto p-6 md:p-8">
                <div className="space-y-6 pb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Staff Management</h1>
                            <p className="text-muted-foreground mt-1">
                                Manage your restaurant staff, roles, and access.
                            </p>
                        </div>
                        <InviteStaffDialog shopId={shopId} businessType={businessType} />
                    </div>

                    <StaffList staff={staffList} shopId={shopId} businessType={businessType} />
                </div>
            </div>
        </StaffSettingsGuard>
    )
}
