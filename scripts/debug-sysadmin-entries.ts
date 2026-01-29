
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Inspecting Detailed entries for System Admin...')

    // 1. Get System Admin
    // Based on previous step, ID is cmkt8hk4l0007tmjova32q9rh (or find by name)
    const sysAdmin = await prisma.member.findFirst({ where: { name: 'System Administrator' } })
    if (!sysAdmin) return

    console.log(`Member: ${sysAdmin.name} (${sysAdmin.id})`)

    const contribAccount = await prisma.systemAccountingMapping.findUnique({
        where: { type: 'CONTRIBUTIONS' }, include: { account: true }
    })

    if (!contribAccount) return

    const entries = await prisma.ledgerEntry.findMany({
        where: {
            ledgerAccountId: contribAccount.account.id,
            ledgerTransaction: {
                referenceId: sysAdmin.id
            }
        },
        include: {
            ledgerTransaction: true
        }
    })

    console.log(`Found ${entries.length} entries.`)
    entries.forEach(e => {
        console.log(`[${e.ledgerTransaction.transactionDate.toISOString()}] ${e.description || e.ledgerTransaction.description}`)
        console.log(`   DR: ${e.debitAmount} | CR: ${e.creditAmount}`)
        console.log(`   RefType: ${e.ledgerTransaction.referenceType}`)
    })
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
