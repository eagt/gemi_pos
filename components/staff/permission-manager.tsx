'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Shield, Lock, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateStaffPermissions } from '@/app/dashboard/shops/[shopId]/settings/staff/permission-actions'
import { MANAGE_PRODUCTS_PERMISSION, canTogglePermission, getDefaultPermissionState } from '@/lib/permissions/permission-checker'

interface PermissionManagerProps {
    shopId: string
    staffId: string
    staffName: string
    role: string
    quickCheckoutRole: string | null
    businessType: 'quick_checkout' | 'table_order'
    permissionOverrides: Record<string, boolean> | null
    canManage: boolean
}

export function PermissionManager({
    shopId,
    staffId,
    staffName,
    role,
    quickCheckoutRole,
    businessType,
    permissionOverrides,
    canManage
}: PermissionManagerProps) {
    const [manageProducts, setManageProducts] = useState(() => {
        // Check if there's an override
        if (permissionOverrides && MANAGE_PRODUCTS_PERMISSION in permissionOverrides) {
            return permissionOverrides[MANAGE_PRODUCTS_PERMISSION]
        }
        // Otherwise use default
        return getDefaultPermissionState(businessType, role, quickCheckoutRole, MANAGE_PRODUCTS_PERMISSION)
    })

    const [saving, setSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    const defaultState = getDefaultPermissionState(businessType, role, quickCheckoutRole, MANAGE_PRODUCTS_PERMISSION)
    const canToggle = canTogglePermission(businessType, role, quickCheckoutRole, MANAGE_PRODUCTS_PERMISSION)
    const isDisabled = !canManage || !canToggle

    const handleToggle = (checked: boolean) => {
        setManageProducts(checked)
        setHasChanges(checked !== defaultState)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const result = await updateStaffPermissions(
                shopId,
                staffId,
                MANAGE_PRODUCTS_PERMISSION,
                manageProducts
            )

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Permissions updated successfully')
                setHasChanges(false)
            }
        } catch (error) {
            toast.error('Failed to update permissions')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-purple-600" />
                        <CardTitle>Permissions: {staffName}</CardTitle>
                    </div>
                    {hasChanges && (
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    )}
                </div>
                <CardDescription>
                    Manage permissions for this staff member
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="manage-products" className="text-sm font-medium">
                                    Manage Products
                                </Label>
                                {!canToggle && (
                                    <Lock className="h-4 w-4 text-slate-400" />
                                )}
                            </div>
                            <p className="text-sm text-slate-500 mt-1">
                                Ability to create, edit, and delete products
                            </p>
                            {!canManage && (
                                <p className="text-xs text-amber-600 mt-1">
                                    You don't have permission to change this setting
                                </p>
                            )}
                            {!canToggle && canManage && (
                                <p className="text-xs text-slate-500 mt-1">
                                    This permission is always {defaultState ? 'enabled' : 'disabled'} for this role
                                </p>
                            )}
                        </div>
                        <Switch
                            id="manage-products"
                            checked={manageProducts}
                            onCheckedChange={handleToggle}
                            disabled={isDisabled}
                        />
                    </div>

                    {hasChanges && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-sm text-blue-800">
                                You have unsaved changes. Click "Save Changes" to apply them.
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
