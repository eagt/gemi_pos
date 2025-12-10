import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShoppingBag, BarChart3, Package, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-purple-400" />
            <span className="text-xl font-bold text-white">SimplePOS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-purple-600 hover:bg-purple-700">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-6xl font-bold text-transparent">
            The Modern POS for Small Retail
          </h1>
          <p className="mb-8 text-xl text-slate-300">
            Beautiful, fast, and affordable point-of-sale system built for the modern shop owner.
            Start selling in minutes, not days.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                View Demo
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mx-auto mt-24 grid max-w-6xl gap-8 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg transition-all hover:bg-white/10">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">Lightning Fast</h3>
            <p className="text-slate-400">
              Optimized for speed. Process transactions in milliseconds with real-time inventory updates.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg transition-all hover:bg-white/10">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-pink-600">
              <Package className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">Inventory Management</h3>
            <p className="text-slate-400">
              Track stock levels in real-time. Get alerts when products are running low.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg transition-all hover:bg-white/10">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">Sales Analytics</h3>
            <p className="text-slate-400">
              Understand your business with detailed reports and insights on your sales.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-8 text-center text-slate-400">
          <p>© 2025 SimplePOS. Built with Next.js & Supabase.</p>
        </div>
      </footer>
    </div>
  )
}
