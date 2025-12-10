'use client'

import { useState, useCallback } from 'react'
import { useIdleTimer } from '@/hooks/use-idle-timer'
import { IdleWarningModal } from './idle-warning-modal'

interface IdleTimerProviderProps {
    shopId: string
    timeoutMinutes: number
    isChef: boolean
    businessType: 'table_order' | 'quick_checkout'
}

export function IdleTimerProvider({
    shopId,
    timeoutMinutes,
    isChef,
    businessType
}: IdleTimerProviderProps) {
    const [warningOpen, setWarningOpen] = useState(false)

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
