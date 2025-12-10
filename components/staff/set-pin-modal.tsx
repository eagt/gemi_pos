'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { PinInput } from './pin-input'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'

interface SetPinModalProps {
    open: boolean
    onSetPin: (pin: string) => Promise<boolean>
    title?: string
    description?: string
    minLength?: number
    maxLength?: number
}

export function SetPinModal({
    open,
    onSetPin,
    title = 'Set Your PIN',
    description = 'Create a 4-6 digit PIN to secure your account',
    minLength = 4,
    maxLength = 6,
}: SetPinModalProps) {
    const [step, setStep] = useState<'choose' | 'confirm'>('choose')
    const [pinLength, setPinLength] = useState(4)
    const [firstPin, setFirstPin] = useState('')
    const [error, setError] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleFirstPinComplete = (pin: string) => {
        setFirstPin(pin)
        setStep('confirm')
        setError(false)
    }

    const handleConfirmPinComplete = async (pin: string) => {
        if (pin !== firstPin) {
            setError(true)
            return
        }

        setIsSubmitting(true)
        setError(false)

        try {
            const success = await onSetPin(pin)

            if (!success) {
                setError(true)
                setIsSubmitting(false)
            }
            // If successful, the parent component will handle closing/navigation
        } catch (error) {
            console.error('Error setting PIN:', error)
            setError(true)
            setIsSubmitting(false)
        }
    }

    const handleBack = () => {
        setStep('choose')
        setFirstPin('')
        setError(false)
    }

    const handleLengthChange = (length: number) => {
        setPinLength(length)
        setFirstPin('')
        setError(false)
    }

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-md" showCloseButton={false}>
                <DialogHeader>
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <DialogTitle className="text-center text-2xl">{title}</DialogTitle>
                    <DialogDescription className="text-center">
                        {step === 'choose' ? description : 'Confirm your PIN'}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    {step === 'choose' ? (
                        <>
                            {/* PIN Length Selection */}
                            <div className="mb-6">
                                <p className="text-sm text-muted-foreground text-center mb-3">
                                    Choose PIN length
                                </p>
                                <div className="flex gap-2 justify-center">
                                    {Array.from({ length: maxLength - minLength + 1 }, (_, i) => minLength + i).map((length) => (
                                        <button
                                            key={length}
                                            onClick={() => handleLengthChange(length)}
                                            className={`px-4 py-2 rounded-lg font-medium transition-all ${pinLength === length
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {length} digits
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* PIN Input */}
                            <div className="mb-4">
                                <p className="text-center text-sm text-muted-foreground mb-4">
                                    Enter your new PIN
                                </p>
                                <PinInput
                                    length={pinLength}
                                    onComplete={handleFirstPinComplete}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Confirm PIN */}
                            <div className="mb-4">
                                <p className="text-center text-sm text-muted-foreground mb-4">
                                    Re-enter your PIN to confirm
                                </p>
                                <PinInput
                                    length={pinLength}
                                    onComplete={handleConfirmPinComplete}
                                    error={error}
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* Error Message */}
                            {error && (
                                <p className="text-center text-sm text-red-600 mb-4">
                                    PINs don't match. Please try again.
                                </p>
                            )}

                            {/* Back Button */}
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                className="w-full"
                                disabled={isSubmitting}
                            >
                                Back
                            </Button>
                        </>
                    )}
                </div>

                {/* Security Note */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-900 text-center">
                        🔒 Your PIN is encrypted and secure. Don't share it with anyone.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
