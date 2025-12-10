'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/cart-store'
import { completeSale } from '../actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Search, Plus, Minus, Trash2, ShoppingCart, Package, X, Store } from 'lucide-react'
import { toast } from 'sonner'
import { Database } from '@/lib/types/database.types'
import { SeedButton } from '@/components/dashboard/seed-button'
import { cn } from '@/lib/utils'
import { OrientationWarning } from '@/components/orientation-warning'
import { ClockOutButton } from '@/components/pos/clock-out-button'

type Product = Database['public']['Tables']['products']['Row']

interface POSPageProps {
    params: Promise<{ shopId: string }>
}

export default function POSPage({ params }: POSPageProps) {
    const [shopId, setShopId] = useState<string>('')
    const [shopName, setShopName] = useState<string>('SimplePOS')
    const [products, setProducts] = useState<Product[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [cartSheetOpen, setCartSheetOpen] = useState(false)
    const supabase = createClient()

    const { items, addItem, updateQuantity, removeItem, clearCart, getTotal, getItemCount } = useCartStore()

    useEffect(() => {
        params.then(p => {
            setShopId(p.shopId)
            loadShopData(p.shopId)
            loadProducts(p.shopId)
            subscribeToProducts(p.shopId)
        })
    }, [params])

    const loadShopData = async (id: string) => {
        const { data } = await supabase
            .from('shops')
            .select('name')
            .eq('id', id)
            .single()

        if (data) {
            setShopName(data.name)
        }
    }

    const loadProducts = async (id: string) => {
        const { data } = await supabase
            .from('products')
            .select('*')
            .eq('shop_id', id)
            .order('name')

        if (data) {
            setProducts(data)
        }
    }

    const subscribeToProducts = (id: string) => {
        const channel = supabase
            .channel('products-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'products',
                    filter: `shop_id=eq.${id}`,
                },
                () => {
                    loadProducts(id)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }

    const handleCompleteSale = async () => {
        if (items.length === 0) {
            toast.error('Cart is empty')
            return
        }

        setLoading(true)

        const saleItems = items.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.product.price_cents,
        }))

        const result = await completeSale(shopId, saleItems)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Sale completed successfully!')
            clearCart()
            setCartSheetOpen(false)
        }

        setLoading(false)
    }

    const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[]
    const sortedCategories = categories.sort()

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = !selectedCategory || product.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    const formatCurrency = (cents: number) => {
        return `£${(cents / 100).toFixed(2)}`
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            {/* Orientation Warning for Mobile Landscape */}
            <OrientationWarning />

            {/* Mobile Top Bar (≤768px) */}
            <div className="md:hidden sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
                <div className="flex items-center gap-3 mb-3">
                    <span className="font-bold text-lg text-slate-900 truncate flex-1">{shopName}</span>
                    <ClockOutButton shopId={shopId} />
                    <button
                        onClick={() => setCartSheetOpen(true)}
                        className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <ShoppingCart className="h-6 w-6 text-purple-600" />
                        {getItemCount() > 0 && (
                            <span className="absolute -top-1 -right-1 h-5 w-5 bg-purple-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                {getItemCount()}
                            </span>
                        )}
                    </button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-10"
                    />
                </div>
            </div>

            {/* Desktop Layout (>768px) */}
            <div className="hidden md:flex flex-1 overflow-hidden">
                {/* Left Panel - Products */}
                <div className="flex flex-1 flex-col border-r border-slate-200 bg-white">
                    {/* Search & Filters */}
                    <div className="border-b border-slate-200 p-4 space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                <Input
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <ClockOutButton shopId={shopId} />
                        </div>

                        {/* Category Filters */}
                        {categories.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant={selectedCategory === null ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSelectedCategory(null)}
                                    className={selectedCategory === null ? 'bg-purple-600 hover:bg-purple-700' : ''}
                                >
                                    All
                                </Button>
                                {sortedCategories.map(category => (
                                    <Button
                                        key={category}
                                        variant={selectedCategory === category ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setSelectedCategory(category)}
                                        className={selectedCategory === category ? 'bg-purple-600 hover:bg-purple-700' : ''}
                                    >
                                        {category}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Grid */}
                    {/* Product Grid */}
                    <div className="flex-1 overflow-y-auto p-4 min-h-0">
                        {products.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <SeedButton shopId={shopId} />
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                                <Package className="h-12 w-12 mb-4" />
                                <p>No products found</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                                {filteredProducts.map(product => {
                                    const isOutOfStock = product.stock <= 0 && !product.allow_overselling
                                    return (
                                        <Card
                                            key={product.id}
                                            className={cn(
                                                "cursor-pointer transition-all hover:shadow-lg hover:scale-105 overflow-hidden py-2 gap-0",
                                                isOutOfStock && "cursor-not-allowed hover:shadow-none hover:scale-100"
                                            )}
                                            onClick={() => {
                                                if (isOutOfStock) {
                                                    toast.error('Product is out of stock')
                                                    return
                                                }
                                                addItem(product)
                                            }}
                                        >
                                            {/* Stock Badge Area - White Header */}
                                            <div className="bg-white w-full flex items-start justify-center pt-0 pb-1">
                                                <Badge
                                                    className={cn(
                                                        "rounded-full h-6 min-w-[1.75rem] px-2 flex items-center justify-center text-[10px] font-bold shadow-sm z-10 border-none",
                                                        isOutOfStock ? "bg-red-600 text-white hover:bg-red-700" :
                                                            (product.stock > 0 && product.stock <= 5) ? "bg-amber-100 text-amber-800 hover:bg-amber-200" :
                                                                "bg-slate-900 text-white hover:bg-slate-800"
                                                    )}
                                                >
                                                    {isOutOfStock ? "Out Of Stock" : (product.stock > 0 && product.stock <= 5) ? "Low Stock" : product.stock}
                                                </Badge>
                                            </div>

                                            <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center relative">
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt={product.name} className={cn("h-full w-full object-cover", isOutOfStock && "opacity-50")} />
                                                ) : (
                                                    <Package className={cn("h-12 w-12 text-purple-400", isOutOfStock && "opacity-50")} />
                                                )}
                                            </div>
                                            <div className="p-3">
                                                <div className="mb-2">
                                                    <h3 className={cn("font-semibold text-sm line-clamp-2 h-10 leading-5", isOutOfStock && "text-slate-500")}>{product.name}</h3>
                                                </div>
                                                <div>
                                                    <span className={cn("text-sm font-bold text-purple-600", isOutOfStock && "text-slate-400")}>
                                                        {formatCurrency(product.price_cents)}
                                                    </span>
                                                </div>
                                            </div>
                                        </Card>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Cart (Desktop only) */}
                <div className="flex w-80 flex-col bg-white">
                    <div className="border-b border-slate-200 p-4">
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="h-6 w-6 text-purple-600" />
                            <h2 className="text-xl font-bold">Cart</h2>
                            <Badge className="ml-auto">{getItemCount()}</Badge>
                        </div>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-4 min-h-0">
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                                <ShoppingCart className="h-12 w-12 mb-4" />
                                <p>Cart is empty</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {items.map(item => (
                                    <Card key={item.product.id} className="p-2">
                                        <div className="flex items-start justify-between mb-1">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-sm">{item.product.name}</h3>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeItem(item.product.id)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                    disabled={item.quantity <= 1}
                                                    className="h-7 w-7"
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                    disabled={item.quantity >= item.product.stock}
                                                    className="h-7 w-7"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <span className="font-bold text-purple-600 text-sm">
                                                {formatCurrency(item.product.price_cents * item.quantity)}
                                            </span>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="border-t border-slate-200 p-4 space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Subtotal</span>
                                <span>{formatCurrency(getTotal())}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-lg font-bold">
                                <span>Total</span>
                                <span className="text-purple-600">{formatCurrency(getTotal())}</span>
                            </div>
                        </div>

                        <Button
                            className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-lg"
                            onClick={handleCompleteSale}
                            disabled={items.length === 0 || loading}
                        >
                            {loading ? 'Processing...' : 'Complete Sale'}
                        </Button>

                        {items.length > 0 && (
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={clearCart}
                            >
                                Clear Cart
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Content (≤768px) */}
            <div className="md:hidden flex-1 flex flex-col overflow-hidden">
                {/* Horizontal Category Scroll */}
                {categories.length > 0 && (
                    <div className="border-b border-slate-200 bg-white px-4 pt-5 pb-6">
                        <div className="flex gap-2 overflow-x-auto mb-3">
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0",
                                    selectedCategory === null
                                        ? "bg-purple-600 text-white"
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                )}
                            >
                                All
                            </button>
                            {sortedCategories.map(category => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0",
                                        selectedCategory === category
                                            ? "bg-purple-600 text-white"
                                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                    )}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Mobile Product Grid */}
                {/* Mobile Product Grid */}
                <div className="flex-1 overflow-y-auto pt-4 min-h-0">
                    {products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <SeedButton shopId={shopId} />
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                            <Package className="h-12 w-12 mb-4" />
                            <p>No products found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-4 pb-4">
                            {filteredProducts.map(product => {
                                const isOutOfStock = product.stock <= 0 && !product.allow_overselling
                                return (
                                    <Card
                                        key={product.id}
                                        className={cn(
                                            "cursor-pointer transition-all active:scale-95 overflow-hidden py-2 gap-0",
                                            isOutOfStock && "cursor-not-allowed active:scale-100"
                                        )}
                                        onClick={() => {
                                            if (isOutOfStock) {
                                                toast.error('Product is out of stock')
                                                return
                                            }
                                            addItem(product)
                                            toast.success(`Added ${product.name}`)
                                        }}
                                    >
                                        {/* Stock Badge Area - White Header */}
                                        <div className="bg-white w-full flex items-start justify-center pt-0 pb-1">
                                            <Badge
                                                className={cn(
                                                    "rounded-full h-6 min-w-[1.75rem] px-2 flex items-center justify-center text-[10px] font-bold shadow-sm z-10 border-none",
                                                    isOutOfStock ? "bg-red-600 text-white hover:bg-red-700" :
                                                        (product.stock > 0 && product.stock <= 5) ? "bg-amber-100 text-amber-800 hover:bg-amber-200" :
                                                            "bg-slate-900 text-white hover:bg-slate-800"
                                                )}
                                            >
                                                {isOutOfStock ? "Out Of Stock" : (product.stock > 0 && product.stock <= 5) ? "Low Stock" : product.stock}
                                            </Badge>
                                        </div>

                                        <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center relative">
                                            {product.image_url ? (
                                                <img src={product.image_url} alt={product.name} className={cn("h-full w-full object-cover", isOutOfStock && "opacity-50")} />
                                            ) : (
                                                <Package className={cn("h-10 w-10 text-purple-400", isOutOfStock && "opacity-50")} />
                                            )}
                                        </div>
                                        <div className="p-2.5">
                                            <div className="mb-1.5">
                                                <h3 className={cn("font-semibold text-sm line-clamp-2 h-10 leading-5", isOutOfStock && "text-slate-500")}>
                                                    {product.name}
                                                </h3>
                                            </div>
                                            <div>
                                                <span className={cn("text-sm font-bold text-purple-600", isOutOfStock && "text-slate-400")}>
                                                    {formatCurrency(product.price_cents)}
                                                </span>
                                            </div>
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Cart Bottom Sheet */}
            {cartSheetOpen && (
                <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setCartSheetOpen(false)}>
                    <div
                        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl flex flex-col h-[90dvh] max-h-[90dvh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Sheet Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="h-6 w-6 text-purple-600" />
                                <h2 className="text-xl font-bold">Cart</h2>
                                <Badge>{getItemCount()}</Badge>
                            </div>
                            <button
                                onClick={() => setCartSheetOpen(false)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>

                        {/* Cart Items */}
                        <ScrollArea className="flex-1 p-4 min-h-0">
                            {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                                    <ShoppingCart className="h-12 w-12 mb-4" />
                                    <p>Cart is empty</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {items.map(item => (
                                        <Card key={item.product.id} className="p-2">
                                            <div className="flex items-start justify-between mb-1">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-sm">{item.product.name}</h3>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeItem(item.product.id)}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                        disabled={item.quantity <= 1}
                                                        className="h-7 w-7"
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                    <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                        disabled={item.quantity >= item.product.stock}
                                                        className="h-7 w-7"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                <span className="font-bold text-purple-600 text-sm">
                                                    {formatCurrency(item.product.price_cents * item.quantity)}
                                                </span>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>

                        {/* Cart Footer */}
                        <div className="border-t border-slate-200 p-4 space-y-4 bg-white">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Subtotal</span>
                                    <span>{formatCurrency(getTotal())}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-xl font-bold">
                                    <span>Total</span>
                                    <span className="text-purple-600">{formatCurrency(getTotal())}</span>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-purple-600 hover:bg-purple-700 h-14 text-lg font-semibold"
                                onClick={handleCompleteSale}
                                disabled={items.length === 0 || loading}
                            >
                                {loading ? 'Processing...' : 'Complete Sale'}
                            </Button>

                            {items.length > 0 && (
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={clearCart}
                                >
                                    Clear Cart
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
