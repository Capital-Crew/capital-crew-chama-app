
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const id = 'cmnle0y4v000atm94xx2r31qi'
    const ledgerTx = await prisma.ledgerTransaction.findUnique({
        where: { id },
        include: {
            ledgerEntries: {
                include: { ledgerAccount: true }
            }
        }
    })

    if (!ledgerTx) {
        console.log('Ledger Transaction not found')
        return
    }

    console.log(`Summary for ${ledgerTx.id}:`)
    ledgerTx.ledgerEntries.forEach(e => {
        console.log(`${e.ledgerAccount.code} | Dr: ${e.debitAmount} | Cr: ${e.creditAmount} | ${e.description}`)
    })
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
