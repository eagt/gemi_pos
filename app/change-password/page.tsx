'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { updatePassword } from './actions'
import { Loader2 } from 'lucide-react'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ChangePasswordForm() {
    const [loading, setLoading] = useState(false)
    const searchParams = useSearchParams()
    const returnUrl = searchParams.get('returnUrl')

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        const result = await updatePassword(formData)
        setLoading(false)

        if (result?.error) {
            toast.error(result.error)
        }
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                    You are using a temporary password. Please set a new secure password to continue.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-4">
                    {returnUrl && <input type="hidden" name="returnUrl" value={returnUrl} />}
                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                            minLength={6}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            required
                            minLength={6}
                        />
                    </div>
                    <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Password
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

export default function ChangePasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-purple-600" />}>
                <ChangePasswordForm />
            </Suspense>
        </div>
    )
}
