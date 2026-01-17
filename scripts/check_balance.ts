
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const member = await prisma.member.findUnique({
        where: { id: 'cmk5dyz5l0000tmeg8aqhxu9n' }, // Session Member ID
        include: { wallet: true }
    })

    if (member) {
        // We use the AccountingEngine to get the true ledger balance
        const { AccountingEngine } = await import('@/lib/accounting/AccountingEngine')
        const { getSystemMappingsDict } = await import('@/app/actions/system-accounting')

        const mappings = await getSystemMappingsDict()
        const balance = await AccountingEngine.getAccountBalance(mappings.MEMBER_WALLET, member.id)

        console.log(`Member: ${member.name}`)
        console.log(`Wallet Balance (Ledger): ${balance}`)
    } else {
        console.log("Member not found (ID: cmk5dyz5l0000tmeg8aqhxu9n)")
    }
}
main()
