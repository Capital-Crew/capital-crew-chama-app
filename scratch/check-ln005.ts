import { PrismaClient, EntityType } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const loanAppNumber = 'LN005'
    console.log(`--- INVESTIGATING ${loanAppNumber} ---`)

    const loan = await prisma.loan.findFirst({
        where: { loanApplicationNumber: loanAppNumber },
        include: {
            member: true,
        }
    })

    if (!loan) {
        console.log(`Loan ${loanAppNumber} not found.`)
        return
    }

    console.log(`Loan ID: ${loan.id}`)
    console.log(`Status: ${loan.approvalStatus}`)

    const request = await prisma.workflowRequest.findFirst({
        where: { 
            entityId: loan.id,
            entityType: EntityType.LOAN,
            status: 'PENDING'
        },
        include: {
            currentStage: true,
            actions: {
                include: {
                    actor: {
                        select: {
                            username: true,
                            role: true,
                            permissions: true
                        }
                    }
                }
            }
        }
    })

    if (!request) {
        console.log("No pending workflow request found for this loan.")
        return
    }

    console.log(`Current Stage: ${request.currentStage?.name} (Min Votes: ${request.currentStage?.minVotesRequired})`)
    console.log(`Total Actions: ${request.actions.length}`)

    const PRIVILEGED_ROLES = ['TREASURER', 'CHAIRPERSON', 'SECRETARY', 'SYSTEM_ADMIN']
    
    console.log("\nVotes Detail:")
    let eligibleCount = 0
    let hasPrivileged = false

    request.actions.forEach(a => {
        const perms = a.actor.permissions as any
        let hasApprovePerm = false
        if (Array.isArray(perms)) {
            hasApprovePerm = perms.includes('APPROVE_LOANS') || perms.includes('APPROVE_LOAN') || perms.includes('ALL')
        } else if (typeof perms === 'object' && perms !== null) {
            hasApprovePerm = perms['APPROVE_LOANS'] === true || perms['canApprove'] === true || perms['ALL'] === true || perms['APPROVE_LOAN'] === true
        }

        const isPrivileged = PRIVILEGED_ROLES.includes(a.actor.role)
        console.log(`- ${a.actor.username} (${a.actor.role}): Action=${a.action}, Eligible=${hasApprovePerm}, Privileged=${isPrivileged}`)
        
        if (a.action === 'APPROVED' && hasApprovePerm) {
            eligibleCount++
            if (isPrivileged) hasPrivileged = true
        }
    })

    console.log(`\nGovernance Result:`)
    console.log(`Eligible Votes: ${eligibleCount} / ${request.currentStage?.minVotesRequired || 1}`)
    console.log(`Privileged Role Voted: ${hasPrivileged}`)

    if (eligibleCount >= (request.currentStage?.minVotesRequired || 1) && !hasPrivileged) {
        console.log("CRITICAL: Quorum met but MISSING privileged role approval.")
    } else if (eligibleCount < (request.currentStage?.minVotesRequired || 1)) {
        console.log("Result: Still pending due to INSUFFICIENT VOTES.")
    } else {
        console.log("Result: Should be approved. Investigating engine sync...")
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
