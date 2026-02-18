'use server'

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { ReportingService } from "@/lib/services/reporting-service"

/**
 * Deep-serialize: converts Decimals to numbers, Dates to strings,
 * and strips any functions or non-plain values so the result is
 * safe to pass from Server Actions to Client Components.
 */
function safeSerialize<T>(data: T): T {
    return JSON.parse(JSON.stringify(data, (_key, value) => {
        // Convert Decimal-like objects
        if (value && typeof value === 'object' && 'd' in value && 'e' in value && 's' in value) {
            return Number(value)
        }
        // Convert BigInt
        if (typeof value === 'bigint') {
            return Number(value)
        }
        return value
    }))
}

function auditLog(userId: string, details: string, summary: string) {
    db.auditLog.create({
        data: {
            userId,
            action: 'LOGIN',
            details,
            summary,
            context: 'REPORTS',
            severity: 'INFO',
            ipAddress: '0.0.0.0',
        }
    }).catch(err => console.error('[Audit] Report log failed:', err))
}

// ──────────────────────────────────────────
// Filter Options (members + products for dropdowns)
// ──────────────────────────────────────────
export async function getFilterOptionsAction() {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const [members, products] = await Promise.all([
        db.member.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
        db.loanProduct.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    ])
    return safeSerialize({ members, products })
}

// ──────────────────────────────────────────
// Report 1: Loan Disbursement
// ──────────────────────────────────────────
export async function getLoanDisbursementReportAction(
    startDate: Date, endDate: Date,
    filters?: { productId?: string; memberId?: string; status?: string }
) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const data = await ReportingService.getLoanDisbursementReport(startDate, endDate, filters)
    auditLog(session.user.id!, `Generated Loan Disbursement Report`, 'Loan Disbursement Report')
    return safeSerialize(data)
}

// ──────────────────────────────────────────
// Report 2: Active Loan Portfolio
// ──────────────────────────────────────────
export async function getActiveLoanPortfolioAction(asOfDate?: Date, filters?: { productId?: string; status?: string }) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const data = await ReportingService.getActiveLoanPortfolio(asOfDate || new Date(), filters)
    auditLog(session.user.id!, `Generated Active Loan Portfolio`, 'Active Loan Portfolio')
    return safeSerialize(data)
}

// ──────────────────────────────────────────
// Report 3: PAR / Delinquency
// ──────────────────────────────────────────
export async function getPARReportAction(asOfDate?: Date) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const data = await ReportingService.getPortfolioAtRisk(asOfDate || new Date())
    auditLog(session.user.id!, `Generated PAR Report as of ${asOfDate || 'today'}`, 'PAR Report')
    return safeSerialize(data)
}

// ──────────────────────────────────────────
// Report 4: Trial Balance
// ──────────────────────────────────────────
export async function getTrialBalanceAction(asOfDate?: Date) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const data = await ReportingService.getFinancialStatements('TRIAL_BALANCE', asOfDate || new Date())
    auditLog(session.user.id!, `Generated Trial Balance`, 'Trial Balance')
    return safeSerialize(data)
}

// ──────────────────────────────────────────
// Report 5: Balance Sheet
// ──────────────────────────────────────────
export async function getBalanceSheetAction(asOfDate?: Date) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const data = await ReportingService.getFinancialStatements('BALANCE_SHEET', asOfDate || new Date())
    auditLog(session.user.id!, `Generated Balance Sheet`, 'Balance Sheet')
    return safeSerialize(data)
}

// ──────────────────────────────────────────
// Report 6: Income Statement
// ──────────────────────────────────────────
export async function getIncomeStatementAction(asOfDate?: Date) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const data = await ReportingService.getFinancialStatements('INCOME_STATEMENT', asOfDate || new Date())
    auditLog(session.user.id!, `Generated Income Statement`, 'Income Statement')
    return safeSerialize(data)
}

// ──────────────────────────────────────────
// Report 7: Cash Flow Statement
// ──────────────────────────────────────────
export async function getCashFlowAction(startDate: Date, endDate: Date) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const data = await ReportingService.getCashFlowStatement(startDate, endDate)
    auditLog(session.user.id!, `Generated Cash Flow Statement`, 'Cash Flow Statement')
    return safeSerialize(data)
}

// ──────────────────────────────────────────
// Report 8: Product Profitability
// ──────────────────────────────────────────
export async function getProductProfitabilityAction(startDate: Date, endDate: Date) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const data = await ReportingService.getProductProfitability(startDate, endDate)
    auditLog(session.user.id!, `Generated Product Profitability`, 'Product Profitability')
    return safeSerialize(data)
}

// ──────────────────────────────────────────
// Report 9: Fee Analysis
// ──────────────────────────────────────────
export async function getFeeAnalysisAction(startDate: Date, endDate: Date) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const data = await ReportingService.getFeeAnalysis(startDate, endDate)
    auditLog(session.user.id!, `Generated Fee Analysis`, 'Fee Analysis')
    return safeSerialize(data)
}

// ──────────────────────────────────────────
// Report 10: Net Interest Margin
// ──────────────────────────────────────────
export async function getNetInterestMarginAction(startDate: Date, endDate: Date) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const data = await ReportingService.getNetInterestMargin(startDate, endDate)
    auditLog(session.user.id!, `Generated NIM Report`, 'Net Interest Margin')
    return safeSerialize(data)
}

// ──────────────────────────────────────────
// Legacy (kept for backward compat)
// ──────────────────────────────────────────
export async function getOperationalReportAction(startDate: Date, endDate: Date) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const data = await ReportingService.getLendingOperationalReport(startDate, endDate)
    auditLog(session.user.id!, `Generated Operational Report`, 'Operational Report')
    return safeSerialize(data)
}

export async function getFinancialStatementAction(type: 'TRIAL_BALANCE' | 'BALANCE_SHEET' | 'INCOME_STATEMENT', asOfDate?: Date) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const data = await ReportingService.getFinancialStatements(type, asOfDate || new Date())
    auditLog(session.user.id!, `Generated ${type}`, `${type} Report`)
    return safeSerialize(data)
}
