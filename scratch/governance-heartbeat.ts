import { PrismaClient, EntityType, WorkflowStatus } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("--- STARTING GOVERNANCE HEARTBEAT (SYSTEM SYNC) ---")
    
    // 1. Fetch all pending workflow requests
    const pendingRequests = await prisma.workflowRequest.findMany({
        where: { status: 'PENDING' },
        include: {
            currentStage: true,
            workflow: {
                include: {
                    stages: { orderBy: { stepNumber: 'asc' } }
                }
            },
            actions: {
                where: { action: 'APPROVED' },
                include: {
                    actor: {
                        select: {
                            id: true,
                            role: true,
                            permissions: true
                        }
                    }
                }
            }
        }
    })

    console.log(`Analyzing ${pendingRequests.length} pending requests...`)

    const PRIVILEGED_ROLES = ['TREASURER', 'CHAIRPERSON', 'SECRETARY', 'SYSTEM_ADMIN'];

    for (const request of pendingRequests) {
        if (!request.currentStage) continue;

        // Implementation of the new Governance Rule
        const eligibleApprovals = request.actions.filter(a => {
            const perms = a.actor.permissions as any;
            if (!perms) return false;
            if (Array.isArray(perms)) return perms.includes('APPROVE_LOANS') || perms.includes('APPROVE_LOAN') || perms.includes('ALL');
            if (typeof perms === 'object') {
                return perms['APPROVE_LOANS'] === true || perms['canApprove'] === true || perms['ALL'] === true || perms['APPROVE_LOAN'] === true;
            }
            return false;
        });

        const effectiveApprovalCount = eligibleApprovals.length;
        const minVotes = request.currentStage.minVotesRequired || 1;
        const hasPrivilegedRole = eligibleApprovals.some(a => PRIVILEGED_ROLES.includes(a.actor.role));

        const quorumMet = effectiveApprovalCount >= minVotes;
        const shouldFinalize = quorumMet && (request.entityType !== 'LOAN' || hasPrivilegedRole);

        if (shouldFinalize) {
            console.log(`[SYNC] Request ${request.id} (${request.entityType} ${request.entityId}) satisfies current rules. Advancing...`)
            
            // Replicate the Advance Logic
            const currentStep = request.currentStage.stepNumber
            const nextStage = request.workflow.stages.find((s: any) => s.stepNumber > currentStep)

            if (nextStage) {
                console.log(`  -> Moving to next stage: ${nextStage.name}`)
                await prisma.workflowRequest.update({
                    where: { id: request.id },
                    data: { currentStageId: nextStage.id }
                })
            } else {
                console.log(`  -> Finalizing Workflow (APPROVED)`)
                await prisma.workflowRequest.update({
                    where: { id: request.id },
                    data: {
                        status: WorkflowStatus.APPROVED,
                        currentStageId: null
                    }
                })

                // Also update the entity status if it's a LOAN
                if (request.entityType === 'LOAN') {
                    await prisma.loan.update({
                        where: { id: request.entityId },
                        data: { status: 'APPROVED' }
                    })
                }
            }
        } else {
            console.log(`[SKIP] Request ${request.id} (${request.entityType}) does not yet satisfy rules. (Votes: ${effectiveApprovalCount}/${minVotes}, Privileged: ${hasPrivilegedRole})`)
        }
    }

    console.log("\n--- HEARTBEAT COMPLETE ---")
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
