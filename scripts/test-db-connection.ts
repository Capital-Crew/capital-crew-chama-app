
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔌 Testing Database Connection...')
    try {
        const userCount = await prisma.user.count()
        console.log(`✅ Connected successfully! Found ${userCount} users.`)

        const adminUser = await prisma.user.findUnique({
            where: { email: 'admin@capitalcrew.com' }
        })

        if (adminUser) {
            console.log('✅ Admin user found: admin@capitalcrew.com')
        } else {
            console.log('⚠️  Admin user NOT found.')
        }

    } catch (e) {
        console.error('❌ Connection failed:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
