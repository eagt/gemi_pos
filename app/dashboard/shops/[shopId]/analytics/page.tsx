import { BarChart3 } from 'lucide-react'

export default function AnalyticsPage() {
    return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Analytics Coming Soon</h1>
            <p className="text-slate-500 max-w-md">
                We're building powerful insights to help you track sales, inventory turnover, and more. Stay tuned!
            </p>
        </div>
    )
}
