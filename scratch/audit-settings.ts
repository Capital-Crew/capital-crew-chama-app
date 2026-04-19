import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("--- SYSTEM CONFIGURATION AUDIT ---")
    
    // 1. Check SaccoSettings
    const settings = await prisma.saccoSettings.findFirst()
    console.log(`\nSaccoSettings.requiredApprovals: ${settings?.requiredApprovals ?? 'NOT SET'}`)

    // 2. Check Workflow Definitions for LOAN
    const loanWf = await prisma.workflowDefinition.findFirst({
        where: { entityType: 'LOAN' },
        include: { stages: true }
    })

    if (loanWf) {
        console.log(`\nWorkflow: ${loanWf.name}`)
        loanWf.stages.forEach(s => {
            console.log(`  Stage: ${s.name}`)
            console.log(`  Min Votes Required in DB: ${s.minVotesRequired}`)
        })
    } else {
        console.log("\nLoan Workflow Definition NOT FOUND.")
    }

    // 3. Check LN009 votes
    const loan = await prisma.loan.findFirst({
        where: { loanApplicationNumber: 'LN009' }
    })

    if (loan) {
        const workflow = await prisma.workflowRequest.findFirst({
            where: { entityId: loan.id, entityType: 'LOAN' },
            include: { actions: true }
        })

        if (workflow) {
            console.log(`\nLN009 Request Status: ${workflow.status}`)
            console.log(`LN009 Vote Count: ${workflow.actions.length}`)
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
