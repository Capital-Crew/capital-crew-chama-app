
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyAudit() {
    console.log('--- Audit Verification ---');
    try {
        const logs = await prisma.auditLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: 5
        });

        if (logs.length === 0) {
            console.log('No logs found.');
            return;
        }

        logs.forEach((log, i) => {
            console.log(`\nLog ${i + 1}: ${log.actionType} (${log.status})`);
            console.log(`Summary: ${log.summary}`);
            console.log(`Steps: ${log.steps ? JSON.parse(JSON.stringify(log.steps)).length : 'None'}`);
            console.log(`Geo: ${JSON.stringify(log.geolocation)}`);
            console.log(`Duration: ${log.durationMs}ms`);
        });
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyAudit();
