
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function check() {
    const logs = await db.auditLog.findMany({
        where: { action: 'PENALTY_ENGINE_RUN' },
        orderBy: { timestamp: 'desc' },
        take: 5,
        include: { user: { select: { name: true } } }
    });
    console.log('Recent Penalty Engine Runs:', JSON.stringify(logs, null, 2));
}

check()
    .catch(console.error)
    .finally(() => db.$disconnect());
