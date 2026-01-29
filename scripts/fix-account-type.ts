
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- FIX ACCOUNT TYPE ---')

    // 1. Get Mapping
    const mapping = await prisma.systemAccountingMapping.findUnique({
        where: { type: 'CONTRIBUTIONS' },
        include: { account: true }
    })

    if (!mapping) return

    console.log(`Updating Account ${mapping.account.code} (${mapping.account.id})`)
    console.log(`Current Type: ${mapping.account.type}`)

    // 2. Update to EQUITY
    await prisma.ledgerAccount.update({
        where: { id: mapping.account.id },
        data: { type: 'EQUITY' } // or LIABILITY
    })

    console.log('Updated to EQUITY')

    // Verify
    const fresh = await prisma.ledgerAccount.findUnique({ where: { id: mapping.account.id } })
    console.log(`New Type: ${fresh?.type}`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
