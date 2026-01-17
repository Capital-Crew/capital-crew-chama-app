const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function ensureAdminWallet() {
    try {
        // Find admin member
        const admin = await prisma.member.findUnique({
            where: { memberNumber: 1 },
            include: { wallet: true }
        })

        if (!admin) {
            console.log('❌ Admin member not found')
            return
        }

        console.log('✅ Admin member found:', admin.name)

        if (admin.wallet) {
            console.log('✅ Wallet already exists')
            console.log('   Balance:', admin.wallet.balance)
        } else {
            console.log('⚠️  No wallet found - creating one...')

            const wallet = await prisma.wallet.create({
                data: {
                    memberId: admin.id,
                    balance: 0
                }
            })

            console.log('✅ Wallet created successfully!')
            console.log('   Wallet ID:', wallet.id)
            console.log('   Balance:', wallet.balance)
        }

    } catch (error) {
        console.error('❌  Error:', error.message)
    } finally {
        await prisma.$disconnect()
    }
}

ensureAdminWallet()
