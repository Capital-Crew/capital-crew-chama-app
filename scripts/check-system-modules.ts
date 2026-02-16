import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const modules = await prisma.systemModule.findMany();
    console.log('System Modules Count:', modules.length);
    console.log('Modules:', JSON.stringify(modules, null, 2));

    const permissions = await prisma.rolePermission.findMany();
    console.log('Permissions Count:', permissions.length);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
