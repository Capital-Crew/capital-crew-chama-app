'use client'

import { useSession } from 'next-auth/react'
import {
    REPORTS,
    CATEGORY_LABELS,
    CATEGORY_ORDER,
    getColorClasses,
    ICON_MAP,
    type Report,
    type FilterOptions,
} from '@/lib/report-types'
import {
    getLoanDisbursementReportAction,
    getActiveLoanPortfolioAction,
    getPARReportAction,
    getTrialBalanceAction,
    getBalanceSheetAction,
    getIncomeStatementAction,
    getCashFlowAction,
    getProductProfitabilityAction,
    getFeeAnalysisAction,
    getNetInterestMarginAction,
} from '@/app/actions/reporting-actions'
import { FilterModal } from './filter-modal'
import { PreviewModal } from './preview-modal'
import { ExportModal } from './export-modal'
import { UserPermissions } from '@/lib/types'

// ── Permission Mapping ──
const PERMISSION_MAP: Record<string, keyof UserPermissions> = {
    'loan-disbursement': 'canViewReportLoanDisbursement',
    'active-loan-portfolio': 'canViewReportActivePortfolio',
    'delinquency-par': 'canViewReportPAR',
    'trial-balance': 'canViewReportTrialBalance',
    'balance-sheet': 'canViewReportBalanceSheet',
    'income-statement': 'canViewReportIncomeStatement',
    'cash-flow': 'canViewReportCashFlow',
    'product-profitability': 'canViewReportProductProfitability',
    'fee-analysis': 'canViewReportFeeAnalysis',
    'net-interest-margin': 'canViewReportNetInterestMargin',
}

// ── Action dispatcher ──
async function fetchReport(report: Report, filters: FilterOptions) {
    const startDate = filters.startDate || new Date(new Date().getFullYear(), 0, 1)
    const endDate = filters.endDate || new Date()
    const asOfDate = filters.asOfDate || new Date()

    switch (report.actionKey) {
        case 'getLoanDisbursementReport':
            return getLoanDisbursementReportAction(startDate, endDate, { productId: filters.productId, memberId: filters.memberId, status: filters.status })
        case 'getActiveLoanPortfolio':
            return getActiveLoanPortfolioAction(asOfDate, { productId: filters.productId, status: filters.status })
        case 'getPARReport':
            return getPARReportAction(asOfDate)
        case 'getTrialBalance':
            return getTrialBalanceAction(asOfDate)
        case 'getBalanceSheet':
            return getBalanceSheetAction(asOfDate)
        case 'getIncomeStatement':
            return getIncomeStatementAction(asOfDate)
        case 'getCashFlow':
            return getCashFlowAction(startDate, endDate)
        case 'getProductProfitability':
            return getProductProfitabilityAction(startDate, endDate)
        case 'getFeeAnalysis':
            return getFeeAnalysisAction(startDate, endDate)
        case 'getNetInterestMargin':
            return getNetInterestMarginAction(startDate, endDate)
        default:
            throw new Error(`Unknown report: ${report.actionKey}`)
    }
}

// ── Normalize data into rows array ──
function normalizeRows(data: any, report: Report): any[] {
    if (data?.rows) return data.rows
    if (data?.breakdown) return data.breakdown
    if (data?.accounts) return data.accounts
    // Balance Sheet / Income Statement have nested structure
    const rows: any[] = []
    if (data?.assets?.items) {
        rows.push(...data.assets.items.map((i: any) => ({ ...i, category: 'Assets' })))
    }
    if (data?.liabilities?.items) {
        rows.push(...data.liabilities.items.map((i: any) => ({ ...i, category: 'Liabilities' })))
    }
    if (data?.equity?.items) {
        rows.push(...data.equity.items.map((i: any) => ({ ...i, category: 'Equity' })))
    }
    if (data?.revenue?.items) {
        rows.push(...data.revenue.items.map((i: any) => ({ ...i, category: 'Revenue' })))
    }
    if (data?.expenses?.items) {
        rows.push(...data.expenses.items.map((i: any) => ({ ...i, category: 'Expenses' })))
    }
    return rows
}

