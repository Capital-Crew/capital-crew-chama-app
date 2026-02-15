
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkColumns() {
  try {
    // Try to create an audit log with the new fields
    const user = await prisma.user.findFirst();
    if (!user) {
        console.log("No user found, skipping creation check.");
        return;
    }

    const log = await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DASHBOARD_VIEWED', // Using a valid enum 
        details: '{}',
        summary: 'Test Summary',
        steps: { test: true },
        metadata: { meta: true },
        durationMs: 123
      }
    });

    console.log("Successfully created AuditLog with new fields:", log);
    
    // Clean up
    await prisma.auditLog.delete({ where: { id: log.id } });

  } catch (error) {
    console.error("Error verification failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkColumns();
