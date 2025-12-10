'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { clockOut } from '@/app/dashboard/actions'
import { useStaffStore } from '@/store/staff-store'
import { toast } from 'sonner'
import { useState } from 'react'

interface ClockOutButtonProps {
    shopId: string
}

export function ClockOutButton({ shopId }: ClockOutButtonProps) {
    const router = useRouter()
    const session = useStaffStore((state) => state.session)
    const clearSession = useStaffStore((state) => state.clearSession)
    const [loading, setLoading] = useState(false)

    const handleClockOut = async () => {
        if (!session?.staffId) return

        setLoading(true)
        try {
            await clockOut(shopId)

            // Clear local session
            clearSession()

            toast.success('Clocked out successfully')
        } catch (error) {
            console.error('Clock out error:', error)
            toast.error('Failed to clock out')
            // Fallback redirect if clockOut action fails
            router.push(`/staff-login/${shopId}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            onClick={handleClockOut}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
        >
            <LogOut className="h-4 w-4" />
            Clock Out & Switch
        </Button>
    )
}
