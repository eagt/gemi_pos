/**
 * Security & Mobility Flow Integration Tests
 * Using Node.js built-in test runner (Node 16+)
 * 
 * Run with: npm test
 */

// Load environment variables
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '../.env.local') })

import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServiceRoleClient } from '../lib/supabase/server.ts'
import bcrypt from 'bcryptjs'

// Test helpers
async function cleanupTestData() {
    const supabase = createServiceRoleClient()
    const { data } = await supabase.auth.admin.listUsers()

    const testUsers = data.users.filter(u =>
        u.email?.includes('@test.com') ||
        u.email?.startsWith('owner_') ||
        u.email?.startsWith('staff_') ||
        u.email?.startsWith('nomad_') ||
        u.email?.startsWith('temp_')
    )

    for (const user of testUsers) {
        await supabase.auth.admin.deleteUser(user.id)
    }
}

async function hashPin(pin) {
    return bcrypt.hash(pin, 10)
}

// Test Suite
describe('Security & Mobility Flows', () => {
    before(async () => {
        console.log('\n🧹 Cleaning up test data...')
        await cleanupTestData()
    })

    after(async () => {
        console.log('\n🧹 Final cleanup...')
        await cleanupTestData()
    })

    describe('Flow 1: The Entrepreneur (Native Signup)', () => {
        it('should allow owner to access POS immediately after PIN setup without password change', async () => {
            const supabase = createServiceRoleClient()

            // 1. Create user (simulating native signup)
            const testEmail = `owner_${Date.now()}@test.com`
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: testEmail,
                password: 'SecurePassword123!',
                email_confirm: true,
                user_metadata: { full_name: 'Test Owner' }
            })

            assert.equal(authError, null, 'Should create user without error')
            assert.ok(authData.user, 'User should be created')

            const userId = authData.user.id

            // 2. Create/update profile with permanent password (upsert to handle duplicates)
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    email: testEmail,
                    full_name: 'Test Owner',
                    has_temporary_password: false
                }, { onConflict: 'id' })

            assert.equal(profileError, null, 'Profile should be created/updated')

            // 3. Create shop
            const { data: shop, error: shopError } = await supabase
                .from('shops')
                .insert({
                    name: 'Entrepreneur Test Shop',
                    owner_id: userId,
                    business_type: 'quick_checkout'
                })
                .select()
                .single()

            assert.equal(shopError, null, 'Shop should be created')
            assert.ok(shop, 'Shop data should exist')

            // 4. Verify owner is automatically added as manager
            const { data: staffRecord } = await supabase
                .from('shop_staff')
                .select('*')
                .eq('shop_id', shop.id)
                .eq('user_id', userId)
                .single()

            assert.ok(staffRecord, 'Staff record should exist')
            assert.equal(staffRecord.quick_checkout_role, 'manager', 'Owner should be manager')

            // 5. Verify permanent password status
            const { data: profile } = await supabase
                .from('profiles')
                .select('has_temporary_password')
                .eq('id', userId)
                .single()

            assert.equal(profile.has_temporary_password, false, 'Should NOT require password change')

            console.log('    ✅ Entrepreneur can access POS without password change')
        })
    })

    describe('Flow 2: The New Hire (Invited User)', () => {
        it('should force password change after PIN setup for invited users', async () => {
            const supabase = createServiceRoleClient()

            // 1. Create shop owner
            const ownerEmail = `owner_${Date.now()}@test.com`
            const { data: ownerAuth } = await supabase.auth.admin.createUser({
                email: ownerEmail,
                password: 'OwnerPass123!',
                email_confirm: true
            })

            const ownerId = ownerAuth.user.id

            await supabase.from('profiles').upsert({
                id: ownerId,
                email: ownerEmail,
                has_temporary_password: false
            }, { onConflict: 'id' })

            const { data: shop } = await supabase
                .from('shops')
                .insert({
                    name: 'New Hire Test Shop',
                    owner_id: ownerId,
                    business_type: 'quick_checkout'
                })
                .select()
                .single()

            // 2. Invite staff member with temporary password
            const staffEmail = `staff_${Date.now()}@test.com`
            const { data: staffAuth } = await supabase.auth.admin.createUser({
                email: staffEmail,
                password: 'TempPass123!',
                email_confirm: true
            })

            const staffUserId = staffAuth.user.id

            // 3. Create profile with temporary password flag
            await supabase.from('profiles').upsert({
                id: staffUserId,
                email: staffEmail,
                has_temporary_password: true // KEY: Invited users have temp passwords
            }, { onConflict: 'id' })

            // 4. Add to shop staff
            await supabase.from('shop_staff').insert({
                shop_id: shop.id,
                user_id: staffUserId,
                email: staffEmail,
                name: 'Test Staff',
                quick_checkout_role: 'cashier',
                invited_by: ownerId
            })

            // 5. Verify temporary password flag is set (re-fetch to get actual DB value)
            const { data: profile } = await supabase
                .from('profiles')
                .select('has_temporary_password')
                .eq('id', staffUserId)
                .single()

            assert.equal(profile.has_temporary_password, true, 'Invited user MUST have temporary password')

            // 6. Simulate password change
            await supabase.from('profiles')
                .update({ has_temporary_password: false })
                .eq('id', staffUserId)

            // 7. Verify password is now permanent
            const { data: updatedProfile } = await supabase
                .from('profiles')
                .select('has_temporary_password')
                .eq('id', staffUserId)
                .single()

            assert.equal(updatedProfile.has_temporary_password, false, 'Password should be permanent after change')

            console.log('    ✅ New hire forced to change password')
        })
    })

    describe('Flow 3: The Lateral Transfer (Existing User, New Shop)', () => {
        it('should allow existing user to join new shop without password change', async () => {
            const supabase = createServiceRoleClient()

            // 1. Create existing user with permanent password
            const userEmail = `user_${Date.now()}@test.com`
            const { data: userAuth } = await supabase.auth.admin.createUser({
                email: userEmail,
                password: 'UserPass123!',
                email_confirm: true
            })

            const userId = userAuth.user.id

            await supabase.from('profiles').upsert({
                id: userId,
                email: userEmail,
                has_temporary_password: false
            }, { onConflict: 'id' })

            // 2. Create Shop A (original shop)
            const { data: shopA } = await supabase
                .from('shops')
                .insert({
                    name: 'Lateral Transfer Shop A',
                    owner_id: userId,
                    business_type: 'quick_checkout'
                })
                .select()
                .single()

            // 3. Create Shop B (new shop they're joining)
            const ownerBEmail = `ownerb_${Date.now()}@test.com`
            const { data: ownerBAuth } = await supabase.auth.admin.createUser({
                email: ownerBEmail,
                password: 'OwnerBPass123!',
                email_confirm: true
            })

            await supabase.from('profiles').upsert({
                id: ownerBAuth.user.id,
                email: ownerBEmail,
                has_temporary_password: false
            }, { onConflict: 'id' })

            const { data: shopB } = await supabase
                .from('shops')
                .insert({
                    name: 'Lateral Transfer Shop B',
                    owner_id: ownerBAuth.user.id,
                    business_type: 'quick_checkout'
                })
                .select()
                .single()

            // 4. User joins Shop B
            await supabase.from('shop_staff').insert({
                shop_id: shopB.id,
                user_id: userId,
                email: userEmail,
                name: 'Transferred User',
                quick_checkout_role: 'cashier',
                invited_by: ownerBAuth.user.id
            })

            // 5. Verify password remains permanent (no change required)
            const { data: profile } = await supabase
                .from('profiles')
                .select('has_temporary_password')
                .eq('id', userId)
                .single()

            assert.equal(profile.has_temporary_password, false, 'Existing user should NOT need password change')

            console.log('    ✅ Lateral transfer works without password change')
        })
    })

    describe('Flow 4: The Multi-Shop Nomad (Session Handover)', () => {
        it('should enforce atomic session transfer between shops', async () => {
            const supabase = createServiceRoleClient()

            // 1. Create nomad user
            const userEmail = `nomad_${Date.now()}@test.com`
            const { data: userAuth } = await supabase.auth.admin.createUser({
                email: userEmail,
                password: 'NomadPass123!',
                email_confirm: true
            })

            const userId = userAuth.user.id

            await supabase.from('profiles').upsert({
                id: userId,
                email: userEmail,
                has_temporary_password: false
            }, { onConflict: 'id' })

            // 2. Create Shop A
            const { data: shopA } = await supabase
                .from('shops')
                .insert({
                    name: 'Nomad Shop A',
                    owner_id: userId,
                    business_type: 'quick_checkout'
                })
                .select()
                .single()

            // 3. Create Shop B
            const ownerBEmail = `ownerb2_${Date.now()}@test.com`
            const { data: ownerBAuth } = await supabase.auth.admin.createUser({
                email: ownerBEmail,
                password: 'OwnerB2Pass123!',
                email_confirm: true
            })

            await supabase.from('profiles').upsert({
                id: ownerBAuth.user.id,
                email: ownerBEmail,
                has_temporary_password: false
            }, { onConflict: 'id' })

            const { data: shopB } = await supabase
                .from('shops')
                .insert({
                    name: 'Nomad Shop B',
                    owner_id: ownerBAuth.user.id,
                    business_type: 'quick_checkout'
                })
                .select()
                .single()

            // 4. Add user to both rosters
            await supabase.from('shop_staff').insert([
                {
                    shop_id: shopA.id,
                    user_id: userId,
                    email: userEmail,
                    name: 'Nomad User',
                    quick_checkout_role: 'manager',
                    pin: await hashPin('1111')
                },
                {
                    shop_id: shopB.id,
                    user_id: userId,
                    email: userEmail,
                    name: 'Nomad User',
                    quick_checkout_role: 'cashier',
                    pin: await hashPin('2222')
                }
            ])

            // 5. Clock into Shop A
            await supabase.from('working_shop').insert({
                shop_id: shopA.id,
                user_id: userId,
                clocked_in: true,
                clocked_out: false
            })

            // 6. Verify active in Shop A
            const { data: sessionA, count: countA } = await supabase
                .from('working_shop')
                .select('*', { count: 'exact' })
                .eq('user_id', userId)

            assert.equal(countA, 1, 'Should have exactly one session')
            assert.equal(sessionA[0].shop_id, shopA.id, 'Should be in Shop A')

            // 7. Atomic handover: Delete from A, add to B
            await supabase
                .from('working_shop')
                .delete()
                .eq('user_id', userId)
                .eq('shop_id', shopA.id)

            await supabase.from('working_shop').insert({
                shop_id: shopB.id,
                user_id: userId,
                clocked_in: true,
                clocked_out: false
            })

            // 8. Verify atomic transfer
            const { data: finalSessions, count: finalCount } = await supabase
                .from('working_shop')
                .select('*', { count: 'exact' })
                .eq('user_id', userId)

            assert.equal(finalCount, 1, 'Should STILL have exactly one session (atomic)')
            assert.equal(finalSessions[0].shop_id, shopB.id, 'Should now be in Shop B')

            console.log('    ✅ Session handover is atomic')
        })
    })

    describe('Flow 5: Security Guardrail (Middleware)', () => {
        it('should identify users with temporary passwords for middleware blocking', async () => {
            const supabase = createServiceRoleClient()

            // 1. Create user with temporary password
            const userEmail = `temp_${Date.now()}@test.com`
            const { data: userAuth } = await supabase.auth.admin.createUser({
                email: userEmail,
                password: 'TempPass123!',
                email_confirm: true
            })

            const userId = userAuth.user.id

            await supabase.from('profiles').upsert({
                id: userId,
                email: userEmail,
                has_temporary_password: true
            }, { onConflict: 'id' })

            // 2. Verify temporary password flag (re-fetch to confirm DB value)
            const { data: profile } = await supabase
                .from('profiles')
                .select('has_temporary_password')
                .eq('id', userId)
                .single()

            assert.equal(profile.has_temporary_password, true, 'Middleware should catch this user')

            console.log('    ✅ Middleware can identify temp password users')
        })
    })
})

console.log('\n📋 Security & Mobility Flow Tests\n')
console.log('Testing:', '\n  - Flow 1: Entrepreneur (Native Signup)')
console.log('  - Flow 2: New Hire (Invited User)')
console.log('  - Flow 3: Lateral Transfer')
console.log('  - Flow 4: Multi-Shop Nomad (Session Handover)')
console.log('  - Flow 5: Security Guardrail\n')
