import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from './settings-form'

export default async function ShopSettingsPage({
    params,
}: {
    params: Promise<{ shopId: string }>
}) {
    const { shopId } = await params
    const supabase = await createClient()

    const { data: shop } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .single()

    if (!shop) {
        return <div>Shop not found</div>
    }

    return (
        <div className="flex-1 w-full overflow-y-auto bg-slate-50/50">
            <div className="max-w-4xl mx-auto py-8 px-8">
                <SettingsForm shop={shop} />
            </div>
        </div>
    )
}
