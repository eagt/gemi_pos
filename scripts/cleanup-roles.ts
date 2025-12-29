import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { join } from 'path'

// Load env vars
dotenv.config({ path: join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function cleanupRoles() {
    console.log('--- Starting Role Cleanup ---')

    // 1. Fetch all shops with their business types
    const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('id, name, business_type')

    if (shopsError) {
        console.error('Error fetching shops:', shopsError)
        return
    }

    console.log(`Found ${shops?.length} shops to check.`)

    for (const shop of shops || []) {
        console.log(`\nChecking Shop: ${shop.name} (${shop.business_type})`)

        // 2. Fetch all staff for this shop
        const { data: staff, error: staffError } = await supabase
            .from('shop_staff')
            .select('id, name, restaurant_role, quick_checkout_role')
            .eq('shop_id', shop.id)

        if (staffError) {
            console.error(`  Error fetching staff for shop ${shop.id}:`, staffError)
            continue
        }

        for (const member of staff || []) {
            let needsUpdate = false
            let updatePayload: any = {}

            if (shop.business_type === 'quick_checkout') {
                // Should ONLY have quick_checkout_role. Clear restaurant_role.
                if (member.restaurant_role !== null) {
                    console.log(`  - Staff [${member.name}]: Clearing restaurant_role (${member.restaurant_role})`)
                    updatePayload.restaurant_role = null
                    needsUpdate = true
                }
                // Rename 'administrator' to 'manager'
                if (member.quick_checkout_role === 'administrator') {
                    console.log(`  - Staff [${member.name}]: Renaming administrator to manager`)
                    updatePayload.quick_checkout_role = 'manager'
                    needsUpdate = true
                }
            } else if (shop.business_type === 'table_order') {
                // Should ONLY have restaurant_role. Clear quick_checkout_role.
                if (member.quick_checkout_role !== null) {
                    console.log(`  - Staff [${member.name}]: Clearing quick_checkout_role (${member.quick_checkout_role})`)
                    updatePayload.quick_checkout_role = null
                    needsUpdate = true
                }
            }

            if (needsUpdate) {
                const { error: updateError } = await supabase
                    .from('shop_staff')
                    .update(updatePayload)
                    .eq('id', member.id)

                if (updateError) {
                    console.error(`    FAILED to update ${member.name}:`, updateError)
                } else {
                    console.log(`    Successfully cleaned up ${member.name}`)
                }
            }
        }
    }

    console.log('\n--- Cleanup Complete ---')
}

cleanupRoles()
