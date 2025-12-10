'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, ChefHat, User, Truck, Shield, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StaffRole } from '@/lib/types/database.types'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { SetPinModal } from '@/components/staff/set-pin-modal'

interface PendingInvitation {
    id: string
    shop_id: string
    shop_name: string
    role: StaffRole
    invited_by_name: string | null
    created_at: string
}

const roleIcons: Record<StaffRole, React.ComponentType<{ className?: string }>> = {
    manager: Shield,
    waiter: User,
    chef: ChefHat,
    runner: Truck,
}

const roleLabels: Record<StaffRole, string> = {
    manager: 'Manager',
    waiter: 'Waiter',
    chef: 'Chef',
    runner: 'Runner',
}

const roleDescriptions: Record<StaffRole, string> = {
    manager: 'Full access to all features',
    waiter: 'Take orders and process payments',
    chef: 'Manage kitchen and preparation',
    runner: 'Deliver orders to tables',
}

export default function PendingInvitationsPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [isChecking, setIsChecking] = useState(false)
    const [invitations, setInvitations] = useState<PendingInvitation[]>([])
    const [selectedInvitation, setSelectedInvitation] = useState<PendingInvitation | null>(null)
    const [showPinModal, setShowPinModal] = useState(false)

    const handleCheckInvitations = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email) {
            toast.error('Please enter your email')
            return
        }

        setIsChecking(true)
        const supabase = createClient()

        try {
            const { data, error } = await supabase
                .rpc('get_pending_invitations', { user_email: email.toLowerCase() })

            if (error) throw error

            if (!data || data.length === 0) {
                toast.info('No pending invitations found for this email')
                setInvitations([])
            } else {
                setInvitations(data)
            }
        } catch (error) {
            console.error('Error checking invitations:', error)
            toast.error('Failed to check invitations')
        } finally {
            setIsChecking(false)
        }
    }

    const handleAcceptInvitation = (invitation: PendingInvitation) => {
        setSelectedInvitation(invitation)
        setShowPinModal(true)
    }

    const handleSetPin = async (pin: string): Promise<boolean> => {
        if (!selectedInvitation) return false

        try {
            // Import dynamically to avoid server-side module issues in client component if any
            const { acceptInvitation } = await import('./actions')

            const result = await acceptInvitation(selectedInvitation.id, pin)

            if (result.error) {
                toast.error(result.error)
                return false
            }

            toast.success('Invitation accepted! Redirecting...')

            // Redirect to the shop
            setTimeout(() => {
                router.push(`/dashboard/shops/${selectedInvitation.shop_id}`)
            }, 1000)

            return true
        } catch (error) {
            console.error('Error accepting invitation:', error)
            toast.error('Failed to accept invitation')
            return false
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-white mb-2">Welcome!</h1>
                    <p className="text-slate-300 text-lg">Check your pending work invitations</p>
                </div>

                {/* Email Check Form */}
                {invitations.length === 0 && (
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle>Enter Your Email</CardTitle>
                            <CardDescription>
                                We'll check if you have any pending invitations
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCheckInvitations} className="space-y-4">
                                <div>
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your.email@example.com"
                                        required
                                        className="text-lg"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-purple-600 hover:bg-purple-700"
                                    disabled={isChecking}
                                >
                                    {isChecking ? 'Checking...' : 'Check Invitations'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Invitations List */}
                {invitations.length > 0 && (
                    <div className="space-y-6">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-white mb-2">
                                You have {invitations.length} pending invitation{invitations.length > 1 ? 's' : ''}
                            </h2>
                            <p className="text-slate-300">Choose which one to accept</p>
                        </div>

                        <div className="grid gap-4">
                            {invitations.map((invitation) => {
                                const Icon = roleIcons[invitation.role]
                                const roleLabel = roleLabels[invitation.role]
                                const roleDescription = roleDescriptions[invitation.role]

                                return (
                                    <Card key={invitation.id} className="overflow-hidden">
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-4 flex-1">
                                                    {/* Icon */}
                                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                                        <Icon className="w-7 h-7 text-white" />
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Building2 className="w-4 h-4 text-muted-foreground" />
                                                            <h3 className="font-semibold text-xl">{invitation.shop_name}</h3>
                                                        </div>

                                                        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700 mb-2">
                                                            {roleLabel}
                                                        </div>

                                                        <p className="text-sm text-muted-foreground mb-2">
                                                            {roleDescription}
                                                        </p>

                                                        <div className="text-xs text-muted-foreground">
                                                            {invitation.invited_by_name && (
                                                                <p>Invited by {invitation.invited_by_name}</p>
                                                            )}
                                                            <p>Sent {format(new Date(invitation.created_at), 'MMM d, yyyy')}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Accept Button */}
                                                <Button
                                                    onClick={() => handleAcceptInvitation(invitation)}
                                                    className="bg-green-600 hover:bg-green-700 ml-4"
                                                >
                                                    <Check className="w-4 h-4 mr-2" />
                                                    Accept
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>

                        {/* Back Button */}
                        <Button
                            variant="outline"
                            onClick={() => {
                                setInvitations([])
                                setEmail('')
                            }}
                            className="w-full"
                        >
                            Check Different Email
                        </Button>
                    </div>
                )}

                {/* No Account Notice */}
                <Card className="mt-8 bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                        <p className="text-sm text-blue-900 text-center">
                            💡 Don't have an account yet? You'll be able to create one after accepting an invitation.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Set PIN Modal */}
            <SetPinModal
                open={showPinModal}
                onSetPin={handleSetPin}
                title="Set Your PIN"
                description="Create a secure PIN to access your account"
            />
        </div>
    )
}
