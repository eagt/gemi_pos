import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Store, Plus, ArrowRight } from 'lucide-react'

export default async function ShopsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: shops } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">My Shops</h1>
                <Link href="/dashboard/shops/new">
                    <Button className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="mr-2 h-4 w-4" />
                        New Shop
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {shops?.map((shop) => (
                    <Card key={shop.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Store className="h-5 w-5 text-purple-500" />
                                {shop.name}
                            </CardTitle>
                            <CardDescription>Created {new Date(shop.created_at).toLocaleDateString()}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href={`/dashboard/shops/${shop.id}/pos`}>
                                <Button className="w-full group">
                                    Open POS
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}

                {shops?.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-500">
                        <Store className="h-12 w-12 mb-4 opacity-20" />
                        <p>No shops found. Create one to get started!</p>
                    </div>
                )}
            </div>
        </div>
    )
}
