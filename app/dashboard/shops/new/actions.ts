'use server'

import { createClient } from '@/lib/supabase/server'
import { getBasePrefix, generateUniquePrefix } from '@/lib/utils'
import { redirect } from 'next/navigation'

export async function createShop(name: string, businessType: 'quick_checkout' | 'table_order' = 'quick_checkout') {
    try {
        if (!name) {
            return { error: 'Name is required' }
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: 'Unauthorized' }
        }

        // CRITICAL: Ensure profile exists before creating shop
        // This prevents the shops_owner_id_fkey foreign key constraint error
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single()

        if (!existingProfile) {
            console.log('[createShop] Profile not found, creating one...')
            // Create profile using service role client to bypass RLS
            const { createServiceRoleClient } = await import('@/lib/supabase/server')
            const serviceClient = createServiceRoleClient()

            const { error: profileError } = await serviceClient
                .from('profiles')
                .insert({
                    id: user.id,
                    email: user.email,
                    full_name: user.user_metadata?.full_name || user.email,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })

            if (profileError) {
                console.error('[createShop] Error creating profile:', profileError)
                return { error: 'Failed to create user profile. Please try again.' }
            }
            console.log('[createShop] Profile created successfully')
        }

        // 1. Calculate base prefix
        const basePrefix = getBasePrefix(name)

        // 2. Fetch existing prefixes to check for collisions
        const { data: shops, error: fetchError } = await supabase
            .from('shops')
            .select('name, settings')

        if (fetchError) {
            console.error('Error fetching shops:', fetchError)
            // Continue with empty list if fetch fails, to avoid blocking creation
        }

        const existingPrefixes = shops
            ?.map(s => {
                const p = (s.settings as any)?.prefix
                return p || getBasePrefix(s.name)
            })
            .filter(Boolean) as string[] || []

        // 3. Generate unique prefix
        const uniquePrefix = generateUniquePrefix(basePrefix, existingPrefixes)

        // 4. Create shop
        const { data: shop, error } = await supabase
            .from('shops')
            .insert({
                name,
                owner_id: user.id,
                business_type: businessType,
                settings: { prefix: uniquePrefix }
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating shop:', error)
            return { error: error.message }
        }

        // 5. Create initial staff member for the owner
        if (businessType === 'table_order') {
            const { error: staffError } = await supabase
                .from('shop_staff')
                .insert({
                    shop_id: shop.id,
                    user_id: user.id,
                    role: 'manager',
                    name: user.user_metadata?.full_name || 'Manager',
                    email: user.email,
                    accepted_at: new Date().toISOString() // Active immediately
                })

            if (staffError) {
                console.error('Error creating manager staff:', staffError)
            }
        } else if (businessType === 'quick_checkout') {
            const { error: staffError } = await supabase
                .from('shop_staff')
                .insert({
                    shop_id: shop.id,
                    user_id: user.id,
                    role: 'manager', // Required by DB constraint, even for QC
                    quick_checkout_role: 'administrator', // Owner gets full access
                    name: user.user_metadata?.full_name || 'Administrator',
                    email: user.email,
                    is_active: true,
                    accepted_at: new Date().toISOString() // Active immediately
                })

            if (staffError) {
                console.error('Error creating administrator staff:', staffError)
            }
        }

        // 6. Create working_shop record for the owner so they appear on the login screen
        const { error: workingShopError } = await supabase
            .from('working_shop')
            .insert({
                shop_id: shop.id,
                user_id: user.id,
                clocked_in: false,
                clocked_out: true,
                updated_at: new Date().toISOString()
            })

        if (workingShopError) {
            console.error('Error creating working_shop record:', workingShopError)
            // Don't fail the entire operation, just log the error
        }

        return { success: true, shop }
    } catch (e) {
        console.error('Unexpected error in createShop:', e)
        return { error: 'An unexpected error occurred while creating the shop.' }
    }
}
