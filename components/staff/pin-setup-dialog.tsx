'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { PinInput } from './pin-input'
import { toast } from 'sonner'

interface PinSetupDialogProps {
    open: boolean
    staffName: string
    onComplete: (pin: string) => Promise<boolean>
    onCancel: () => void
}

export function PinSetupDialog({ open, staffName, onComplete, onCancel }: PinSetupDialogProps) {
    const [step, setStep] = useState<'create' | 'confirm'>('create')
    const [createdPin, setCreatedPin] = useState('')
    const [error, setError] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleCreatePin = (pin: string) => {
        setCreatedPin(pin)
        setStep('confirm')
        setError(false)
    }

    const handleConfirmPin = async (pin: string) => {
        if (pin !== createdPin) {
            setError(true)
            toast.error('PINs do not match')
            return
        }

        setIsSubmitting(true)
        try {
            const success = await onComplete(pin)
            if (!success) {
                toast.error('Failed to set PIN')
                setError(true)
            }
        } catch (error) {
            console.error('Error setting PIN:', error)
            toast.error('Failed to set PIN')
            setError(true)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleBack = () => {
        setStep('create')
        setCreatedPin('')
        setError(false)
    }

    return (
        <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl">
                        {step === 'create' ? 'Create Your PIN' : 'Confirm Your PIN'}
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        {step === 'create'
                            ? <span>Welcome, <span className="capitalize">{staffName}</span>! Please create a 4-digit PIN to secure your account.</span>
                            : 'Please enter your PIN again to confirm.'
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    <div className="mb-6">
                        <PinInput
                            key={step} // This forces the component to reset when step changes
                            length={4}
                            onComplete={step === 'create' ? handleCreatePin : handleConfirmPin}
                            error={error}
                            disabled={isSubmitting}
                        />
                    </div>

                    {error && step === 'confirm' && (
                        <p className="text-center text-sm text-red-600 mb-4">
                            PINs do not match. Please try again.
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
