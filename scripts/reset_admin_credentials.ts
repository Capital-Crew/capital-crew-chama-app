
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Resetting Admin User...')
    const email = 'admin@capitalcrew.com'
    const password = 'Admin@2025'
    const hashedPassword = await bcrypt.hash(password, 10)

    const permissions = {
        canViewAll: true,
        canAddData: true,
        canApprove: true,
        canManageSettings: true,
        canViewReports: true,
        canViewAudit: true,
        canManageUserRights: true,
        canExemptFees: true,
        canReverse: true,
        canEnrollMembers: true
    }

    // 1. Ensure Member exists
    let member = await prisma.member.findFirst({
        where: { OR: [{ contact: email }, { name: 'System Administrator' }] }
    })

    if (!member) {
        // Create if missing
        const lastMember = await prisma.member.findFirst({ orderBy: { memberNumber: 'desc' } })
        const memberNumber = (lastMember?.memberNumber || 0) + 1
        console.log(`Creating new member for admin... #${memberNumber}`)

        member = await prisma.member.create({
            data: {
                memberNumber,
                name: 'System Administrator',
                contact: email
            }
        })
    }

    // 2. Upsert User
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash: hashedPassword,
            role: 'SYSTEM_ADMIN', // Use the new role
            permissions: permissions,
            memberId: member.id,
            name: 'System Administrator'
        },
        create: {
            email,
            name: 'System Administrator',
            passwordHash: hashedPassword,
            role: 'SYSTEM_ADMIN',
            permissions: permissions,
            memberId: member.id,
            mustChangePassword: false
        }
    })

    console.log('✅ Admin User Updated Successfully!')
    console.log(`   Email: ${user.email}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Password: ${password}`)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
