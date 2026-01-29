
import { calculateBorrowingPower } from '@/lib/utils/credit-limit'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Debugging Borrowing Power...')

    // 1. Get SysAdmin
    const sysAdmin = await prisma.member.findFirst({ where: { name: 'System Administrator' } })
    if (!sysAdmin) return

    console.log(`Member: ${sysAdmin.name} (${sysAdmin.id})`)

    // 2. Calculate
    try {
        const snapshot = await calculateBorrowingPower(sysAdmin.id)
        console.log('Snapshot Result:')
        console.log(JSON.stringify(snapshot, null, 2))
    } catch (e) {
        console.error('Error:', e)
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
