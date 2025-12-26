'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { approveClockInRequest, denyClockInRequest, dismissClockInRequest } from '@/app/staff-login/[shopId]/actions'
import { useStaffSession } from '@/components/staff/staff-session-provider'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Numpad } from '@/components/ui/numpad'

interface ManagerNotificationListenerProps {
    shopId: string
    userId: string
    businessType: string
    restaurantRole: string | null
    quickCheckoutRole: string | null
}

export function ManagerNotificationListener({
    shopId,
    userId,
    businessType,
    restaurantRole,
    quickCheckoutRole
}: ManagerNotificationListenerProps) {
    const supabase = createClient()
    const { staff } = useStaffSession()
    const [pinDialogOpen, setPinDialogOpen] = useState(false)
    const [managerPin, setManagerPin] = useState('')
    const [pinError, setPinError] = useState('')
    const [activeRequestId, setActiveRequestId] = useState<string | null>(null)
    const [approving, setApproving] = useState(false)
    const [requestingStaffName, setRequestingStaffName] = useState('')
    const [showNumpad, setShowNumpad] = useState(false)

    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        // Use a unique channel name for this shop to avoid conflicts
        const channel = supabase
            .channel(`clock_in_requests_${shopId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'clock_in_requests'
                },
                async (payload) => {
                    const newRequest = payload.new as any

                    // Filter by shop ID in JS for maximum reliability
                    if (newRequest.shop_id !== shopId) return

                    // Get the person currently clocked in (from the cookie/store)
                    let currentRoles: string[] = []

                    if (staff) {
                        currentRoles = [
                            (staff.restaurantRole || '').toLowerCase(),
                            (staff.quickCheckoutRole || '').toLowerCase()
                        ]
                    } else {
                        // Fallback to the main account if no one is clocked in via PIN
                        currentRoles = [
                            (quickCheckoutRole || '').toLowerCase(),
                            (restaurantRole || '').toLowerCase()
                        ]
                    }

                    const isAuthorized = currentRoles.some(role =>
                        ['manager', 'administrator', 'supervisor', 'admin', 'owner'].includes(role)
                    )

                    if (!isAuthorized) return

                    if (newRequest.status === 'pending') {
                        // Immediate notification
                        playNotificationSound()
                        setActiveRequestId(newRequest.id)
                        setPinDialogOpen(true)
                        setShowNumpad(false)
                        setRequestingStaffName('Staff Member')

                        // Background name fetch
                        try {
                            const { data: staff } = await supabase
                                .from('shop_staff')
                                .select('name')
                                .eq('shop_id', shopId)
                                .eq('user_id', newRequest.staff_user_id)
                                .single()

                            if (staff?.name) setRequestingStaffName(staff.name)
                        } catch (err) { }
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [shopId, supabase, businessType, restaurantRole, quickCheckoutRole, staff])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!pinDialogOpen || approving) return

            // If it's a number key
            if (/^[0-9]$/.test(e.key)) {
                handleNumpadClick(e.key)
            }
            // If it's backspace
            else if (e.key === 'Backspace') {
                handleBackspace()
            }
            // If it's Enter and we have a PIN
            else if (e.key === 'Enter' && managerPin.length > 0) {
                handleConfirmApprove()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [pinDialogOpen, managerPin, approving, activeRequestId])

    const playNotificationSound = () => {
        try {
            const audio = new Audio('/sounds/notification.mp3')
            audio.play().catch(() => { })
        } catch (e) { }
    }

    const handleConfirmApprove = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!activeRequestId || !managerPin) return

        setApproving(true)
        setPinError('')

        try {
            const result = await approveClockInRequest(shopId, activeRequestId, managerPin)
            if (result.error) {
                setPinError(result.error)
            } else {
                handleClose()
                toast.success('Clock-in authorized')
            }
        } catch (error) {
            setPinError('Failed to authorize')
        } finally {
            setApproving(false)
        }
    }

    const handleDeny = async () => {
        if (!activeRequestId) return
        try {
            await denyClockInRequest(shopId, activeRequestId)
            toast.info('Request denied')
            handleClose()
        } catch (error) {
            toast.error('Failed to deny')
        }
    }

    const handleClose = async () => {
        if (activeRequestId) {
            await dismissClockInRequest(activeRequestId)
        }
        setPinDialogOpen(false)
        setActiveRequestId(null)
        setManagerPin('')
        setPinError('')
        setRequestingStaffName('')
        setShowNumpad(false)
    }

    const handleNumpadClick = (num: string) => {
        if (managerPin.length < 6) {
            setManagerPin(prev => prev + num)
            setPinError('')
        }
    }

    const handleBackspace = () => {
        setManagerPin(prev => prev.slice(0, -1))
    }

    const handleClear = () => {
        setManagerPin('')
    }

    return (
        <Dialog open={pinDialogOpen} onOpenChange={(open) => {
            if (!open) handleClose()
            else setPinDialogOpen(true)
        }}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                <div className="bg-white overflow-hidden flex flex-col">
                    {/* Header Section */}
                    <div className="p-8 pb-4">
                        <DialogHeader className="mb-6 p-0">
                            <DialogTitle className="text-2xl font-bold text-slate-900 mb-2">Authorize Clock-In</DialogTitle>
                            <DialogDescription className="text-slate-500 text-lg leading-snug">
                                {requestingStaffName ? (
                                    <>
                                        Approval required for <span className="font-bold text-slate-900 capitalize">{requestingStaffName}</span>
                                    </>
                                ) : (
                                    "Enter your PIN to verify this staff member's clock-in."
                                )}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleConfirmApprove} className="space-y-4">
                            <div className="space-y-3 relative">
                                <Label className="text-base font-bold text-slate-900">Manager PIN</Label>
                                <div className="relative group">
                                    <Input
                                        ref={inputRef}
                                        type="password"
                                        value={managerPin}
                                        readOnly
                                        onFocus={() => setShowNumpad(true)}
                                        onClick={() => setShowNumpad(true)}
                                        placeholder="Enter PIN"
                                        className="h-16 text-2xl tracking-[0.5em] text-center border-2 border-slate-200 focus:border-purple-500 rounded-2xl px-4 transition-all bg-slate-50/50 cursor-pointer"
                                    />
                                    {managerPin && (
                                        <button
                                            type="button"
                                            onClick={handleClear}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                                {pinError && <p className="text-sm font-semibold text-red-600 px-1 text-center">{pinError}</p>}
                            </div>
                        </form>
                    </div>

                    {/* Animated Numpad Section */}
                    <div className={cn(
                        "transition-all duration-500 ease-in-out border-t border-slate-100 bg-slate-50/80 p-6 pt-8",
                        showNumpad ? "max-h-[500px] opacity-100 translate-y-0" : "max-h-0 opacity-0 translate-y-10 py-0 border-none pointer-events-none"
                    )}>
                        <Numpad
                            onNumberClick={handleNumpadClick}
                            onBackspace={handleBackspace}
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="p-8 bg-white border-t border-slate-100">
                        <div className="grid grid-cols-3 gap-4">
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDeny}
                                className="h-14 w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-red-100 px-2 text-sm uppercase tracking-wider"
                            >
                                Deny
                            </Button>

                            <Button
                                type="button"
                                onClick={handleClose}
                                className="h-14 w-full bg-slate-900 hover:bg-black text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-slate-200 px-2 text-sm uppercase tracking-wider"
                            >
                                Cancel
                            </Button>

                            <Button
                                type="button"
                                onClick={() => handleConfirmApprove()}
                                disabled={!managerPin || approving}
                                className="h-14 w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-200 disabled:text-white text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-purple-100 px-2 text-sm uppercase tracking-wider"
                            >
                                {approving ? '...' : 'Authorize'}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
