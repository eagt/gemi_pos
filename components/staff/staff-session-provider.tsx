'use client'

import { useState, useEffect, useRef, createContext, useContext } from 'react'
import { useRouter, usePathname, useParams } from 'next/navigation'
import { StaffRole } from '@/lib/types/database.types'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useStaffStore } from '@/store/staff-store'
import { fetchActiveSession, clockOut } from '@/app/dashboard/actions'
import { toast } from 'sonner'
import { User } from 'lucide-react'

interface StaffSessionContextType {
    logout: () => void
    staff: {
        id: string
        restaurantRole: string
        quickCheckoutRole?: string | null
        name: string
    } | null
}

const StaffSessionContext = createContext<StaffSessionContextType | null>(null)

export function useStaffSession() {
    const context = useContext(StaffSessionContext)
    // Return an empty object with undefined staff if context is null (for fallback)
    return context || { staff: null, logout: () => { } }
}

interface StaffSessionProviderProps {
    children: React.ReactNode
    shopId?: string
    shopName?: string
    businessType: string
}

const IDLE_TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes

export function StaffSessionProvider({ children, businessType }: StaffSessionProviderProps) {
    const router = useRouter()
    const pathname = usePathname()
    const params = useParams()
    const shopId = params.shopId as string

    const session = useStaffStore((state) => state.session)
    const setSession = useStaffStore((state) => state.setSession)
    const clearSession = useStaffStore((state) => state.clearSession)

    const [isLoading, setIsLoading] = useState(true)
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null)

    const isStaffLoginPage = pathname?.includes('/staff-login')

    // 1. Fetch session from server on mount
    useEffect(() => {
        const checkSession = async () => {
            setIsLoading(true)
            try {
                const serverSession = await fetchActiveSession(shopId)

                if (serverSession) {
                    setSession(serverSession)
                } else {
                    clearSession()
                    // If no session and not on login page, redirect
                    if (businessType === 'table_order' && !isStaffLoginPage) {
                        router.push(`/staff-login/${shopId}`)
                    }
                }
            } catch (error) {
                console.error('Failed to fetch session:', error)
            } finally {
                setIsLoading(false)
            }
        }

        checkSession()
    }, [shopId, businessType, isStaffLoginPage, router, setSession, clearSession])

    // 2. Idle Timer Logic
    useEffect(() => {
        if (!session) return

        const resetTimer = () => {
            if (idleTimerRef.current) {
                clearTimeout(idleTimerRef.current)
            }
            idleTimerRef.current = setTimeout(handleIdleTimeout, IDLE_TIMEOUT_MS)
        }

        const handleIdleTimeout = async () => {
            if (session?.staffId) {
                await clockOut(shopId)
                clearSession()
                toast.info('Session timed out due to inactivity')
                router.push(`/staff-login/${shopId}`)
            }
        }

        // Listen for user activity
        const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll']
        events.forEach(event => document.addEventListener(event, resetTimer))

        // Initial start
        resetTimer()

        return () => {
            if (idleTimerRef.current) {
                clearTimeout(idleTimerRef.current)
            }
            events.forEach(event => document.removeEventListener(event, resetTimer))
        }
    }, [session, shopId, router, clearSession])

    // 3. Handle Logout (Manual)
    const handleLogout = async () => {
        if (session?.staffId) {
            await clockOut(shopId)
        }
        clearSession()
        router.push(`/staff-login/${shopId}`)
    }

    // Build the context value with staff data from session
    const contextValue: StaffSessionContextType = {
        logout: handleLogout,
        staff: session ? {
            id: session.staffId,
            restaurantRole: session.restaurantRole,
            quickCheckoutRole: session.quickCheckoutRole,
            name: session.name
        } : null
    }

    // If quick_checkout, just render children (no protection)
    if (businessType === 'quick_checkout') {
        return (
            <StaffSessionContext.Provider value={contextValue}>
                {children}
            </StaffSessionContext.Provider>
        )
    }

    // If we're on the staff-login page, don't show loading spinner
    // Let the page itself handle its own loading state
    if (isStaffLoginPage) {
        return (
            <StaffSessionContext.Provider value={contextValue}>
                {children}
            </StaffSessionContext.Provider>
        )
    }

    // While fetching session, show loading spinner (only for protected pages)
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white">Loading...</p>
                </div>
            </div>
        )
    }

    // If no session and not on login page, we are redirecting (handled in useEffect), so show null
    if (!session) {
        return null
    }

    return (
        <StaffSessionContext.Provider value={contextValue}>
            {children}
        </StaffSessionContext.Provider>
    )
}
