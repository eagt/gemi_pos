export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

// Restaurant order statuses
export type RestaurantOrderStatus =
    | 'new'
    | 'accepted'
    | 'in_preparation'
    | 'ready'
    | 'served'
    | 'payment_requested'
    | 'paid'
    | 'void'

// Quick checkout order statuses
export type QuickCheckoutOrderStatus =
    | 'pending'
    | 'completed'
    | 'cancelled'
    | 'refunded'

// All order statuses
export type OrderStatus = RestaurantOrderStatus | QuickCheckoutOrderStatus

// Staff roles
export type StaffRole = 'manager' | 'waiter' | 'chef' | 'runner'

// Business types
export type BusinessType = 'quick_checkout' | 'table_order'

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            shops: {
                Row: {
                    created_at: string
                    id: string
                    logo_url: string | null
                    name: string
                    owner_id: string
                    slug: string | null
                    currency: string | null
                    timezone: string | null
                    phone: string | null
                    email: string | null
                    address: string | null
                    website: string | null
                    instagram: string | null
                    tiktok: string | null
                    x_handle: string | null
                    settings: Json | null
                    business_type: BusinessType
                    updated_at: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    logo_url?: string | null
                    name: string
                    owner_id: string
                    slug?: string | null
                    currency?: string | null
                    timezone?: string | null
                    phone?: string | null
                    email?: string | null
                    address?: string | null
                    website?: string | null
                    instagram?: string | null
                    tiktok?: string | null
                    x_handle?: string | null
                    settings?: Json | null
                    business_type?: BusinessType
                    updated_at?: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    logo_url?: string | null
                    name?: string
                    owner_id?: string
                    slug?: string | null
                    currency?: string | null
                    timezone?: string | null
                    phone?: string | null
                    email?: string | null
                    address?: string | null
                    website?: string | null
                    instagram?: string | null
                    tiktok?: string | null
                    x_handle?: string | null
                    settings?: Json | null
                    business_type?: BusinessType
                    updated_at?: string
                }
            }
            shop_staff: {
                Row: {
                    id: string
                    shop_id: string
                    user_id: string | null
                    email: string | null
                    role: StaffRole
                    name: string
                    pin: string | null
                    avatar_url: string | null
                    created_at: string
                    invited_by: string | null
                    accepted_at: string | null
                }
                Insert: {
                    id?: string
                    shop_id: string
                    user_id?: string | null
                    email?: string | null
                    role: StaffRole
                    name: string
                    pin?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    invited_by?: string | null
                    accepted_at?: string | null
                }
                Update: {
                    id?: string
                    shop_id?: string
                    user_id?: string | null
                    email?: string | null
                    role?: StaffRole
                    name?: string
                    pin?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    invited_by?: string | null
                    accepted_at?: string | null
                }
            }
            products: {
                Row: {
                    id: string
                    shop_id: string
                    name: string
                    description: string | null
                    price_cents: number
                    cost_cents: number | null
                    stock: number
                    image_url: string | null
                    barcode: string | null
                    category: string | null
                    low_stock_threshold: number | null
                    allow_overselling: boolean
                    is_pre_order: boolean
                    pre_order_stock: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    shop_id: string
                    name: string
                    description?: string | null
                    price_cents: number
                    cost_cents?: number | null
                    stock?: number
                    image_url?: string | null
                    barcode?: string | null
                    category?: string | null
                    low_stock_threshold?: number | null
                    allow_overselling?: boolean
                    is_pre_order?: boolean
                    pre_order_stock?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    shop_id?: string
                    name?: string
                    description?: string | null
                    price_cents?: number
                    cost_cents?: number | null
                    stock?: number
                    image_url?: string | null
                    barcode?: string | null
                    category?: string | null
                    low_stock_threshold?: number | null
                    allow_overselling?: boolean
                    is_pre_order?: boolean
                    pre_order_stock?: number
                    created_at?: string
                    updated_at?: string
                }
            }
            orders: {
                Row: {
                    id: string
                    shop_id: string
                    total_cents: number
                    status: OrderStatus
                    customer_name: string | null
                    payment_method: string | null
                    table_number: string | null
                    notes: string | null
                    last_changed_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    shop_id: string
                    total_cents?: number
                    status?: OrderStatus
                    customer_name?: string | null
                    payment_method?: string | null
                    table_number?: string | null
                    notes?: string | null
                    last_changed_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    shop_id?: string
                    total_cents?: number
                    status?: OrderStatus
                    customer_name?: string | null
                    payment_method?: string | null
                    table_number?: string | null
                    notes?: string | null
                    last_changed_by?: string | null
                    created_at?: string
                }
            }
            order_items: {
                Row: {
                    id: string
                    order_id: string
                    product_id: string | null
                    quantity: number
                    unit_price_cents: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    order_id: string
                    product_id?: string | null
                    quantity: number
                    unit_price_cents: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    order_id?: string
                    product_id?: string | null
                    quantity?: number
                    unit_price_cents?: number
                    created_at?: string
                }
            }
            order_status_changes: {
                Row: {
                    id: string
                    order_id: string
                    changed_by: string | null
                    old_status: string | null
                    new_status: string | null
                    changed_at: string
                }
                Insert: {
                    id?: string
                    order_id: string
                    changed_by?: string | null
                    old_status?: string | null
                    new_status?: string | null
                    changed_at?: string
                }
                Update: {
                    id?: string
                    order_id?: string
                    changed_by?: string | null
                    old_status?: string | null
                    new_status?: string | null
                    changed_at?: string
                }
            }
        }
    }
}
