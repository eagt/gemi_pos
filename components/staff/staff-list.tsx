'use client'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { User, Mail, Shield, Clock, UserCheck, Edit2 } from 'lucide-react'
import { EditStaffSheet } from './edit-staff-sheet'

interface StaffMember {
    id: string
    name: string
    email: string | null
    role: string
    created_at: string
    accepted_at: string | null
    invited_by_staff: { name: string }[] | null
}

interface StaffListProps {
    staff: StaffMember[]
    shopId: string
    businessType: string
}

const roleColors = {
    manager: 'bg-purple-100 text-purple-700 border-purple-200',
    waiter: 'bg-blue-100 text-blue-700 border-blue-200',
    chef: 'bg-orange-100 text-orange-700 border-orange-200',
    runner: 'bg-green-100 text-green-700 border-green-200',
}

const roleLabels = {
    manager: 'Manager',
    waiter: 'Waiter',
    chef: 'Chef',
    runner: 'Runner',
}

export function StaffList({ staff, shopId, businessType }: StaffListProps) {
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
    const [editOpen, setEditOpen] = useState(false)

    const handleEdit = (member: StaffMember) => {
        setSelectedStaff(member)
        setEditOpen(true)
    }

    const handleUpdate = () => {
        // Refresh the page to get updated data
        window.location.reload()
    }

    if (!staff || staff.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <User className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500">No staff members yet</p>
                    <p className="text-sm text-slate-400 mt-1">Invite your first team member to get started</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {/* Desktop Table View (hidden on mobile) */}
            <Card className="hidden md:block">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 whitespace-nowrap">Staff Member</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 whitespace-nowrap">Role</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 whitespace-nowrap">Status</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 whitespace-nowrap">Joined</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 whitespace-nowrap">Invited By</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {staff.map((member) => (
                                    <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                    <User className="h-5 w-5 text-purple-600" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-medium text-slate-900 whitespace-nowrap capitalize">{member.name}</div>
                                                    {member.email && (
                                                        <div className="text-sm text-slate-500 flex items-center gap-1">
                                                            <Mail className="h-3 w-3 flex-shrink-0" />
                                                            <span className="truncate">{member.email}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <Badge
                                                variant="outline"
                                                className={roleColors[member.role as keyof typeof roleColors] || 'bg-slate-100 text-slate-700'}
                                            >
                                                <Shield className="h-3 w-3 mr-1" />
                                                {roleLabels[member.role as keyof typeof roleLabels] || member.role}
                                            </Badge>
                                        </td>
                                        <td className="py-4 px-4">
                                            {member.accepted_at ? (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 whitespace-nowrap">
                                                    <UserCheck className="h-3 w-3 mr-1" />
                                                    Active
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 whitespace-nowrap">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    Pending
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="py-4 px-4 text-sm text-slate-600 whitespace-nowrap">
                                            {formatDistanceToNow(new Date(member.created_at), { addSuffix: true })}
                                        </td>
                                        <td className="py-4 px-4 text-sm text-slate-600 whitespace-nowrap">
                                            <span className="capitalize">{member.invited_by_staff?.[0]?.name || '-'}</span>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleEdit(member)}
                                            >
                                                <Edit2 className="h-4 w-4 text-slate-600" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Mobile Card View (visible on mobile only) */}
            <div className="md:hidden space-y-3">
                {staff.map((member) => (
                    <Card key={member.id} className="overflow-hidden">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex items-start gap-3">
                                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                        <User className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-slate-900 truncate capitalize">{member.name}</div>
                                        {member.email && (
                                            <div className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                                                <Mail className="h-3 w-3 flex-shrink-0" />
                                                <span className="truncate">{member.email}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2" onClick={() => handleEdit(member)}>
                                    <Edit2 className="h-4 w-4 text-slate-500" />
                                </Button>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-3">
                                <Badge
                                    variant="outline"
                                    className={roleColors[member.role as keyof typeof roleColors] || 'bg-slate-100 text-slate-700'}
                                >
                                    <Shield className="h-3 w-3 mr-1" />
                                    {roleLabels[member.role as keyof typeof roleLabels] || member.role}
                                </Badge>
                                {member.accepted_at ? (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        <UserCheck className="h-3 w-3 mr-1" />
                                        Active
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                        <Clock className="h-3 w-3 mr-1" />
                                        Pending
                                    </Badge>
                                )}
                            </div>

                            <div className="text-xs text-slate-500 space-y-1">
                                <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Joined {formatDistanceToNow(new Date(member.created_at), { addSuffix: true })}
                                </div>
                                {member.invited_by_staff?.[0]?.name && (
                                    <div>
                                        Invited by <span className="capitalize">{member.invited_by_staff[0].name}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <EditStaffSheet
                staff={selectedStaff}
                shopId={shopId}
                businessType={businessType}
                open={editOpen}
                onOpenChange={setEditOpen}
                onUpdate={handleUpdate}
            />
        </div>
    )
}
