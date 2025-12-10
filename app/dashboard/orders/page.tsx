import { ShoppingCart } from 'lucide-react'

export default function OrdersPage() {
    return (
        <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 rounded-full bg-purple-100 p-6">
                <ShoppingCart className="h-12 w-12 text-purple-600" />
            </div>
            <h1 className="mb-2 text-2xl font-bold">Orders History</h1>
            <p className="mb-8 text-slate-500 max-w-md">
                To view orders, please open a specific shop from the Shops page.
                Global order history is coming soon.
            </p>
        </div>
    )
}
