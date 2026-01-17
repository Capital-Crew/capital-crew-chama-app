import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function verifyUser() {
    console.log('🔍 Checking user credentials...\n')

    const user = await prisma.user.findUnique({
        where: { email: 'admin@capitalcrew.com' },
        include: { member: true }
    })

    if (!user) {
        console.log('❌ User not found!')
        console.log('Run: npx tsx prisma/seed-user.ts')
        return
    }

    console.log('✅ User found in database:')
    console.log('   Email:', user.email)
    console.log('   Name:', user.name)
    console.log('   Role:', user.role)
    console.log('   Member ID:', user.memberId)
    console.log('   Member:', user.member?.name)
    console.log('')

    // Test password
    const testPassword = 'Admin123!'
    const isPasswordValid = await bcrypt.compare(testPassword, user.password)

    if (isPasswordValid) {
        console.log('✅ Password verification: SUCCESS')
        console.log('   The password "Admin123!" is correct!')
    } else {
        console.log('❌ Password verification: FAILED')
        console.log('   The stored password hash does not match "Admin123!"')
        console.log('   Resetting password...')

        // Reset password
        const newHash = await bcrypt.hash('Admin123!', 10)
        await prisma.user.update({
            where: { id: user.id },
            data: { password: newHash }
        })

        console.log('✅ Password reset to: Admin123!')
    }

    console.log('')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 Login Credentials:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📧 Email:    admin@capitalcrew.com')
    console.log('🔑 Password: Admin123!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    console.log('🌐 Login URL: http://localhost:3000/login')
}

verifyUser()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
