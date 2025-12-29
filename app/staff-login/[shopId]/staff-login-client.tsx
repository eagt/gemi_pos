'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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

const roleLabels: Record<StaffRole, string> = {
    manager: 'Manager',
    waiter: 'Waiter',
    chef: 'Chef',
    runner: 'Runner',
    cashier: 'Cashier',
    supervisor: 'Supervisor',
    administrator: 'Admin',
}

export function StaffLoginClient({
    shop,
    staff: initialStaff,
    shopId,
    returnUrl,
    currentUserId,
    isManager = false
}: StaffLoginClientProps) {
    const router = useRouter()
    const clearSession = useStaffStore((state) => state.clearSession)
    const [staff, setStaff] = useState<StaffMember[]>(initialStaff)
    const [showPinSetup, setShowPinSetup] = useState(false)
    const [setupStaff, setSetupStaff] = useState<StaffMember | null>(null)
    const [isCheckingPin, setIsCheckingPin] = useState(true)

    // Mobility/Handover state
    const [showMobilityModal, setShowMobilityModal] = useState(false)
    const [mobilityShopName, setMobilityShopName] = useState('')
    const [mobilityCredentials, setMobilityCredentials] = useState<{ email: string, password: string } | null>(null)

    // Authorization State
    const [waitingForRequestId, setWaitingForRequestId] = useState<string | null>(null)
    const [waitingForName, setWaitingForName] = useState('')
    const [isApproving, setApproving] = useState(false)

    const shopName = shop.name
    const businessType = shop.business_type as 'quick_checkout' | 'table_order'

    const supabase = createClient()

    // Proactive Check for Password Change
    useEffect(() => {
        async function checkStatus() {
            if (currentUserId) {
                const result = await verifyStaffPin(shopId, currentUserId, '')

                if (result.success && (result as any).staff) {
                    if ((result as any).needsSetup) {
                        setSetupStaff((result as any).staff as any)
                        setShowPinSetup(true)
                    } else if (result.mustChangePassword) {
                        // PIN is already set, but password must be changed
                        const currentPath = `/staff-login/${shopId}`
                        router.push(`/change-temporary-password?returnUrl=${encodeURIComponent(currentPath)}`)
                    }
                }
            }
            setIsCheckingPin(false)
        }
        checkStatus()
    }, [shopId, currentUserId, router])

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
    }, [waitingForRequestId, supabase, shopId])

    const executeCompleteLogin = async (requestId: string) => {
        setApproving(true)
        try {
            const result = await completeClockIn(requestId)

            if (result.error) {
                toast.error(result.error)
                return
            }

            // Set session in store (handled by backend cookie but nice to have in store for client sync)
            if (result.success) {
                setWaitingForRequestId(null)
                setApproving(false)

                if (result.mustChangePassword) {
                    toast.info('Security update required. Please change your password.')
                    const currentPath = `/staff-login/${shopId}`
                    router.push(`/change-temporary-password?returnUrl=${encodeURIComponent(currentPath)}`)
                    return
                }

                const targetUrl = returnUrl ? decodeURIComponent(returnUrl) : `/dashboard/shops/${shopId}/pos`
                router.push(targetUrl)
            }
        } catch (error) {
            console.error('Complete login error:', error)
            toast.error('Failed to complete login')
        } finally {
            setApproving(false)
        }
    }

    const handleStaffLogin = async (staffId: string, pin: string): Promise<boolean> => {
        try {
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
                setWaitingForRequestId(result.requestId!)
                setWaitingForName(result.staffName || '')
                return true // Close PIN pad to show waiting modal
            }

            return false
        } catch (error) {
            console.error('Login error:', error)
            toast.error('Failed to log in')
            return false
        }
    }

    const handlePinSetupComplete = async (pin: string): Promise<boolean> => {
        if (!setupStaff) return false
        try {
            const result = await setPinForStaff(shopId, setupStaff.id, pin)

            if (result.success) {
                toast.success('PIN created successfully!')
                setShowPinSetup(false)
                setSetupStaff(null)

                if (result.mustChangePassword) {
                    toast.info('Please create a new password for your account.')
                    const currentPath = `/staff-login/${shopId}`
                    router.push(`/change-temporary-password?returnUrl=${encodeURIComponent(currentPath)}`)
                } else {
                    toast.success('You can now log in.')
                    router.refresh()
                }

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

    const handleFinishShift = async (staffId: string, pin: string): Promise<boolean> => {
        try {
            const result = await finishForToday(shopId, staffId, pin)

            if (result.error) {
                toast.error(result.error)
                return false
            }

            if (result.success) {
                toast.success(result.message || 'Shift ended')
                if (staffId === currentUserId) {
                    clearSession()
                }
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

            if (result.confirmationNeeded) {
                setMobilityShopName(result.previousShopName || 'Another Shop')
                setMobilityCredentials({ email, password })
                setShowMobilityModal(true)
                return false // Don't close the Start Shift modal yet
            }

            if (result.error) {
                toast.error(result.error)
                return false
            }

            if (result.success) {
                toast.success(result.message || 'You are now on the roster!')
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

    const handleConfirmMobility = async () => {
        if (!mobilityCredentials) return

        try {
            const { startShift } = await import('./actions')
            const result = await startShift(shopId, mobilityCredentials.email, mobilityCredentials.password, true)

            if (result.error) {
                toast.error(result.error)
            } else if (result.success) {
                toast.success('Shift transferred successfully! You can now clock in.')
                setShowMobilityModal(false)
                setMobilityCredentials(null)
                router.refresh()
            }
        } catch (error) {
            toast.error('Failed to transfer shift')
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
                if (!open && !isApproving) {
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
                        {isApproving ? (
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

            {/* Mobility Handover Modal */}
            <Dialog open={showMobilityModal} onOpenChange={setShowMobilityModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-600">
                            <XCircle className="h-6 w-6" />
                            Active Session Found
                        </DialogTitle>
                        <DialogDescription>
                            You have an active session in <strong>{mobilityShopName}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-slate-600 text-sm">
                            To join the roster here, you must first finish your session at the other shop.
                            If you proceed, your avatar will be removed from {mobilityShopName} and added here.
                        </p>
                        <p className="text-slate-600 text-sm font-semibold">
                            Proceed with the transfer?
                        </p>
                    </div>
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setShowMobilityModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmMobility} className="bg-amber-600 hover:bg-amber-700">
                            Transfer Session
                        </Button>
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
