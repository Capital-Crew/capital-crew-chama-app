import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Re-running Magnitude Correction (Raw SQL Mode)...');

    try {
        // 1. LedgerEntry Correction
        // We assume anything >= 10000 is still "Cents" or "Old Format" and needs division.
        console.log('... Updating LedgerEntry (debitAmount/creditAmount) where >= 10000');

        const resDebit = await prisma.$executeRaw`
        UPDATE "LedgerEntry"
        SET "debitAmount" = "debitAmount" / 100
        WHERE "debitAmount" >= 10000;
      `;

        const resCredit = await prisma.$executeRaw`
        UPDATE "LedgerEntry"
        SET "creditAmount" = "creditAmount" / 100
        WHERE "creditAmount" >= 10000;
      `;

        console.log(`✅ Updated Debits: ${resDebit}, Credits: ${resCredit}`);

        // 2. LedgerTransaction Correction
        console.log('... Updating LedgerTransaction (totalAmount) where >= 10000');
        const resTx = await prisma.$executeRaw`
        UPDATE "LedgerTransaction"
        SET "totalAmount" = "totalAmount" / 100
        WHERE "totalAmount" >= 10000;
      `;
        console.log(`✅ Updated Transactions: ${resTx}`);


        // 3. FULL Recalculate LedgerAccount Balances
        // We intentionally reset everything based on the new entry values.
        console.log('🔄 Recalculating ALL LedgerAccount Balances...');

        // Fetch all account IDs
        const accounts = await prisma.ledgerAccount.findMany({ select: { id: true, code: true, type: true } });

        for (const acc of accounts) {
            // Calculate Sums via SQL for speed/type safety
            const sums = await prisma.$queryRaw<[{ debit: number, credit: number }]>`
            SELECT 
                COALESCE(SUM("debitAmount"), 0) as debit, 
                COALESCE(SUM("creditAmount"), 0) as credit
            FROM "LedgerEntry"
            WHERE "ledgerAccountId" = ${acc.id};
          `;

            const debit = Number(sums[0].debit);
            const credit = Number(sums[0].credit);

            let newBalance = 0;
            if (['ASSET', 'EXPENSE'].includes(acc.type)) {
                newBalance = debit - credit;
            } else {
                newBalance = credit - debit;
            }

            await prisma.$executeRaw`
            UPDATE "LedgerAccount"
            SET "balance" = ${newBalance}
            WHERE "id" = ${acc.id};
          `;
            console.log(`Updated ${acc.code}: ${newBalance}`);
        }

        console.log('✨ All corrections complete.');

    } catch (error) {
        console.error('❌ SQL Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
