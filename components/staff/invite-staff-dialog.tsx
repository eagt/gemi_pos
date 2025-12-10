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
}

export function InviteStaffDialog({ shopId }: InviteStaffDialogProps) {
    const { staff } = useStaffSession()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showCredentials, setShowCredentials] = useState(false)
    const [showExistingUserSuccess, setShowExistingUserSuccess] = useState(false)
    const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [role, setRole] = useState<StaffRole>('waiter')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Pass the clocked-in staff's ID as the inviter
            const result = await inviteStaff(shopId, name, email, role, staff?.id)

            if (result.error) {
                toast.error(result.error)
            } else if (result.credentials) {
                setCredentials(result.credentials)
                setShowCredentials(true)
                setOpen(false)
                setName('')
                setEmail('')
                setRole('waiter')
            } else if (result.existingUser) {
                setShowExistingUserSuccess(true)
                setOpen(false)
                setName('')
                setEmail('')
                setRole('waiter')
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
                                <Select value={role} onValueChange={(v) => setRole(v as StaffRole)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="manager">Manager</SelectItem>
                                        <SelectItem value="waiter">Waiter</SelectItem>
                                        <SelectItem value="chef">Chef</SelectItem>
                                        <SelectItem value="runner">Runner</SelectItem>
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
        </>
    )
}
