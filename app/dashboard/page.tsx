import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Store, Plus, LogOut } from 'lucide-react'
import { BusinessCard } from '@/components/dashboard/business-card'
import { logout } from './actions'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // 1. Check for pending invitations (Global Check)
    const { count } = await supabase
        .from('shop_staff')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('accepted_at', null)

    if (count && count > 0) {
        redirect('/pending-invitations')
    }

    // 3. Get all active shops (Owner + Staff)
    const adminSupabase = createServiceRoleClient()
    const { data: staffEntries } = await adminSupabase
        .from('shop_staff')
        .select('shop:shops!shop_staff_shop_id_fkey(*), id')
        .eq('user_id', user.id)
        .not('accepted_at', 'is', null)

    const shopsWithStaffId = staffEntries?.map((entry: any) => ({
        ...entry.shop,
        staffId: entry.id
    }))
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || []

    // Render the list of shops
    return (
        <div className="container mx-auto max-w-4xl p-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Your Businesses</h1>
                    <p className="text-slate-500">Select a business to manage or create a new one</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/dashboard/shops/new/business-type">
                        <Button className="bg-purple-600 hover:bg-purple-700">
                            <Plus className="mr-2 h-4 w-4" />
                            New Business
                        </Button>
                    </Link>
                    <form action={logout}>
                        <Button variant="destructive" type="submit" className="bg-red-600 hover:bg-red-700">
                            <LogOut className="mr-2 h-4 w-4" />
                            Log Out
                        </Button>
                    </form>
                </div>
            </div>

            {shopsWithStaffId && shopsWithStaffId.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {shopsWithStaffId.map((shop: any) => (
                        <BusinessCard
                            key={shop.id}
                            shop={shop}
                            staffId={shop.staffId}
                        />
                    ))}
                </div>
            ) : (
                <Card className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                        <Store className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-slate-900">No businesses yet</h3>
                    <p className="mb-6 text-slate-500 max-w-sm">
                        Create your first business to start selling products and managing inventory.
                    </p>
                    <Link href="/dashboard/shops/new/business-type">
                        <Button variant="outline">
                            Create Business
                        </Button>
                    </Link>
                </Card>
            )}
        </div>
    )
}
