
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.member.count();
    const userCount = await prisma.user.count();
    console.log(`Total Members: ${count}`);
    console.log(`Total Users: ${userCount}`);
    if (count > 0) {
        const firstFew = await prisma.member.findMany({ take: 3 });
        console.log('First 3 members:', firstFew);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
