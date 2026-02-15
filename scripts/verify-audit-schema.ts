
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
    console.log("Verifying AuditLog schema...");
    try {
        // 1. Check if we can select the new fields
        // If these fields don't exist in the DB, Prisma Client (generated with the new schema) 
        // might throw an error when trying to select them, or the DB will throw "column does not exist".
        const log = await prisma.auditLog.findFirst({
            select: {
                id: true,
                summary: true,
                steps: true,
                metadata: true,
                durationMs: true
            }
        });

        console.log("✓ Connection successful.");
        console.log("✓ Query for new columns did not crash.");

        // 2. Try to insert a record with the new fields
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log("⚠ No user found to test insertion.");
            return;
        }

        const newLog = await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'DASHBOARD_VIEWED', // Using a generic enum
                details: 'Schema Verification Test',
                summary: 'Verification Summary',
                steps: { success: true },
                metadata: { type: 'test' },
                durationMs: 100
            }
        });

        console.log("✓ Successfully INSERTED record with new columns with ID:", newLog.id);

        // Clean up
        await prisma.auditLog.delete({ where: { id: newLog.id } });
        console.log("✓ Cleaned up test record.");
        console.log("CONCLUSION: The schema changes ARE implemented.");

    } catch (e: any) {
        console.error("❌ VERIFICATION FAILED:", e.message);
        console.log("CONCLUSION: The schema changes are NOT correctly applied to the database.");
    } finally {
        await prisma.$disconnect();
    }
}

verify();
