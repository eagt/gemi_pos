'use client'

import { useState } from 'react'
import { updateProfile, updatePassword } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { User, Lock, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ShopPinList } from '@/components/user-settings/shop-pin-list'

interface UserSettingsClientProps {
    userEmail: string
    userFullName: string
    shopId: string
}

export default function UserSettingsClient({ userEmail, userFullName, shopId }: UserSettingsClientProps) {
    const [fullName, setFullName] = useState(userFullName || '')
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loadingProfile, setLoadingProfile] = useState(false)
    const [loadingPassword, setLoadingPassword] = useState(false)

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoadingProfile(true)

        try {
            const result = await updateProfile(fullName)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Profile updated successfully!')
            }
        } catch (error) {
            toast.error('An unexpected error occurred')
        } finally {
            setLoadingProfile(false)
        }
    }

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match')
            return
        }

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }

        setLoadingPassword(true)

        try {
            const result = await updatePassword(currentPassword, newPassword)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Password updated successfully! You can continue working.')
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
            }
        } catch (error) {
            toast.error('An unexpected error occurred')
        } finally {
            setLoadingPassword(false)
        }
    }

    return (
        <div className="h-full flex flex-col p-4 md:p-8 overflow-y-auto">
            <div className="max-w-3xl mx-auto space-y-6 w-full">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/shops/${shopId}/pos`}>
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to POS
                        </Button>
                    </Link>
                </div>

                <div>
                    <h1 className="text-3xl font-bold text-slate-900">User Settings</h1>
                    <p className="text-slate-500 mt-1">Manage your account settings and preferences (applies globally to all businesses)</p>
                </div>

                {/* Profile Settings */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-purple-600" />
                            <CardTitle>Profile Information</CardTitle>
                        </div>
                        <CardDescription>
                            Update your personal information (applies to all businesses you work at)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={userEmail}
                                    disabled
                                    className="bg-slate-50"
                                />
                                <p className="text-xs text-slate-500">Email cannot be changed</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                    id="fullName"
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Enter your full name"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="bg-purple-600 hover:bg-purple-700"
                                disabled={loadingProfile}
                            >
                                {loadingProfile ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Update Profile'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Password Settings */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-purple-600" />
                            <CardTitle>Change Password</CardTitle>
                        </div>
                        <CardDescription>
                            Update your password to keep your account secure
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <Input
                                    id="currentPassword"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
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
                                className="bg-purple-600 hover:bg-purple-700"
                                disabled={loadingPassword}
                            >
                                {loadingPassword ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Change Password'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Shop PIN Management */}
                <ShopPinList />
            </div>
        </div>
    )
}
