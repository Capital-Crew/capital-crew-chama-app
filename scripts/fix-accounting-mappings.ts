
import { PrismaClient, AccountType, SystemAccountType } from '@prisma/client';
const prisma = new PrismaClient();

async function fixBalances() {
    console.log('--- STARTING ACCOUNTING FIXUP ---');

    // 1. Correct Account Type for 4100 (Income)
    console.log('Step 1: Updating account 4100 type to REVENUE...');
    await prisma.ledgerAccount.update({
        where: { code: '4100' },
        data: { type: 'REVENUE' as AccountType }
    });

    // 2. Correct Mapping for EVENT_LOAN_DISBURSEMENT
    console.log('Step 2: Updating EVENT_LOAN_DISBURSEMENT mapping to 1310 (Loan Portfolio)...');
    const portAccount = await prisma.ledgerAccount.findUnique({ where: { code: '1310' } });
    if (portAccount) {
        await prisma.systemAccountingMapping.update({
            where: { type: 'EVENT_LOAN_DISBURSEMENT' as SystemAccountType },
            data: { accountId: portAccount.id }
        });
    }

    // 3. Migrate Ledger Entries for LN005 (Disbursement Principal)
    // We need to find the Disbursement entry for LN005 that was wrongly posted to 2200 (Wallet)
    // and move it to 1310 (Portfolio) so the balance calculator sees the debit.
    console.log('Step 3: Migrating ledger entries for LN005...');

    // Find LN005
    const loan = await prisma.loan.findFirst({ where: { loanApplicationNumber: 'LN005' } });
    if (loan) {
        // Find the "Wallet - System Administrator" account (it's account 2200 or similar sub-account)
        // From previous check it was a sub-account or code 2200?
        // Actually, looking at debug output: [2026-01-28] LOAN_DISBURSEMENT | Wallet - System Administrator | DR: 0 | CR: 9800
        // And [2026-01-28] LOAN_DISBURSEMENT | Member Wallet | DR: 10000 | CR: 0

        // Error: "Member Wallet" (10000 Debit) should have been "Loan Portfolio".
        const memberWalletAcc = await prisma.ledgerAccount.findUnique({ where: { code: '2000' } }); // Based on list-accounts output 2000/2200
        const receivablesAcc = await prisma.ledgerAccount.findUnique({ where: { code: '1200' } }); // Contributions? Mapping said 1200.
        const portfolioAcc = await prisma.ledgerAccount.findUnique({ where: { code: '1310' } });

        // Find entries for this loan where account is wrong
        const entriesToFix = await prisma.ledgerEntry.findMany({
            where: {
                ledgerTransaction: {
                    referenceId: loan.id,
                    referenceType: 'LOAN_DISBURSEMENT'
                },
                // The principal debit (10000) was sent to Account Code '2000'? No, previous debug said "Member Wallet"
                // Let's identify by amount and description
                debitAmount: 10000
            }
        });

        console.log(`Found ${entriesToFix.length} entries to move to Portfolio.`);
        for (const entry of entriesToFix) {
            await prisma.ledgerEntry.update({
                where: { id: entry.id },
                data: { ledgerAccountId: portfolioAcc!.id }
            });
        }
    }

    console.log('--- FIXUP COMPLETE ---');
}

fixBalances()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
