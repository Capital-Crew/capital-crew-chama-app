
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function refineLedger() {
    console.log('--- REFINING LEDGER PATHS ---');

    const portfolioAcc = await prisma.ledgerAccount.findUnique({ where: { code: '1310' } });
    const walletAcc = await prisma.ledgerAccount.findUnique({ where: { code: '2200' } });
    const incomeAcc = await prisma.ledgerAccount.findUnique({ where: { code: '4100' } });

    if (!portfolioAcc || !walletAcc || !incomeAcc) {
        console.error('Missing accounts');
        return;
    }

    // 1. Move "Net Disbursement to Wallet" entries BACK to Wallet (2200)
    const walletEntries = await prisma.ledgerEntry.findMany({
        where: {
            description: { contains: 'Net Disbursement to Wallet' },
            ledgerAccountId: portfolioAcc.id
        }
    });
    console.log(`Moving ${walletEntries.length} Wallet entries back to account 2200...`);
    for (const e of walletEntries) {
        await prisma.ledgerEntry.update({
            where: { id: e.id },
            data: { ledgerAccountId: walletAcc.id }
        });
    }

    // 2. Move "Fee" entries to Income (4100)
    const feeEntries = await prisma.ledgerEntry.findMany({
        where: {
            OR: [
                { description: { contains: 'Fee' } },
                { description: { contains: 'Insurance' } }
            ],
            ledgerAccountId: portfolioAcc.id
        }
    });
    console.log(`Moving ${feeEntries.length} Fee entries back to account 4100...`);
    for (const e of feeEntries) {
        await prisma.ledgerEntry.update({
            where: { id: e.id },
            data: { ledgerAccountId: incomeAcc.id }
        });
    }

    console.log('--- REFINEMENT COMPLETE ---');
}

refineLedger()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
