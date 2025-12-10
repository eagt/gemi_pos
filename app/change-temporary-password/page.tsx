'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { completeSetup } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Lock, Loader2 } from 'lucide-react'

function ChangePasswordForm() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectTo = searchParams.get('redirect_to') || '/dashboard'

    // Extract shopId from redirect_to if possible
    // Format: /dashboard/shops/[shopId]...
    const match = redirectTo.match(/\/dashboard\/shops\/([^\/]+)/)
    const shopId = match ? match[1] : null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }

        if (!shopId) {
            toast.error('Invalid shop ID')
            return
        }

        setLoading(true)
        try {
            const result = await completeSetup(password, shopId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Setup complete!')
                router.push(redirectTo)
            }
        } catch (error) {
            toast.error('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    if (!shopId) {
        return (
            <div className="text-center text-red-500">
                Error: Missing shop information. Please try clicking the invitation link again.
            </div>
        )
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <Lock className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-2xl">Set Your Password</CardTitle>
                <CardDescription>
                    Please set a permanent password for your account.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>
                    <Button
                        type="submit"
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Setting Password...
                            </>
                        ) : (
                            'Set Password & Continue'
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

export default function ChangeTemporaryPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-purple-600" />}>
                <ChangePasswordForm />
            </Suspense>
        </div>
    )
}
