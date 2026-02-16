import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Enabling Ledger Management permissions...');

    const rolesToEnable = ['SYSTEM_ADMIN', 'TREASURER', 'CHAIRPERSON', 'SECRETARY'];
    const ledgerModuleKey = 'ledger';

    // 1. Ensure Module Exists (Safety Check)
    const module = await prisma.systemModule.findUnique({ where: { key: ledgerModuleKey } });
    if (!module) {
        console.error('Ledger module not found! Please run the seed script first.');
        process.exit(1);
    }

    // 2. Grant Permission to Roles
    for (const role of rolesToEnable) {
        // Upsert permission
        await prisma.rolePermission.upsert({
            where: {
                role_moduleKey: {
                    role: role as any,
                    moduleKey: ledgerModuleKey
                }
            },
            update: { canAccess: true },
            create: {
                role: role as any,
                moduleKey: ledgerModuleKey,
                canAccess: true
            }
        });
        console.log(`Enabled ledger access for role: ${role}`);
    }

    // 3. Update Individual User Permissions (For current session safety)
    // Find users with these roles and update their JSON permission if necessary
    // Note: The app mostly checks role permissions via the matrix, but let's be safe.
    // Actually, the app logic in `UserRightsTable` defaults `canManageLedger` to false, 
    // but the `SystemAdminPage` checks `permissions` prop which comes from `rolePermission` table usually?
    // Let's verify `user-permissions.ts`. It merges user.permissions json with defaults.
    // To be 100% sure, let's update all admin users' permission JSON.

    const admins = await prisma.user.findMany({
        where: { role: { in: rolesToEnable as any } }
    });

    for (const user of admins) {
        const currentPerms = (user.permissions as any) || {};
        if (!currentPerms.canManageLedger) {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    permissions: {
                        ...currentPerms,
                        canManageLedger: true
                    }
                }
            });
            console.log(`Updated user permissions for: ${user.name} (${user.role})`);
        }
    }

    console.log('Permission update complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
