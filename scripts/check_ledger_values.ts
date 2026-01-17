
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking Raw Database Values...');

    // Check Ledger Accounts
    const accounts = await prisma.ledgerAccount.findMany({
        select: { code: true, name: true, balance: true }
    });

    console.log('\n--- Ledger Accounts ---');
    accounts.forEach(acc => {
        console.log(`${acc.code} ${acc.name}: ${acc.balance.toString()}`);
    });

    // Check Ledger Entries (sample)
    const entries = await prisma.ledgerEntry.findMany({
        take: 5,
        select: { debitAmount: true, creditAmount: true, description: true }
    });

    console.log('\n--- Ledger Entries (First 5) ---');
    entries.forEach(entry => {
        console.log(`Dr: ${entry.debitAmount.toString()} | Cr: ${entry.creditAmount.toString()} | ${entry.description}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
