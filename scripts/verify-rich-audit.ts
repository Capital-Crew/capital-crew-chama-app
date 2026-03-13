import { db as prisma } from '../lib/db';

async function verifyAuditIntegrity() {
    console.log('--- Audit Trail Integrity Verification ---');

    // 1. Check for recent rich audit logs
    const richLogs = await prisma.auditLog.findMany({
        where: {
            steps: { not: null }
        },
        orderBy: { timestamp: 'desc' },
        take: 5
    });

    console.log(`Found ${richLogs.length} recent rich audit logs.`);

    if (richLogs.length === 0) {
        console.warn('WARNING: No logs with execution steps found. Verify withAudit integration.');
    }

    richLogs.forEach((log, i) => {
        console.log(`\n[Log ${i + 1}] Action: ${log.actionType} | User: ${log.userEmail || 'System'}`);
        console.log(`- Request ID: ${log.requestId}`);
        console.log(`- Steps: ${(log.steps as any[]).length} documented`);
        console.log(`- Latency: ${log.durationMs}ms`);
        console.log(`- State Capture: ${log.stateAfter ? 'Present' : 'Absent'}`);
        if (log.stateAfter) {
            console.log(`  - After State Keys: ${Object.keys(log.stateAfter as any).join(', ')}`);
        }
        console.log(`- Geo: ${log.geolocation ? 'Captured' : 'Not captured'}`);
    });

    // 2. Check for manual audit logs (should be minimal in new domain areas)
    const legacyCounts = await prisma.auditLog.count({
        where: {
            steps: null,
            timestamp: { gte: new Date(Date.now() - 3600000) } // Last hour
        }
    });

    console.log(`\nLegacy/Thin logs in last hour: ${legacyCounts}`);

    // 3. Verify sensitive data redaction (Basic check)
    const sensitiveCheck = await prisma.auditLog.findFirst({
        where: {
            OR: [
                { summary: { contains: 'password' } },
                { details: { contains: 'password' } }
            ]
        }
    });

    if (sensitiveCheck) {
        console.warn('CAUTION: Found a log mentioning "password". Ensure value redaction is active.');
    } else {
        console.log('Sanitization check: No plaintext passwords found in summaries/details.');
    }

    console.log('\n--- Verification Complete ---');
}

verifyAuditIntegrity()
    .catch(e => console.error(e))
    .finally(() => process.exit());
