import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { Decimal } from 'decimal.js'
import { LedgerService } from './ledger-service'

export interface RevenueStatement {
    interestRevenue: Decimal
    feeRevenue: Decimal
    penaltyRevenue: Decimal
    totalRevenue: Decimal
    loanLossProvisions: Decimal
    netRevenue: Decimal
}

export interface BalanceSheet {
    assets: {
        grossLoanPortfolio: Decimal
        loanLossProvisions: Decimal
        netLoanPortfolio: Decimal
        cashAndBank: Decimal
        totalAssets: Decimal
    }
    liabilities: {
        memberSavings: Decimal
        totalLiabilities: Decimal
    }
    equity: {
        retainedEarnings: Decimal
        currentYearProfit: Decimal
        totalEquity: Decimal
    }
}

export class AccountingService {
    /**
     * Revenue Statement (P&L)
     * Mirrors Fineract logic: sum portions from LoanTransactions.
     */
    static async getRevenueStatement(startDate: Date, endDate: Date, basis: 'CASH' | 'ACCRUAL' = 'CASH'): Promise<RevenueStatement> {
        // For Cash Basis, we look at REPAYMENT transactions
        // For Accrual Basis, we look at INTEREST and PENALTY accrual transactions (if implemented as such)

        const transactionTypes = basis === 'CASH'
            ? ['REPAYMENT']
            : ['INTEREST', 'PENALTY', 'REPAYMENT'] // Simplified: In accrual, interest/penalties are revenue when posted

        const aggregations = await db.loanTransaction.aggregate({
            where: {
                postedAt: {
                    gte: startDate,
                    lte: endDate
                },
                type: { in: transactionTypes as any },
                isReversed: false
            },
            _sum: {
                interestAmount: true,
                feeAmount: true,
                penaltyAmount: true
            }
        })

        const interestRevenue = new Decimal(aggregations._sum.interestAmount?.toString() || '0')
        const feeRevenue = new Decimal(aggregations._sum.feeAmount?.toString() || '0')
        const penaltyRevenue = new Decimal(aggregations._sum.penaltyAmount?.toString() || '0')
        const totalRevenue = interestRevenue.plus(feeRevenue).plus(penaltyRevenue)

        // Expense: Loan Loss Provisioning (Simplified for now - can be calculated based on PAR buckets)
        // PAR (Portfolio At Risk) logic would go here
        const loanLossProvisions = new Decimal(0) // Placeholder

        const netRevenue = totalRevenue.minus(loanLossProvisions)

        return {
            interestRevenue,
            feeRevenue,
            penaltyRevenue,
            totalRevenue,
            loanLossProvisions,
            netRevenue
        }
    }

    /**
     * Balance Sheet (Statement of Financial Position)
     * Point-in-time snapshot.
     */
    static async getBalanceSheet(asOfDate: Date): Promise<BalanceSheet> {
        // 1. Gross Loan Portfolio (Total Principal Outstanding as of Date)
        const disbursements = await db.ledgerEntry.aggregate({
            where: {
                ledgerTransaction: {
                    referenceType: 'LOAN_DISBURSEMENT',
                    transactionDate: { lte: asOfDate },
                    status: 'POSTED',
                    isReversed: false
                }
            },
            _sum: { debitAmount: true }
        })

        const repayments = await db.ledgerEntry.aggregate({
            where: {
                ledgerTransaction: {
                    referenceType: 'LOAN_REPAYMENT',
                    transactionDate: { lte: asOfDate },
                    status: 'POSTED',
                    isReversed: false
                }
            },
            _sum: { creditAmount: true }
        })

        const grossLoanPortfolio = new Decimal(disbursements._sum.debitAmount?.toString() || '0')
            .minus(new Decimal(repayments._sum.creditAmount?.toString() || '0'))

        const loanLossProvisions = new Decimal(0) // Placeholder
        const netLoanPortfolio = grossLoanPortfolio.minus(loanLossProvisions)

        // 2. Cash/Bank (Query mapping or fallback to '1000')
        const cashMapping = await db.systemAccountingMapping.findFirst({
            where: { type: 'CASH_ON_HAND' }
        })

        const cashAndBank = cashMapping
            ? await LedgerService.getDerivedBalance(cashMapping.accountId, asOfDate)
            : new Decimal(0)

        // 3. Liabilities: Member Savings/Shares (Query mapping or fallback to '2000')
        const savingsMapping = await db.systemAccountingMapping.findFirst({
            where: { type: 'MEMBER_WALLET' }
        })

        const memberSavings = savingsMapping
            ? await LedgerService.getDerivedBalance(savingsMapping.accountId, asOfDate)
            : new Decimal(0)

        const totalLiabilities = memberSavings

        // 4. Equity
        const currentYearProfit = (await this.getRevenueStatement(
            new Date(asOfDate.getFullYear(), 0, 1),
            asOfDate
        )).netRevenue

        const totalAssets = netLoanPortfolio.plus(cashAndBank)
        const retainedEarnings = totalAssets.minus(totalLiabilities).minus(currentYearProfit)

        return {
            assets: {
                grossLoanPortfolio,
                loanLossProvisions,
                netLoanPortfolio,
                cashAndBank,
                totalAssets
            },
            liabilities: {
                memberSavings,
                totalLiabilities
            },
            equity: {
                retainedEarnings,
                currentYearProfit,
                totalEquity: retainedEarnings.plus(currentYearProfit)
            }
        }
    }

    /**
     * Operational Metrics
     */
    static async getOperationalMetrics(startDate: Date, endDate: Date) {
        const aggregations = await db.loanTransaction.aggregate({
            where: {
                type: 'DISBURSEMENT',
                postedAt: { gte: startDate, lte: endDate },
                isReversed: false
            },
            _count: { id: true },
            _sum: { amount: true },
            _avg: { amount: true }
        })

        return {
            count: aggregations._count.id,
            totalVolume: new Decimal(aggregations._sum.amount?.toString() || '0'),
            averageSize: new Decimal(aggregations._avg.amount?.toString() || '0'),
            // Yield, PAR, etc. would be added here
        }
    }
}
