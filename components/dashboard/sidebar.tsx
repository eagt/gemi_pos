'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ShoppingBag, LayoutDashboard, Package, ShoppingCart, BarChart3, Settings, LogOut, Store } from 'lucide-react'
import { toast } from 'sonner'

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        toast.success('Logged out successfully')
        router.push('/login')
        router.refresh()
    }

    const navItems = [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/dashboard/shops', icon: Store, label: 'Shops' },
        { href: '/dashboard/products', icon: Package, label: 'Products' },
        { href: '/dashboard/orders', icon: ShoppingCart, label: 'Orders' },
        { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
        { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
    ]

    return (
        <div className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
            {/* Logo */}
            <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6">
                <ShoppingBag className="h-6 w-6 text-purple-600" />
                <span className="text-xl font-bold text-slate-900">SimplePOS</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-4">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
                                    ? 'bg-purple-50 text-purple-700'
                                    : 'text-slate-700 hover:bg-slate-100'
                                }`}
                        >
                            <Icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            {/* Logout */}
            <div className="border-t border-slate-200 p-4">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-slate-700 hover:bg-slate-100"
                    onClick={handleLogout}
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Logout
                </Button>
            </div>
        </div>
    )
}
