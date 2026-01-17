const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUsers() {
    try {
        const users = await prisma.user.findMany({
            include: { member: true },
            orderBy: { createdAt: 'asc' }
        })

        console.log('\n📋 All Users in Database:\n')

        if (users.length === 0) {
            console.log('❌ No users found in database')
            return
        }

        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email}`)
            console.log(`   Role: ${user.role}`)
            console.log(`   Member: ${user.member?.name || 'No member linked'} (#${user.member?.memberNumber || 'N/A'})`)
            console.log(`   Created: ${user.createdAt.toISOString().split('T')[0]}`)
            console.log('')
        })

        const adminUser = users.find(u => u.role === 'CHAIRPERSON')
        if (adminUser) {
            console.log('✅ Admin/Chairperson found:')
            console.log(`   Email: ${adminUser.email}`)
            console.log(`   Member: ${adminUser.member?.name}`)
            console.log('\n💡 You can use this account to login')
        } else {
            console.log('⚠️  No CHAIRPERSON role found')
        }

    } catch (error) {
        console.error('❌ Error:', error.message)
    } finally {
        await prisma.$disconnect()
    }
}

checkUsers()
