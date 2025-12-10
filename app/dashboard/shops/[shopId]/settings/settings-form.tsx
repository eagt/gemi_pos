'use client'

import { useState } from 'react'
import { updateShopSettings, deleteShop } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SettingsSection } from './components/settings-section'
import { SettingsCard } from './components/settings-card'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Loader2, Save, Trash2 } from 'lucide-react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export function SettingsForm({ shop }: { shop: any }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const settings = shop.settings || {}

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)

        const result = await updateShopSettings(shop.id, formData)

        if (result?.error) {
            toast.error('Failed to update settings')
        } else {
            toast.success('Settings updated successfully')
        }
        setLoading(false)
    }

    const handleDelete = async () => {
        const result = await deleteShop(shop.id)
        if (result?.error) {
            toast.error('Failed to delete business')
        } else {
            toast.success('Business deleted')
            router.push('/dashboard/shops')
        }
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto pb-8">
            <div className="flex items-center justify-between mb-8 sticky top-0 bg-slate-50 py-4 z-10 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold">Business Settings</h1>
                    <p className="text-slate-500">Manage your business preferences</p>
                </div>
                <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </div>

            <SettingsSection title="General" description="Basic information about your business">
                <SettingsCard title="Business Details">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Business Name</Label>
                            <Input id="name" name="name" defaultValue={shop.name} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Select name="currency" defaultValue={shop.currency || 'GBP'}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="GBP">British Pound (£)</SelectItem>
                                    <SelectItem value="USD">US Dollar ($)</SelectItem>
                                    <SelectItem value="EUR">Euro (€)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="timezone">Time Zone</Label>
                            <Select name="timezone" defaultValue={shop.timezone || 'Europe/London'}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select timezone" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                                    <SelectItem value="America/New_York">New York (EST)</SelectItem>
                                    <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </SettingsCard>
            </SettingsSection>

            <SettingsSection title="Location & Contact" description="Where can customers find you?">
                <SettingsCard title="Contact Information">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea id="address" name="address" defaultValue={shop.address || ''} placeholder="123 High Street..." />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" name="phone" defaultValue={shop.phone || ''} type="tel" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" defaultValue={shop.email || ''} type="email" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="website">Website</Label>
                                <Input id="website" name="website" defaultValue={shop.website || ''} type="url" placeholder="https://..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="instagram">Instagram</Label>
                                <Input id="instagram" name="instagram" defaultValue={shop.instagram || ''} placeholder="@myshop" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tiktok">TikTok</Label>
                                <Input id="tiktok" name="tiktok" defaultValue={shop.tiktok || ''} placeholder="@myshop" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="x_handle">X (Twitter)</Label>
                                <Input id="x_handle" name="x_handle" defaultValue={shop.x_handle || ''} placeholder="@myshop" />
                            </div>
                        </div>
                    </div>
                </SettingsCard>
            </SettingsSection>

            <SettingsSection title="Sales & Receipts" description="Customize your checkout experience">
                <SettingsCard title="Receipt Customization">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="receiptHeader">Receipt Header</Label>
                            <Input id="receiptHeader" name="receiptHeader" defaultValue={settings.receiptHeader || ''} placeholder="Thank you for shopping!" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="receiptFooter">Receipt Footer</Label>
                            <Input id="receiptFooter" name="receiptFooter" defaultValue={settings.receiptFooter || ''} placeholder="No returns after 30 days" />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="showTaxOnReceipt" className="flex-1">Show Tax on Receipt</Label>
                            <Switch id="showTaxOnReceipt" name="showTaxOnReceipt" defaultChecked={settings.showTaxOnReceipt !== false} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="showContactOnReceipt" className="flex-1">Show Contact Info on Receipt</Label>
                            <Switch id="showContactOnReceipt" name="showContactOnReceipt" defaultChecked={settings.showContactOnReceipt !== false} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="autoPrintReceipt" className="flex-1">Auto-print Receipt</Label>
                            <Switch id="autoPrintReceipt" name="autoPrintReceipt" defaultChecked={settings.autoPrintReceipt === true} />
                        </div>
                    </div>
                </SettingsCard>
            </SettingsSection>

            <SettingsSection title="Pricing & Inventory" description="Control how you sell">
                <SettingsCard title="Rules">
                    <div className="grid gap-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="allowDiscounts" className="flex-1">Allow Discounts</Label>
                            <Switch id="allowDiscounts" name="allowDiscounts" defaultChecked={settings.allowDiscounts !== false} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="allowPriceOverride" className="flex-1">Allow Price Override</Label>
                            <Switch id="allowPriceOverride" name="allowPriceOverride" defaultChecked={settings.allowPriceOverride === true} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="enableStockManagement" className="flex-1">Enable Stock Management</Label>
                            <Switch id="enableStockManagement" name="enableStockManagement" defaultChecked={settings.enableStockManagement !== false} />
                        </div>
                    </div>
                </SettingsCard>
            </SettingsSection>

            <SettingsSection title="Payments" description="Accepted payment methods">
                <SettingsCard title="Payment Options">
                    <div className="grid gap-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="enableCash" className="flex-1">Accept Cash</Label>
                            <Switch id="enableCash" name="enableCash" defaultChecked={settings.enableCash !== false} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="enableCard" className="flex-1">Accept Card</Label>
                            <Switch id="enableCard" name="enableCard" defaultChecked={settings.enableCard !== false} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="enableTipping" className="flex-1">Enable Tipping</Label>
                            <Switch id="enableTipping" name="enableTipping" defaultChecked={settings.enableTipping === true} />
                        </div>
                    </div>
                </SettingsCard>
            </SettingsSection>

            <SettingsSection title="Staff & Permissions" description="Manage access control">
                <SettingsCard title="Security">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="idle_timeout_minutes">Idle Timeout (Auto-Logout)</Label>
                            <Select name="idle_timeout_minutes" defaultValue={String(shop.idle_timeout_minutes || 5)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select timeout" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="3">3 Minutes</SelectItem>
                                    <SelectItem value="5">5 Minutes (Default)</SelectItem>
                                    <SelectItem value="7">7 Minutes</SelectItem>
                                    <SelectItem value="10">10 Minutes</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-slate-500">
                                Automatically log out inactive staff after this period. (Disabled for Chefs in restaurants)
                            </p>
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="requirePinToOpen" className="flex-1">Require PIN to Open POS</Label>
                            <Switch id="requirePinToOpen" name="requirePinToOpen" defaultChecked={settings.requirePinToOpen === true} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="staffCanDeleteItems" className="flex-1">Staff Can Delete Items from Cart</Label>
                            <Switch id="staffCanDeleteItems" name="staffCanDeleteItems" defaultChecked={settings.staffCanDeleteItems !== false} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="staffCanVoidOrders" className="flex-1">Staff Can Void Orders</Label>
                            <Switch id="staffCanVoidOrders" name="staffCanVoidOrders" defaultChecked={settings.staffCanVoidOrders === true} />
                        </div>
                    </div>
                </SettingsCard>
            </SettingsSection>

            <SettingsSection title="Danger Zone" description="Irreversible actions">
                <SettingsCard title="Delete Business" danger>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="font-medium text-red-600">Delete this business</p>
                            <p className="text-sm text-slate-500">Once you delete a business, there is no going back. Please be certain.</p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Business
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your business
                                        and remove all associated data including products and orders.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                                        Delete Business
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </SettingsCard>
            </SettingsSection>
        </form>
    )
}
