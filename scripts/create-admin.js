const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdmin() {
    try {
        // Admin details
        const adminEmail = 'admin@capitalcrew.com'
        const adminPassword = 'Admin@123'
        const adminName = 'System Administrator'
        const memberNumber = 1

        // Check if admin already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: adminEmail }
        })

        if (existingUser) {
            console.log('❌ Admin user already exists with email:', adminEmail)
            return
        }

        // Hash password
        const passwordHash = await bcrypt.hash(adminPassword, 10)

        // Create member first
        const member = await prisma.member.create({
            data: {
                memberNumber: memberNumber,
                name: adminName,
                contact: '+254700000000'
            }
        })

        console.log('✅ Member created:', member.memberNumber)

        // Create admin user
        const user = await prisma.user.create({
            data: {
                email: adminEmail,
                passwordHash: passwordHash,
                name: adminName,
                role: 'CHAIRPERSON',
                memberId: member.id
            }
        })

        console.log('✅ Admin user created successfully!')
        console.log('\n📧 Email:', adminEmail)
        console.log('🔑 Password:', adminPassword)
        console.log('👤 Role:', user.role)
        console.log('🔢 Member Number:', member.memberNumber)
        console.log('\n⚠️  Please change the password after first login!')

    } catch (error) {
        console.error('❌ Error creating admin:', error)
    } finally {
        await prisma.$disconnect()
    }
}

createAdmin()
