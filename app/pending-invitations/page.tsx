'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, Store, UserCircle, Calendar } from 'lucide-react'
import { format } from 'date-fns'

import { getPendingInvitations, acceptInvitation } from './actions'

export default function PendingInvitationsPage() {
    const [invitations, setInvitations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        loadInvitations()
    }, [])

    const loadInvitations = async () => {
        try {
            const data = await getPendingInvitations()
            setInvitations(data || [])
        } catch (error) {
            console.error('Failed to load invitations', error)
        } finally {
            setLoading(false)
        }
    }

    const capitalizeRole = (role: string) =>
        role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()

    const formatInvitationDate = (dateString: string) => {
        try {
            const date = new Date(dateString)
            return format(date, 'dd-MMM-yyyy @ HH:mm')
        } catch {
            return 'Unknown date'
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-slate-50">
            <div className="max-w-4xl w-full space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-slate-900">Pending Invitations</h1>
                    <p className="text-slate-500">You have been invited to join the following businesses.</p>
                </div>

                {invitations.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {invitations.map((invite) => {
                            const role = invite.quick_checkout_role || invite.role
                            const shopId = invite.shops?.id

                            return (
                                <Card key={invite.id} className="h-full transition-all hover:border-purple-200 hover:shadow-md group">
                                    <CardHeader>
                                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 transition-colors group-hover:bg-purple-600">
                                            <Store className="h-6 w-6 text-purple-600 transition-colors group-hover:text-white" />
                                        </div>
                                        <CardTitle className="text-xl">{invite.shops?.name || 'Unknown Business'}</CardTitle>
                                        <CardDescription className="flex items-center gap-2">
                                            <UserCircle className="h-4 w-4" />
                                            Role: {capitalizeRole(role)}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-start gap-2 text-sm text-slate-500">
                                            <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <div className="font-medium text-slate-600">Invitation sent on:</div>
                                                <div>{formatInvitationDate(invite.created_at)}</div>
                                            </div>
                                        </div>

                                        <form action={acceptInvitation.bind(null, invite.id, shopId)} className="w-full">
                                            <Button
                                                type="submit"
                                                className="w-full bg-purple-600 hover:bg-purple-700"
                                            >
                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                Accept & Set Up
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                ) : (
                    <Card className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                            <CheckCircle2 className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Pending Invitations</h3>
                        <p className="text-slate-500 mb-4">You don't have any pending invitations at the moment.</p>
                        <Button variant="outline" onClick={() => router.push('/dashboard')}>
                            Go to Dashboard
                        </Button>
                    </Card>
                )}
            </div>
        </div>
    )
}