'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { User, ChefHat, Truck, Shield, ArrowLeft, LogIn, Power, UserPlus, Loader2, Store, ShieldCheck, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StaffRole } from '@/lib/types/database.types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Numpad } from '@/components/ui/numpad'

interface StaffMember {
    id: string
    name: string
    restaurant_role: StaffRole
    quick_checkout_role?: string | null
    avatar_url?: string | null
    user_id: string | null
    authorization_status?: 'yes' | 'no' | null
}

interface StaffSelectionGridProps {
    staff: StaffMember[]
    onStaffLogin: (staffId: string, pin: string) => Promise<boolean>
    onFinishShift: (userId: string, pin: string) => Promise<boolean>
    onStartShift: (email: string, password: string) => Promise<boolean>
    shopName: string
    businessType: 'quick_checkout' | 'table_order'
    showBackButton?: boolean
}

const roleIcons: Record<StaffRole, React.ComponentType<{ className?: string }>> = {
    manager: Shield,
    waiter: User,
    chef: ChefHat,
    runner: Truck,
    cashier: Store,
    supervisor: ShieldCheck,
    administrator: Shield,
}

const roleColors: Record<StaffRole, string> = {
    manager: 'from-purple-500 to-purple-600',
    waiter: 'from-blue-500 to-blue-600',
    chef: 'from-orange-500 to-orange-600',
    runner: 'from-green-500 to-green-600',
    cashier: 'from-emerald-500 to-emerald-600',
    supervisor: 'from-cyan-500 to-cyan-600',
    administrator: 'from-indigo-500 to-indigo-600',
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

type ActionMode = 'clock_in' | 'finish'

export function StaffSelectionGrid({
    staff,
    onStaffLogin,
    onFinishShift,
    onStartShift,
    shopName,
    businessType,
    showBackButton = true
}: StaffSelectionGridProps) {
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
    const [actionMode, setActionMode] = useState<ActionMode>('clock_in')
    const [isVerifying, setIsVerifying] = useState(false)
    const [pinError, setPinError] = useState(false)
    const [pin, setPin] = useState('')
    const [showNumpad, setShowNumpad] = useState(false)

    // Start Shift modal state
    const [showStartShiftModal, setShowStartShiftModal] = useState(false)
    const [loginEmail, setLoginEmail] = useState('')
    const [loginPassword, setLoginPassword] = useState('')
    const [loginError, setLoginError] = useState('')
    const [isLoggingIn, setIsLoggingIn] = useState(false)

    // Auto-submit when pin reaches 4 digits
    useEffect(() => {
        if (pin.length === 4) {
            handlePinComplete(pin)
        }
    }, [pin])

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedStaff || isVerifying || showStartShiftModal) return

            // If it's a number key
            if (/^[0-9]$/.test(e.key)) {
                handleNumpadClick(e.key)
            }
            // If it's backspace
            else if (e.key === 'Backspace') {
                handleBackspace()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedStaff, isVerifying, pin, showStartShiftModal])

    const handleClockIn = (member: StaffMember) => {
        setPin('')
        setSelectedStaff(member)
        setActionMode('clock_in')
        setPinError(false)
        setShowNumpad(true)
    }

    const handleFinish = (member: StaffMember) => {
        setPin('')
        setSelectedStaff(member)
        setActionMode('finish')
        setPinError(false)
        setShowNumpad(true)
    }

    const handlePinComplete = async (currentPin: string) => {
        if (!selectedStaff || isVerifying) return

        setIsVerifying(true)
        setPinError(false)

        try {
            let success = false

            if (actionMode === 'clock_in') {
                success = await onStaffLogin(selectedStaff.id, currentPin)
            } else if (actionMode === 'finish' && selectedStaff.user_id) {
                success = await onFinishShift(selectedStaff.user_id, currentPin)
            }

            if (!success) {
                setPinError(true)
                setPin('') // Clear pin on error
            } else {
                handleClose()
            }
        } catch (error) {
            console.error('Action error:', error)
            setPinError(true)
            setPin('')
        } finally {
            setIsVerifying(false)
        }
    }

    const handleClose = () => {
        setSelectedStaff(null)
        setPinError(false)
        setPin('')
        setShowNumpad(false)
    }

    const handleStartShiftSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoginError('')
        setIsLoggingIn(true)

        try {
            const success = await onStartShift(loginEmail, loginPassword)
            if (success) {
                setShowStartShiftModal(false)
                setLoginEmail('')
                setLoginPassword('')
            }
        } catch (error) {
            console.error('Start shift error:', error)
            setLoginError('An unexpected error occurred')
        } finally {
            setIsLoggingIn(false)
        }
    }

    const handleNumpadClick = (num: string) => {
        if (pin.length < 4) {
            setPin(prev => prev + num)
            setPinError(false)
        }
    }

    const handleBackspace = () => {
        setPin(prev => prev.slice(0, -1))
    }

    const getDialogTitle = () => {
        if (actionMode === 'clock_in') {
            return `Welcome, ${selectedStaff?.name}`
        }
        return `End Shift for ${selectedStaff?.name}`
    }

    const getDialogDescription = () => {
        if (actionMode === 'clock_in') {
            return 'Enter your 4-digit PIN to clock in'
        }
        return 'Enter your 4-digit PIN to confirm'
    }

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
                {/* Header Row */}
                <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between">
                    {/* Back Button - conditionally rendered */}
                    {showBackButton ? (
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Businesses
                        </Link>
                    ) : (
                        <div /> // Empty div for flex spacing
                    )}

                    {/* Start Shift Button */}
                    <Button
                        onClick={() => setShowStartShiftModal(true)}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Start Shift
                    </Button>
                </div>

                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-white mb-2">{shopName}</h1>
                        <p className="text-slate-300 text-lg">Select your profile to continue</p>
                    </div>

                    {/* Staff Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {staff.map((member) => {
                            const activeRole = businessType === 'quick_checkout' && member.quick_checkout_role
                                ? member.quick_checkout_role as StaffRole
                                : member.restaurant_role

                            const Icon = roleIcons[activeRole] || User
                            const gradient = roleColors[activeRole] || 'from-slate-500 to-slate-600'
                            const roleLabel = roleLabels[activeRole] || activeRole

                            return (
                                <div
                                    key={member.id}
                                    className="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 p-6 transition-all hover:bg-white/15"
                                >
                                    {/* Avatar or Icon */}
                                    <div className="mb-4 flex justify-center">
                                        {member.avatar_url ? (
                                            <img
                                                src={member.avatar_url}
                                                alt={member.name}
                                                className="w-20 h-20 rounded-full object-cover ring-4 ring-white/20"
                                            />
                                        ) : (
                                            <div className={cn(
                                                'w-20 h-20 rounded-full bg-gradient-to-br flex items-center justify-center ring-4 ring-white/20',
                                                gradient
                                            )}>
                                                <Icon className="w-10 h-10 text-white" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Name */}
                                    <h3 className="text-white font-semibold text-lg mb-1 truncate capitalize text-center">
                                        {member.name}
                                    </h3>

                                    {/* Role Badge */}
                                    <div className="flex justify-center mb-4">
                                        <div className={cn(
                                            'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r text-white',
                                            gradient
                                        )}>
                                            <Icon className="w-3 h-3" />
                                            {roleLabel}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => handleClockIn(member)}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-2"
                                            size="sm"
                                        >
                                            <LogIn className="w-3 h-3 mr-1" />
                                            Clock In
                                        </Button>
                                        <Button
                                            onClick={() => handleFinish(member)}
                                            variant="outline"
                                            className="flex-1 border-red-400 text-red-400 hover:bg-red-500/10 text-xs py-2"
                                            size="sm"
                                        >
                                            <Power className="w-3 h-3 mr-1" />
                                            Finish
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* PIN Dialog */}
            <Dialog open={!!selectedStaff} onOpenChange={(open) => !open && handleClose()}>
                <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                    <div className="bg-white overflow-hidden flex flex-col">
                        <div className="p-8 pb-4 text-center">
                            <DialogHeader className="mb-6 p-0">
                                <DialogTitle className={cn(
                                    "text-2xl font-bold capitalize",
                                    actionMode === 'finish' ? "text-red-600" : "text-slate-900"
                                )}>
                                    {getDialogTitle()}
                                </DialogTitle>
                                <DialogDescription className="text-slate-500 text-lg">
                                    {getDialogDescription()}
                                </DialogDescription>
                            </DialogHeader>

                            {/* Staff Avatar/Icon Small */}
                            <div className="flex justify-center mb-6">
                                {selectedStaff && (
                                    selectedStaff.avatar_url ? (
                                        <img
                                            src={selectedStaff.avatar_url}
                                            alt={selectedStaff.name}
                                            className={cn(
                                                "w-20 h-20 rounded-full object-cover ring-4",
                                                actionMode === 'finish' ? "ring-red-500/30" : "ring-purple-500/20"
                                            )}
                                        />
                                    ) : (
                                        <div className={cn(
                                            'w-20 h-20 rounded-full bg-gradient-to-br flex items-center justify-center ring-4',
                                            selectedStaff && (() => {
                                                const activeRole = businessType === 'quick_checkout' && selectedStaff.quick_checkout_role
                                                    ? selectedStaff.quick_checkout_role as StaffRole
                                                    : selectedStaff.restaurant_role
                                                return roleColors[activeRole] || 'from-slate-500 to-slate-600'
                                            })(),
                                            actionMode === 'finish' ? "ring-red-500/30" : "ring-purple-500/20"
                                        )}>
                                            {selectedStaff && (() => {
                                                const activeRole = businessType === 'quick_checkout' && selectedStaff.quick_checkout_role
                                                    ? selectedStaff.quick_checkout_role as StaffRole
                                                    : selectedStaff.restaurant_role
                                                const Icon = roleIcons[activeRole] || User
                                                return <Icon className="w-10 h-10 text-white" />
                                            })()}
                                        </div>
                                    )
                                )}
                            </div>

                            {/* PIN Display */}
                            <div className="space-y-4 max-w-[280px] mx-auto mb-6">
                                <div className="relative group">
                                    <Input
                                        type="password"
                                        value={pin}
                                        readOnly
                                        placeholder="••••"
                                        className="h-16 text-3xl tracking-[1em] text-center border-2 border-slate-200 focus:border-purple-500 rounded-2xl px-4 transition-all bg-slate-50/50"
                                    />
                                    {pin && (
                                        <button
                                            onClick={() => setPin('')}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                                {pinError && (
                                    <p className="text-sm font-semibold text-red-600">
                                        Incorrect PIN. Please try again.
                                    </p>
                                )}
                            </div>
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
                            <Button
                                variant="outline"
                                onClick={handleClose}
                                className="w-full h-14 rounded-2xl border-slate-200 text-slate-600 font-bold uppercase tracking-wider hover:bg-slate-50"
                                disabled={isVerifying}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Start Shift Login Modal */}
            <Dialog open={showStartShiftModal} onOpenChange={setShowStartShiftModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center text-2xl">
                            Start Your Shift
                        </DialogTitle>
                        <DialogDescription className="text-center">
                            Log in to join the roster for {shopName}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleStartShiftSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="login-email">Email</Label>
                            <Input
                                id="login-email"
                                type="email"
                                placeholder="you@example.com"
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                required
                                disabled={isLoggingIn}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="login-password">Password</Label>
                            <Input
                                id="login-password"
                                type="password"
                                placeholder="••••••••"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                required
                                disabled={isLoggingIn}
                            />
                        </div>

                        {loginError && (
                            <p className="text-sm text-red-600 text-center">
                                {loginError}
                            </p>
                        )}

                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowStartShiftModal(false)}
                                className="flex-1"
                                disabled={isLoggingIn}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-purple-600 hover:bg-purple-700"
                                disabled={isLoggingIn}
                            >
                                {isLoggingIn ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Logging in...
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="w-4 h-4 mr-2" />
                                        Start Shift
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
