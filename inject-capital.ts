
import { AccountingEngine } from './lib/accounting/AccountingEngine';
import { db as prisma } from '@/lib/db';
import { ReferenceType } from '@prisma/client';

async function injectCapital() {
    console.log("💉 Injecting Capital into Loan Portfolio...");

    const PORTFOLIO_ACCOUNT = '1100'; // Asset
    const EQUITY_ACCOUNT = '3000';    // Equity

    const amount = 1000000; // 1 Million KES

    console.log(`Amount: KES ${amount.toLocaleString()}`);

    try {
        const tx = await AccountingEngine.postJournalEntry({
            transactionDate: new Date(),
            referenceType: ReferenceType.MANUAL_ADJUSTMENT,
            referenceId: 'CAPITAL_INJECTION_001',
            description: 'Initial Capital Injection for Lending',
            createdBy: 'SYSTEM_ADMIN',
            createdByName: 'System Admin',
            lines: [
                {
                    accountCode: PORTFOLIO_ACCOUNT,
                    debitAmount: amount, // Increase Asset (Available Balance)
                    creditAmount: 0,
                    description: 'Capital Injection'
                },
                {
                    accountCode: EQUITY_ACCOUNT,
                    debitAmount: 0,
                    creditAmount: amount, // Increase Equity
                    description: 'Capital Injection Source'
                }
            ]
        });

        console.log("✅ Capital Injected Successfully!");
        console.log(`Transaction ID: ${tx.id}`);

    } catch (error) {
        console.error("❌ Failed to inject capital:", error);
    }
}

injectCapital()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
