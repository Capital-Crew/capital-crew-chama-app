
import { PrismaClient, EntityType, WorkflowStatus } from '@prisma/client';
const prisma = new PrismaClient();

async function fix() {
    console.log('Starting Refined Fix v3...');
    try {
        const settings = await prisma.saccoSettings.findFirst();
        const reqVotes = settings?.requiredApprovals || 1;
        console.log('Required Votes:', reqVotes);

        const def = await prisma.workflowDefinition.findUnique({
            where: { entityType: EntityType.LOAN },
            include: { stages: { orderBy: { stepNumber: 'asc' } } }
        });

        let mainStageId = '';

        if (def && def.stages.length > 0) {
            const firstStage = def.stages[0];
            mainStageId = firstStage.id;
            const otherStageIds = def.stages.slice(1).map(s => s.id);

            console.log('Repurposing first stage:', firstStage.id);
            await prisma.workflowStage.update({
                where: { id: firstStage.id },
                data: {
                    name: "Committee Approval",
                    requiredRole: 'TREASURER',
                    minVotesRequired: reqVotes,
                    isFinal: true
                }
            });

            if (otherStageIds.length > 0) {
                console.log('Handling actions in other stages...');
                await prisma.workflowAction.updateMany({
                    where: { stageId: { in: otherStageIds } },
                    data: { stageId: firstStage.id }
                });

                console.log('Updating requests in other stages...');
                await prisma.workflowRequest.updateMany({
                    where: { currentStageId: { in: otherStageIds } },
                    data: { currentStageId: firstStage.id }
                });

                console.log('Deleting other stages...');
                await prisma.workflowStage.deleteMany({
                    where: { id: { in: otherStageIds } }
                });
            }
        } else if (def) {
            console.log('No stages found for LOAN workflow. Creating new one...');
            const ns = await prisma.workflowStage.create({
                data: {
                    workflowId: def.id,
                    stepNumber: 1,
                    name: "Committee Approval",
                    requiredRole: 'TREASURER',
                    minVotesRequired: reqVotes,
                    isFinal: true
                }
            });
            mainStageId = ns.id;
        }

        // Evaluation for LN025
        const loan = await prisma.loan.findFirst({
            where: { loanApplicationNumber: 'LN025' }
        });

        if (loan) {
            console.log('Inspecting LN025...');
            const requests = await prisma.workflowRequest.findMany({
                where: {
                    entityId: loan.id,
                    entityType: EntityType.LOAN,
                    status: WorkflowStatus.PENDING
                },
                include: { actions: true }
            });

            for (const req of requests) {
                console.log('Checking pending request, version:', req.version);
                const approvals = req.actions.filter(a => a.action === 'APPROVED');
                console.log('Approval count:', approvals.length);

                if (approvals.length >= reqVotes) {
                    console.log('Quorum met! Approving LN025...');
                    await prisma.loan.update({
                        where: { id: loan.id },
                        data: { status: 'APPROVED' }
                    });
                    await prisma.workflowRequest.update({
                        where: { id: req.id },
                        data: {
                            status: WorkflowStatus.APPROVED,
                            currentStageId: null
                        }
                    });
                    console.log('LN025 is now APPROVED');
                } else {
                    console.log('Quorum NOT met for version', req.version);
                }
            }
        }

    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await prisma.$disconnect();
        console.log('Done.');
    }
}

fix();
