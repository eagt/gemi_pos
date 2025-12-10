import { BarChart3 } from 'lucide-react'

export default function AnalyticsPage() {
    return (
        <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 rounded-full bg-purple-100 p-6">
                <BarChart3 className="h-12 w-12 text-purple-600" />
            </div>
            <h1 className="mb-2 text-2xl font-bold">Analytics & Reports</h1>
            <p className="mb-8 text-slate-500 max-w-md">
                Detailed sales analytics and reporting features are currently under development.
            </p>
        </div>
    )
}
