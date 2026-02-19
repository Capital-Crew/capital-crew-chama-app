import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { Decimal } from 'decimal.js'

/**
 * ReportingService
 * 
 * Handles complex financial aggregations and risk metrics.
 * Follows the "Dynamic Derivation" principle: No stored totals.
 */
export class ReportingService {

    /**
     * Calculate Portfolio At Risk (PAR)
     * 
     * Logic:
     * 1. Fetch all ACTIVE/OVERDUE loans.
     * 2. For each loan, find the total principal repaid up to reportDate.
     * 3. Waterfall total principal repaid over the chronological repayment schedule.
     * 4. Identify the oldest installment where Principal Due > Principal Paid.
     * 5. Compute DPD = reportDate - dueDate.
     * 6. Bucket and aggregate.
     */
    static async getPortfolioAtRisk(asOfDate: Date = new Date()) {
        const reportDate = new Date(asOfDate)
        reportDate.setHours(23, 59, 59, 999)

        // 1. Fetch Candidate Loans
        const loans = await db.loan.findMany({
            where: {
                status: { in: ['ACTIVE', 'OVERDUE'] },
                disbursementDate: { lte: reportDate }
            },
            include: {
                member: true,
                loanProduct: true,
                repaymentInstallments: {
                    orderBy: { installmentNumber: 'asc' }
                },
                transactions: {
                    where: {
                        type: 'REPAYMENT',
                        isReversed: false,
                        postedAt: { lte: reportDate }
                    },
                    select: {
                        principalAmount: true
                    }
                }
            }
        })

        // 2. Process each loan
        const results = loans.map(loan => {
            // Total principal repaid up to reportDate
            const totalPrincipalRepaid = loan.transactions.reduce(
                (sum, tx) => sum.plus(new Decimal(tx.principalAmount.toString())),
                new Decimal(0)
            )

            // Dynamic Allocation Waterfall
            let remainingRepaid = totalPrincipalRepaid
            let oldestOverdueInstallment = null

            for (const inst of loan.repaymentInstallments) {
                const principalDue = new Decimal(inst.principalDue.toString())
                const paidTowardThis = Decimal.min(remainingRepaid, principalDue)

                const isPaid = paidTowardThis.gte(principalDue)
                remainingRepaid = remainingRepaid.minus(paidTowardThis)

                // If not paid and due date passed, it's overdue
                if (!isPaid && new Date(inst.dueDate) < reportDate) {
                    oldestOverdueInstallment = inst
                    break // Stop at oldest
                }
            }

            // Calculations
            const outstandingPrincipal = new Decimal(loan.amount?.toString() || '0').minus(totalPrincipalRepaid)
            const dpd = oldestOverdueInstallment
                ? Math.floor((reportDate.getTime() - new Date(oldestOverdueInstallment.dueDate).getTime()) / (1000 * 60 * 60 * 24))
                : 0

            let bucket = 'Current'
            if (dpd > 90) bucket = '90+'
            else if (dpd > 60) bucket = '61-90'
            else if (dpd > 30) bucket = '31-60'
            else if (dpd > 0) bucket = '1-30'

            return {
                loanId: loan.id,
                loanNumber: loan.loanApplicationNumber,
                memberName: loan.member.name,
                productName: loan.loanProduct?.name || 'N/A',
                outstandingPrincipal,
                dpd,
                bucket
            }
        })

        // 3. Global Aggregates
        const totalPortfolioOutstanding = results.reduce((sum, r) => sum.plus(r.outstandingPrincipal), new Decimal(0))

        const summary = {
            totalPortfolioOutstanding: totalPortfolioOutstanding.toNumber(),
            par30: 0,
            par60: 0,
            par90: 0,
            totalOverdueLoans: results.filter(r => r.dpd > 0).length,
            totalOverduePrincipal: results.filter(r => r.dpd > 0).reduce((sum, r) => sum.plus(r.outstandingPrincipal), new Decimal(0)).toNumber()
        }

        const buckets = {
            current: results.filter(r => r.dpd === 0).reduce((sum, r) => sum.plus(r.outstandingPrincipal), new Decimal(0)).toNumber(),
            par30: results.filter(r => r.dpd > 0 && r.dpd <= 30).reduce((sum, r) => sum.plus(r.outstandingPrincipal), new Decimal(0)).toNumber(),
            par60: results.filter(r => r.dpd > 30 && r.dpd <= 60).reduce((sum, r) => sum.plus(r.outstandingPrincipal), new Decimal(0)).toNumber(),
            par90: results.filter(r => r.dpd > 60 && r.dpd <= 90).reduce((sum, r) => sum.plus(r.outstandingPrincipal), new Decimal(0)).toNumber(),
            par90Plus: results.filter(r => r.dpd > 90).reduce((sum, r) => sum.plus(r.outstandingPrincipal), new Decimal(0)).toNumber()
        }

        if (totalPortfolioOutstanding.gt(0)) {
            summary.par30 = (results.filter(r => r.dpd > 30).reduce((sum, r) => sum.plus(r.outstandingPrincipal), new Decimal(0)).div(totalPortfolioOutstanding).toNumber()) * 100
            summary.par60 = (results.filter(r => r.dpd > 60).reduce((sum, r) => sum.plus(r.outstandingPrincipal), new Decimal(0)).div(totalPortfolioOutstanding).toNumber()) * 100
            summary.par90 = (results.filter(r => r.dpd > 90).reduce((sum, r) => sum.plus(r.outstandingPrincipal), new Decimal(0)).div(totalPortfolioOutstanding).toNumber()) * 100
        }

        return {
            reportDate,
            summary,
            buckets,
            breakdown: results.map(r => ({
                ...r,
                outstandingPrincipal: r.outstandingPrincipal.toNumber()
            }))
        }
    }

