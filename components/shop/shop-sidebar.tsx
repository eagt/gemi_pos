'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Store, Package, ShoppingCart, Settings, Bell, BarChart3, User, LogOut, LayoutGrid, X, Users, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { useStaffStore } from '@/store/staff-store'

interface ShopSidebarProps {
    shopId: string
    shopName?: string
    businessType?: string
    alertCounts: {
        outOfStock: number
        lowStock: number
    }
    userRole?: string | null
    restaurantRole?: string | null
    quickCheckoutRole?: string | null
}

export function ShopSidebar({ shopId, shopName = 'SimplePOS', businessType, alertCounts, restaurantRole: propRestaurantRole, quickCheckoutRole: propQuickCheckoutRole }: ShopSidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [hasSupabaseSession, setHasSupabaseSession] = useState(false)
    const [pendingNotificationsCount, setPendingNotificationsCount] = useState(0)

    const staffSession = useStaffStore((state) => state.session)

    // Use roles from props (server-side) or store (client-side staff login)
    // Priority: Clocked-in staff (cookie/store) > Master account (auth)
    const restaurantRole = staffSession ? staffSession.restaurantRole : propRestaurantRole
    const quickCheckoutRole = staffSession ? staffSession.quickCheckoutRole : propQuickCheckoutRole

    // Check if user has a Supabase auth session (not just PIN login)
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            setHasSupabaseSession(!!session)
        }
        checkSession()

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setHasSupabaseSession(!!session)
        })

        return () => subscription.unsubscribe()
    }, [supabase])

    // Real-time listener for Clock-in Requests
    useEffect(() => {
        const fetchPendingCount = async () => {
            const { count } = await supabase
                .from('clock_in_requests')
                .select('*', { count: 'exact', head: true })
                .eq('shop_id', shopId)
                .eq('status', 'pending')
                .eq('is_dismissed', true)

            setPendingNotificationsCount(count || 0)
        }

        fetchPendingCount()

        // Subscribe to changes in clock_in_requests
        const channel = supabase
            .channel('sidebar_notifications')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'clock_in_requests',
                    filter: `shop_id=eq.${shopId}`
                },
                () => {
                    fetchPendingCount()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, shopId])

    const handleLogout = async () => {
        // Clock out from current shop only (soft logout)
        // ROSTER-BASED MODEL: Pass the staff member's userId so the correct person is clocked out
        try {
            const { clockOut } = await import('@/app/dashboard/actions')
            await clockOut(shopId, staffSession?.userId || undefined)
        } catch (error) {
            console.error('Logout error:', error)
            router.push(`/staff-login/${shopId}`)
        }
    }

    const navItems = [
        { href: '/dashboard', label: 'Businesses', icon: LayoutGrid },
        { href: `/dashboard/shops/${shopId}/pos`, label: 'POS', icon: Store },
        ...(businessType === 'table_order' ? [
            { href: `/dashboard/shops/${shopId}/restaurant`, label: 'Restaurant Orders', icon: ShoppingCart }
        ] : []),
        { href: `/dashboard/shops/${shopId}/orders`, label: 'Orders', icon: ShoppingCart },
        {
            href: `/dashboard/shops/${shopId}/alerts`,
            label: 'Stock Alerts',
            icon: Bell,
            badge: alertCounts.outOfStock > 0 ? 'red' : alertCounts.lowStock > 0 ? 'amber' : null
        },
        { href: `/dashboard/shops/${shopId}/products`, label: 'Products', icon: Package },
        { href: `/dashboard/shops/${shopId}/analytics`, label: 'Analytics', icon: BarChart3 },
        ...((businessType === 'table_order' && restaurantRole === 'manager') || (businessType === 'quick_checkout' && (quickCheckoutRole === 'administrator' || quickCheckoutRole === 'manager')) ? [
            { href: `/dashboard/shops/${shopId}/settings`, label: 'Business Settings', icon: Settings }
        ] : []),
        ...((businessType === 'table_order' && restaurantRole === 'manager') || (businessType === 'quick_checkout' && (quickCheckoutRole === 'administrator' || quickCheckoutRole === 'manager')) ? [
            { href: `/dashboard/shops/${shopId}/settings/staff`, label: 'Staff', icon: Users },
            {
                href: `/dashboard/shops/${shopId}/notifications`,
                label: 'Notifications',
                icon: ShieldCheck,
                badge: pendingNotificationsCount > 0 ? 'red' : null
            }
        ] : []),
    ]

    const handleNavClick = () => {
        setMobileMenuOpen(false)
    }

    return (
        <>
            {/* Desktop Sidebar (>900px) - Full width with labels */}
            <div className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col h-full">
                {/* Shop Header */}
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-purple-600 rounded-lg flex items-center justify-center">
                            <Store className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-lg text-slate-900 truncate">{shopName}</span>
                    </div>
                </div>

                {/* Main Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/dashboard' && pathname?.startsWith(`${item.href}/`) &&
                                !navItems.some(other => other.href !== item.href && pathname?.startsWith(other.href)))

                        return (
                            <Link key={item.href} href={item.href}>
                                <div className={cn(
                                    "flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors relative group",
                                    isActive
                                        ? "bg-purple-50 text-purple-700"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                )}>
                                    <div className="flex items-center">
                                        <item.icon className={cn("mr-3 h-5 w-5 transition-colors", isActive ? "text-purple-600" : "text-slate-400 group-hover:text-slate-600")} />
                                        {item.label}
                                    </div>

                                    {item.badge && (
                                        <div className={cn(
                                            "h-2.5 w-2.5 rounded-full",
                                            item.badge === 'red' ? "bg-red-500 animate-pulse" : "bg-amber-400"
                                        )} />
                                    )}
                                </div>
                            </Link>
                        )
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="p-4 border-t border-slate-100 space-y-1">
                    {/* Show User Settings/Staff Name based on session */}
                    <Link href={`/dashboard/shops/${shopId}/user-settings`}>
                        <div className="w-full flex items-center px-3 py-2.5 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors group">
                            <User className="mr-3 h-5 w-5 text-slate-400 group-hover:text-slate-600" />
                            {staffSession ? (
                                <span className="capitalize">{staffSession.name} - User Settings</span>
                            ) : (
                                <span>{hasSupabaseSession ? 'User Settings' : 'Settings'}</span>
                            )}
                        </div>
                    </Link>
                    {/* Clock Out button - only clocks out from current shop */}
                    {staffSession && (
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center px-3 py-2.5 rounded-md text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                        >
                            <LogOut className="mr-3 h-5 w-5" />
                            Clock Out
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile/Tablet Sidebar (≤900px) - Icon only */}
            <div className="lg:hidden w-[72px] bg-white border-r border-slate-200 flex flex-col h-full">
                {/* Shop Icon */}
                <div className="p-4 border-b border-slate-100 flex justify-center">
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="h-10 w-10 bg-purple-600 rounded-lg flex items-center justify-center"
                    >
                        <Store className="h-5 w-5 text-white" />
                    </button>
                </div>

                {/* Icon Navigation */}
                <nav className="flex-1 p-2 space-y-1 overflow-y-auto no-scrollbar">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/dashboard' && pathname?.startsWith(`${item.href}/`) &&
                                !navItems.some(other => other.href !== item.href && pathname?.startsWith(other.href)))

                        return (
                            <Link key={item.href} href={item.href}>
                                <div className={cn(
                                    "relative flex items-center justify-center h-12 w-12 mx-auto rounded-md transition-colors",
                                    isActive
                                        ? "bg-purple-50"
                                        : "hover:bg-slate-50"
                                )}>
                                    <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-purple-600" : "text-slate-400")} />

                                    {item.badge && (
                                        <div className={cn(
                                            "absolute top-1 right-1 h-2 w-2 rounded-full",
                                            item.badge === 'red' ? "bg-red-500 animate-pulse" : "bg-amber-400"
                                        )} />
                                    )}
                                </div>
                            </Link>
                        )
                    })}
                </nav>

                {/* Bottom Icons */}
                <div className="p-2 border-t border-slate-100 space-y-1">
                    <Link href={`/dashboard/shops/${shopId}/user-settings`}>
                        <div className="flex items-center justify-center h-12 w-12 mx-auto rounded-md hover:bg-slate-50 transition-colors">
                            <User className="h-5 w-5 text-slate-400" />
                        </div>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center h-12 w-12 mx-auto rounded-md hover:bg-red-50 transition-colors group"
                    >
                        <LogOut className="h-5 w-5 text-slate-400 group-hover:text-red-600" />
                    </button>
                </div>
            </div>

            {/* Mobile Overlay Menu */}
            {mobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
                    <div
                        className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header with Close */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-purple-600 rounded-lg flex items-center justify-center">
                                    <Store className="h-5 w-5 text-white" />
                                </div>
                                <span className="font-bold text-lg text-slate-900 truncate">{shopName}</span>
                            </div>
                            <button onClick={() => setMobileMenuOpen(false)} className="p-1 hover:bg-slate-100 rounded">
                                <X className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href ||
                                    (item.href !== '/dashboard' && pathname?.startsWith(`${item.href}/`) &&
                                        !navItems.some(other => other.href !== item.href && pathname?.startsWith(other.href)))

                                return (
                                    <Link key={item.href} href={item.href} onClick={handleNavClick}>
                                        <div className={cn(
                                            "flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-purple-50 text-purple-700"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        )}>
                                            <div className="flex items-center">
                                                <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-purple-600" : "text-slate-400")} />
                                                {item.label}
                                            </div>

                                            {item.badge && (
                                                <div className={cn(
                                                    "h-2.5 w-2.5 rounded-full",
                                                    item.badge === 'red' ? "bg-red-500 animate-pulse" : "bg-amber-400"
                                                )} />
                                            )}
                                        </div>
                                    </Link>
                                )
                            })}
                        </nav>

                        <div className="p-4 border-t border-slate-100 space-y-1">
                            <Link href={`/dashboard/shops/${shopId}/user-settings`} onClick={handleNavClick}>
                                <div className="w-full flex items-center px-3 py-2.5 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                                    <User className="mr-3 h-5 w-5 text-slate-400" />
                                    {staffSession ? (
                                        <span className="capitalize">{staffSession.name} - User Settings</span>
                                    ) : (
                                        <span>{hasSupabaseSession ? 'User Settings' : 'Settings'}</span>
                                    )}
                                </div>
                            </Link>
                            {/* Clock Out button - only clocks out from current shop */}
                            {staffSession && (
                                <button
                                    onClick={() => { handleNavClick(); handleLogout(); }}
                                    className="w-full flex items-center px-3 py-2.5 rounded-md text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                                >
                                    <LogOut className="mr-3 h-5 w-5" />
                                    Clock Out
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
