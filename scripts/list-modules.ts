import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const modules = await prisma.systemModule.findMany();
    console.log(JSON.stringify(modules, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
