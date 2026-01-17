import { Prisma, PrismaClient } from '@prisma/client';

/**
 * Service to enforce strict loan balance calculations from the ledger.
 * This ensures that the 'outstandingBalance' field on the Loan model
 * is always perfectly synced with the sum of all LoanTransactions.
 */
export class LoanBalanceService {

    /**
     * Recalculates and updates the outstanding balance for a loan based on its transaction history.
     * This should be called within the SAME transaction as the event that changed the balance.
     * 
     * Formula: Balance = (Disbursements + Interest + Penalties) - (Repayments + Waivers)
     * 
     * @param loanId The ID of the loan to update
     * @param tx The Prisma Transaction Client
     */
    static async updateLoanBalance(
        loanId: string,
        tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">
    ) {
        // 1. Calculate Balance directly from the General Ledger (Source of Truth)
        // This sums all ASSET account movements (Principal + Interest + Penalties) for this loan
        const { getLoanOutstandingBalance } = await import('@/lib/accounting/AccountingEngine');
        const newBalance = await getLoanOutstandingBalance(loanId, tx);

        // 2. Update the Loan Record
        await tx.loan.update({
            where: { id: loanId },
            data: {
                outstandingBalance: newBalance,
                // Legacy field support
                current_balance: newBalance
            }
        });

        return new Prisma.Decimal(newBalance);
    }
}
