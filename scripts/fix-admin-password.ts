import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'admin@capitalcrew.com'
    const password = 'Admin123!'

    console.log(`🔍 Checking user ${email}...`)

    const user = await prisma.user.findUnique({
        where: { email }
    })

    if (!user) {
        console.error('❌ User not found!')
        return
    }

    console.log('✅ User found. Updating password hash...')

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.update({
        where: { email },
        data: {
            passwordHash: hashedPassword
        }
    })

    console.log('✅ Password hash updated successfully.')
    console.log('🔑 New Password:', password)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
