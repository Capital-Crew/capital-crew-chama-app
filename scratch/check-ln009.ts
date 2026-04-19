import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("--- FETCHING LOAN LN009 ---")
    
    // 1. Find the loan
    const loan = await prisma.loan.findFirst({
        where: {
            OR: [
                { id: 'LN009' },
                { loanApplicationNumber: 'LN009' }
            ]
        },
        include: {
            member: true,
            loanProduct: true
        }
    })

    if (!loan) {
        console.log("Loan not found.")
        return
    }

    console.log(`Loan Found: ${loan.loanNumber || loan.id}`)
    console.log(`Status: ${loan.status}`)
    console.log(`Amount: ${loan.amount}`)
    console.log(`Member: ${loan.member.name}`)

    // 2. Find associated Workflow
    const workflow = await prisma.workflowRequest.findFirst({
        where: {
            entityId: loan.id,
            entityType: 'LOAN'
        },
        include: {
            currentStage: true,
            actions: {
                include: {
                    actor: true,
                    stage: true
                }
            }
        }
    })

    if (workflow) {
        console.log("\n--- WORKFLOW STATUS ---")
        console.log(`Request Status: ${workflow.status}`)
        console.log(`Current Stage: ${workflow.currentStage?.name || 'Workflow Complete/Unknown'}`)
        console.log(`Required Role: ${workflow.currentStage?.requiredRole || 'N/A'}`)
        
        console.log("\n--- ACTION HISTORY ---")
        if (workflow.actions.length === 0) {
            console.log("No actions recorded yet.")
        } else {
            workflow.actions.forEach(a => {
                console.log(`[${a.createdAt.toISOString()}] ${a.actor.name} (${a.stage.name}): ${a.action}`)
            })
        }
    } else {
        console.log("\nNo active workflow found for this loan.")
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
