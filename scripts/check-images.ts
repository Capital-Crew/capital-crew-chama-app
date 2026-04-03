import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkImage() {
  const members = await prisma.member.findMany({
    take: 5,
    include: {
      user: true
    }
  })

  members.forEach(m => {
    console.log(`Member: ${m.name} (${m.id})`)
    console.log(`User ID: ${m.user?.id || 'NONE'}`)
    console.log(`Has Image: ${m.user?.image ? 'YES' : 'NO'}`)
    if (m.user?.image) {
        console.log(`Image Length: ${m.user.image.length}`)
        console.log(`Image Start: ${m.user.image.substring(0, 50)}...`)
    }
    console.log('---')
  })
}

checkImage()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
