import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkWorkflow() {
    try {
        const definition = await prisma.workflowDefinition.findUnique({
            where: { entityType: 'LOAN' },
            include: { stages: { orderBy: { stepNumber: 'asc' } } }
        });

        console.log(JSON.stringify(definition, null, 2));
    } catch (error) {
        console.error('Error querying database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkWorkflow();
