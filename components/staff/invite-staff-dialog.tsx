'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2 } from 'lucide-react'
import { inviteStaff } from '@/app/dashboard/shops/[shopId]/settings/staff/actions'
import { toast } from 'sonner'
import { StaffRole } from '@/lib/types/database.types'
import { useStaffSession } from '@/components/staff/staff-session-provider'

interface InviteStaffDialogProps {
    shopId: string
    businessType?: 'quick_checkout' | 'table_order'
}

const roleDescriptions: Record<string, string> = {
    // Quick Checkout roles
    manager: 'Full Access',
    administrator: 'Full Access',
    supervisor: 'Sales & Management',
    cashier: 'Sales & Service',

    // Restaurant roles
    waiter: 'Orders & Payments',
    chef: 'Kitchen Orders',
    runner: 'Table Service',
}

export function InviteStaffDialog({ shopId, businessType = 'quick_checkout' }: InviteStaffDialogProps) {
    const { staff } = useStaffSession()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showCredentials, setShowCredentials] = useState(false)
    const [showAlreadyMember, setShowAlreadyMember] = useState(false)
    const [showExistingUserSuccess, setShowExistingUserSuccess] = useState(false)
    const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')

    // Define available roles based on business type (Alphabetical order)
    const availableRoles = businessType === 'table_order'
        ? ['chef', 'manager', 'runner', 'waiter']
        : ['administrator', 'cashier', 'manager', 'supervisor']

    // Default to the first role in the alphabetized list
    const [role, setRole] = useState<string>(availableRoles[0])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Pass the clocked-in staff's ID as the inviter
            const result = await inviteStaff(shopId, name, email, role, staff?.id, businessType)

            if (result.error) {
                if (result.error === 'User is already a staff member') {
                    // Specific handling for existing member
                    setShowAlreadyMember(true)
                    setOpen(false)
                    setName('')
                    setEmail('')
                    setRole(availableRoles[0])
                } else {
                    toast.error(result.error)
                }
            } else if (result.credentials) {
                setCredentials(result.credentials)
                setShowCredentials(true)
                setOpen(false)
                setName('')
                setEmail('')
                setRole(availableRoles[0])
            } else if (result.existingUser) {
                setShowExistingUserSuccess(true)
                setOpen(false)
                setName('')
                setEmail('')
                setRole(availableRoles[0])
            }
        } catch (error) {
            toast.error('Failed to invite staff')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                {/* ... existing dialog content ... */}
                <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Invite Staff
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Invite Staff Member</DialogTitle>
                        <DialogDescription>
                            Send an invitation to a new staff member. They will need to accept it and set a PIN.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="role">Role</Label>
                                <Select value={role} onValueChange={(v) => setRole(v)}>
                                    <SelectTrigger className="h-12 bg-white">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableRoles.map(r => (
                                            <SelectItem key={r} value={r} textValue={r} className="py-2 cursor-pointer">
                                                <div className="flex flex-col items-start gap-0.5">
                                                    <span className="font-semibold capitalize text-slate-900">{r}</span>
                                                    <span className="text-xs text-slate-500 font-normal">
                                                        {roleDescriptions[r] || 'Staff member'}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send Invitation
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Credentials Success Modal */}
            <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-green-600">✓ Staff Invited Successfully!</DialogTitle>
                        <DialogDescription>
                            The staff member can now log in with these credentials
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                            <div>
                                <Label className="text-xs text-slate-600">Email</Label>
                                <div className="font-mono text-sm mt-1">{credentials?.email}</div>
                            </div>
                            <div>
                                <Label className="text-xs text-slate-600">Temporary Password</Label>
                                <div className="font-mono text-sm mt-1 bg-white p-2 rounded border">
                                    {credentials?.password}
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-amber-600">
                            ⚠️ Make sure to share these credentials with the staff member. They can log in immediately.
                        </p>
                        <Button
                            onClick={() => {
                                if (credentials) {
                                    navigator.clipboard.writeText(`Email: ${credentials.email}\nPassword: ${credentials.password}`)
                                    toast.success('Credentials copied to clipboard!')
                                }
                            }}
                            variant="outline"
                            className="w-full"
                        >
                            Copy Credentials
                        </Button>
                        <Button
                            onClick={() => setShowCredentials(false)}
                            className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                            Done
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Existing User Success Modal */}
            <Dialog open={showExistingUserSuccess} onOpenChange={setShowExistingUserSuccess}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-green-600">✓ Invitation Sent Successfully!</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                            <p className="text-green-800 font-medium">
                                This person already has an account.
                            </p>
                            <p className="text-green-700 text-sm mt-1">
                                They will receive an email to log in and set their PIN for your shop.
                            </p>
                        </div>
                        <Button
                            onClick={() => setShowExistingUserSuccess(false)}
                            className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                            Done
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Already Member Modal */}
            <Dialog open={showAlreadyMember} onOpenChange={setShowAlreadyMember}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Notice</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                        <p className="text-slate-700">
                            This User is already a member. Check the details and try again.
                        </p>
                        <Button
                            onClick={() => setShowAlreadyMember(false)}
                            variant="outline"
                            className="w-full"
                        >
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
