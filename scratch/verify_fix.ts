import { PrismaClient } from '@prisma/client'
import { initiateWorkflow } from '../app/actions/workflow-engine'

const prisma = new PrismaClient()

async function main() {
    const loanId = 'cmo7ionh40000tm08l9r4bujf' // The ID for LN010
    const user = await prisma.user.findFirst()
    if (!user) throw new Error('No user found for trace')
    const userId = user.id

    console.log('--- Step 1: Check initial state ---')
    let requests = await prisma.workflowRequest.findMany({ where: { entityId: loanId, entityType: 'LOAN' } })
    console.log('Requests for LN010:', requests.length)

    console.log('\n--- Step 2: Initiate workflow 1 ---')
    await initiateWorkflow('LOAN', loanId, userId, 1);
    requests = await prisma.workflowRequest.findMany({ where: { entityId: loanId, entityType: 'LOAN' } })
    console.log('After first initiate - Requests for LN010:', requests.length)

    console.log('\n--- Step 3: Initiate workflow 2 (Idempotency check) ---')
    await initiateWorkflow('LOAN', loanId, userId, 1);
    requests = await prisma.workflowRequest.findMany({ where: { entityId: loanId, entityType: 'LOAN' } })
    console.log('After second initiate - Requests for LN010:', requests.length)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
