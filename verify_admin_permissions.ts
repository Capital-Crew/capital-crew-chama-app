
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    console.log('Verifying Admin Permissions Logic...')

    // 1. Fetch the user exactly as the app does
    const email = 'admin@capitalcrew.com'
    const userRole = await prisma.user.findUnique({
        where: { email },
        select: { role: true, permissions: true }
    })

    if (!userRole) {
        console.error('❌ User not found!')
        return
    }

    console.log('User Role:', userRole.role)
    console.log('User Permissions:', userRole.permissions)

    // 2. Replicate the logic from app/actions.ts
    const permissions = userRole.permissions || {}
    const isSystemAdmin = userRole.role === 'SYSTEM_ADMIN'
    const hasEnrollPermission = permissions.canEnrollMembers === true

    console.log(`- Is System Admin? ${isSystemAdmin}`)
    console.log(`- Has Enroll Permission? ${hasEnrollPermission}`)
    console.log(`- Is Restricted Role (Chair/Sec/Treas)? ${['CHAIRPERSON', 'SECRETARY', 'TREASURER'].includes(userRole.role)}`)

    // THE CHECK
    if (!isSystemAdmin && !['CHAIRPERSON', 'SECRETARY', 'TREASURER'].includes(userRole.role) && !hasEnrollPermission) {
        console.error('❌ CHECK FAILED: User would be DENIED access.')
    } else {
        console.log('✅ CHECK PASSED: User would be ALLOWED to enroll members.')
    }
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
