'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { PinInput } from '@/components/staff/pin-input'
import { verifyStaffPin } from '@/app/staff-login/[shopId]/actions'
import { getStaffList } from '@/app/dashboard/shops/[shopId]/settings/staff/actions'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, LogOut } from 'lucide-react'
import { StaffRole } from '@/lib/types/database.types'

interface StaffMember {
    id: string
    name: string
    role: StaffRole
    avatar_url: string | null
    pin: string | null // We only need to know if it exists
}

interface StaffLoginViewProps {
    shopId: string
    shopName: string
    onLogin: (staff: { id: string; name: string; role: StaffRole }) => void
}

export function StaffLoginView({ shopId, shopName, onLogin }: StaffLoginViewProps) {
    const [staffList, setStaffList] = useState<StaffMember[]>([])
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
    const [loading, setLoading] = useState(true)
    const [verifying, setVerifying] = useState(false)
    const [error, setError] = useState(false)

    useEffect(() => {
        loadStaff()
    }, [shopId])

    const loadStaff = async () => {
        try {
            const staff = await getStaffList(shopId)
            // Filter out staff without PINs (pending invites)
            setStaffList(staff.filter((s: any) => s.pin))
        } catch (error) {
            toast.error('Failed to load staff list')
        } finally {
            setLoading(false)
        }
    }

    const handlePinComplete = async (pin: string) => {
        if (!selectedStaff) return

        setVerifying(true)
        setError(false)

        try {
            const result = await verifyStaffPin(shopId, selectedStaff.id, pin)

            if (result.error) {
                toast.error(result.error)
                setError(true)
            } else if (result.staff) {
                toast.success(`Welcome back, ${result.staff.name}!`)
                onLogin(result.staff)
            }
        } catch (error) {
            toast.error('Login failed')
            setError(true)
        } finally {
            setVerifying(false)
        }
    }

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-900">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        )
    }

    return (
        <div className="h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-4xl">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-white mb-2">{shopName}</h1>
                    <p className="text-slate-400 text-lg">Who is logging in?</p>
                </div>

                {!selectedStaff ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {staffList.map((staff) => (
                            <button
                                key={staff.id}
                                onClick={() => setSelectedStaff(staff)}
                                className="group relative flex flex-col items-center p-6 bg-slate-800 rounded-2xl border border-slate-700 hover:border-purple-500 hover:bg-slate-750 transition-all duration-200"
                            >
                                <Avatar className="w-24 h-24 mb-4 border-4 border-slate-700 group-hover:border-purple-500 transition-colors">
                                    <AvatarImage src={staff.avatar_url || undefined} />
                                    <AvatarFallback className="text-2xl bg-slate-600 text-white">
                                        {staff.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-xl font-semibold text-white group-hover:text-purple-400 transition-colors">
                                    {staff.name}
                                </span>
                                <span className="text-sm text-slate-400 mt-1 capitalize">
                                    {staff.role}
                                </span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <Card className="max-w-md mx-auto bg-slate-800 border-slate-700">
                        <CardHeader className="text-center relative">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute left-4 top-4 text-slate-400 hover:text-white hover:bg-slate-700"
                                onClick={() => {
                                    setSelectedStaff(null)
                                    setError(false)
                                }}
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div className="flex justify-center mb-4">
                                <Avatar className="w-20 h-20 border-4 border-purple-500">
                                    <AvatarImage src={selectedStaff.avatar_url || undefined} />
                                    <AvatarFallback className="text-xl bg-slate-600 text-white">
                                        {selectedStaff.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <CardTitle className="text-2xl text-white">
                                Hello, {selectedStaff.name}
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                Enter your PIN to continue
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-center py-6">
                                <PinInput
                                    length={4}
                                    onComplete={handlePinComplete}
                                    error={error}
                                    disabled={verifying}
                                    className="text-white"
                                />
                            </div>
                            {verifying && (
                                <div className="text-center text-purple-400 flex items-center justify-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Verifying...
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
