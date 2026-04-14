import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

async function main() {
    const prisma = new PrismaClient()
    try {
        const hash = await bcrypt.hash('Password12345', 10)
        const user = await prisma.user.update({
            where: { email: 'admin@capitalcrew.co.ke' },
            data: {
                passwordHash: hash,
                mustChangePassword: true,
                failedLoginAttempts: 0,
                lockoutUntil: null
            }
        })
        console.log('✅ Password reset for:', user.email)
    } catch (e) {
        console.error('❌ Error:', e)
    } finally {
        await prisma.$disconnect()
    }
}
main()
