
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkRecentNotifications() {
  const recent = await prisma.notification.findMany({
    take: 10,
    orderBy: { timestamp: 'desc' },
    select: { message: true, timestamp: true }
  })

  console.log("Recent Notifications:")
  recent.forEach(n => {
    console.log(`[${n.timestamp.toISOString()}] ${n.message}`)
    if (n.message.toLowerCase().includes("password is:")) {
        console.log(">> ALERT: Found plaintext password in notification log!")
    }
  })
}

checkRecentNotifications().finally(() => prisma.$disconnect())
