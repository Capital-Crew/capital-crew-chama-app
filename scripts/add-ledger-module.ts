import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Ledger Management module...');

    const ledgerModule = await prisma.systemModule.upsert({
        where: { key: 'ledger' },
        update: {},
        create: {
            key: 'ledger',
            name: 'Ledger Management',
            description: 'Manage Chart of Accounts, Journals, and Accounting Periods'
        }
    });

    console.log('Ledger Management module seeded:', ledgerModule);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
