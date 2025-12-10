'use client'

import { useState } from 'react'
import { seedSampleProducts } from '@/app/dashboard/shops/[shopId]/seed-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package } from 'lucide-react'
import { toast } from 'sonner'

interface SeedButtonProps {
    shopId: string
}

export function SeedButton({ shopId }: SeedButtonProps) {
    const [loading, setLoading] = useState(false)

    const handleSeed = async () => {
        setLoading(true)
        const result = await seedSampleProducts(shopId)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Sample products added!')
        }

        setLoading(false)
    }

    return (
        <Card className="border-dashed">
            <CardHeader>
                <CardTitle className="text-lg">No Products Yet</CardTitle>
                <CardDescription>
                    Add some sample products to get started quickly
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button
                    onClick={handleSeed}
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                >
                    <Package className="mr-2 h-4 w-4" />
                    {loading ? 'Adding...' : 'Add Sample Products'}
                </Button>
            </CardContent>
        </Card>
    )
}
