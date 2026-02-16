
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function upgradeToChairperson() {
    try {
        const userEmail = 'geoffmwangi125@gmail.com'

        // Find the user
        const user = await prisma.user.findUnique({
            where: { email: userEmail },
            include: { member: true }
        })

        if (!user) {
            console.log('❌ User not found:', userEmail)
            return
        }

        console.log('📋 Current User Details:')
        console.log('   Email:', user.email)
        console.log('   Current Role:', user.role)
        console.log('   Member:', user.member?.name)

        // Upgrade to CHAIRPERSON
        const updatedUser = await prisma.user.update({
            where: { email: userEmail },
            data: {
                role: 'CHAIRPERSON'
            }
        })

        console.log('\n✅ User upgraded successfully!')
        console.log('   New Role:', updatedUser.role)
        console.log('\n💡 This user now has full administrative access')

    } catch (error) {
        console.error('❌ Error:', error.message)
    } finally {
        await prisma.$disconnect()
    }
}

upgradeToChairperson()
