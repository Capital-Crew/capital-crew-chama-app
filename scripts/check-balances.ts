
import { AccountingEngine } from './lib/accounting/AccountingEngine';
import { db as prisma } from '@/lib/db';
import { SystemAccountType } from '@prisma/client';

async function checkBalances() {
    console.log("--- Checking Account Balances ---");

    // 1. Account 1100 (Current Loan Portfolio)
    try {
        const bal1100 = await AccountingEngine.getAccountBalance('1100');
        console.log(`Account 1100 (Loan Portfolio): KES ${bal1100.toLocaleString()}`);
    } catch (e: any) { console.log("Account 1100 not found or error", e.message); }

    // 2. Account 1200 (Old Contributions)
    try {
        const bal1200 = await AccountingEngine.getAccountBalance('1200');
        console.log(`Account 1200 (Receivables/Old Contrib): KES ${bal1200.toLocaleString()}`);
    } catch (e: any) { console.log("Account 1200 not found or error", e.message); }

    // 3. Account 3000 (Contributions Equity)
    try {
        const bal3000 = await AccountingEngine.getAccountBalance('3000');
        console.log(`Account 3000 (Contributions Equity): KES ${bal3000.toLocaleString()}`);
    } catch (e: any) { console.log("Account 3000 not found or error", e.message); }

    // 4. Check Mapping for EVENT_LOAN_DISBURSEMENT
    const mapping = await prisma.systemAccountingMapping.findUnique({
        where: { type: 'EVENT_LOAN_DISBURSEMENT' },
        include: { account: true }
    });
    if (mapping) {
        console.log(`\nMapping 'EVENT_LOAN_DISBURSEMENT' -> [${mapping.account.code}] ${mapping.account.name}`);
    } else {
        console.log("\nMapping 'EVENT_LOAN_DISBURSEMENT' -> NOT SET");
    }
}

checkBalances()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
