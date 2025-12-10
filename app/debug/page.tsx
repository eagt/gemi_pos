
import { createClient } from '@/lib/supabase/server'

export default async function DebugPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Not logged in</div>

    const { data: selections, error } = await supabase
        .from('staff_shop_selections')
        .select('*')

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Debug: Staff Shop Selections</h1>
            <pre className="bg-slate-100 p-4 rounded overflow-auto">
                {JSON.stringify({ user_id: user.id, selections, error }, null, 2)}
            </pre>
        </div>
    )
}
