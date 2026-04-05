
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function check() {
    const logs = await db.auditLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 20,
        include: { user: { select: { name: true } } }
    });
    console.log('Recent Audit Logs:', JSON.stringify(logs, null, 2));
}

check()
    .catch(console.error)
    .finally(() => db.$disconnect());
