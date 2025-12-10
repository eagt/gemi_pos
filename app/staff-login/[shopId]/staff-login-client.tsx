'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { StaffSelectionGrid } from '@/components/staff/staff-selection-grid'
import { PinSetupDialog } from '@/components/staff/pin-setup-dialog'
import { useStaffStore } from '@/store/staff-store'
import { toast } from 'sonner'
import { StaffRole } from '@/lib/types/database.types'
import { verifyStaffPin, setPinForStaff, finishForToday } from './actions'

interface StaffMember {
    id: string
    name: string
    role: StaffRole
    avatar_url?: string | null
    user_id: string | null
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

    const handleStaffLogin = async (staffId: string, pin: string): Promise<boolean> => {
        try {
            // Verify PIN
            const result = await verifyStaffPin(shopId, staffId, pin)

            // This shouldn't happen now since we check on mount, but just in case
            if (result.needsSetup && result.staff) {
                setSetupStaff(result.staff as any)
                setShowPinSetup(true)
                return false
            }

            if (!result.success || !result.staff) {
                toast.error(result.error || 'Invalid PIN')
                return false
            }

            if (result.mustChangePassword) {
                toast.info('Please change your temporary password')
                // Pass the returnUrl (or default to POS) to the change password page
                const targetUrl = returnUrl ? decodeURIComponent(returnUrl) : `/dashboard/shops/${shopId}/pos`
                router.push(`/change-password?returnUrl=${encodeURIComponent(targetUrl)}`)
                return true
            }

            toast.success(`Welcome back, ${result.staff.name}!`)

            // Set session in store
            useStaffStore.getState().setSession({
                staffId: result.staff.id,
                shopId: result.staff.shop_id,
                role: result.staff.role,
                name: result.staff.name,
                userId: result.staff.user_id,
                avatarUrl: result.staff.avatar_url,
                quickCheckoutRole: result.staff.quick_checkout_role
            })

            // Redirect to returnUrl if present
            if (returnUrl) {
                router.push(decodeURIComponent(returnUrl))
                return true
            }

            // Always redirect to POS
            router.push(`/dashboard/shops/${shopId}/pos`)
            return true
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
                showBackButton={isManager}
            />
            <PinSetupDialog
                open={showPinSetup}
                staffName={setupStaff?.name || ''}
                onComplete={handlePinSetupComplete}
                onCancel={handlePinSetupCancel}
            />
        </>
    )
}