export function ReportsDashboard() {
    const { data: session } = useSession()
    const userPermissions = (session?.user as any)?.permissions as UserPermissions | undefined

    const [selectedReport, setSelectedReport] = useState<Report | null>(null)
    const [showFilterModal, setShowFilterModal] = useState(false)
    const [showPreviewModal, setShowPreviewModal] = useState(false)
    const [showExportModal, setShowExportModal] = useState(false)

    const [reportData, setReportData] = useState<any>(null)
    const [reportRows, setReportRows] = useState<any[]>([])
    const [appliedFilters, setAppliedFilters] = useState<FilterOptions>({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleCardClick = useCallback((report: Report) => {
        setSelectedReport(report)
        setReportData(null)
        setReportRows([])
        setError(null)
        setShowFilterModal(true)
    }, [])

    const handlePreview = useCallback(async (filters: FilterOptions) => {
        if (!selectedReport) return
        setAppliedFilters(filters)
        setLoading(true)
        setError(null)
        try {
            const data = await fetchReport(selectedReport, filters)
            setReportData(data)
            setReportRows(normalizeRows(data, selectedReport))
            setShowFilterModal(false)
            setShowPreviewModal(true)
        } catch (err: any) {
            setError(err.message || 'Failed to fetch report')
        } finally {
            setLoading(false)
        }
    }, [selectedReport])

    const handleExport = useCallback(() => {
        setShowPreviewModal(false)
        setShowExportModal(true)
    }, [])

    // Filter reports based on permissions
    const filteredReports = REPORTS.filter(report => {
        if (!userPermissions) return false

        // Admin override
        if ((session?.user as any)?.role === 'SYSTEM_ADMIN' || userPermissions.canViewAll) {
            return true
        }

        const permKey = PERMISSION_MAP[report.id]
        if (!permKey) return true // Default to show if no granular key defined

        return userPermissions[permKey] === true
    })

    const grouped = CATEGORY_ORDER.map(cat => ({
        category: cat,
        label: CATEGORY_LABELS[cat],
        reports: filteredReports.filter(r => r.category === cat),
    })).filter(group => group.reports.length > 0)

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">

            {/* ── Header ── */}
            <div className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-4 md:py-5">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                        Reports Hub
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Financial insights & analytics — Click any report to generate
                    </p>
                </div>
            </div>

            {/* ── Card Grid ── */}
            <div className="px-4 md:px-6 py-5 md:py-8 max-w-7xl mx-auto space-y-8">
                {grouped.map(({ category, label, reports }) => (
                    <section key={category} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 ml-1">
                            {label}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                            {reports.map(report => {
                                const colors = getColorClasses(report.color)
                                const Icon = ICON_MAP[report.icon]
                                return (
                                    <button
                                        key={report.id}
                                        onClick={() => handleCardClick(report)}
                                        className={`group relative p-5 rounded-2xl border ${colors.border} ${colors.bg} ${colors.hover}
                                            text-left transition-all duration-300 cursor-pointer
                                            hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center ring-1 ring-inset ring-black/5 dark:ring-white/10 transition-transform duration-300 group-hover:scale-110`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                                                    {report.title}
                                                </h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                                    {report.description}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`absolute bottom-2.5 right-3 text-xs font-medium ${colors.text} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                                            Generate →
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </section>
                ))}
            </div>

            {/* ── Modals ── */}
            {selectedReport && (
                <>
                    <FilterModal
                        open={showFilterModal}
                        onOpenChange={setShowFilterModal}
                        report={selectedReport}
                        onPreview={handlePreview}
                        loading={loading}
                        error={error}
                    />

                    <PreviewModal
                        open={showPreviewModal}
                        onOpenChange={setShowPreviewModal}
                        report={selectedReport}
                        data={reportRows}
                        rawData={reportData}
                        filters={appliedFilters}
                        onExport={handleExport}
                        onBackToFilters={() => {
                            setShowPreviewModal(false)
                            setShowFilterModal(true)
                        }}
                    />

                    <ExportModal
                        open={showExportModal}
                        onOpenChange={setShowExportModal}
                        report={selectedReport}
                        data={reportRows}
                    />
                </>
            )}
        </div>
    )
}
