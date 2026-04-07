
import { PrismaClient, UserRole, MemberStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Starting Admin User Seed ---')

  const email = 'admin@capitalcrew.com'
  const password = 'Admin1234!'
  const hashedPassword = await bcrypt.hash(password, 10)

  // 1. Ensure Branch exists
  console.log('Step 1: Ensuring Head Office branch exists...')
  const branch = await prisma.branch.upsert({
    where: { code: 'HQ-01' },
    update: {},
    create: {
      name: 'Head Office',
      code: 'HQ-01'
    }
  })
  console.log('✅ Branch ready:', branch.name)

  // 2. Ensure Member exists
  console.log('Step 2: Ensuring System Admin member record exists...')
  const member = await prisma.member.upsert({
    where: { memberNumber: 1 },
    update: {
      name: 'System Administrator',
      status: MemberStatus.ACTIVE,
      branchId: branch.id
    },
    create: {
      memberNumber: 1,
      name: 'System Administrator',
      contact: '+254700000000',
      status: MemberStatus.ACTIVE,
      branchId: branch.id
    }
  })
  console.log('✅ Member ready:', member.name)

  // 3. Ensure User exists
  console.log(`Step 3: Creating/Updating user ${email}...`)
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hashedPassword,
      role: UserRole.SYSTEM_ADMIN,
      memberId: member.id,
      mustChangePassword: false
    },
    create: {
      email,
      name: 'Admin',
      passwordHash: hashedPassword,
      role: UserRole.SYSTEM_ADMIN,
      memberId: member.id,
      mustChangePassword: false
    }
  })
  console.log('✅ User ready:', user.email)

  console.log('--- Admin User Seed Completed Successfully ---')
  console.log(`\nCREDENTIALS:`)
  console.log(`Email:    ${email}`)
  console.log(`Password: ${password}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
