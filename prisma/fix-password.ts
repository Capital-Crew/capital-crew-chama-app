import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function fixUserPassword() {
    console.log('🔧 Fixing user password...\n')

    const user = await prisma.user.findUnique({
        where: { email: 'admin@capitalcrew.com' }
    })

    if (!user) {
        console.log('❌ User not found!')
        return
    }

    console.log('Found user:', user.email)
    console.log('Current password hash:', user.passwordHash ? 'EXISTS' : 'NULL/UNDEFINED')
    console.log('')

    // Hash the password
    const hashedPassword = await bcrypt.hash('Admin123!', 10)

    // Update user with hashed password
    await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashedPassword }
    })

    console.log('✅ Password updated successfully!')
    console.log('')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎉 Login Credentials Ready!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📧 Email:    admin@capitalcrew.com')
    console.log('🔑 Password: Admin123!')
    console.log('👤 Role:     CHAIRPERSON')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    console.log('🌐 Try logging in at: http://localhost:3000/login')
}

fixUserPassword()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
