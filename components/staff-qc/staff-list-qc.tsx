'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { User, Mail, Shield, Clock, UserCheck, Edit, UserX, UserPlus, Phone } from 'lucide-react'
import { PermissionEditor } from './permission-editor'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

interface StaffMember {
    id: string
    name: string
    email: string | null
    phone: string | null
    quick_checkout_role: string | null
    is_active: boolean
    created_at: string
    accepted_at: string | null
    invited_by_staff: { name: string }[] | null
}

interface StaffListQCProps {
    staff: StaffMember[]
    shopId: string
    currentUserId: string
}

const roleColors = {
    cashier: 'bg-blue-100 text-blue-700 border-blue-200',
    supervisor: 'bg-green-100 text-green-700 border-green-200',
    manager: 'bg-purple-100 text-purple-700 border-purple-200',
    administrator: 'bg-orange-100 text-orange-700 border-orange-200',
}

const roleLabels = {
    cashier: 'Cashier',
    supervisor: 'Supervisor',
    manager: 'Manager',
    administrator: 'Administrator',
}

export function StaffListQC({ staff, shopId, currentUserId }: StaffListQCProps) {
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)

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

    const handleEditClick = (member: StaffMember) => {
        setSelectedStaff(member)
        setEditDialogOpen(true)
    }

    return (
        <>
            <div className="space-y-4">
                {/* Desktop Table View */}
                <Card className="hidden md:block">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Staff Member</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Role</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Joined</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
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
                                                    <div>
                                                        <div className="font-medium text-slate-900">{member.name}</div>
                                                        <div className="flex flex-col gap-0.5">
                                                            {member.email && (
                                                                <div className="text-sm text-slate-500 flex items-center gap-1">
                                                                    <Mail className="h-3 w-3" />
                                                                    {member.email}
                                                                </div>
                                                            )}
                                                            {member.phone && (
                                                                <div className="text-sm text-slate-500 flex items-center gap-1">
                                                                    <Phone className="h-3 w-3" />
                                                                    {member.phone}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                {member.quick_checkout_role && (
                                                    <Badge
                                                        variant="outline"
                                                        className={roleColors[member.quick_checkout_role as keyof typeof roleColors] || 'bg-slate-100 text-slate-700'}
                                                    >
                                                        <Shield className="h-3 w-3 mr-1" />
                                                        {roleLabels[member.quick_checkout_role as keyof typeof roleLabels] || member.quick_checkout_role}
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="py-4 px-4">
                                                {!member.is_active ? (
                                                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                                        <UserX className="h-3 w-3 mr-1" />
                                                        Inactive
                                                    </Badge>
                                                ) : member.accepted_at ? (
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
                                            </td>
                                            <td className="py-4 px-4 text-sm text-slate-600">
                                                {formatDistanceToNow(new Date(member.created_at), { addSuffix: true })}
                                            </td>
                                            <td className="py-4 px-4">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEditClick(member)}
                                                >
                                                    <Edit className="h-3 w-3 mr-1" />
                                                    Manage
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                    {staff.map((member) => (
                        <Card key={member.id} className="overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                        <User className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-slate-900 truncate">{member.name}</div>
                                        {member.email && (
                                            <div className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                                                <Mail className="h-3 w-3 flex-shrink-0" />
                                                <span className="truncate">{member.email}</span>
                                            </div>
                                        )}
                                        {member.phone && (
                                            <div className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                                                <Phone className="h-3 w-3 flex-shrink-0" />
                                                <span className="truncate">{member.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-3">
                                    {member.quick_checkout_role && (
                                        <Badge
                                            variant="outline"
                                            className={roleColors[member.quick_checkout_role as keyof typeof roleColors] || 'bg-slate-100 text-slate-700'}
                                        >
                                            <Shield className="h-3 w-3 mr-1" />
                                            {roleLabels[member.quick_checkout_role as keyof typeof roleLabels] || member.quick_checkout_role}
                                        </Badge>
                                    )}
                                    {!member.is_active ? (
                                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                            <UserX className="h-3 w-3 mr-1" />
                                            Inactive
                                        </Badge>
                                    ) : member.accepted_at ? (
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

                                <div className="text-xs text-slate-500 mb-3">
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Joined {formatDistanceToNow(new Date(member.created_at), { addSuffix: true })}
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => handleEditClick(member)}
                                >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Manage Permissions & Role
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Edit Dialog with Permission Editor */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Manage {selectedStaff?.name}</DialogTitle>
                    </DialogHeader>
                    {selectedStaff && (
                        <PermissionEditor
                            staffId={selectedStaff.id}
                            staffName={selectedStaff.name}
                            currentRole={selectedStaff.quick_checkout_role as any}
                            shopId={shopId}
                            onClose={() => setEditDialogOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
