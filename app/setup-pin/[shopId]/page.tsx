'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PinInput } from '@/components/staff/pin-input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { setStaffPin, getUserOtherBusinessPins, copyPinFromOtherBusiness, getShopName } from './actions'
import { ShieldCheck, Loader2, Building2, Copy, Store } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface OtherBusiness {
    id: string
    shop_id: string
    shops: { name: string } | null
}

export default function SetupPinPage({ params }: { params: Promise<{ shopId: string }> }) {
    const [pin, setPin] = useState('')
    const [confirmPin, setConfirmPin] = useState('')
    const [step, setStep] = useState<'choose' | 'enter' | 'confirm'>('choose')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)
    const [otherBusinesses, setOtherBusinesses] = useState<OtherBusiness[]>([])
    const [loadingBusinesses, setLoadingBusinesses] = useState(true)
    const [shopName, setShopName] = useState('')
    const router = useRouter()

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const { shopId } = await params

            // Load shop name
            const name = await getShopName(shopId)
            setShopName(name)

            // Load other businesses
            const businesses = await getUserOtherBusinessPins(shopId)
            setOtherBusinesses(businesses as any)

            // If no other businesses, skip choice step
            if (businesses.length === 0) {
                setStep('enter')
            }
        } catch (error) {
            console.error('Failed to load data:', error)
            setStep('enter')
        } finally {
            setLoadingBusinesses(false)
        }
    }

    const handleReusePinFrom = async (sourceStaffId: string, businessName: string) => {
        setLoading(true)
        try {
            const { shopId } = await params
            const result = await copyPinFromOtherBusiness(shopId, sourceStaffId)

            if (result.error) {
                toast.error(result.error)
            } else if (result.redirectUrl) {
                toast.success(`PIN copied from ${businessName}!`)
                router.push(result.redirectUrl)
            }
        } catch (error) {
            toast.error('Failed to copy PIN')
        } finally {
            setLoading(false)
        }
    }

    const handlePinComplete = (value: string) => {
        setError(false)
        if (step === 'enter') {
            setPin(value)
            setTimeout(() => {
                setStep('confirm')
            }, 300)
        } else {
            setConfirmPin(value)
        }
    }

    const handleSubmit = async () => {
        if (pin !== confirmPin) {
            toast.error('PINs do not match')
            setError(true)
            setConfirmPin('')
            return
        }

        setLoading(true)
        try {
            const { shopId } = await params
            const result = await setStaffPin(shopId, pin)

            if (result.error) {
                toast.error(result.error)
                setError(true)
            } else if (result.redirectUrl) {
                toast.success('PIN set successfully!')
                router.push(result.redirectUrl)
            }
        } catch (error) {
            console.error('Error calling setStaffPin:', error)
            toast.error('Failed to set PIN')
        } finally {
            setLoading(false)
        }
    }

    const handleBack = () => {
        if (step === 'confirm') {
            setStep('enter')
            setPin('')
            setConfirmPin('')
            setError(false)
        } else if (step === 'enter' && otherBusinesses.length > 0) {
            setStep('choose')
        }
    }

    if (loadingBusinesses) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
            {/* Shop Header */}
            <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-4">
                    <Store className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white capitalize">{shopName}</h1>
                <p className="text-purple-200 mt-1">Welcome to the team!</p>
            </div>

            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                        <ShieldCheck className="w-6 h-6 text-purple-600" />
                    </div>
                    <CardTitle className="text-2xl">
                        {step === 'choose' && 'Set Up Your PIN'}
                        {step === 'enter' && 'Create Your Staff PIN'}
                        {step === 'confirm' && 'Confirm Your PIN'}
                    </CardTitle>
                    <CardDescription>
                        {step === 'choose' && 'Use an existing PIN or create a new one'}
                        {step === 'enter' && 'Create a 4-digit PIN for quick access to the POS'}
                        {step === 'confirm' && 'Enter your PIN again to confirm'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {step === 'choose' && (
                        <div className="space-y-4">
                            <div className="text-center mb-4">
                                <p className="text-sm text-muted-foreground">
                                    Would you like to use the same PIN from one of the businesses you are registered at on this one?
                                    If so, simply click on the card
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {otherBusinesses.map((business: any) => (
                                    <Button
                                        key={business.id}
                                        variant="outline"
                                        className="h-auto p-4 justify-start hover:bg-purple-50 hover:border-purple-300 transition-colors"
                                        onClick={() => handleReusePinFrom(business.id, business.shops?.name || 'Unknown')}
                                        disabled={loading}
                                    >
                                        <div className="flex items-center gap-3 w-full">
                                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                <Building2 className="h-5 w-5 text-purple-600" />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className="font-medium text-base">
                                                    {business.shops?.name || 'Unknown Business'}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Click to use this PIN
                                                </div>
                                            </div>
                                            <Copy className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        </div>
                                    </Button>
                                ))}
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <Separator />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-muted-foreground">Or</span>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-purple-600 hover:bg-purple-700"
                                onClick={() => setStep('enter')}
                            >
                                Create New PIN
                            </Button>
                        </div>
                    )}

                    {(step === 'enter' || step === 'confirm') && (
                        <>
                            <div className="flex justify-center py-4">
                                <PinInput
                                    length={4}
                                    onComplete={handlePinComplete}
                                    error={error}
                                    disabled={loading}
                                    key={step}
                                />
                            </div>

                            {step === 'confirm' && (
                                <div className="space-y-3">
                                    <Button
                                        className="w-full bg-purple-600 hover:bg-purple-700"
                                        onClick={handleSubmit}
                                        disabled={confirmPin.length !== 4 || loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Setting PIN...
                                            </>
                                        ) : (
                                            'Save PIN & Continue'
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="w-full"
                                        onClick={handleBack}
                                        disabled={loading}
                                    >
                                        Back
                                    </Button>
                                </div>
                            )}

                            {step === 'enter' && otherBusinesses.length > 0 && (
                                <Button
                                    variant="ghost"
                                    className="w-full"
                                    onClick={handleBack}
                                >
                                    Back to options
                                </Button>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
