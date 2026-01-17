const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function setupAdmin() {
    try {
        // Check if admin user exists
        const adminEmail = 'admin@capitalcrew.com'
        const existingUser = await prisma.user.findUnique({
            where: { email: adminEmail },
            include: { member: true }
        })

        if (existingUser) {
            console.log('✅ Admin user already exists!')
            console.log('📧 Email:', existingUser.email)
            console.log('👤 Role:', existingUser.role)
            console.log('🔢 Member Number:', existingUser.member?.memberNumber)
            console.log('\n🔑 Default Password: Admin@123')
            console.log('⚠️  If you changed it, use your new password')
            return
        }

        // Find member with number 1 or create new one
        let member = await prisma.member.findUnique({
            where: { memberNumber: 1 }
        })

        if (!member) {
            // Create new member
            member = await prisma.member.create({
                data: {
                    memberNumber: 1,
                    name: 'System Administrator',
                    contact: '+254700000000'
                }
            })
            console.log('✅ Created new member #1')
        } else {
            console.log('✅ Found existing member #1:', member.name)
        }

        // Create admin user
        const passwordHash = await bcrypt.hash('Admin@123', 10)
        const user = await prisma.user.create({
            data: {
                email: adminEmail,
                passwordHash: passwordHash,
                name: 'System Administrator',
                role: 'CHAIRPERSON',
                memberId: member.id,
                permissions: {
                    canViewAll: true,
                    canAddData: true,
                    canApprove: true,
                    canManageSettings: true,
                    canViewReports: true,
                    canViewAudit: true,
                    canManageUserRights: true,
                    canExemptFees: true
                }
            }
        })

        console.log('\n✅ Admin user created successfully!')
        console.log('📧 Email:', adminEmail)
        console.log('🔑 Password: Admin@123')
        console.log('👤 Role:', user.role)
        console.log('🔢 Member Number:', member.memberNumber)
        console.log('\n⚠️  Please change the password after first login!')

    } catch (error) {
        console.error('❌ Error:', error.message)
    } finally {
        await prisma.$disconnect()
    }
}

setupAdmin()
