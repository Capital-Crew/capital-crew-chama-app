
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const modules = await prisma.systemModule.findMany()
    console.log('System Modules in DB:', JSON.stringify(modules, null, 2))
    const permissions = await prisma.rolePermission.findMany({
        where: { moduleKey: 'REPORTS_HUB' }
    })
    console.log('REPORTS_HUB Permissions in DB:', JSON.stringify(permissions, null, 2))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
