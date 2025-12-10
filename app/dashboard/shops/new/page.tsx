'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createShop } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Store } from 'lucide-react'
import { toast } from 'sonner'

export default function NewShopPage() {
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [businessType, setBusinessType] = useState<'quick' | 'table' | null>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        // Get business type from sessionStorage
        const type = sessionStorage.getItem('businessType') as 'quick' | 'table' | null
        if (!type) {
            // If no type selected, redirect back to business type selection
            router.push('/dashboard/shops/new/business-type')
        } else {
            setBusinessType(type)
        }
    }, [router])

    const handleCreateShop = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Convert businessType from 'quick'/'table' to 'quick_checkout'/'table_order'
            const dbBusinessType = businessType === 'quick' ? 'quick_checkout' : 'table_order'
            const result = await createShop(name, dbBusinessType)

            if (result.error) {
                toast.error(result.error)
            } else if (result.shop) {
                // Clear the business type from sessionStorage
                sessionStorage.removeItem('businessType')

                toast.success('Business created successfully!')

                if (dbBusinessType === 'table_order') {
                    router.push(`/dashboard/shops/${result.shop.id}/settings/staff/setup-pin`)
                } else {
                    // Quick Checkout also goes to PIN setup first
                    router.push(`/dashboard/shops/${result.shop.id}/settings/staff/setup-pin`)
                }
            }
        } catch (error) {
            toast.error('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-8">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <button
                        onClick={() => router.push('/dashboard/shops/new/business-type')}
                        className="mb-4 text-sm text-slate-500 hover:text-purple-600 transition-colors flex items-center gap-1"
                    >
                        ← Back to business type
                    </button>
                    <div className="mb-4 flex justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                            <Store className="h-8 w-8 text-purple-600" />
                        </div>
                    </div>
                    <CardTitle className="text-center text-2xl">Create Your Business</CardTitle>
                    <CardDescription className="text-center">
                        {businessType === 'quick' && (
                            <span className="inline-flex items-center gap-1 font-semibold">
                                <span>⚡</span> Quick Checkout POS
                            </span>
                        )}
                        {businessType === 'table' && (
                            <span className="inline-flex items-center gap-1 font-semibold">
                                <span>🍽️</span> Table Order POS
                            </span>
                        )}
                        <br />
                        Give your business a name to get started
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreateShop} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Business Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="My Awesome Business"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-purple-600 hover:bg-purple-700"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Business'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
