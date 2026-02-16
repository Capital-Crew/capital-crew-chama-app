
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    if (prisma.systemModule) {
        console.log('✅ SystemModule exists on client');
        try {
            const count = await prisma.systemModule.count();
            console.log(`📊 SystemModules count: ${count}`);
        } catch (e) {
            console.error('❌ Error querying SystemModule:', e.message);
        }
    } else {
        console.error('❌ SystemModule definition MISSING on client');
    }

    if (prisma.rolePermission) {
        console.log('✅ RolePermission exists on client');
        try {
            const count = await prisma.rolePermission.count();
            console.log(`📊 RolePermissions count: ${count}`);
        } catch (e) {
            console.error('❌ Error querying RolePermission:', e.message);
        }
    } else {
        console.error('❌ RolePermission definition MISSING on client');
    }

    await prisma.$disconnect();
}

check();
