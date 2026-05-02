import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const requests = await prisma.workflowRequest.findMany({
        where: { status: 'PENDING' },
        include: {
            currentStage: true
        }
    })

    for (const req of requests) {
        if (req.entityType === 'LOAN') {
            const loan = await prisma.loan.findUnique({
                where: { id: req.entityId },
                include: { member: true }
            })
            if (loan) {
                console.log(`Loan Application: ${loan.loanApplicationNumber} - ${loan.member.name}`)
                console.log(`  Amount: KES ${Number(loan.amount).toLocaleString()}`)
                console.log(`  Status: ${loan.status}`)
                console.log(`  Workflow Stage: ${req.currentStage?.name || 'Initial Stage'}`)
            }
        } else {
            console.log(`Request: ${req.entityType} (ID: ${req.entityId})`)
            console.log(`  Workflow Stage: ${req.currentStage?.name || 'Initial Stage'}`)
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
