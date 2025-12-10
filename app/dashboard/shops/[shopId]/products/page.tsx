import { createClient } from '@/lib/supabase/server'
import { AddProductDialog } from './add-product-dialog'
import { ProductRow } from './product-row'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Package } from 'lucide-react'
import { hasPermission, MANAGE_PRODUCTS_PERMISSION } from '@/lib/permissions/permission-checker'

export default async function ShopProductsPage({
    params,
}: {
    params: Promise<{ shopId: string }>
}) {
    const { shopId } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    // Get shop and user's staff role
    const { data: shop } = await supabase
        .from('shops')
        .select('business_type')
        .eq('id', shopId)
        .single()

    const { data: staffMember } = await supabase
        .from('shop_staff')
        .select('role, quick_checkout_role, permission_overrides')
        .eq('shop_id', shopId)
        .eq('user_id', user?.id)
        .single()

    // Check if user can manage products
    const canManageProducts = staffMember && shop ? hasPermission(
        shop.business_type,
        staffMember.role,
        staffMember.quick_checkout_role,
        MANAGE_PRODUCTS_PERMISSION,
        staffMember.permission_overrides as Record<string, boolean> | null
    ) : false

    const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })

    return (
        <div className="h-full flex flex-col p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Products</h1>
                    <p className="text-slate-500">Manage your inventory</p>
                </div>
                {canManageProducts && <AddProductDialog shopId={shopId} />}
            </div>

            <div className="rounded-md border border-slate-200 bg-white">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="font-bold text-slate-900">Name</TableHead>
                            <TableHead className="font-bold text-slate-900">Category</TableHead>
                            <TableHead className="font-bold text-slate-900">Price</TableHead>
                            <TableHead className="font-bold text-slate-900">Stock</TableHead>
                            <TableHead className="font-bold text-slate-900">Status</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products?.map((product) => (
                            <ProductRow
                                key={product.id}
                                product={product}
                                shopId={shopId}
                                canManage={canManageProducts}
                            />
                        ))}
                        {products?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                    No products found. {canManageProducts ? 'Add your first product to get started.' : 'No products available.'}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
