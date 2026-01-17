const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createSeparateAdmin() {
    try {
        const adminEmail = 'admin@capitalcrew.com'
        const adminPassword = 'Admin@123'

        // Check if admin already exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email: adminEmail }
        })

        if (existingAdmin) {
            console.log('❌ Admin account already exists with email:', adminEmail)
            console.log('💡 Use the upgrade script to change role if needed')
            return
        }

        // Get the highest member number
        const lastMember = await prisma.member.findFirst({
            orderBy: { memberNumber: 'desc' }
        })

        const newMemberNumber = (lastMember?.memberNumber || 10000) + 1

        console.log('📋 Creating new admin account...')
        console.log('   Member Number:', newMemberNumber)

        // Create new member for admin
        const member = await prisma.member.create({
            data: {
                memberNumber: newMemberNumber,
                name: 'System Administrator',
                contact: '+254700000000',
                status: 'ACTIVE'
            }
        })

        console.log('✅ Member created:', member.name, '#' + member.memberNumber)

        // Hash password
        const passwordHash = await bcrypt.hash(adminPassword, 10)

        // Create admin user
        const adminUser = await prisma.user.create({
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

        // Create wallet for the admin member
        await prisma.wallet.create({
            data: {
                memberId: member.id,
                balance: 0
            }
        })

        console.log('\n✅ Admin account created successfully!')
        console.log('\n📧 Email:', adminEmail)
        console.log('🔑 Password:', adminPassword)
        console.log('👤 Role:', adminUser.role)
        console.log('🔢 Member Number:', member.memberNumber)
        console.log('💰 Wallet: Created with balance 0')
        console.log('\n⚠️  IMPORTANT: Change the password after first login!')
        console.log('⚠️  Store these credentials securely!')

    } catch (error) {
        console.error('❌ Error:', error.message)
        if (error.code === 'P2002') {
            console.log('💡 This might be a duplicate. Check existing users with: node scripts/list-users.js')
        }
    } finally {
        await prisma.$disconnect()
    }
}

createSeparateAdmin()
