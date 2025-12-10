'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PinInput } from '@/components/staff/pin-input'
import { updateUserShopPin } from '@/app/dashboard/shops/[shopId]/user-settings/actions'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface ChangePinModalProps {
    shop: { shopId: string; shopName: string; hasPin: boolean }
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function ChangePinModal({ shop, open, onOpenChange, onSuccess }: ChangePinModalProps) {
    const [step, setStep] = useState<'current' | 'new' | 'confirm'>(shop.hasPin ? 'current' : 'new')
    const [currentPin, setCurrentPin] = useState('')
    const [newPin, setNewPin] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)

    const handlePinComplete = async (value: string) => {
        setError(false)

        if (step === 'current') {
            setCurrentPin(value)
            setTimeout(() => setStep('new'), 300)
        } else if (step === 'new') {
            setNewPin(value)
            setTimeout(() => setStep('confirm'), 300)
        } else if (step === 'confirm') {
            if (value !== newPin) {
                setError(true)
                toast.error("PINs do not match")
                return
            }
            handleSubmit(value)
        }
    }

    const handleSubmit = async (confirmedPin: string) => {
        setLoading(true)
        try {
            const result = await updateUserShopPin(shop.shopId, currentPin, confirmedPin)

            if (result.error) {
                toast.error(result.error)
                if (result.error.includes('current')) {
                    setStep('current')
                    setCurrentPin('')
                } else {
                    setStep('new')
                    setNewPin('')
                }
                setError(true)
            } else {
                toast.success(`PIN updated for ${shop.shopName}`)
                onSuccess()
            }
        } catch (error) {
            toast.error("Failed to update PIN")
        } finally {
            setLoading(false)
        }
    }

    const reset = () => {
        setStep(shop.hasPin ? 'current' : 'new')
        setCurrentPin('')
        setNewPin('')
        setError(false)
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) reset()
            onOpenChange(val)
        }}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>
                        {step === 'current' && 'Enter Current PIN'}
                        {step === 'new' && 'Create New PIN'}
                        {step === 'confirm' && 'Confirm New PIN'}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'current' && `Please enter your current PIN for ${shop.shopName}`}
                        {step === 'new' && `Enter a new 4-digit PIN for ${shop.shopName}`}
                        {step === 'confirm' && 'Enter the new PIN again to confirm'}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 flex justify-center">
                    {loading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                    ) : (
                        <PinInput
                            length={4}
                            onComplete={handlePinComplete}
                            error={error}
                            disabled={loading}
                            key={step}
                        />
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
