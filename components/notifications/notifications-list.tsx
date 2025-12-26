'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, formatDistanceToNow } from 'date-fns'
import { Check, X, Clock, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { approveClockInRequest, denyClockInRequest } from '@/app/staff-login/[shopId]/actions'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from '@/components/ui/input'
import { Numpad } from '@/components/ui/numpad'
import { cn } from '@/lib/utils'

interface ClockInRequest {
    id: string
    created_at: string
    responded_at: string | null
    responded_by_user_id: string | null
    status: 'pending' | 'approved' | 'denied' | 'expired'
    staff_user_id: string
    shop_staff: {
        name: string
        restaurant_role: string
        quick_checkout_role?: string
    } | null
}

export function NotificationsList({ shopId }: { shopId: string }) {
    const [requests, setRequests] = useState<ClockInRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
    const [selectedStaffName, setSelectedStaffName] = useState('')
    const [pinDialogOpen, setPinDialogOpen] = useState(false)
    const [managerPin, setManagerPin] = useState('')
    const [pinError, setPinError] = useState('')
    const [approving, setApproving] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        fetchRequests()

        const channel = supabase
            .channel('clock_in_requests_list_table_updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'clock_in_requests',
                    filter: `shop_id=eq.${shopId}`
                },
                () => {
                    fetchRequests()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [shopId])

    // Keyboard support for PIN entry
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!pinDialogOpen || approving) return

            if (/^[0-9]$/.test(e.key)) {
                handleNumpadClick(e.key)
            } else if (e.key === 'Backspace') {
                handleBackspace()
            } else if (e.key === 'Enter' && managerPin.length > 0) {
                handleConfirmApprove()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [pinDialogOpen, managerPin, approving])

    const fetchRequests = async () => {
        try {
            const { data: reqs, error } = await supabase
                .from('clock_in_requests')
                .select('*')
                .eq('shop_id', shopId)
                .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                .order('created_at', { ascending: false })

            if (error) throw error

            if (reqs && reqs.length > 0) {
                const userIds = reqs.map(r => r.staff_user_id)
                const { data: staffMembers } = await supabase
                    .from('shop_staff')
                    .select('user_id, name, restaurant_role, quick_checkout_role')
                    .eq('shop_id', shopId)
                    .in('user_id', userIds)

                const enriched = reqs.map(r => ({
                    ...r,
                    shop_staff: staffMembers?.find(s => s.user_id === r.staff_user_id) || { name: 'Unknown', restaurant_role: 'staff' }
                }))
                setRequests(enriched as any)
            } else {
                setRequests([])
            }
        } catch (error) {
            console.error('Error fetching notifications:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleApproveClick = (requestId: string, staffName: string) => {
        setSelectedRequestId(requestId)
        setSelectedStaffName(staffName)
        setManagerPin('')
        setPinError('')
        setPinDialogOpen(true)
    }

    const handleConfirmApprove = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!selectedRequestId || !managerPin) return

        setApproving(true)
        setPinError('')

        try {
            const result = await approveClockInRequest(shopId, selectedRequestId, managerPin)
            if (result.error) {
                setPinError(result.error)
            } else {
                setPinDialogOpen(false)
                toast.success('Clock-in approved')
                fetchRequests()
            }
        } catch (error) {
            setPinError('Failed to approve')
        } finally {
            setApproving(false)
        }
    }

    const handleDenyClick = async (requestId: string) => {
        try {
            const result = await denyClockInRequest(shopId, requestId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Request denied')
                fetchRequests()
            }
        } catch (error) {
            toast.error('Failed to deny request')
        }
    }

    const handleNumpadClick = (num: string) => {
        if (managerPin.length < 6) {
            setManagerPin(prev => prev + num)
            setPinError('')
        }
    }

    const handleBackspace = () => {
        setManagerPin(prev => prev.slice(0, -1))
    }

    if (loading) return <div className="p-8 text-center text-slate-500">Loading notifications...</div>

    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <Check className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">All Requests Processed</h3>
                <p className="text-slate-500 mt-2">No active clock-in authorizations pending.</p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-slate-200">
                        <TableHead className="font-bold text-slate-900 h-12">Staff Name</TableHead>
                        <TableHead className="font-bold text-slate-900 h-12">Role</TableHead>
                        <TableHead className="font-bold text-slate-900 h-12">Time Stamp</TableHead>
                        <TableHead className="font-bold text-slate-900 h-12 text-center">Status / Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests.map((request) => (
                        <TableRow key={request.id} className={cn(
                            "group transition-colors border-slate-100",
                            request.status === 'pending' ? "bg-amber-50/30" : "hover:bg-slate-50/50"
                        )}>
                            <TableCell className="py-3">
                                <span className="font-bold text-slate-900 capitalize text-base">
                                    {request.shop_staff?.name || 'Staff Member'}
                                </span>
                            </TableCell>
                            <TableCell className="py-3">
                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider text-[10px]">
                                    {request.shop_staff?.quick_checkout_role || request.shop_staff?.restaurant_role || 'Staff'}
                                </Badge>
                            </TableCell>
                            <TableCell className="py-3">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-slate-700">
                                        {format(new Date(request.created_at), 'hh:mm a')}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                        {format(new Date(request.created_at), 'MMM dd, yyyy')}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="py-3 text-center">
                                {(() => {
                                    if (request.status === 'pending') {
                                        // Check if there's a more recent acted-upon request for this staff member
                                        const isObsolete = requests.some(other =>
                                            other.staff_user_id === request.staff_user_id &&
                                            other.status !== 'pending' &&
                                            new Date(other.created_at) > new Date(request.created_at)
                                        )

                                        if (isObsolete) {
                                            return (
                                                <div className="flex items-center justify-center">
                                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                                                        Not Granted
                                                    </span>
                                                </div>
                                            )
                                        }

                                        return (
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 px-4 border-red-200 text-red-600 font-bold uppercase text-[10px] tracking-widest hover:bg-red-50 hover:border-red-300 transition-all rounded-lg"
                                                    onClick={() => handleDenyClick(request.id)}
                                                >
                                                    Deny
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="h-8 px-4 bg-emerald-600 text-white font-bold uppercase text-[10px] tracking-widest hover:bg-emerald-700 shadow-sm rounded-lg"
                                                    onClick={() => handleApproveClick(request.id, request.shop_staff?.name || '')}
                                                >
                                                    Approve
                                                </Button>
                                            </div>
                                        )
                                    }

                                    return (
                                        <div className="flex items-center justify-center gap-2">
                                            <span className={cn(
                                                "text-xs font-black uppercase tracking-widest",
                                                request.status === 'approved' ? "text-emerald-600" : "text-red-600"
                                            )}>
                                                {request.status === 'approved'
                                                    ? (request.responded_by_user_id === request.staff_user_id ? 'Auto-approved' : 'Mgr-APPROVED')
                                                    : request.status}
                                            </span>
                                        </div>
                                    )
                                })()}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Premium PIN Dialog (Matched with listener) */}
            <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
                <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                    <div className="bg-white overflow-hidden flex flex-col">
                        <div className="p-8 pb-4">
                            <DialogHeader className="mb-6 p-0 text-center">
                                <DialogTitle className="text-2xl font-bold text-slate-900 mb-2">Authorize Approval</DialogTitle>
                                <DialogDescription className="text-slate-500 text-lg leading-snug">
                                    Approval required for <span className="font-bold text-slate-900 capitalize">{selectedStaffName}</span>
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 max-w-[280px] mx-auto mb-6">
                                <Input
                                    type="password"
                                    value={managerPin}
                                    readOnly
                                    placeholder="••••••"
                                    className="h-16 text-3xl tracking-[1em] text-center border-2 border-slate-200 focus:border-purple-500 rounded-2xl px-4 bg-slate-50/50"
                                />
                                {pinError && <p className="text-sm font-semibold text-red-600 text-center">{pinError}</p>}
                            </div>
                        </div>

                        <div className="bg-slate-50/80 p-6 pt-8 border-t border-slate-100">
                            <Numpad
                                onNumberClick={handleNumpadClick}
                                onBackspace={handleBackspace}
                            />
                        </div>

                        <div className="p-8 bg-white border-t border-slate-100 grid grid-cols-2 gap-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setPinDialogOpen(false)}
                                className="h-14 text-slate-600 font-bold rounded-2xl uppercase tracking-wider"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={() => handleConfirmApprove()}
                                disabled={!managerPin || approving}
                                className="h-14 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-purple-100 uppercase tracking-wider"
                            >
                                {approving ? '...' : 'Confirm'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
