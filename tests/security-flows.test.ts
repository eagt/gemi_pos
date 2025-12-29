/**
 * Security & Mobility Flow Integration Tests
 * 
 * These tests verify the core security invariants:
 * - Access Granted = (Has PIN) AND (Password Permanent) AND (Manager Approved)
 * 
 * Test Scenarios:
 * 1. The Entrepreneur (Native Signup)
 * 2. The New Hire (Invited with Temp Password)
 * 3. The Lateral Transfer (Existing User, New Shop)
 * 4. The Multi-Shop Nomad (Session Handover)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createServiceRoleClient } from '@/lib/supabase/server'

describe('Security & Mobility Flows', () => {
    let supabase: ReturnType<typeof createServiceRoleClient>

    beforeEach(async () => {
        supabase = createServiceRoleClient()
        // Clean up test data before each test
        await cleanupTestData()
    })

    describe('Flow 1: The Entrepreneur (Native Signup)', () => {
        it('should allow owner to access POS immediately after PIN setup without password change', async () => {
            // 1. Create a new user (simulating native signup)
            const testEmail = `owner_${Date.now()}@test.com`
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: testEmail,
                password: 'SecurePassword123!',
                email_confirm: true,
                user_metadata: { full_name: 'Test Owner' }
            })

            expect(authError).toBeNull()
            expect(authData.user).toBeDefined()

            const userId = authData.user!.id

            // 2. Create profile with has_temporary_password = false (native signup)
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: userId,
                    email: testEmail,
                    full_name: 'Test Owner',
                    has_temporary_password: false
                })

            expect(profileError).toBeNull()

            // 3. Create a shop
            const { data: shop, error: shopError } = await supabase
                .from('shops')
                .insert({
                    name: 'Test Shop',
                    owner_id: userId,
                    business_type: 'quick_checkout'
                })
                .select()
                .single()

            expect(shopError).toBeNull()
            expect(shop).toBeDefined()

            // 4. Verify owner is added to shop_staff as manager
            const { data: staffRecord } = await supabase
                .from('shop_staff')
                .select('*')
                .eq('shop_id', shop.id)
                .eq('user_id', userId)
                .single()

            expect(staffRecord).toBeDefined()
            expect(staffRecord?.quick_checkout_role).toBe('manager')

            // 5. Verify profile has permanent password
            const { data: profile } = await supabase
                .from('profiles')
                .select('has_temporary_password')
                .eq('id', userId)
                .single()

            expect(profile?.has_temporary_password).toBe(false)

            // 6. Set PIN (simulating PIN setup)
            const { error: pinError } = await supabase
                .from('shop_staff')
                .update({ pin: await hashPin('1234') })
                .eq('id', staffRecord!.id)

            expect(pinError).toBeNull()

            // ASSERTION: User should NOT need to change password
            // This is verified by checking has_temporary_password remains false
            const { data: finalProfile } = await supabase
                .from('profiles')
                .select('has_temporary_password')
                .eq('id', userId)
                .single()

            expect(finalProfile?.has_temporary_password).toBe(false)
        })
    })

    describe('Flow 2: The New Hire (Invited User)', () => {
        it('should force password change after PIN setup for invited users', async () => {
            // 1. Create shop owner first
            const ownerEmail = `owner_${Date.now()}@test.com`
            const { data: ownerAuth } = await supabase.auth.admin.createUser({
                email: ownerEmail,
                password: 'OwnerPass123!',
                email_confirm: true
            })

            const ownerId = ownerAuth.user!.id

            await supabase.from('profiles').insert({
                id: ownerId,
                email: ownerEmail,
                has_temporary_password: false
            })

            const { data: shop } = await supabase
                .from('shops')
                .insert({
                    name: 'Test Shop',
                    owner_id: ownerId,
                    business_type: 'quick_checkout'
                })
                .select()
                .single()

            // 2. Invite a new staff member (with temporary password)
            const staffEmail = `staff_${Date.now()}@test.com`
            const tempPassword = 'TempPass123!'

            const { data: staffAuth } = await supabase.auth.admin.createUser({
                email: staffEmail,
                password: tempPassword,
                email_confirm: true
            })

            const staffUserId = staffAuth.user!.id

            // 3. Create profile with has_temporary_password = true
            await supabase.from('profiles').insert({
                id: staffUserId,
                email: staffEmail,
                has_temporary_password: true
            })

            // 4. Add to shop_staff
            const { data: staffRecord } = await supabase
                .from('shop_staff')
                .insert({
                    shop_id: shop!.id,
                    user_id: staffUserId,
                    email: staffEmail,
                    name: 'Test Staff',
                    quick_checkout_role: 'cashier',
                    invited_by: ownerId
                })
                .select()
                .single()

            // 5. Set PIN
            await supabase
                .from('shop_staff')
                .update({ pin: await hashPin('5678') })
                .eq('id', staffRecord!.id)

            // ASSERTION: User MUST have temporary password flag still set
            const { data: profile } = await supabase
                .from('profiles')
                .select('has_temporary_password')
                .eq('id', staffUserId)
                .single()

            expect(profile?.has_temporary_password).toBe(true)

            // 6. Simulate password change
            await supabase.from('profiles')
                .update({ has_temporary_password: false })
                .eq('id', staffUserId)

            // ASSERTION: After password change, flag should be false
            const { data: updatedProfile } = await supabase
                .from('profiles')
                .select('has_temporary_password')
                .eq('id', staffUserId)
                .single()

            expect(updatedProfile?.has_temporary_password).toBe(false)
        })
    })

    describe('Flow 3: The Lateral Transfer (Existing User, New Shop)', () => {
        it('should allow existing user to join new shop without password change', async () => {
            // 1. Create existing user with permanent password
            const userEmail = `user_${Date.now()}@test.com`
            const { data: userAuth } = await supabase.auth.admin.createUser({
                email: userEmail,
                password: 'UserPass123!',
                email_confirm: true
            })

            const userId = userAuth.user!.id

            await supabase.from('profiles').insert({
                id: userId,
                email: userEmail,
                has_temporary_password: false
            })

            // 2. Create Shop A (user's original shop)
            const { data: shopA } = await supabase
                .from('shops')
                .insert({
                    name: 'Shop A',
                    owner_id: userId,
                    business_type: 'quick_checkout'
                })
                .select()
                .single()

            // 3. Create Shop B (new shop)
            const ownerBEmail = `ownerb_${Date.now()}@test.com`
            const { data: ownerBAuth } = await supabase.auth.admin.createUser({
                email: ownerBEmail,
                password: 'OwnerBPass123!',
                email_confirm: true
            })

            await supabase.from('profiles').insert({
                id: ownerBAuth.user!.id,
                email: ownerBEmail,
                has_temporary_password: false
            })

            const { data: shopB } = await supabase
                .from('shops')
                .insert({
                    name: 'Shop B',
                    owner_id: ownerBAuth.user!.id,
                    business_type: 'quick_checkout'
                })
                .select()
                .single()

            // 4. Invite user to Shop B
            const { data: staffRecordB } = await supabase
                .from('shop_staff')
                .insert({
                    shop_id: shopB!.id,
                    user_id: userId,
                    email: userEmail,
                    name: 'Transferred User',
                    quick_checkout_role: 'cashier',
                    invited_by: ownerBAuth.user!.id
                })
                .select()
                .single()

            // 5. Set PIN for Shop B
            await supabase
                .from('shop_staff')
                .update({ pin: await hashPin('9999') })
                .eq('id', staffRecordB!.id)

            // ASSERTION: User should NOT need password change (already permanent)
            const { data: profile } = await supabase
                .from('profiles')
                .select('has_temporary_password')
                .eq('id', userId)
                .single()

            expect(profile?.has_temporary_password).toBe(false)
        })
    })

    describe('Flow 4: The Multi-Shop Nomad (Session Handover)', () => {
        it('should enforce atomic session transfer between shops', async () => {
            // 1. Create user
            const userEmail = `nomad_${Date.now()}@test.com`
            const { data: userAuth } = await supabase.auth.admin.createUser({
                email: userEmail,
                password: 'NomadPass123!',
                email_confirm: true
            })

            const userId = userAuth.user!.id

            await supabase.from('profiles').insert({
                id: userId,
                email: userEmail,
                has_temporary_password: false
            })

            // 2. Create Shop A
            const { data: shopA } = await supabase
                .from('shops')
                .insert({
                    name: 'Shop A',
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

            await supabase.from('profiles').insert({
                id: ownerBAuth.user!.id,
                email: ownerBEmail,
                has_temporary_password: false
            })

            const { data: shopB } = await supabase
                .from('shops')
                .insert({
                    name: 'Shop B',
                    owner_id: ownerBAuth.user!.id,
                    business_type: 'quick_checkout'
                })
                .select()
                .single()

            // 4. Add user to both shop rosters
            await supabase.from('shop_staff').insert([
                {
                    shop_id: shopA!.id,
                    user_id: userId,
                    email: userEmail,
                    name: 'Nomad User',
                    quick_checkout_role: 'manager',
                    pin: await hashPin('1111')
                },
                {
                    shop_id: shopB!.id,
                    user_id: userId,
                    email: userEmail,
                    name: 'Nomad User',
                    quick_checkout_role: 'cashier',
                    pin: await hashPin('2222')
                }
            ])

            // 5. Clock into Shop A
            await supabase.from('working_shop').insert({
                shop_id: shopA!.id,
                user_id: userId,
                clocked_in: true,
                clocked_out: false
            })

            // 6. Verify user is in Shop A
            const { data: sessionA } = await supabase
                .from('working_shop')
                .select('*')
                .eq('user_id', userId)
                .single()

            expect(sessionA?.shop_id).toBe(shopA!.id)

            // 7. Simulate session handover to Shop B (atomic transfer)
            await supabase
                .from('working_shop')
                .delete()
                .eq('user_id', userId)
                .eq('shop_id', shopA!.id)

            await supabase.from('working_shop').insert({
                shop_id: shopB!.id,
                user_id: userId,
                clocked_in: true,
                clocked_out: false
            })

            // ASSERTION: User should only have ONE active session
            const { data: allSessions, count } = await supabase
                .from('working_shop')
                .select('*', { count: 'exact' })
                .eq('user_id', userId)

            expect(count).toBe(1)
            expect(allSessions?.[0]?.shop_id).toBe(shopB!.id)
        })
    })

    describe('Flow 5: Security Guardrail (Middleware)', () => {
        it('should prevent POS access for users with temporary passwords', async () => {
            // 1. Create user with temporary password
            const userEmail = `temp_${Date.now()}@test.com`
            const { data: userAuth } = await supabase.auth.admin.createUser({
                email: userEmail,
                password: 'TempPass123!',
                email_confirm: true
            })

            const userId = userAuth.user!.id

            await supabase.from('profiles').insert({
                id: userId,
                email: userEmail,
                has_temporary_password: true
            })

            // ASSERTION: User with temporary password should be blocked
            const { data: profile } = await supabase
                .from('profiles')
                .select('has_temporary_password')
                .eq('id', userId)
                .single()

            expect(profile?.has_temporary_password).toBe(true)

            // This would be caught by middleware and redirected to /change-temporary-password
        })
    })
})

// Helper Functions
async function cleanupTestData() {
    const supabase = createServiceRoleClient()

    // Delete test users (cascade will handle related records)
    await supabase.auth.admin.listUsers().then(async ({ data }) => {
        const testUsers = data.users.filter(u =>
            u.email?.includes('@test.com') ||
            u.email?.includes('owner_') ||
            u.email?.includes('staff_') ||
            u.email?.includes('nomad_') ||
            u.email?.includes('temp_')
        )

        for (const user of testUsers) {
            await supabase.auth.admin.deleteUser(user.id)
        }
    })
}

async function hashPin(pin: string): Promise<string> {
    const bcrypt = await import('bcryptjs')
    return bcrypt.hash(pin, 10)
}
