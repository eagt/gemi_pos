'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, KeyRound, Store } from 'lucide-react'
import { getUserShopPins } from '@/app/dashboard/shops/[shopId]/user-settings/actions'
import { ChangePinModal } from './change-pin-modal'

interface ShopPin {
    shopId: string
    shopName: string
    role: string
    hasPin: boolean
}

export function ShopPinList() {
    const [pins, setPins] = useState<ShopPin[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedShop, setSelectedShop] = useState<ShopPin | null>(null)
    const [modalOpen, setModalOpen] = useState(false)

    useEffect(() => {
        loadPins()
    }, [])

    const loadPins = async () => {
        try {
            const data = await getUserShopPins()
            setPins(data as any)
        } catch (error) {
            console.error('Failed to load shop PINs', error)
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (shop: ShopPin) => {
        setSelectedShop(shop)
        setModalOpen(true)
    }

    const handleSuccess = () => {
        loadPins() // Reload to update status if needed
        setModalOpen(false)
    }

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-purple-600" />
                    <CardTitle>My Shop PINs</CardTitle>
                </div>
                <CardDescription>
                    Manage your POS access PIN for each shop you belong to.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="h-10 px-4 text-left font-medium text-slate-500">Shop Name</th>
                                <th className="h-10 px-4 text-left font-medium text-slate-500">Role</th>
                                <th className="h-10 px-4 text-left font-medium text-slate-500">Current PIN</th>
                                <th className="h-10 px-4 text-right font-medium text-slate-500">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {pins.map((shop) => (
                                <tr key={shop.shopId} className="hover:bg-slate-50/50">
                                    <td className="p-4 font-medium">
                                        <div className="flex items-center gap-2">
                                            <Store className="h-4 w-4 text-slate-400" />
                                            {shop.shopName}
                                        </div>
                                    </td>
                                    <td className="p-4 uppercase">
                                        <Badge variant="secondary" className="font-semibold text-[10px] tracking-wider bg-slate-100 text-slate-700 border-none">
                                            {shop.role}
                                        </Badge>
                                    </td>
                                    <td className="p-4">
                                        {shop.hasPin ? (
                                            <div className="flex items-center gap-1 text-slate-600 font-mono text-lg">
                                                <span>•</span><span>•</span><span>•</span><span>•</span>
                                            </div>
                                        ) : (
                                            <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">
                                                Not Set
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleOpenModal(shop)}
                                            className="rounded-lg border-slate-200 hover:bg-slate-50"
                                        >
                                            {shop.hasPin ? 'Change PIN' : 'Set PIN'}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {pins.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-500">
                                        You don't belong to any shops yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>

            {selectedShop && (
                <ChangePinModal
                    shop={selectedShop}
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                    onSuccess={handleSuccess}
                />
            )}
        </Card>
    )
}
