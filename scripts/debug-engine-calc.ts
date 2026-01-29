
import { AccountingEngine, getMemberContributionBalance } from '@/lib/accounting/AccountingEngine'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Verifying AccountingEngine Calculation...')

    // 1. Get SysAdmin ID
    const sysAdmin = await prisma.member.findFirst({ where: { name: 'System Administrator' } })
    if (!sysAdmin) return

    console.log(`Member: ${sysAdmin.name}`)

    // 2. Call the Engine Function directly
    try {
        const balance = await getMemberContributionBalance(sysAdmin.id)
        console.log(`Engine.getMemberContributionBalance: ${balance}`)
    } catch (e) {
        console.error('Error calling engine:', e)
    }

    // 3. Call generic getAccountBalance directly for 1200
    try {
        const bal = await AccountingEngine.getAccountBalance('1200', sysAdmin.id)
        console.log(`AccountingEngine.getAccountBalance('1200'): ${bal}`)
    } catch (e) {
        console.error('Error calling generic balance:', e)
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
