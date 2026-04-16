
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function purgeLegacyPasswords() {
  console.log("Starting legacy password purge...")

  const updatedMessage = "Welcome to Capital Crew! Your account has been initialized. Please secure your login credentials from your administrator."
  
  const result = await prisma.notification.updateMany({
    where: {
      message: {
        contains: "Your temporary password is:"
      }
    },
    data: {
      message: updatedMessage
    }
  })

  console.log(`Successfully redacted ${result.count} legacy notification records.`)
}

purgeLegacyPasswords().finally(() => prisma.$disconnect())
