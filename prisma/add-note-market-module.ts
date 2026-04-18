
import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Adding Note Market Module ---')

  const moduleDef = { 
    key: 'NOTE_MARKET', 
    name: 'Note Market', 
    description: 'Secondary market for Loan Notes and investments' 
  };

  // 1. Upsert Module
  await prisma.systemModule.upsert({
    where: { key: moduleDef.key },
    update: { name: moduleDef.name, description: moduleDef.description },
    create: moduleDef,
  })
  console.log('Module registered.')

  // 2. Setup Default Permissions (Enabled for all major roles)
  const roles: UserRole[] = [
    UserRole.SYSTEM_ADMIN, 
    UserRole.CHAIRPERSON, 
    UserRole.TREASURER, 
    UserRole.SECRETARY, 
    UserRole.MEMBER
  ];

  for (const role of roles) {
    await prisma.rolePermission.upsert({
      where: {
        role_moduleKey: {
          role,
          moduleKey: moduleDef.key
        }
      },
      update: { canAccess: true },
      create: {
        role,
        moduleKey: moduleDef.key,
        canAccess: true
      }
    })
  }
  
  console.log('Default permissions configured for Note Market.')
  console.log('--- Completed ---')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
