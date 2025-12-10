import { Settings } from 'lucide-react'

export default function SettingsPage() {
    return (
        <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 rounded-full bg-purple-100 p-6">
                <Settings className="h-12 w-12 text-purple-600" />
            </div>
            <h1 className="mb-2 text-2xl font-bold">Settings</h1>
            <p className="mb-8 text-slate-500 max-w-md">
                Global account settings and preferences are coming soon.
            </p>
        </div>
    )
}
