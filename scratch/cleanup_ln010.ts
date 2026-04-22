import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const loan = await prisma.loan.findFirst({ where: { loanApplicationNumber: 'LN010' } })
    if (!loan) {
        console.log('LN010 not found')
        return
    }

    const requests = await prisma.workflowRequest.findMany({ 
        where: { entityId: loan.id, entityType: 'LOAN' },
        orderBy: { createdAt: 'desc' }
    })

    if (requests.length > 1) {
        const toDelete = requests.slice(1)
        await prisma.workflowRequest.deleteMany({ 
            where: { id: { in: toDelete.map(r => r.id) } } 
        })
        console.log(`Deleted ${toDelete.length} duplicate requests for LN010`)
    } else {
        console.log('No duplicate requests found for LN010')
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
