'use client'

import { useState, useCallback } from 'react'
import { useIdleTimer } from '@/hooks/use-idle-timer'
import { IdleWarningModal } from './idle-warning-modal'

import { useStaffSession } from './staff/staff-session-provider'

interface IdleTimerProviderProps {
    shopId: string
    timeoutMinutes: number
    businessType: 'table_order' | 'quick_checkout'
}

export function IdleTimerProvider({
    shopId,
    timeoutMinutes,
    businessType
}: IdleTimerProviderProps) {
    const { staff } = useStaffSession()
    const [warningOpen, setWarningOpen] = useState(false)

    // Determine if the *actual person holding the tablet* is a chef
    const isChef = businessType === 'table_order' && staff?.restaurantRole === 'chef'

    const {
        showWarning,
        resetTimer,
        performSoftLogout,
        isDisabled
    } = useIdleTimer({
        timeoutMinutes,
        shopId,
        isChef,
        businessType,
        onWarning: () => setWarningOpen(true),
        onTimeout: () => setWarningOpen(false)
    })

    const handleContinue = useCallback(() => {
        setWarningOpen(false)
        resetTimer()
    }, [resetTimer])

    const handleLogout = useCallback(() => {
        setWarningOpen(false)
        performSoftLogout()
    }, [performSoftLogout])

    // Don't render anything if disabled
    if (isDisabled) return null

    return (
        <IdleWarningModal
            open={warningOpen}
            onContinue={handleContinue}
            onLogout={handleLogout}
        />
    )
}
