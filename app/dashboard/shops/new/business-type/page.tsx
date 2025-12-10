'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, X } from 'lucide-react'

export default function BusinessTypePage() {
    const router = useRouter()

    const handleSelectType = (type: 'quick' | 'table') => {
        sessionStorage.setItem('businessType', type)
        router.push('/dashboard/shops/new')
    }

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50 overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            {/* Cancel button - top right */}
            <div className="absolute top-8 right-8 z-10">
                <Button
                    variant="outline"
                    onClick={() => router.push('/dashboard')}
                    className="bg-slate-900 text-white border-slate-900 hover:bg-slate-800 hover:border-slate-800 hover:text-white shadow-lg"
                >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                </Button>
            </div>

            <div className="relative flex min-h-screen items-center justify-center p-8">
                <div className="w-full max-w-7xl">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <h1 className="text-5xl font-bold text-slate-900 mb-4 tracking-tight">
                            Choose Your Business Type
                        </h1>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                            Select the POS system that perfectly matches your business model
                        </p>
                    </div>

                    {/* Cards */}
                    <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                        {/* Quick Checkout POS Card */}
                        <div
                            onClick={() => handleSelectType('quick')}
                            className="group relative cursor-pointer"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                            <Card className="relative h-full border-2 border-slate-200 hover:border-emerald-400 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-1 bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-bl-full"></div>

                                <CardHeader className="space-y-6 pb-6 pt-8 px-8">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-5">
                                            <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-4xl shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                                                ⚡
                                            </div>
                                            <div className="flex-1 pt-1">
                                                <CardTitle className="text-3xl mb-3 text-emerald-700 font-bold">
                                                    Quick Checkout POS
                                                </CardTitle>
                                                <CardDescription className="text-base leading-relaxed text-slate-600">
                                                    Customers choose items and pay right away at the counter.
                                                    Perfect for retail stores, pharmacies, cafés, and any "grab-and-go" business.
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-6 w-6 text-emerald-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                                    </div>
                                </CardHeader>

                                <CardContent className="px-8 pb-8">
                                    <div className="pt-6 border-t border-slate-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Perfect For</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {['Cafés & coffee shops', 'Pharmacies', 'Supermarkets', 'Liquor stores', 'Spare parts', 'Toy stores', 'Cinemas', 'Clothing stores', 'Convenience stores'].map((item) => (
                                                <span key={item} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Table Order POS Card */}
                        <div
                            onClick={() => handleSelectType('table')}
                            className="group relative cursor-pointer"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                            <Card className="relative h-full border-2 border-slate-200 hover:border-orange-400 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-1 bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/20 to-transparent rounded-bl-full"></div>

                                <CardHeader className="space-y-6 pb-6 pt-8 px-8">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-5">
                                            <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-4xl shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform duration-300">
                                                🍽️
                                            </div>
                                            <div className="flex-1 pt-1">
                                                <CardTitle className="text-3xl mb-3 text-orange-700 font-bold">
                                                    Table Order POS
                                                </CardTitle>
                                                <CardDescription className="text-base leading-relaxed text-slate-600">
                                                    Take orders first (table, kitchen ticket, or queue), then charge when ready.
                                                    Made for restaurants, bars, and any business with table/service orders.
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-6 w-6 text-orange-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                                    </div>
                                </CardHeader>

                                <CardContent className="px-8 pb-8">
                                    <div className="pt-6 border-t border-slate-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                                            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Perfect For</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {['Restaurants', 'Bars with table service', 'Casual dining', 'Fast-casual with orders', 'Cafeterias', 'Food courts'].map((item) => (
                                                <span key={item} className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-sm font-medium">
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    )
}
