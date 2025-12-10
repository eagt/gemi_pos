'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ChevronDown, Search, Shield, Check, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
    QuickCheckoutRole,
    ALL_PERMISSIONS,
    PERMISSION_CATEGORIES,
    getPermissionsByCategory,
    roleHasPermission,
} from '@/lib/permissions/quick-checkout-permissions'
import {
    getStaffPermissions,
    updateStaffRole,
    togglePermission,
} from '@/app/dashboard/shops/[shopId]/staff-qc/actions'

interface PermissionEditorProps {
    staffId: string
    staffName: string
    currentRole: QuickCheckoutRole
    shopId: string
    onClose: () => void
}

const ROLE_LABELS: Record<QuickCheckoutRole, string> = {
    cashier: 'Cashier',
    supervisor: 'Supervisor',
    manager: 'Manager',
    administrator: 'Administrator'
}

export function PermissionEditor({
    staffId,
    staffName,
    currentRole,
    shopId,
    onClose
}: PermissionEditorProps) {
    const [role, setRole] = useState<QuickCheckoutRole>(currentRole)
    const [overrides, setOverrides] = useState<Record<string, boolean>>({})
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [openCategories, setOpenCategories] = useState<string[]>([])

    const permissionsByCategory = getPermissionsByCategory()

    // Load current permissions
    useEffect(() => {
        async function loadPermissions() {
            setLoading(true)
            try {
                const data = await getStaffPermissions(staffId)
                if (data.role) {
                    setRole(data.role)
                }
                const overrideMap: Record<string, boolean> = {}
                data.overrides.forEach((override: any) => {
                    overrideMap[override.permission_key] = override.is_granted
                })
                setOverrides(overrideMap)
            } catch (error) {
                toast.error('Failed to load permissions')
            } finally {
                setLoading(false)
            }
        }
        loadPermissions()
    }, [staffId])

    const handleRoleChange = async (newRole: QuickCheckoutRole) => {
        setSaving(true)
        try {
            const result = await updateStaffRole(shopId, staffId, newRole)
            if (result.error) {
                toast.error(result.error)
            } else {
                setRole(newRole)
                toast.success('Role updated successfully')
            }
        } catch (error) {
            toast.error('Failed to update role')
        } finally {
            setSaving(false)
        }
    }

    const handlePermissionToggle = async (permissionKey: string, isGranted: boolean) => {
        setSaving(true)
        try {
            const result = await togglePermission(shopId, staffId, permissionKey, isGranted)
            if (result.error) {
                toast.error(result.error)
            } else {
                setOverrides(prev => ({ ...prev, [permissionKey]: isGranted }))
                toast.success('Permission updated')
            }
        } catch (error) {
            toast.error('Failed to update permission')
        } finally {
            setSaving(false)
        }
    }

    const getPermissionState = (permissionKey: string) => {
        // Check if there's an override
        if (permissionKey in overrides) {
            return {
                granted: overrides[permissionKey],
                source: 'individual' as const
            }
        }
        // Fall back to role permission
        return {
            granted: roleHasPermission(role, permissionKey),
            source: 'role' as const
        }
    }

    const toggleCategory = (category: string) => {
        setOpenCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        )
    }

    const filteredPermissions = ALL_PERMISSIONS.filter(p =>
        p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Role Selector */}
            <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={handleRoleChange} disabled={saving}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {(Object.keys(ROLE_LABELS) as QuickCheckoutRole[]).map((r) => (
                            <SelectItem key={r} value={r}>
                                {ROLE_LABELS[r]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                    Changing the role will update default permissions. Individual overrides will be preserved.
                </p>
            </div>

            <Separator />

            {/* Search */}
            <div className="space-y-2">
                <Label>Search Permissions</Label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search by name or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Permission Categories */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>Permissions ({filteredPermissions.length})</Label>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOpenCategories(Object.keys(PERMISSION_CATEGORIES))}
                        >
                            Expand All
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOpenCategories([])}
                        >
                            Collapse All
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    {Object.entries(permissionsByCategory).map(([category, permissions]) => {
                        const visiblePerms = permissions.filter(p =>
                            filteredPermissions.some(fp => fp.key === p.key)
                        )

                        if (visiblePerms.length === 0) return null

                        const isOpen = openCategories.includes(category)
                        const categoryInfo = PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES]

                        return (
                            <Collapsible
                                key={category}
                                open={isOpen}
                                onOpenChange={() => toggleCategory(category)}
                            >
                                <CollapsibleTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-between h-auto py-3"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4" />
                                            <span className="font-semibold">{categoryInfo.label}</span>
                                            <Badge variant="secondary" className="ml-2">
                                                {visiblePerms.length}
                                            </Badge>
                                        </div>
                                        <ChevronDown
                                            className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''
                                                }`}
                                        />
                                    </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-2 space-y-2 pl-4">
                                    {visiblePerms.map((permission) => {
                                        const state = getPermissionState(permission.key)
                                        const isOverridden = permission.key in overrides

                                        return (
                                            <div
                                                key={permission.key}
                                                className="flex items-start justify-between p-3 rounded-lg border bg-white hover:bg-slate-50 transition-colors"
                                            >
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium text-sm">
                                                            {permission.label}
                                                        </span>
                                                        {state.source === 'role' && (
                                                            <Badge variant="outline" className="text-xs">
                                                                From Role
                                                            </Badge>
                                                        )}
                                                        {isOverridden && (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                                                            >
                                                                Custom
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {permission.description}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {state.granted ? (
                                                        <Check className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <X className="h-4 w-4 text-red-600" />
                                                    )}
                                                    <Switch
                                                        checked={state.granted}
                                                        onCheckedChange={(checked) =>
                                                            handlePermissionToggle(permission.key, checked)
                                                        }
                                                        disabled={saving}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </CollapsibleContent>
                            </Collapsible>
                        )
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={onClose}>
                    Close
                </Button>
            </div>
        </div>
    )
}
