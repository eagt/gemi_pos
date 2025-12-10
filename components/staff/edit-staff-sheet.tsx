'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Shield, UserX, Loader2 } from 'lucide-react'
import { StaffRole } from '@/lib/types/database.types'
import { updateStaffRole, deactivateStaffMember } from '../../app/dashboard/shops/[shopId]/settings/staff/actions'
import { toast } from 'sonner'

interface EditStaffSheetProps {
    staff: {
        id: string
        name: string
        role: string
        email: string | null
    } | null
    shopId: string
    businessType: string
    open: boolean
    onOpenChange: (open: boolean) => void
    onUpdate?: () => void
}

export function EditStaffSheet({ staff, shopId, businessType, open, onOpenChange, onUpdate }: EditStaffSheetProps) {
    const [selectedRole, setSelectedRole] = useState<StaffRole>(staff?.role as StaffRole || 'waiter')
    const [loading, setLoading] = useState(false)
    const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)
    const [deactivating, setDeactivating] = useState(false)

    // Update selectedRole when staff changes
    useEffect(() => {
        if (staff) {
            setSelectedRole(staff.role as StaffRole)
        }
    }, [staff?.id]) // Only update when staff ID changes

    const handleSaveRole = async () => {
        if (!staff) return
        setLoading(true)
        try {
            await updateStaffRole(shopId, staff.id, selectedRole)
            toast.success('Role updated successfully!')
            onUpdate?.()
            onOpenChange(false)
        } catch (error) {
            toast.error('Failed to update role')
        } finally {
            setLoading(false)
        }
    }

    const handleDeactivate = async () => {
        if (!staff) return
        setDeactivating(true)
        try {
            await deactivateStaffMember(shopId, staff.id)
            toast.success(`${staff.name} has been removed from this shop`)
            onUpdate?.()
            onOpenChange(false)
            setDeactivateDialogOpen(false)
        } catch (error) {
            toast.error('Failed to deactivate staff member')
        } finally {
            setDeactivating(false)
        }
    }

    // Determine available roles based on business type
    const availableRoles: { value: StaffRole; label: string }[] = businessType === 'table_order'
        ? [
            { value: 'manager', label: 'Manager' },
            { value: 'waiter', label: 'Waiter' },
            { value: 'chef', label: 'Chef' },
            { value: 'runner', label: 'Runner' },
        ]
        : [
            { value: 'manager', label: 'Manager' },
            { value: 'waiter', label: 'Cashier' },
        ]

    if (!staff) return null

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Staff Member</DialogTitle>
                        <DialogDescription>
                            Manage settings for {staff.name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-6">
                        {/* Change Role Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
                                <Shield className="h-5 w-5 text-blue-600" />
                                <h3>Change Role</h3>
                            </div>
                            <p className="text-sm text-slate-500">
                                Modify permissions and access levels.
                            </p>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as StaffRole)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableRoles.map((role) => (
                                            <SelectItem key={role.value} value={role.value}>
                                                {role.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    onClick={handleSaveRole}
                                    disabled={loading || selectedRole === staff.role}
                                    className="w-full mt-2"
                                    style={{ backgroundColor: '#9333EA' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7E22CE'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#9333EA'}
                                >
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Role
                                </Button>
                            </div>
                        </div>

                        <Separator />

                        {/* Deactivate User Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-base font-semibold text-red-600">
                                <UserX className="h-5 w-5" />
                                <h3>Deactivate User</h3>
                            </div>
                            <p className="text-sm text-slate-500">
                                Remove this user's access to the shop. This action can be undone later.
                            </p>
                            <Button
                                onClick={() => setDeactivateDialogOpen(true)}
                                variant="destructive"
                                className="w-full"
                            >
                                <UserX className="mr-2 h-4 w-4" />
                                Deactivate User
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Deactivation Confirmation Dialog */}
            <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove <strong>{staff?.name}</strong> from this shop. They will lose access to this shop's POS system, but their account will remain active for other shops they belong to.
                            <br /><br />
                            You can re-invite them later if needed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deactivating}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                handleDeactivate()
                            }}
                            disabled={deactivating}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deactivating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Deactivate
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
