import { db as prisma } from "@/lib/db";

async function checkIncomeAccounts() {
    console.log("Checking accounts in 4000-4120 range...");
    const accounts = await prisma.ledgerAccount.findMany({
        where: {
            code: {
                gte: '4000',
                lte: '4120'
            }
        },
        select: {
            code: true,
            name: true,
            type: true
        },
        orderBy: { code: 'asc' }
    });

    console.table(accounts);
}

checkIncomeAccounts()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
