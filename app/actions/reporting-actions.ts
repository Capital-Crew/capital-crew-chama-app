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
            action: 'USER_LOGIN' as any,
            details,
            summary,
            context: 'REPORTS',
            severity: 'INFO',
            ipAddress: '0.0.0.0',
        }
    })
}

export async function getFilterOptionsAction() {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const [members, products] = await Promise.all([
        db.member.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
        db.loanProduct.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    ])
    return safeSerialize({ members, products })
}

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

export async function getActiveLoanPortfolioAction(asOfDate?: Date, filters?: { productId?: string; status?: string }) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const data = await ReportingService.getActiveLoanPortfolio(asOfDate || new Date(), filters)
    auditLog(session.user.id!, `Generated Active Loan Portfolio`, 'Active Loan Portfolio')
    return safeSerialize(data)
}

export async function getPARReportAction(asOfDate?: Date) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const data = await ReportingService.getPortfolioAtRisk(asOfDate || new Date())
    auditLog(session.user.id!, `Generated PAR Report as of ${asOfDate || 'today'}`, 'PAR Report')
    return safeSerialize(data)
}

export async function getTrialBalanceAction(asOfDate?: Date) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const data = await ReportingService.getFinancialStatements('TRIAL_BALANCE', asOfDate || new Date())
    auditLog(session.user.id!, `Generated Trial Balance`, 'Trial Balance')
    return safeSerialize(data)
}

export async function getBalanceSheetAction(asOfDate?: Date) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const data = await ReportingService.getFinancialStatements('BALANCE_SHEET', asOfDate || new Date())
    auditLog(session.user.id!, `Generated Balance Sheet`, 'Balance Sheet')
    return safeSerialize(data)
}

export async function getRevenueStatementAction(asOfDate?: Date) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const data = await ReportingService.getFinancialStatements('REVENUE_STATEMENT', asOfDate || new Date())
    auditLog(session.user.id!, `Generated Revenue Statement`, 'Revenue Statement')
    return safeSerialize(data)
}

export async function getCashFlowAction(startDate: Date, endDate: Date) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const data = await ReportingService.getCashFlowStatement(startDate, endDate)
    auditLog(session.user.id!, `Generated Cash Flow Statement`, 'Cash Flow Statement')
    return safeSerialize(data)
}

export async function getProductProfitabilityAction(startDate: Date, endDate: Date) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const data = await ReportingService.getProductProfitability(startDate, endDate)
    auditLog(session.user.id!, `Generated Product Profitability`, 'Product Profitability')
    return safeSerialize(data)
}

export async function getFeeAnalysisAction(startDate: Date, endDate: Date) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const data = await ReportingService.getFeeAnalysis(startDate, endDate)
    auditLog(session.user.id!, `Generated Fee Analysis`, 'Fee Analysis')
    return safeSerialize(data)
}

export async function getNetInterestMarginAction(startDate: Date, endDate: Date) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const data = await ReportingService.getNetInterestMargin(startDate, endDate)
    auditLog(session.user.id!, `Generated NIM Report`, 'Net Interest Margin')
    return safeSerialize(data)
}

export async function getOperationalReportAction(startDate: Date, endDate: Date) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const data = await ReportingService.getLendingOperationalReport(startDate, endDate)
    auditLog(session.user.id!, `Generated Operational Report`, 'Operational Report')
    return safeSerialize(data)
}

export async function getFinancialStatementAction(type: 'TRIAL_BALANCE' | 'BALANCE_SHEET' | 'REVENUE_STATEMENT', asOfDate?: Date) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")
    const data = await ReportingService.getFinancialStatements(type, asOfDate || new Date())
    auditLog(session.user.id!, `Generated ${type}`, `${type} Report`)
    return safeSerialize(data)
}
