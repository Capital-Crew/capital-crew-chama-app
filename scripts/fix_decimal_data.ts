
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Data Correction: Cents -> Decimals');
    console.log('This script divides accounting figures by 100 to fix the magnitude shift.');

    try {
        // 1. Fix Ledger Entries (Debits/Credits)
        console.log('... Updating LedgerEntry (debitAmount, creditAmount)');
        const entriesUpdate = await prisma.$executeRaw`
      UPDATE "LedgerEntry"
      SET "debitAmount" = "debitAmount" / 100,
          "creditAmount" = "creditAmount" / 100;
    `;
        console.log(`✅ Updated ${entriesUpdate} ledger entries.`);

        // 2. Fix Ledger Transactions (Total Amount)
        console.log('... Updating LedgerTransaction (totalAmount)');
        const txUpdate = await prisma.$executeRaw`
      UPDATE "LedgerTransaction"
      SET "totalAmount" = "totalAmount" / 100;
    `;
        console.log(`✅ Updated ${txUpdate} ledger transactions.`);

        // 3. Fix Ledger Accounts (Balance)
        console.log('... Updating LedgerAccount (balance)');
        const accUpdate = await prisma.$executeRaw`
      UPDATE "LedgerAccount"
      SET "balance" = "balance" / 100;
    `;
        console.log(`✅ Updated ${accUpdate} ledger accounts.`);

        console.log('\n✨ Correction Complete! All values have been divided by 100.');

    } catch (error) {
        console.error('❌ Error updating data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
