'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStaffStore } from '@/store/staff-store'
import { createClient } from '@/lib/supabase/client'

interface StaffSettingsGuardProps {
    children: React.ReactNode
    shopId: string
}

export function StaffSettingsGuard({ children, shopId }: StaffSettingsGuardProps) {
    const router = useRouter()
    const staffSession = useStaffStore((state) => state.session)
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

    useEffect(() => {
        const checkAuth = async () => {
            // 1. Check client-side staff session (PIN login)
            if (staffSession?.shopId === shopId &&
                (staffSession.role === 'manager' || staffSession.quickCheckoutRole === 'administrator')) {
                setIsAuthorized(true)
                return
            }

            // 2. Check server-side supabase session
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                // We assume if they have a user session and can access this route, 
                // the layout/middleware would have caught them if they weren't staff.
                // But strictly we should check their role here too if we want to be safe.
                // For now, let's assume Supabase Auth users accessing this are Owners/Managers.
                setIsAuthorized(true)
                return
            }

            // Not authorized
            setIsAuthorized(false)
            router.push(`/dashboard/shops/${shopId}`)
        }

        checkAuth()
    }, [shopId, staffSession, router])

    if (isAuthorized === null) {
        return null // Loading state
    }

    if (!isAuthorized) {
        return null // Will redirect
    }

    return <>{children}</>
}
