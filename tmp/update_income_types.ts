import { db as prisma } from "@/lib/db";

async function updateIncomeAccounts() {
    console.log("Updating accounts in 4000-4120 range to type 'INCOME'...");
    
    const result = await prisma.ledgerAccount.updateMany({
        where: {
            code: {
                gte: '4000',
                lte: '4120'
            },
            type: 'REVENUE'
        },
        data: {
            type: 'INCOME'
        }
    });

    console.log(`Updated ${result.count} accounts to 'INCOME'.`);
    
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

updateIncomeAccounts()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
