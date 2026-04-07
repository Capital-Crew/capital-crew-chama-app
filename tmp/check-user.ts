
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@capitalcrew.com'
  const user = await prisma.user.findUnique({
    where: { email },
    include: { member: true }
  })

  if (!user) {
    console.log('User not found')
    return
  }

  console.log('User Record:', JSON.stringify({
    id: user.id,
    email: user.email,
    role: user.role,
    failedLoginAttempts: user.failedLoginAttempts,
    lockoutUntil: user.lockoutUntil,
    mustChangePassword: user.mustChangePassword,
    hasPasswordHash: !!user.passwordHash
  }, null, 2))

  const testPassword = 'Admin1234!'
  if (user.passwordHash) {
    const isValid = await bcrypt.compare(testPassword, user.passwordHash)
    console.log(`Password match with "Admin123!": ${isValid}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
