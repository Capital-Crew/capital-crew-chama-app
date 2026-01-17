
import { db } from '@/lib/db';
import { LoanBalanceService } from '@/services/loan-balance';
import { AccountingEngine } from '@/lib/accounting/AccountingEngine';


async function main() {
    console.log('🧪 Starting Loan Balance Service Verification...');

    try {
        await db.$transaction(async (tx) => {
            // 1. Setup Data
            // Find an ASSET account (e.g., Ledger 1200)
            const assetAccount = await tx.account.findFirst({
                where: { type: 'ASSET', code: '1200' }
            });
            if (!assetAccount) throw new Error('Account 1200 (Asset) not found');

            const liabilityAccount = await tx.account.findFirst({
                where: { type: 'LIABILITY' } // or any other to balance
            }) || assetAccount;

            // Create Dummy Loan ID (We don't strictly need a Loan record for AccountingEngine calculation,
            // but LoanBalanceService updates the Loan record, so we need one).
            // We need a member and product first.
            const member = await tx.member.findFirst();
            if (!member) throw new Error('No members found to attach dummy loan');

            const product = await tx.loanProduct.findFirst();
            if (!product) throw new Error('No loan products found');

            const loan = await tx.loan.create({
                data: {
                    loanApplicationNumber: `TEST-${Date.now()}`,
                    memberId: member.id,
                    loanProductId: product.id,
                    amount: 5000,
                    outstandingBalance: 0,
                    current_balance: 0,
                    applicationDate: new Date(),
                    interestRate: 10,
                    status: 'APPROVED',
                    approvalVotes: [],
                    repaymentSchedule: [],
                    feeExemptions: {}
                    // other required fields? defaults should handle it based on schema
                }
            });

            console.log(`📝 Created Test Loan: ${loan.id}`);

            // 2. Test Initial Balance
            const bal1 = await LoanBalanceService.updateLoanBalance(loan.id, tx as any);
            console.log(`Check 1: Initial Balance: ${bal1} (Expected: 0)`);
            if (Number(bal1) !== 0) throw new Error('Initial balance check failed');

            // 3. Post Disbursement (Debit Asset 1000)
            await AccountingEngine.postJournalEntry({
                transactionDate: new Date(),
                referenceType: 'LOAN_DISBURSEMENT',
                referenceId: loan.id,
                description: 'Test Disbursement',
                createdBy: 'TEST',
                createdByName: 'Tester',
                lines: [
                    {
                        accountId: assetAccount.id,
                        debitAmount: 1000,
                        creditAmount: 0,
                        description: 'Debit Principal'
                    },
                    {
                        accountId: liabilityAccount.id,
                        debitAmount: 0,
                        creditAmount: 1000,
                        description: 'Credit Cash/Wallet'
                    }
                ]
            }, tx as any);

            const bal2 = await LoanBalanceService.updateLoanBalance(loan.id, tx as any);
            console.log(`Check 2: Post-Disbursement: ${bal2} (Expected: 1000)`);
            if (Number(bal2) !== 1000) throw new Error(`Disbursement check failed. Got ${bal2}`);

            // 4. Post Repayment (Credit Asset 200)
            await AccountingEngine.postJournalEntry({
                transactionDate: new Date(),
                referenceType: 'LOAN_REPAYMENT',
                referenceId: loan.id,
                description: 'Test Repayment',
                createdBy: 'TEST',
                createdByName: 'Tester',
                lines: [
                    {
                        accountId: assetAccount.id,
                        debitAmount: 0,
                        creditAmount: 200, // Reduces Asset
                        description: 'Credit Principal'
                    },
                    {
                        accountId: liabilityAccount.id,
                        debitAmount: 200,
                        creditAmount: 0,
                        description: 'Debit Cash'
                    }
                ]
            }, tx as any);

            const bal3 = await LoanBalanceService.updateLoanBalance(loan.id, tx as any);
            console.log(`Check 3: Post-Repayment: ${bal3} (Expected: 800)`);
            if (Number(bal3) !== 800) throw new Error(`Repayment check failed. Got ${bal3}`);

            // Rollback to clean up
            throw new Error('ROLLBACK_TEST');
        }, { timeout: 20000 }); // Increase timeout to 20s
    } catch (e: any) {
        if (e.message === 'ROLLBACK_TEST') {
            console.log('✅ Verification Successful! (Changes rolled back)');
        } else {
            console.error('❌ Verification Failed:', e);
            process.exit(1);
        }
    }
}

// Helper for product if needed
// ...

main();
