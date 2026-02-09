/**
 * Debug script to diagnose password authentication issues
 * Usage: npx tsx scripts/debug-passwords.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Password Authentication Diagnostic Tool')
    console.log('='.repeat(50))

    // 1. Fetch all users (limit to 10 for safety)
    const users = await prisma.user.findMany({
        take: 10,
        select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            lockoutUntil: true,
            failedLoginAttempts: true,
        }
    })

    console.log(`\n📋 Found ${users.length} users in database:\n`)

    for (const user of users) {
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
        console.log(`📧 Email: ${user.email}`)
        console.log(`👤 Name: ${user.name}`)
        console.log(`🔒 Hash Length: ${user.passwordHash?.length || 0} chars`)
        console.log(`🔐 Hash Preview: ${user.passwordHash?.substring(0, 20)}...`)

        // Check if hash looks like a valid bcrypt hash
        const isValidBcryptFormat = user.passwordHash?.startsWith('$2')
        console.log(`✅ Valid bcrypt format: ${isValidBcryptFormat}`)

        // Check lockout status
        if (user.lockoutUntil && user.lockoutUntil > new Date()) {
            console.log(`⚠️  LOCKED OUT until: ${user.lockoutUntil}`)
        }
        if (user.failedLoginAttempts > 0) {
            console.log(`⚠️  Failed attempts: ${user.failedLoginAttempts}`)
        }

        // Test password verification with known test password
        const testPasswords = ['Admin123!', 'password123', '123456']
        console.log(`\n🧪 Testing passwords:`)

        for (const testPwd of testPasswords) {
            try {
                const match = await bcrypt.compare(testPwd, user.passwordHash)
                if (match) {
                    console.log(`   ✅ "${testPwd}" MATCHES!`)
                }
            } catch (err) {
                console.log(`   ❌ Error testing "${testPwd}": ${err}`)
            }
        }
        console.log('')
    }

    // 2. Test bcrypt is working correctly
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔧 Verifying bcrypt library functionality:')

    const testPassword = 'TestPassword123!'
    const hash = await bcrypt.hash(testPassword, 10)
    const verification = await bcrypt.compare(testPassword, hash)

    console.log(`   Hash created: ${hash.substring(0, 20)}...`)
    console.log(`   Verification: ${verification ? '✅ Working' : '❌ BROKEN'}`)

    // 3. Generate a fresh hash for Admin123! that can be used
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔑 Fresh hash for "Admin123!" (if you need to reset):')
    const freshAdminHash = await bcrypt.hash('Admin123!', 10)
    console.log(`   ${freshAdminHash}`)

    console.log('\n✅ Diagnostic complete!')
}

main()
    .catch((e) => {
        console.error('❌ Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
