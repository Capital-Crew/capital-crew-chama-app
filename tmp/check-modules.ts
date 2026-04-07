
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

async function main() {
  const modules = await db.systemModule.findMany()
  console.log('System Modules:', JSON.stringify(modules, null, 2))
  
  const roles = ['SYSTEM_ADMIN', 'CHAIRPERSON', 'TREASURER', 'SECRETARY', 'MEMBER']
  for (const role of roles) {
    const permissions = await db.rolePermission.findMany({ where: { role: role as any } })
    console.log(`Permissions for ${role}:`, permissions.filter(p => p.canAccess).map(p => p.moduleKey))
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
