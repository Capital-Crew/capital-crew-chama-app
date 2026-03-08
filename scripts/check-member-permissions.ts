import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMemberPermissions() {
    const permissions = await prisma.rolePermission.findMany({
        where: { role: 'MEMBER' },
        include: { module: true },
        orderBy: { moduleKey: 'asc' }
    });

    console.log("MEMBER Permissions:");
    for (const p of permissions) {
        console.log(`- [${p.moduleKey}] (${p.module?.name}): ${p.canAccess ? 'GRANTED ✅' : 'DENIED ❌'}`);
    }

    const modules = await prisma.systemModule.findMany();
    const configuredKeys = permissions.map(p => p.moduleKey);

    console.log("\nUnconfigured Modules (Default Deny):");
    const unconfigured = modules.filter(m => !configuredKeys.includes(m.key));
    for (const m of unconfigured) {
        console.log(`- [${m.key}] (${m.name}): DENIED ❌ (Not Configured)`);
    }

    await prisma.$disconnect();
}

checkMemberPermissions().catch(console.error);
