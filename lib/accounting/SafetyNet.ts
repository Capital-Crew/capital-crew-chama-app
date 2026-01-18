
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export class SafetyNet {

    /**
     * Checks if the entire Ledger is balanced.
     * Total Debits must equal Total Credits.
     */
    static async checkLedgerIntegrity(): Promise<{
        isBalanced: boolean;
        totalDebit: number;
        totalCredit: number;
        difference: number
    }> {
        // Aggregate all LedgerEntries
        const aggregation = await prisma.ledgerEntry.aggregate({
            _sum: {
                debitAmount: true,
                creditAmount: true
            }
        })

        const totalDebit = aggregation._sum.debitAmount || new Prisma.Decimal(0)
        const totalCredit = aggregation._sum.creditAmount || new Prisma.Decimal(0)
        const diff = totalDebit.minus(totalCredit)

        return {
            isBalanced: diff.equals(0),
            totalDebit: totalDebit.toNumber(),
            totalCredit: totalCredit.toNumber(),
            difference: diff.toNumber()
        }
    }

    /**
     * Validates that the cached 'balance' on LedgerAccount matches the sum of its entries.
     * Returns a list of mismatched accounts.
     */
    static async validateAccountBalances(): Promise<Array<{
        accountId: string;
        code: string;
        cachedBalance: number;
        calculatedBalance: number;
        difference: number;
    }>> {
        const accounts = await prisma.ledgerAccount.findMany()
        const mismatches = []

        for (const account of accounts) {
            // Calculate actual balance from entries
            // CoreLedger stores Balance as (Sum Credits - Sum Debits) universally?
            // Actually CoreLedger logic was:
            // Debit/Credit affect balance based on `increment: credit - debit`.
            // So Balance = Sum(Credit - Debit) = TotalCredit - TotalDebit.
            // This is the "Net Credit" convention.

            const entries = await prisma.ledgerEntry.aggregate({
                where: { ledgerAccountId: account.id },
                _sum: {
                    debitAmount: true,
                    creditAmount: true
                }
            })

            const sumDebit = entries._sum.debitAmount || new Prisma.Decimal(0)
            const sumCredit = entries._sum.creditAmount || new Prisma.Decimal(0)

            const calculated = sumCredit.minus(sumDebit)
            const cached = account.balance || new Prisma.Decimal(0) // Handle potential null

            if (!calculated.equals(cached)) {
                mismatches.push({
                    accountId: account.id,
                    code: account.code,
                    cachedBalance: cached.toNumber(),
                    calculatedBalance: calculated.toNumber(),
                    difference: calculated.minus(cached).toNumber()
                })
            }
        }

        return mismatches
    }
}
