/**
 * Emergency Password Reset Script
 * Usage: npx tsx scripts/reset-passwords.ts
 * 
 * This will reset ALL user passwords to a temporary password
 * and set mustChangePassword = true so they're forced to change it on login.
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// The temporary password that will be set for all users
const TEMP_PASSWORD = 'TempPass123!'

async function main() {
    console.log('🔐 Emergency Password Reset Tool')
    console.log('='.repeat(50))
    console.log(`⚠️  This will reset ALL user passwords to: ${TEMP_PASSWORD}`)
    console.log('⚠️  Users will be required to change password on next login\n')

    // Hash the temporary password
    const hashedPassword = await bcrypt.hash(TEMP_PASSWORD, 10)

    // Verify the hash works
    const verification = await bcrypt.compare(TEMP_PASSWORD, hashedPassword)
    if (!verification) {
        console.error('❌ FATAL: bcrypt verification failed!')
        process.exit(1)
    }
    console.log('✅ Password hash verified\n')

    // Fetch all users
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
        }
    })

    console.log(`📋 Found ${users.length} users to reset:\n`)

    // Reset each user's password
    for (const user of users) {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: hashedPassword,
                mustChangePassword: true,
                failedLoginAttempts: 0,
                lockoutUntil: null,
            }
        })
        console.log(`   ✅ Reset: ${user.email} (${user.name})`)
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎉 Password Reset Complete!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📧 Temporary Password: ${TEMP_PASSWORD}`)
    console.log('⚠️  All users will be prompted to change password on login')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

main()
    .catch((e) => {
        console.error('❌ Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
