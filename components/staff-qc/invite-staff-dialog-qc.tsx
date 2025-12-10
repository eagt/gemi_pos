'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import { toast } from 'sonner'
import { inviteQuickCheckoutStaff } from '@/app/dashboard/shops/[shopId]/staff-qc/actions'
import { QuickCheckoutRole } from '@/lib/permissions/quick-checkout-permissions'

const ROLE_LABELS: Record<QuickCheckoutRole, string> = {
    cashier: 'Cashier',
    supervisor: 'Supervisor',
    manager: 'Manager',
    administrator: 'Administrator'
}

const ROLE_DESCRIPTIONS: Record<QuickCheckoutRole, string> = {
    cashier: 'Basic sales and customer service',
    supervisor: 'Sales + inventory management + reports',
    manager: 'Full operations + staff management',
    administrator: 'Complete system access and control'
}

interface InviteStaffDialogQCProps {
    shopId: string
}

export function InviteStaffDialogQC({ shopId }: InviteStaffDialogQCProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showCredentials, setShowCredentials] = useState(false)
    const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'cashier' as QuickCheckoutRole
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name || !formData.email) {
            toast.error('Name and email are required')
            return
        }

        setLoading(true)
        try {
            const result = await inviteQuickCheckoutStaff(
                shopId,
                formData.name,
                formData.email,
                formData.phone || null,
                formData.role
            )

            if (result.error) {
                toast.error(result.error)
            } else if (result.credentials) {
                setCredentials(result.credentials)
                setShowCredentials(true)
                setOpen(false)
                setFormData({ name: '', email: '', phone: '', role: 'cashier' })
            } else {
                toast.success('Staff member invited successfully!')
                setOpen(false)
                setFormData({ name: '', email: '', phone: '', role: 'cashier' })
            }
        } catch (error) {
            toast.error('Failed to invite staff member')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Invite Staff
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Invite Staff Member</DialogTitle>
                        <DialogDescription>
                            Add a new team member and assign their role. They'll receive an invitation to join.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="John Doe"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="john@example.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number (Optional)</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+1 (555) 123-4567"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Role *</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value) => setFormData({ ...formData, role: value as QuickCheckoutRole })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {(Object.keys(ROLE_LABELS) as QuickCheckoutRole[]).map((role) => (
                                        <SelectItem key={role} value={role}>
                                            <div className="flex flex-col items-start">
                                                <span className="font-medium">{ROLE_LABELS[role]}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {ROLE_DESCRIPTIONS[role]}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                className="flex-1"
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-purple-600 hover:bg-purple-700"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Inviting...
                                    </>
                                ) : (
                                    'Send Invitation'
                                )}
                            </Button>
                        </div>
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
        </>
    )
}