    /**
     * Get Lending Operational Report
     * 
     * Aggregates disbursements, volume, and collections within a date range.
     */
    static async getLendingOperationalReport(startDate: Date, endDate: Date) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)

        const loans = await db.loan.findMany({
            where: {
                disbursementDate: {
                    gte: start,
                    lte: end
                }
            },
            include: {
                loanProduct: true
            }
        })

        const repayments = await db.loanTransaction.findMany({
            where: {
                type: 'REPAYMENT',
                isReversed: false,
                postedAt: {
                    gte: start,
                    lte: end
                }
            }
        })

        const totalDisbursed = loans.reduce((sum, l) => sum.plus(new Decimal(l.amount?.toString() || '0')), new Decimal(0))
        const totalPrincipalCollected = repayments.reduce((sum, r) => sum.plus(new Decimal(r.principalAmount.toString())), new Decimal(0))
        const totalInterestCollected = repayments.reduce((sum, r) => sum.plus(new Decimal(r.interestAmount.toString())), new Decimal(0))
        const totalFeesCollected = repayments.reduce((sum, r) => sum.plus(new Decimal(r.feeAmount.toString())), new Decimal(0))

        // Group by product
        const productStats = await db.loanProduct.findMany({
            include: {
                _count: {
                    select: {
                        loans: {
                            where: {
                                disbursementDate: { gte: start, lte: end }
                            }
                        }
                    }
                }
            }
        })

        return {
            period: { start, end },
            summary: {
                count: loans.length,
                totalDisbursed: totalDisbursed.toNumber(),
                averageLoanSize: loans.length > 0 ? totalDisbursed.div(loans.length).toNumber() : 0,
                totalPrincipalCollected: totalPrincipalCollected.toNumber(),
                totalInterestCollected: totalInterestCollected.toNumber(),
                totalFeesCollected: totalFeesCollected.toNumber(),
                totalCollections: totalPrincipalCollected.plus(totalInterestCollected).plus(totalFeesCollected).toNumber()
            },
            productBreakdown: productStats.map(ps => ({
                name: ps.name,
                count: ps._count.loans,
            }))
        }
    }

    /**
     * Get Financial Statements
     * 
     * Supports Trial Balance, Balance Sheet, and Income Statement based on Ledger data.
     */
    static async getFinancialStatements(type: 'TRIAL_BALANCE' | 'BALANCE_SHEET' | 'INCOME_STATEMENT', asOfDate: Date = new Date()) {
        const { AccountingEngine } = await import('@/lib/accounting/AccountingEngine')

        // 1. Fetch all accounts
        const accounts = await db.ledgerAccount.findMany({
            orderBy: { code: 'asc' }
        })

        // 2. Fetch Aggregated Debits and Credits by Account ID
        // Optimized: Single query instead of N (account count) queries
        const aggregations = await db.ledgerEntry.groupBy({
            by: ['ledgerAccountId'],
            _sum: {
                debitAmount: true,
                creditAmount: true
            },
            where: {
                ledgerTransaction: {
                    transactionDate: { lte: asOfDate }
                }
            }
        })

        // Map aggregations for O(1) lookup
        const aggregationMap = new Map<string, { debit: Decimal, credit: Decimal }>()
        aggregations.forEach(agg => {
            aggregationMap.set(agg.ledgerAccountId, {
                debit: new Decimal(agg._sum.debitAmount?.toString() || '0'),
                credit: new Decimal(agg._sum.creditAmount?.toString() || '0')
            })
        })

        // 3. Calculate balances
        const statement = accounts.map((account) => {
            const agg = aggregationMap.get(account.id) || { debit: new Decimal(0), credit: new Decimal(0) }

            let balance = new Decimal(0)

            // Asset/Expense: Debit increases (+), Credit decreases (-)
            // Liability/Equity/Revenue: Credit increases (+), Debit decreases (-)
            if (['ASSET', 'EXPENSE'].includes(account.type)) {
                balance = agg.debit.minus(agg.credit)
            } else {
                balance = agg.credit.minus(agg.debit)
            }

            return {
                id: account.id,
                code: account.code,
                name: account.name,
                type: account.type, // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
                balance: balance.toNumber()
            }
        })

        // 3. Filter based on statement type
        if (type === 'TRIAL_BALANCE') {
            return {
                type,
                asOfDate,
                accounts: statement.filter(a => a.balance !== 0), // Filter out zero balance accounts? Maybe keep for completeness if requested.
                totals: {
                    debit: statement.filter(a => ['ASSET', 'EXPENSE'].includes(a.type)).reduce((sum, a) => sum + Math.max(0, a.balance), 0),
                    credit: statement.filter(a => ['LIABILITY', 'EQUITY', 'REVENUE'].includes(a.type)).reduce((sum, a) => sum + Math.max(0, a.balance), 0)
                }
            }
        }

        if (type === 'BALANCE_SHEET') {
            const assets = statement.filter(a => a.type === 'ASSET')
            const liabilities = statement.filter(a => a.type === 'LIABILITY')
            const equity = statement.filter(a => a.type === 'EQUITY')

            return {
                type,
                asOfDate,
                assets: {
                    items: assets,
                    total: assets.reduce((sum, a) => sum + a.balance, 0)
                },
                liabilities: {
                    items: liabilities,
                    total: liabilities.reduce((sum, a) => sum + a.balance, 0)
                },
                equity: {
                    items: equity,
                    total: equity.reduce((sum, a) => sum + a.balance, 0)
                }
            }
        }

        if (type === 'INCOME_STATEMENT') {
            const revenue = statement.filter(a => a.type === 'REVENUE')
            const expenses = statement.filter(a => a.type === 'EXPENSE')

            const totalRevenue = revenue.reduce((sum, a) => sum + a.balance, 0)
            const totalExpenses = expenses.reduce((sum, a) => sum + a.balance, 0)

            return {
                type,
                asOfDate,
                revenue: {
                    items: revenue,
                    total: totalRevenue
                },
                expenses: {
                    items: expenses,
                    total: totalExpenses
                },
                netIncome: totalRevenue - totalExpenses
            }
        }
    }

    // ======================================================
    // NEW SERVICE METHODS (Reports 2, 7, 8, 9, 10)
    // ======================================================

    /**
     * Report 1: Loan Disbursement Report
     * Loans disbursed within a date range with member & product details.
     */
    static async getLoanDisbursementReport(startDate: Date, endDate: Date, filters?: { productId?: string; memberId?: string; status?: string }) {
        const start = new Date(startDate); start.setHours(0, 0, 0, 0)
        const end = new Date(endDate); end.setHours(23, 59, 59, 999)

        const where: any = {
            disbursementDate: { gte: start, lte: end },
            status: { notIn: ['PENDING_APPROVAL', 'DRAFT'] },
        }
        if (filters?.productId) where.loanProductId = filters.productId
        if (filters?.memberId) where.memberId = filters.memberId
        if (filters?.status) where.status = filters.status // override the notIn

        const loans = await db.loan.findMany({
            where,
            include: { member: true, loanProduct: true },
            orderBy: { disbursementDate: 'desc' },
        })

        return {
            rows: loans.map(l => ({
                loanNumber: l.loanApplicationNumber,
                memberName: l.member.name,
                productName: l.loanProduct?.name || 'N/A',
                amount: new Decimal(l.amount?.toString() || '0').toNumber(),
                disbursementDate: l.disbursementDate?.toISOString() || '',
                status: l.status,
            })),
            summary: {
                totalLoans: loans.length,
                totalDisbursed: loans.reduce((s, l) => s.plus(new Decimal(l.amount?.toString() || '0')), new Decimal(0)).toNumber(),
            }
        }
    }

    /**
     * Report 2: Active Loan Portfolio
     * All currently ACTIVE/OVERDUE loans with outstanding balances.
     */
    static async getActiveLoanPortfolio(asOfDate: Date = new Date(), filters?: { productId?: string; status?: string }) {
        const where: any = {
            status: { in: ['ACTIVE', 'OVERDUE'] },
            disbursementDate: { lte: asOfDate },
        }
        if (filters?.productId) where.loanProductId = filters.productId
        if (filters?.status) where.status = filters.status

        const loans = await db.loan.findMany({
            where,
            include: {
                member: true,
                loanProduct: true,
                transactions: {
                    where: { type: 'REPAYMENT', isReversed: false, postedAt: { lte: asOfDate } },
                    select: { principalAmount: true }
                }
            },
            orderBy: { disbursementDate: 'desc' },
        })

        return {
            rows: loans.map(l => {
                const disbursed = new Decimal(l.amount?.toString() || '0')
                const repaid = l.transactions.reduce((s, t) => s.plus(new Decimal(t.principalAmount.toString())), new Decimal(0))
                return {
                    loanNumber: l.loanApplicationNumber,
                    memberName: l.member.name,
                    productName: l.loanProduct?.name || 'N/A',
                    disbursedAmount: disbursed.toNumber(),
                    outstandingBalance: disbursed.minus(repaid).toNumber(),
                    status: l.status,
                }
            }),
            summary: {
                totalLoans: loans.length,
                totalOutstanding: loans.reduce((s, l) => {
                    const disbursed = new Decimal(l.amount?.toString() || '0')
                    const repaid = l.transactions.reduce((s2, t) => s2.plus(new Decimal(t.principalAmount.toString())), new Decimal(0))
                    return s.plus(disbursed.minus(repaid))
                }, new Decimal(0)).toNumber(),
            }
        }
    }

    /**
     * Report 7: Cash Flow Statement
     * Derives operating, investing, and financing cash flows from loan transactions
     * and wallet/ledger movements.
     */
    static async getCashFlowStatement(startDate: Date, endDate: Date) {
        const start = new Date(startDate); start.setHours(0, 0, 0, 0)
        const end = new Date(endDate); end.setHours(23, 59, 59, 999)

        // Operating Activities
        // Inflows: Repayments (principal + interest + fees)
        const repayments = await db.loanTransaction.findMany({
            where: { type: 'REPAYMENT', isReversed: false, postedAt: { gte: start, lte: end } },
        })
        const repaymentPrincipal = repayments.reduce((s, r) => s.plus(new Decimal(r.principalAmount.toString())), new Decimal(0))
        const repaymentInterest = repayments.reduce((s, r) => s.plus(new Decimal(r.interestAmount.toString())), new Decimal(0))
        const repaymentFees = repayments.reduce((s, r) => s.plus(new Decimal(r.feeAmount.toString())), new Decimal(0))
        const repaymentPenalties = repayments.reduce((s, r) => s.plus(new Decimal(r.penaltyAmount.toString())), new Decimal(0))

        // Outflows: Expenses disbursed
        const expenses = await db.expense.findMany({
            where: { status: { in: ['DISBURSED', 'CLOSED'] }, date: { gte: start, lte: end } },
        })
        const totalExpenses = expenses.reduce((s, e) => s.plus(new Decimal(e.amount.toString())), new Decimal(0))

        // Investing Activities
        // Outflows: Loan disbursements
        const disbursements = await db.loanTransaction.findMany({
            where: { type: 'DISBURSEMENT', isReversed: false, postedAt: { gte: start, lte: end } },
        })
        const totalDisbursements = disbursements.reduce((s, d) => s.plus(new Decimal(d.amount.toString())), new Decimal(0))

        // Financing Activities
        // Inflows: Member contributions (shares + wallet deposits)
        const shares = await db.shareTransaction.findMany({
            where: { type: 'CONTRIBUTION', isReversed: false, createdAt: { gte: start, lte: end } },
        })
        const totalShares = shares.reduce((s, sh) => s.plus(new Decimal(sh.amount.toString())), new Decimal(0))

        const contributions = await db.contributionTransaction.findMany({
            where: { date: { gte: start, lte: end } },
        })
        const totalContributions = contributions.reduce((s, c) => s.plus(new Decimal(c.amount.toString())), new Decimal(0))

        const operatingInflow = repaymentPrincipal.plus(repaymentInterest).plus(repaymentFees).plus(repaymentPenalties)
        const operatingOutflow = totalExpenses
        const investingOutflow = totalDisbursements
        const financingInflow = totalShares.plus(totalContributions)

        return {
            rows: [
                { category: 'Operating', description: 'Loan Repayments (Principal)', inflow: repaymentPrincipal.toNumber(), outflow: 0, net: repaymentPrincipal.toNumber() },
                { category: 'Operating', description: 'Interest Collected', inflow: repaymentInterest.toNumber(), outflow: 0, net: repaymentInterest.toNumber() },
                { category: 'Operating', description: 'Fees & Penalties Collected', inflow: repaymentFees.plus(repaymentPenalties).toNumber(), outflow: 0, net: repaymentFees.plus(repaymentPenalties).toNumber() },
                { category: 'Operating', description: 'Expenses Paid', inflow: 0, outflow: totalExpenses.toNumber(), net: totalExpenses.neg().toNumber() },
                { category: 'Investing', description: 'Loan Disbursements', inflow: 0, outflow: totalDisbursements.toNumber(), net: totalDisbursements.neg().toNumber() },
                { category: 'Financing', description: 'Share Capital Contributions', inflow: totalShares.toNumber(), outflow: 0, net: totalShares.toNumber() },
                { category: 'Financing', description: 'Member Contributions', inflow: totalContributions.toNumber(), outflow: 0, net: totalContributions.toNumber() },
            ],
            summary: {
                operatingNet: operatingInflow.minus(operatingOutflow).toNumber(),
                investingNet: investingOutflow.neg().toNumber(),
                financingNet: financingInflow.toNumber(),
                netCashFlow: operatingInflow.minus(operatingOutflow).minus(investingOutflow).plus(financingInflow).toNumber(),
            }
        }
    }

    /**
     * Report 8: Product Profitability
     * Revenue analysis by loan product.
     */
    static async getProductProfitability(startDate: Date, endDate: Date) {
        const start = new Date(startDate); start.setHours(0, 0, 0, 0)
        const end = new Date(endDate); end.setHours(23, 59, 59, 999)

        const products = await db.loanProduct.findMany({ where: { isActive: true } })

        const rows = await Promise.all(products.map(async (product) => {
            // Loans disbursed in period
            const loans = await db.loan.findMany({
                where: { loanProductId: product.id, disbursementDate: { gte: start, lte: end } },
            })

            // All repayments on this product's loans in the period
            const repayments = await db.loanTransaction.findMany({
                where: {
                    loan: { loanProductId: product.id },
                    type: 'REPAYMENT',
                    isReversed: false,
                    postedAt: { gte: start, lte: end }
                },
            })

            const totalDisbursed = loans.reduce((s, l) => s.plus(new Decimal(l.amount?.toString() || '0')), new Decimal(0))
            const interestIncome = repayments.reduce((s, r) => s.plus(new Decimal(r.interestAmount.toString())), new Decimal(0))
            const feeIncome = repayments.reduce((s, r) => s.plus(new Decimal(r.feeAmount.toString())), new Decimal(0))
            const penaltyIncome = repayments.reduce((s, r) => s.plus(new Decimal(r.penaltyAmount.toString())), new Decimal(0))

            return {
                productName: product.name,
                loanCount: loans.length,
                totalDisbursed: totalDisbursed.toNumber(),
                interestIncome: interestIncome.toNumber(),
                feeIncome: feeIncome.plus(penaltyIncome).toNumber(),
                totalRevenue: interestIncome.plus(feeIncome).plus(penaltyIncome).toNumber(),
            }
        }))

        return {
            rows: rows.sort((a, b) => b.totalRevenue - a.totalRevenue),
            summary: {
                totalRevenue: rows.reduce((s, r) => s + r.totalRevenue, 0),
                totalDisbursed: rows.reduce((s, r) => s + r.totalDisbursed, 0),
            }
        }
    }

    /**
     * Report 9: Fee Analysis
     * Breakdown of all fee-type income from loan transactions.
     */
    static async getFeeAnalysis(startDate: Date, endDate: Date) {
        const start = new Date(startDate); start.setHours(0, 0, 0, 0)
        const end = new Date(endDate); end.setHours(23, 59, 59, 999)

        // Get all repayment transactions with fee/penalty amounts
        const transactions = await db.loanTransaction.findMany({
            where: {
                isReversed: false,
                postedAt: { gte: start, lte: end },
                type: { in: ['REPAYMENT', 'DISBURSEMENT'] },
            },
        })

        // Aggregate fees
        const feeRows = transactions.filter(t => new Decimal(t.feeAmount.toString()).gt(0))
        const penaltyRows = transactions.filter(t => new Decimal(t.penaltyAmount.toString()).gt(0))

        // Processing fees from loan disbursements
        const disbursedLoans = await db.loan.findMany({
            where: { disbursementDate: { gte: start, lte: end }, status: { notIn: ['PENDING_APPROVAL', 'DRAFT'] } },
        })
        const processingFees = disbursedLoans.reduce((s, l) => s.plus(new Decimal(l.processingFee.toString())), new Decimal(0))
        const insuranceFees = disbursedLoans.reduce((s, l) => s.plus(new Decimal(l.insuranceFee.toString())), new Decimal(0))

        const totalFees = feeRows.reduce((s, r) => s.plus(new Decimal(r.feeAmount.toString())), new Decimal(0))
        const totalPenalties = penaltyRows.reduce((s, r) => s.plus(new Decimal(r.penaltyAmount.toString())), new Decimal(0))

        const rows = [
            {
                feeType: 'Processing Fees',
                count: disbursedLoans.length,
                totalAmount: processingFees.toNumber(),
                avgAmount: disbursedLoans.length > 0 ? processingFees.div(disbursedLoans.length).toNumber() : 0,
            },
            {
                feeType: 'Insurance Fees',
                count: disbursedLoans.length,
                totalAmount: insuranceFees.toNumber(),
                avgAmount: disbursedLoans.length > 0 ? insuranceFees.div(disbursedLoans.length).toNumber() : 0,
            },
            {
                feeType: 'Repayment Fees',
                count: feeRows.length,
                totalAmount: totalFees.toNumber(),
                avgAmount: feeRows.length > 0 ? totalFees.div(feeRows.length).toNumber() : 0,
            },
            {
                feeType: 'Penalty Charges',
                count: penaltyRows.length,
                totalAmount: totalPenalties.toNumber(),
                avgAmount: penaltyRows.length > 0 ? totalPenalties.div(penaltyRows.length).toNumber() : 0,
            },
        ]

        return {
            rows,
            summary: {
                grandTotal: processingFees.plus(insuranceFees).plus(totalFees).plus(totalPenalties).toNumber(),
            }
        }
    }

    /**
     * Report 10: Net Interest Margin (NIM)
     * Interest income vs earning assets (loan portfolio).
     */
    static async getNetInterestMargin(startDate: Date, endDate: Date) {
        const start = new Date(startDate); start.setHours(0, 0, 0, 0)
        const end = new Date(endDate); end.setHours(23, 59, 59, 999)

        // Interest income collected in period
        const repayments = await db.loanTransaction.findMany({
            where: { type: 'REPAYMENT', isReversed: false, postedAt: { gte: start, lte: end } },
        })
        const interestIncome = repayments.reduce((s, r) => s.plus(new Decimal(r.interestAmount.toString())), new Decimal(0))

        // Total earning assets (outstanding loan portfolio at end date)
        const activeLoans = await db.loan.findMany({
            where: { status: { in: ['ACTIVE', 'OVERDUE'] }, disbursementDate: { lte: end } },
            include: {
                transactions: {
                    where: { type: 'REPAYMENT', isReversed: false, postedAt: { lte: end } },
                    select: { principalAmount: true }
                }
            }
        })

        const totalEarningAssets = activeLoans.reduce((s, l) => {
            const disbursed = new Decimal(l.amount?.toString() || '0')
            const repaid = l.transactions.reduce((s2, t) => s2.plus(new Decimal(t.principalAmount.toString())), new Decimal(0))
            return s.plus(disbursed.minus(repaid))
        }, new Decimal(0))

        // Interest expense (Member savings interest if any — using contribution-based cost)
        // For SACCO, cost of funds = interest paid on deposits, currently derived from welfare/savings interest
        const costOfFunds = new Decimal(0) // SACCOs typically don't pay interest on member deposits — this is 0

        const netInterestIncome = interestIncome.minus(costOfFunds)
        const nim = totalEarningAssets.gt(0)
            ? netInterestIncome.div(totalEarningAssets).times(100)
            : new Decimal(0)

        return {
            rows: [
                { metric: 'Interest Income', value: interestIncome.toNumber(), percentage: 100 },
                { metric: 'Interest Expense (Cost of Funds)', value: costOfFunds.toNumber(), percentage: totalEarningAssets.gt(0) ? costOfFunds.div(totalEarningAssets).times(100).toNumber() : 0 },
                { metric: 'Net Interest Income', value: netInterestIncome.toNumber(), percentage: totalEarningAssets.gt(0) ? netInterestIncome.div(totalEarningAssets).times(100).toNumber() : 0 },
                { metric: 'Average Earning Assets', value: totalEarningAssets.toNumber(), percentage: 100 },
                { metric: 'Net Interest Margin (NIM)', value: nim.toNumber(), percentage: nim.toNumber() },
            ],
            summary: {
                nim: nim.toNumber(),
                netInterestIncome: netInterestIncome.toNumber(),
                earningAssets: totalEarningAssets.toNumber(),
            }
        }
    }
}
