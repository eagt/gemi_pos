'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useStaffStore } from '@/store/staff-store'

const WARNING_BEFORE_TIMEOUT = 90 // 90 seconds warning before logout
const EVENTS = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']

interface UseIdleTimerOptions {
    timeoutMinutes: number
    shopId: string
    isChef: boolean
    businessType: 'table_order' | 'quick_checkout'
    onWarning: () => void
    onTimeout: () => void
}

export function useIdleTimer({
    timeoutMinutes,
    shopId,
    isChef,
    businessType,
    onWarning,
    onTimeout
}: UseIdleTimerOptions) {
    const router = useRouter()
    const pathname = usePathname()
    const [isIdle, setIsIdle] = useState(false)
    const [showWarning, setShowWarning] = useState(false)
    const clearSession = useStaffStore((state) => state.clearSession)

    const timeoutIdRef = useRef<NodeJS.Timeout | undefined>(undefined)
    const warningTimeoutIdRef = useRef<NodeJS.Timeout | undefined>(undefined)
    const lastActivityRef = useRef<number>(Date.now())

    // Disable idle timeout for Chefs in table_order businesses
    const isDisabled = businessType === 'table_order' && isChef

    const performSoftLogout = useCallback(async () => {
        // Clear any pending timers
        if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current)
        if (warningTimeoutIdRef.current) clearTimeout(warningTimeoutIdRef.current)

        // Get current session before clearing
        const session = useStaffStore.getState().session

        // If user is clocked in, clock them out from the database
        if (session?.staffId) {
            try {
                const { clockOut } = await import('@/app/dashboard/actions')
                await clockOut(shopId)
            } catch (error) {
                console.error('Error clocking out on timeout:', error)
            }
        }

        // Clear staff session from store
        clearSession()

        // Also clear legacy sessionStorage if any
        sessionStorage.removeItem('currentStaffId')
        sessionStorage.removeItem('currentStaffRole')

        // Navigate to staff login screen with return URL
        // Don't set returnUrl if we are already on the login page
        const currentPath = pathname || `/dashboard/shops/${shopId}`
        const isLoginPage = currentPath.includes('/staff-login')

        const returnUrl = isLoginPage ? '' : encodeURIComponent(currentPath)
        const targetUrl = `/staff-login/${shopId}${returnUrl ? `?returnUrl=${returnUrl}` : ''}`

        router.push(targetUrl)

        onTimeout()
    }, [shopId, router, onTimeout, pathname, clearSession])

    const resetTimer = useCallback(() => {
        if (isDisabled) return

        lastActivityRef.current = Date.now()
        setShowWarning(false)
        setIsIdle(false)

        // Clear existing timers
        if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current)
        if (warningTimeoutIdRef.current) clearTimeout(warningTimeoutIdRef.current)

        const timeoutMs = timeoutMinutes * 60 * 1000
        const warningMs = timeoutMs - (WARNING_BEFORE_TIMEOUT * 1000)

        // Set warning timer (show modal 90 seconds before timeout)
        warningTimeoutIdRef.current = setTimeout(() => {
            setShowWarning(true)
            onWarning()
        }, warningMs)

        // Set logout timer (perform soft logout after full timeout)
        timeoutIdRef.current = setTimeout(() => {
            performSoftLogout()
        }, timeoutMs)
    }, [timeoutMinutes, isDisabled, onWarning, performSoftLogout])

    const handleActivity = useCallback(() => {
        resetTimer()
    }, [resetTimer])

    useEffect(() => {
        if (isDisabled) {
            // Clean up if disabled
            if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current)
            if (warningTimeoutIdRef.current) clearTimeout(warningTimeoutIdRef.current)
            return
        }

        // Only activate on dashboard routes, but EXCLUDE staff-login
        if (!pathname?.includes('/dashboard/shops/') || pathname?.includes('/staff-login')) return

        // Initialize timer
        resetTimer()

        // Add event listeners
        EVENTS.forEach(event => {
            window.addEventListener(event, handleActivity)
        })

        // Cleanup
        return () => {
            EVENTS.forEach(event => {
                window.removeEventListener(event, handleActivity)
            })
            if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current)
            if (warningTimeoutIdRef.current) clearTimeout(warningTimeoutIdRef.current)
        }
    }, [pathname, isDisabled, handleActivity, resetTimer])

    return {
        showWarning,
        resetTimer,
        performSoftLogout,
        isDisabled
    }
}
