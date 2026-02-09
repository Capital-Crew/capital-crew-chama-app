import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { Decimal } from 'decimal.js'

export interface IncomeStatement {
    interestIncome: Decimal
    feeIncome: Decimal
    penaltyIncome: Decimal
    totalRevenue: Decimal
    loanLossProvisions: Decimal
    netIncome: Decimal
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
     * Income Statement (P&L)
     * Mirrors Fineract logic: sum portions from LoanTransactions.
     */
    static async getIncomeStatement(startDate: Date, endDate: Date, basis: 'CASH' | 'ACCRUAL' = 'CASH'): Promise<IncomeStatement> {
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

        const interestIncome = new Decimal(aggregations._sum.interestAmount?.toString() || '0')
        const feeIncome = new Decimal(aggregations._sum.feeAmount?.toString() || '0')
        const penaltyIncome = new Decimal(aggregations._sum.penaltyAmount?.toString() || '0')
        const totalRevenue = interestIncome.plus(feeIncome).plus(penaltyIncome)

        // Expense: Loan Loss Provisioning (Simplified for now - can be calculated based on PAR buckets)
        // PAR (Portfolio At Risk) logic would go here
        const loanLossProvisions = new Decimal(0) // Placeholder

        const netIncome = totalRevenue.minus(loanLossProvisions)

        return {
            interestIncome,
            feeIncome,
            penaltyIncome,
            totalRevenue,
            loanLossProvisions,
            netIncome
        }
    }

    /**
     * Balance Sheet (Statement of Financial Position)
     * Point-in-time snapshot.
     */
    static async getBalanceSheet(asOfDate: Date): Promise<BalanceSheet> {
        // 1. Gross Loan Portfolio (Total Principal Outstanding as of Date)
        // Sum(Disbursements.principal) - Sum(Repayments.principal) up to date
        const portfolioAgg = await db.loanTransaction.aggregate({
            where: {
                postedAt: { lte: asOfDate },
                isReversed: false
            },
            _sum: {
                principalAmount: true
            }
        })

        // Note: Disbursement principalAmount should be positive, Repayment principalAmount should be negative if using single sum,
        // OR we filter by type. In our schema, Repayment principalAmount is likely positive (how much was paid).
        // So: Gross Portfolio = Sum(DISBURSEMENT.principalAmount) - Sum(REPAYMENT.principalAmount)

        const disbursements = await db.loanTransaction.aggregate({
            where: {
                type: 'DISBURSEMENT',
                postedAt: { lte: asOfDate },
                isReversed: false
            },
            _sum: { amount: true }
        })

        const repayments = await db.loanTransaction.aggregate({
            where: {
                type: 'REPAYMENT',
                postedAt: { lte: asOfDate },
                isReversed: false
            },
            _sum: { principalAmount: true }
        })

        const grossLoanPortfolio = new Decimal(disbursements._sum.amount?.toString() || '0')
            .minus(new Decimal(repayments._sum.principalAmount?.toString() || '0'))

        const loanLossProvisions = new Decimal(0) // Placeholder
        const netLoanPortfolio = grossLoanPortfolio.minus(loanLossProvisions)

        // 2. Cash/Bank (Simplified: Sum of all transactions affecting cash accounts)
        // In a real system, this would query the LedgerAccount for 'CASH_ON_HAND' or similar.
        const cashAgg = await db.ledgerAccount.findFirst({
            where: { code: '1000' }, // Assume 1000 is Cash/Bank
            select: { balance: true }
        })
        const cashAndBank = new Decimal(cashAgg?.balance?.toString() || '0')

        const totalAssets = netLoanPortfolio.plus(cashAndBank)

        // 3. Liabilities: Member Savings/Shares
        const savingsAgg = await db.ledgerAccount.findFirst({
            where: { code: '2000' }, // Assume 2000 is Member Savings/Fund
            select: { balance: true }
        })
        const memberSavings = new Decimal(savingsAgg?.balance?.toString() || '0')
        const totalLiabilities = memberSavings

        // 4. Equity
        const currentYearProfit = (await this.getIncomeStatement(
            new Date(asOfDate.getFullYear(), 0, 1),
            asOfDate
        )).netIncome

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
