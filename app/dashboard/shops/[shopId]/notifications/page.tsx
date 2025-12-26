import { NotificationsList } from '@/components/notifications/notifications-list'

export default async function NotificationsPage({
    params,
}: {
    params: Promise<{ shopId: string }>
}) {
    const { shopId } = await params

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="p-6 border-b border-slate-200 bg-white">
                <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
                <p className="text-slate-500">Manage clock-in requests and authorizations.</p>
            </div>
            <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
                <NotificationsList shopId={shopId} />
            </div>
        </div>
    )
}
