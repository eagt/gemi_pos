'use client'

import { useEffect, useState } from 'react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Clock } from 'lucide-react'

interface IdleWarningModalProps {
    open: boolean
    onContinue: () => void
    onLogout: () => void
}

export function IdleWarningModal({ open, onContinue, onLogout }: IdleWarningModalProps) {
    const [countdown, setCountdown] = useState(90)

    useEffect(() => {
        if (!open) {
            setCountdown(90)
            return
        }

        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [open])

    useEffect(() => {
        if (open && countdown === 0) {
            onLogout()
        }
    }, [countdown, open, onLogout])

    return (
        <AlertDialog open={open}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                            <Clock className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <AlertDialogTitle className="text-xl">Session expiring soon</AlertDialogTitle>
                        </div>
                    </div>
                    <AlertDialogDescription className="text-base pt-4">
                        You will be logged out in <strong className="text-amber-600 font-semibold">{countdown} seconds</strong> due to inactivity.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 sm:gap-2">
                    <AlertDialogCancel
                        onClick={onLogout}
                        className="mt-0"
                    >
                        Log out now
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onContinue}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        Continue Working
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
