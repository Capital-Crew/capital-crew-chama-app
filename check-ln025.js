import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkLoan() {
    try {
        const loan = await prisma.loan.findFirst({
            where: { loanApplicationNumber: 'LN025' },
            include: {
                approvals: {
                    include: {
                        approver: true
                    }
                }
            }
        });

        if (!loan) {
            console.log('Loan LN025 not found.');
            return;
        }

        const workflowRequests = await prisma.workflowRequest.findMany({
            where: {
                entityId: loan.id,
                entityType: 'LOAN'
            },
            include: {
                actions: {
                    include: {
                        actor: true
                    }
                },
                currentStage: true
            }
        });

        // Simplify for easier reading in console
        const summary = {
            id: loan.id,
            loanApplicationNumber: loan.loanApplicationNumber,
            status: loan.status,
            submissionVersion: loan.submissionVersion,
            approvalsRequired: loan.approvalsRequired,
            legacyApprovals: loan.approvals.map(a => ({
                approver: a.approver.name,
                decision: a.decision,
                version: a.version,
                timestamp: a.timestamp
            })),
            workflowRequests: workflowRequests.map(r => ({
                id: r.id,
                status: r.status,
                version: r.version,
                currentStage: r.currentStage?.name,
                requiredRole: r.currentStage?.requiredRole,
                actions: r.actions.map(a => ({
                    actor: a.actor.name,
                    role: a.actor.role,
                    action: a.action,
                    timestamp: a.timestamp
                }))
            }))
        };

        console.log(JSON.stringify(summary, null, 2));
    } catch (error) {
        console.error('Error querying database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkLoan();
