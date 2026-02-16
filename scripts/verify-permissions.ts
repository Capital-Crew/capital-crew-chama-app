
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyPermissions() {
    console.log('🕵️ Verifying Module Access...')

    const roles = ['MEMBER', 'CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN']
    const expectedModules = ['DASHBOARD', 'APPROVALS', 'MEMBERS', 'LOANS', 'WALLET', 'WELFARE', 'ACCOUNTS', 'ADMIN', 'AUDIT']

    const allModules = await prisma.systemModule.findMany({ select: { key: true } })
    const allModuleKeys = allModules.map(m => m.key)

    console.log(`📚 Found ${allModuleKeys.length} System Modules: ${allModuleKeys.join(', ')}`)

    for (const role of roles) {
        console.log(`\n👤 Checking Role: ${role}`)
        const permissions = await prisma.rolePermission.findMany({
            where: { role: role as any }
        })

        const accessibleModules = permissions.filter(p => p.canAccess).map(p => p.moduleKey)
        const missingModules = expectedModules.filter(m => !accessibleModules.includes(m))

        if (role === 'SYSTEM_ADMIN') {
            // System admin might use the wildcard or explicit
            // In our seed we gave explicit, but code also hardcodes checkPermission to true.
            // We just check DB state here.
        }

        if (missingModules.length === 0) {
            console.log(`   ✅ FULL ACCESS CONFIRMED (${accessibleModules.length} modules)`)
        } else {
            console.log(`   ❌ MISSING MODULES: ${missingModules.join(', ')}`)
            console.log(`   ⚠️  Accessible: ${accessibleModules.join(', ')}`)
        }
    }
}

verifyPermissions()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
