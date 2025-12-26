'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, ShieldCheck, XCircle } from 'lucide-react'
import { StaffSelectionGrid } from '@/components/staff/staff-selection-grid'
import { PinSetupDialog } from '@/components/staff/pin-setup-dialog'
import { useStaffStore } from '@/store/staff-store'
import { toast } from 'sonner'
import { StaffRole } from '@/lib/types/database.types'
import { verifyStaffPin, setPinForStaff, finishForToday, requestClockIn, completeClockIn } from './actions'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

interface StaffMember {
    id: string
    name: string
    restaurant_role: StaffRole
    avatar_url?: string | null
    user_id: string | null
    quick_checkout_role?: string | null
}

interface Shop {
    id: string
    name: string
    business_type: string
}

interface StaffLoginClientProps {
    shop: Shop
    staff: StaffMember[]
    shopId: string
    returnUrl?: string
    currentUserId?: string | null
    isManager?: boolean
}

export function StaffLoginClient({ shop, staff, shopId, returnUrl, currentUserId, isManager = false }: StaffLoginClientProps) {
    const router = useRouter()
    const clearSession = useStaffStore((state) => state.clearSession)
    const [showPinSetup, setShowPinSetup] = useState(false)
    const [setupStaff, setSetupStaff] = useState<StaffMember | null>(null)
    const [isCheckingPin, setIsCheckingPin] = useState(true)

    // Authorization State
    const [waitingForRequestId, setWaitingForRequestId] = useState<string | null>(null)
    const [waitingForName, setWaitingForName] = useState('')
    const [approving, setApproving] = useState(false)

    const supabase = createClient()

    // Check if current user needs PIN setup on page load
    useEffect(() => {
        const checkForMissingPin = async () => {
            if (!currentUserId) {
                setIsCheckingPin(false)
                return
            }

            // Find the staff member that matches the current user
            const userStaff = staff.find(s => s.user_id === currentUserId)

            if (userStaff) {
                // Try to verify with empty PIN to check if PIN exists
                const result = await verifyStaffPin(shopId, userStaff.id, '')

                if (result.needsSetup && result.staff) {
                    setSetupStaff(result.staff as any)
                    setShowPinSetup(true)
                }
            }

            setIsCheckingPin(false)
        }

        checkForMissingPin()
    }, [currentUserId, staff, shopId])

    // Wait for Authorization
    useEffect(() => {
        if (!waitingForRequestId) return

        const channel = supabase
            .channel(`auth_wait_${waitingForRequestId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'clock_in_requests',
                    filter: `id=eq.${waitingForRequestId}`
                },
                async (payload) => {
                    const req = payload.new as any
                    if (req.status === 'approved') {
                        setApproving(true)
                        await executeCompleteLogin(waitingForRequestId)
                    } else if (req.status === 'denied') {
                        setWaitingForRequestId(null)
                        toast.error('Manager denied the request')
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [waitingForRequestId, supabase])

    const executeCompleteLogin = async (requestId: string) => {
        try {
            const result = await completeClockIn(requestId)
            if (result.error) {
                toast.error(result.error)
                setWaitingForRequestId(null)
                setApproving(false)
                return
            }

            toast.success(result.message || 'Clocked in successfully!')

            // Set session in store (handled by backend cookie but nice to have in store for client sync)
            if (result.success) {
                router.refresh()
                const targetUrl = returnUrl ? decodeURIComponent(returnUrl) : `/dashboard/shops/${shopId}/pos`
                router.push(targetUrl)
            }
        } catch (error) {
            console.error('Completion error:', error)
            setWaitingForRequestId(null)
            setApproving(false)
        }
    }

    const handleStaffLogin = async (staffId: string, pin: string): Promise<boolean> => {
        try {
            // First check if setup needed (Standard flow fallback)
            // But verifyStaffPin is used for this check usually. 
            // requestClockIn checks PIN internally.

            const result = await requestClockIn(shopId, staffId, pin)

            if (result.error) {
                toast.error(result.error)
                return false
            }

            if (result.status === 'approved') {
                // Auto-approved
                await executeCompleteLogin(result.requestId!)
                return true
            }

            if (result.status === 'pending') {
                setWaitingForName(result.staffName || 'Staff')
                setWaitingForRequestId(result.requestId!)
                return true // Close PIN pad to show waiting modal
            }

            return false
        } catch (error) {
            console.error('Login error:', error)
            return false
        }
    }

    const handlePinSetupComplete = async (pin: string): Promise<boolean> => {
        if (!setupStaff) return false

        try {
            const result = await setPinForStaff(shopId, setupStaff.id, pin)

            if (result.success) {
                toast.success('PIN created successfully! You can now log in.')
                setShowPinSetup(false)
                setSetupStaff(null)
                // Refresh the page to show the profiles grid
                router.refresh()
                return true
            } else {
                toast.error(result.error || 'Failed to create PIN')
                return false
            }
        } catch (error) {
            console.error('PIN setup error:', error)
            toast.error('Failed to create PIN')
            return false
        }
    }

    const handlePinSetupCancel = () => {
        setShowPinSetup(false)
        setSetupStaff(null)
        // Redirect back to dashboard if they cancel PIN setup
        router.push('/dashboard')
    }

    const handleFinishShift = async (userId: string, pin: string): Promise<boolean> => {
        try {
            const result = await finishForToday(shopId, userId, pin)

            if (result.error) {
                toast.error(result.error)
                return false
            }

            if (result.success) {
                toast.success(result.message || 'Shift ended successfully')
                // Refresh the page to update the roster
                router.refresh()
                return true
            }

            return false
        } catch (error) {
            console.error('Finish shift error:', error)
            toast.error('Failed to end shift')
            return false
        }
    }

    const handleStartShift = async (email: string, password: string): Promise<boolean> => {
        try {
            const { startShift } = await import('./actions')
            const result = await startShift(shopId, email, password)

            if (result.error) {
                toast.error(result.error)
                return false
            }

            if (result.success) {
                toast.success(result.message || 'You are now on the roster!')
                // Refresh the page to update the roster
                router.refresh()
                return true
            }

            return false
        } catch (error) {
            console.error('Start shift error:', error)
            toast.error('Failed to start shift')
            return false
        }
    }

    if (staff.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-6">
                {/* Back Button */}
                <div className="absolute top-6 left-6">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Businesses
                    </Link>
                </div>

                <div className="text-center text-white max-w-md">
                    <h1 className="text-3xl font-bold mb-4">No Staff Members</h1>
                    <p className="text-slate-300 mb-6">
                        No staff members found for this shop.
                    </p>
                </div>
            </div>
        )
    }

    // Show loading while checking for PIN
    if (isCheckingPin) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <>
            <StaffSelectionGrid
                staff={staff}
                onStaffLogin={handleStaffLogin}
                onFinishShift={handleFinishShift}
                onStartShift={handleStartShift}
                shopName={shop.name}
                businessType={shop.business_type as any}
                showBackButton={isManager}
            />
            <PinSetupDialog
                open={showPinSetup}
                staffName={setupStaff?.name || ''}
                onComplete={handlePinSetupComplete}
                onCancel={handlePinSetupCancel}
            />
            {/* Waiting for Approval Dialog */}
            <Dialog open={!!waitingForRequestId} onOpenChange={(open) => {
                if (!open && !approving) {
                    // Ideally we should cancel the request if user closes dialog?
                    // For now just close local state
                    setWaitingForRequestId(null)
                }
            }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-6 w-6 text-blue-600" />
                            Manager Authorization
                        </DialogTitle>
                        <DialogDescription>
                            Approval required for <strong className="capitalize">{waitingForName}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                        {approving ? (
                            <>
                                <div className="h-12 w-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                                <p className="text-lg font-medium text-emerald-600">Logging in...</p>
                            </>
                        ) : (
                            <>
                                <div className="h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                                <p className="text-lg font-medium text-slate-700">Waiting for manager approval...</p>
                                <p className="text-sm text-slate-500">Please ask a manager to approve on their device.</p>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

function capitalizeName(name: string): string {
    if (!name) return ''
    return name.charAt(0).toUpperCase() + name.slice(1)
}
