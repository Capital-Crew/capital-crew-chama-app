
import prisma from '@/lib/prisma'

export class SafetyNet {

    /**
     * Checks if the entire Ledger is balanced.
     * Total Debits must equal Total Credits.
     */
    static async checkLedgerIntegrity(): Promise<{
        isBalanced: boolean;
        totalDebit: bigint;
        totalCredit: bigint;
        difference: bigint
    }> {
        // Aggregate all LedgerEntries
        const aggregation = await prisma.ledgerEntry.aggregate({
            _sum: {
                debitAmount: true,
                creditAmount: true
            }
        })

        const totalDebit = aggregation._sum.debitAmount || BigInt(0)
        const totalCredit = aggregation._sum.creditAmount || BigInt(0)
        const diff = totalDebit - totalCredit

        return {
            isBalanced: diff === BigInt(0),
            totalDebit,
            totalCredit,
            difference: diff
        }
    }

    /**
     * Validates that the cached 'balance' on LedgerAccount matches the sum of its entries.
     * Returns a list of mismatched accounts.
     */
    static async validateAccountBalances(): Promise<Array<{
        accountId: string;
        code: string;
        cachedBalance: bigint;
        calculatedBalance: bigint;
        difference: bigint;
    }>> {
        const accounts = await prisma.ledgerAccount.findMany()
        const mismatches = []

        for (const account of accounts) {
            // Calculate actual balance from entries
            // Formula depends on Account Type?
            // CoreLedger stores 'balance' often as Credits - Debits for Liability/Equity/Revenue
            // and Debits - Credits for Asset/Expense?
            // actually CoreLedger.ts `recalculateBalance` uses:
            // balance = (sumCredits - sumDebits) for LIABILITY, EQUITY, REVENUE
            // balance = (sumDebits - sumCredits) for ASSET, EXPENSE

            // CoreLedger stores Balance as (Sum Credits - Sum Debits) universally.
            // This means Assets/Expenses are typically negative.
            // Liabilities/Equity/Revenue are typically positive.

            const entries = await prisma.ledgerEntry.aggregate({
                where: { ledgerAccountId: account.id },
                _sum: {
                    debitAmount: true,
                    creditAmount: true
                }
            })

            const sumDebit = entries._sum.debitAmount || BigInt(0)
            const sumCredit = entries._sum.creditAmount || BigInt(0)

            const calculated = sumCredit - sumDebit

            if (calculated !== account.balance) {
                mismatches.push({
                    accountId: account.id,
                    code: account.code,
                    cachedBalance: account.balance,
                    calculatedBalance: calculated,
                    difference: calculated - account.balance
                })
            }
        }

        return mismatches
    }
}
