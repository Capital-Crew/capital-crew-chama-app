
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    try {
        const loan = await prisma.loan.findFirst({
            where: { loanApplicationNumber: 'LN025' },
            include: {
                workflowRequests: {
                    include: {
                        actions: true,
                        currentStage: true
                    }
                }
            }
        });

        console.log('--- LOAN STATUS ---');
        console.log(JSON.stringify(loan, null, 2));

        const settings = await prisma.saccoSettings.findFirst();
        console.log('--- SETTINGS ---');
        console.log('Required Approvals:', settings?.requiredApprovals);

        const definitions = await prisma.workflowDefinition.findMany({
            include: { stages: true }
        });
        console.log('--- WORFKFLOW DEFINITIONS ---');
        console.log(JSON.stringify(definitions, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
