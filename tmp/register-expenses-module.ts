
import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Registering EXPENSES module...')
  
  const moduleKey = 'EXPENSES'
  
  // 1. Create the module
  await prisma.systemModule.upsert({
    where: { key: moduleKey },
    update: { name: 'Expenses Management' },
    create: {
      key: moduleKey,
      name: 'Expenses Management',
      description: 'Standalone module for group expenses and reimbursements'
    }
  })
  
  // 2. Grant access to all roles
  const roles = Object.values(UserRole)
  for (const role of roles) {
    await prisma.rolePermission.upsert({
      where: {
        role_moduleKey: {
          role,
          moduleKey
        }
      },
      update: { canAccess: true },
      create: {
        role,
        moduleKey,
        canAccess: true
      }
    })
    console.log(`Granted ${moduleKey} access to ${role}`)
  }
  
  console.log('✅ EXPENSES module registered successfully!')
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
