import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const loan = await prisma.loan.findFirst({ where: { loanApplicationNumber: 'LN010' } })
    if (loan) {
        console.log('Loan ID for LN010:', loan.id)
        const requests = await prisma.workflowRequest.findMany({ 
            where: { entityId: loan.id, entityType: 'LOAN' },
            orderBy: { createdAt: 'desc' }
        })
        console.log('Requests for LN010:', requests.length)
        console.table(requests.map(r => ({ 
            id: r.id, 
            status: r.status, 
            createdAt: r.createdAt,
            version: (r as any).version 
        })))
    } else {
        console.log('Loan LN010 not found')
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
