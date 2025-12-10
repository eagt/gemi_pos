'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Store } from 'lucide-react'
import { toast } from 'sonner'
import { selectShop } from '@/app/dashboard/actions'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useRouter } from 'next/navigation'

interface BusinessCardProps {
    shop: {
        id: string
        name: string
        location?: string
        created_at: string
        business_type?: string
    }
    staffId?: string
}

export function BusinessCard({ shop, staffId }: BusinessCardProps) {
    const [showConfirmation, setShowConfirmation] = useState(false)
    const [previousShop, setPreviousShop] = useState<{ id: string, name: string } | null>(null)
    const router = useRouter()

    const handleCardClick = async () => {
        try {
            const result = await selectShop(shop.id)

            if (result && result.confirmationNeeded) {
                setPreviousShop({
                    id: result.previousShopId,
                    name: result.previousShopName
                })
                setShowConfirmation(true)
            } else {
                // No confirmation needed, go to staff login
                router.push(`/staff-login/${shop.id}`)
            }
        } catch (error) {
            console.error('Failed to select shop:', error)
            toast.error('Failed to access shop')
        }
    }

    const handleConfirmSwitch = async () => {
        try {
            await selectShop(shop.id, true) // Force switch
            setShowConfirmation(false)
            router.push(`/staff-login/${shop.id}`)
        } catch (error) {
            console.error('Failed to switch shop:', error)
            toast.error('Failed to switch shop')
        }
    }

    const handleCancelSwitch = () => {
        setShowConfirmation(false)
        if (previousShop) {
            router.push(`/staff-login/${previousShop.id}`)
        }
    }

    return (
        <>
            <Card
                className="cursor-pointer hover:shadow-lg transition-shadow border-slate-200 hover:border-purple-200 group"
                onClick={handleCardClick}
            >
                <CardHeader className="flex flex-row items-center gap-4">
                    <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                        <Store className="h-6 w-6 text-purple-600 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">{shop.name}</CardTitle>
                        <CardDescription>{shop.business_type === 'table_order' ? 'Restaurant' : 'Retail'}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-slate-500">
                        {shop.location || 'No location set'}
                    </div>
                    <div className="text-xs text-slate-400 mt-2">
                        Created {new Date(shop.created_at).toLocaleDateString()}
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Switch Shop Session?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Do you want to come out of {previousShop?.name}? It will terminate the previous session here.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCancelSwitch}>No</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmSwitch} className="bg-purple-600 hover:bg-purple-700">
                            Yes
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
