
import { PrismaClient, EntityType } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    try {
        const loan = await prisma.loan.findFirst({
            where: { loanApplicationNumber: 'LN025' }
        });

        if (!loan) {
            console.log('LN025 NOT FOUND');
            return;
        }

        console.log('--- LOAN DATA ---');
        console.log(JSON.stringify(loan, null, 2));

        const workflowRequests = await prisma.workflowRequest.findMany({
            where: {
                entityId: loan.id,
                entityType: EntityType.LOAN
            },
            include: {
                actions: true,
                currentStage: true
            }
        });

        console.log('--- WORKFLOW REQUESTS ---');
        console.log(JSON.stringify(workflowRequests, null, 2));

        const settings = await prisma.saccoSettings.findFirst();
        console.log('--- SETTINGS ---');
        console.log('Required Approvals:', settings?.requiredApprovals);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
