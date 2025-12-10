'use client'

import { useState } from 'react'
import Link from 'next/link'
import { User, ChefHat, Truck, Shield, ArrowLeft, LogIn, Power, UserPlus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StaffRole } from '@/lib/types/database.types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { PinInput } from './pin-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface StaffMember {
    id: string
    name: string
    role: StaffRole
    avatar_url?: string | null
    user_id: string | null
}

interface StaffSelectionGridProps {
    staff: StaffMember[]
    onStaffLogin: (staffId: string, pin: string) => Promise<boolean>
    onFinishShift: (userId: string, pin: string) => Promise<boolean>
    onStartShift: (email: string, password: string) => Promise<boolean>
    shopName: string
    showBackButton?: boolean
}

const roleIcons: Record<StaffRole, React.ComponentType<{ className?: string }>> = {
    manager: Shield,
    waiter: User,
    chef: ChefHat,
    runner: Truck,
}

const roleColors: Record<StaffRole, string> = {
    manager: 'from-purple-500 to-purple-600',
    waiter: 'from-blue-500 to-blue-600',
    chef: 'from-orange-500 to-orange-600',
    runner: 'from-green-500 to-green-600',
}

const roleLabels: Record<StaffRole, string> = {
    manager: 'Manager',
    waiter: 'Waiter',
    chef: 'Chef',
    runner: 'Runner',
}

type ActionMode = 'clock_in' | 'finish'

export function StaffSelectionGrid({ staff, onStaffLogin, onFinishShift, onStartShift, shopName, showBackButton = true }: StaffSelectionGridProps) {
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
    const [actionMode, setActionMode] = useState<ActionMode>('clock_in')
    const [isVerifying, setIsVerifying] = useState(false)
    const [pinError, setPinError] = useState(false)

    // Start Shift modal state
    const [showStartShiftModal, setShowStartShiftModal] = useState(false)
    const [loginEmail, setLoginEmail] = useState('')
    const [loginPassword, setLoginPassword] = useState('')
    const [loginError, setLoginError] = useState('')
    const [isLoggingIn, setIsLoggingIn] = useState(false)

    const handleClockIn = (member: StaffMember) => {
        setSelectedStaff(member)
        setActionMode('clock_in')
        setPinError(false)
    }

    const handleFinish = (member: StaffMember) => {
        setSelectedStaff(member)
        setActionMode('finish')
        setPinError(false)
    }

    const handlePinComplete = async (pin: string) => {
        if (!selectedStaff || isVerifying) return

        setIsVerifying(true)
        setPinError(false)

        try {
            let success = false

            if (actionMode === 'clock_in') {
                success = await onStaffLogin(selectedStaff.id, pin)
            } else if (actionMode === 'finish' && selectedStaff.user_id) {
                success = await onFinishShift(selectedStaff.user_id, pin)
            }

            if (!success) {
                setPinError(true)
            } else {
                handleClose()
            }
        } catch (error) {
            console.error('Action error:', error)
            setPinError(true)
        } finally {
            setIsVerifying(false)
        }
    }

    const handleClose = () => {
        setSelectedStaff(null)
        setPinError(false)
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

    const getDialogTitle = () => {
        if (actionMode === 'clock_in') {
            return `Welcome, ${selectedStaff?.name}`
        }
        return `End Shift for ${selectedStaff?.name}`
    }

    const getDialogDescription = () => {
        if (actionMode === 'clock_in') {
            return 'Enter your PIN to clock in'
        }
        return 'Enter your PIN to confirm (or manager PIN)'
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
                            const Icon = roleIcons[member.role]
                            const gradient = roleColors[member.role]
                            const roleLabel = roleLabels[member.role]

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
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className={cn(
                            "text-center text-2xl capitalize",
                            actionMode === 'finish' && "text-red-600"
                        )}>
                            {getDialogTitle()}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-6">
                        {/* Staff Avatar/Icon */}
                        <div className="flex justify-center mb-6">
                            {selectedStaff && (
                                selectedStaff.avatar_url ? (
                                    <img
                                        src={selectedStaff.avatar_url}
                                        alt={selectedStaff.name}
                                        className={cn(
                                            "w-24 h-24 rounded-full object-cover ring-4",
                                            actionMode === 'finish' ? "ring-red-500/30" : "ring-purple-500/20"
                                        )}
                                    />
                                ) : (
                                    <div className={cn(
                                        'w-24 h-24 rounded-full bg-gradient-to-br flex items-center justify-center ring-4',
                                        selectedStaff && roleColors[selectedStaff.role],
                                        actionMode === 'finish' ? "ring-red-500/30" : "ring-purple-500/20"
                                    )}>
                                        {selectedStaff && (() => {
                                            const Icon = roleIcons[selectedStaff.role]
                                            return <Icon className="w-12 h-12 text-white" />
                                        })()}
                                    </div>
                                )
                            )}
                        </div>

                        {/* PIN Input */}
                        <div className="mb-6">
                            <p className="text-center text-sm text-muted-foreground mb-4">
                                {getDialogDescription()}
                            </p>
                            <PinInput
                                length={4}
                                onComplete={handlePinComplete}
                                error={pinError}
                                disabled={isVerifying}
                            />
                        </div>

                        {/* Error Message */}
                        {pinError && (
                            <p className="text-center text-sm text-red-600 mb-4">
                                Incorrect PIN. Please try again.
                            </p>
                        )}

                        {/* Cancel Button */}
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            className="w-full"
                            disabled={isVerifying}
                        >
                            Cancel
                        </Button>
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
