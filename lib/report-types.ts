import {
    FileText,
    TrendingUp,
    ShieldAlert,
    BookOpen,
    Scale,
    DollarSign,
    Banknote,
    PieChart,
    Receipt,
    LineChart,
} from "lucide-react"


export interface Report {
    id: string
    title: string
    description: string
    category: 'loan' | 'financial' | 'profitability'
    color: ReportColor
    icon: keyof typeof ICON_MAP
    /** Server action identifier */
    actionKey: string
    /** Columns for preview table */
    columns: ColumnDef[]
    /** Available filter fields */
    filters: FilterField[]
}

export interface ColumnDef {
    key: string
    label: string
    align?: 'left' | 'right' | 'center'
    format?: 'currency' | 'percent' | 'number' | 'date' | 'text'
}

export type FilterField = 'dateRange' | 'asOfDate' | 'product' | 'member' | 'status'

export interface FilterOptions {
    startDate?: Date
    endDate?: Date
    asOfDate?: Date
    productId?: string
    memberId?: string
    status?: string
}

export type ReportColor =
    | 'blue' | 'cyan' | 'violet'
    | 'emerald' | 'lime' | 'orange' | 'amber'
    | 'rose' | 'pink' | 'indigo'

export interface ColorClasses {
    bg: string
    text: string
    border: string
    hover: string
}


export const ICON_MAP = {
    FileText,
    TrendingUp,
    ShieldAlert,
    BookOpen,
    Scale,
    DollarSign,
    Banknote,
    PieChart,
    Receipt,
    LineChart,
} as const


export function getColorClasses(color: ReportColor): ColorClasses {
    const map: Record<ReportColor, ColorClasses> = {
        blue: {
            bg: 'bg-blue-50 dark:bg-blue-950',
            text: 'text-blue-600 dark:text-blue-400',
            border: 'border-blue-200 dark:border-blue-800',
            hover: 'hover:shadow-md hover:shadow-blue-500/10 dark:hover:shadow-blue-500/20',
        },
        cyan: {
            bg: 'bg-cyan-50 dark:bg-cyan-950',
            text: 'text-cyan-600 dark:text-cyan-400',
            border: 'border-cyan-200 dark:border-cyan-800',
            hover: 'hover:shadow-md hover:shadow-cyan-500/10 dark:hover:shadow-cyan-500/20',
        },
        violet: {
            bg: 'bg-violet-50 dark:bg-violet-950',
            text: 'text-violet-600 dark:text-violet-400',
            border: 'border-violet-200 dark:border-violet-800',
            hover: 'hover:shadow-md hover:shadow-violet-500/10 dark:hover:shadow-violet-500/20',
        },
        emerald: {
            bg: 'bg-emerald-50 dark:bg-emerald-950',
            text: 'text-emerald-600 dark:text-emerald-400',
            border: 'border-emerald-200 dark:border-emerald-800',
            hover: 'hover:shadow-md hover:shadow-emerald-500/10 dark:hover:shadow-emerald-500/20',
        },
        lime: {
            bg: 'bg-lime-50 dark:bg-lime-950',
            text: 'text-lime-600 dark:text-lime-400',
            border: 'border-lime-200 dark:border-lime-800',
            hover: 'hover:shadow-md hover:shadow-lime-500/10 dark:hover:shadow-lime-500/20',
        },
        orange: {
            bg: 'bg-orange-50 dark:bg-orange-950',
            text: 'text-orange-600 dark:text-orange-400',
            border: 'border-orange-200 dark:border-orange-800',
            hover: 'hover:shadow-md hover:shadow-orange-500/10 dark:hover:shadow-orange-500/20',
        },
        amber: {
            bg: 'bg-amber-50 dark:bg-amber-950',
            text: 'text-amber-600 dark:text-amber-400',
            border: 'border-amber-200 dark:border-amber-800',
            hover: 'hover:shadow-md hover:shadow-amber-500/10 dark:hover:shadow-amber-500/20',
        },
        rose: {
            bg: 'bg-rose-50 dark:bg-rose-950',
            text: 'text-rose-600 dark:text-rose-400',
            border: 'border-rose-200 dark:border-rose-800',
            hover: 'hover:shadow-md hover:shadow-rose-500/10 dark:hover:shadow-rose-500/20',
        },
        pink: {
            bg: 'bg-pink-50 dark:bg-pink-950',
            text: 'text-pink-600 dark:text-pink-400',
            border: 'border-pink-200 dark:border-pink-800',
            hover: 'hover:shadow-md hover:shadow-pink-500/10 dark:hover:shadow-pink-500/20',
        },
        indigo: {
            bg: 'bg-indigo-50 dark:bg-indigo-950',
            text: 'text-indigo-600 dark:text-indigo-400',
            border: 'border-indigo-200 dark:border-indigo-800',
            hover: 'hover:shadow-md hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/20',
        },
    }
    return map[color] || map.blue
}


export const REPORTS: Report[] = [
    // â”€â”€ Loan Reports â”€â”€
    {
        id: 'loan-disbursement',
        title: 'Loan Disbursement Report',
        description: 'Summary of loans disbursed within a date range, grouped by product.',
        category: 'loan',
        color: 'blue',
        icon: 'FileText',
        actionKey: 'getLoanDisbursementReport',
        filters: ['dateRange', 'member', 'product', 'status'],
        columns: [
            { key: 'loanNumber', label: 'Loan #' },
            { key: 'memberName', label: 'Member' },
            { key: 'productName', label: 'Product' },
            { key: 'amount', label: 'Amount', align: 'right', format: 'currency' },
            { key: 'disbursementDate', label: 'Date', format: 'date' },
            { key: 'status', label: 'Status' },
        ],
    },
    {
        id: 'active-loan-portfolio',
        title: 'Active Loan Portfolio',
        description: 'All currently active and overdue loans with outstanding balances.',
        category: 'loan',
        color: 'cyan',
        icon: 'TrendingUp',
        actionKey: 'getActiveLoanPortfolio',
        filters: ['asOfDate', 'product', 'status'],
        columns: [
            { key: 'loanNumber', label: 'Loan #' },
            { key: 'memberName', label: 'Member' },
            { key: 'productName', label: 'Product' },
            { key: 'disbursedAmount', label: 'Disbursed', align: 'right', format: 'currency' },
            { key: 'outstandingBalance', label: 'Outstanding', align: 'right', format: 'currency' },
            { key: 'status', label: 'Status' },
        ],
    },
    {
        id: 'delinquency-par',
        title: 'Delinquency & PAR Report',
        description: 'Portfolio-at-risk analysis with aging buckets and DPD breakdown.',
        category: 'loan',
        color: 'violet',
        icon: 'ShieldAlert',
        actionKey: 'getPARReport',
        filters: ['asOfDate'],
        columns: [
            { key: 'loanNumber', label: 'Loan #' },
            { key: 'memberName', label: 'Member' },
            { key: 'productName', label: 'Product' },
            { key: 'dpd', label: 'DPD', align: 'right', format: 'number' },
            { key: 'outstandingPrincipal', label: 'Outstanding', align: 'right', format: 'currency' },
            { key: 'bucket', label: 'Bucket' },
        ],
    },

    // â”€â”€ Financial Accounting â”€â”€
    {
        id: 'trial-balance',
        title: 'Trial Balance Report',
        description: 'Verification of debit and credit equality across the general ledger.',
        category: 'financial',
        color: 'emerald',
        icon: 'BookOpen',
        actionKey: 'getTrialBalance',
        filters: ['asOfDate'],
        columns: [
            { key: 'code', label: 'Code' },
            { key: 'name', label: 'Account Name' },
            { key: 'debit', label: 'Debit', align: 'right', format: 'currency' },
            { key: 'credit', label: 'Credit', align: 'right', format: 'currency' },
        ],
    },
    {
        id: 'balance-sheet',
        title: 'Balance Sheet Report',
        description: 'Statement of financial position showing assets, liabilities, and equity.',
        category: 'financial',
        color: 'lime',
        icon: 'Scale',
        actionKey: 'getBalanceSheet',
        filters: ['asOfDate'],
        columns: [
            { key: 'category', label: 'Category' },
            { key: 'name', label: 'Account' },
            { key: 'balance', label: 'Balance', align: 'right', format: 'currency' },
        ],
    },
    {
        id: 'revenue-statement',
        title: 'Revenue Statement Report',
        description: 'Revenue, expenses, and net income for a selected period.',
        category: 'financial',
        color: 'orange',
        icon: 'DollarSign',
        actionKey: 'getRevenueStatement',
        filters: ['asOfDate'],
        columns: [
            { key: 'category', label: 'Type' },
            { key: 'name', label: 'Account' },
            { key: 'balance', label: 'Amount', align: 'right', format: 'currency' },
        ],
    },
    {
        id: 'cash-flow',
        title: 'Cash Flow Statement',
        description: 'Operating, investing, and financing cash movements over a period.',
        category: 'financial',
        color: 'amber',
        icon: 'Banknote',
        actionKey: 'getCashFlow',
        filters: ['dateRange'],
        columns: [
            { key: 'category', label: 'Category' },
            { key: 'description', label: 'Description' },
            { key: 'inflow', label: 'Inflow', align: 'right', format: 'currency' },
            { key: 'outflow', label: 'Outflow', align: 'right', format: 'currency' },
            { key: 'net', label: 'Net', align: 'right', format: 'currency' },
        ],
    },

    // â”€â”€ Profitability â”€â”€
    {
        id: 'product-profitability',
        title: 'Product Profitability Report',
        description: 'Revenue and cost analysis per loan product.',
        category: 'profitability',
        color: 'rose',
        icon: 'PieChart',
        actionKey: 'getProductProfitability',
        filters: ['dateRange'],
        columns: [
            { key: 'productName', label: 'Product' },
            { key: 'loanCount', label: 'Loans', align: 'right', format: 'number' },
            { key: 'totalDisbursed', label: 'Disbursed', align: 'right', format: 'currency' },
            { key: 'interestIncome', label: 'Interest Income', align: 'right', format: 'currency' },
            { key: 'feeIncome', label: 'Fee Income', align: 'right', format: 'currency' },
            { key: 'totalRevenue', label: 'Total Revenue', align: 'right', format: 'currency' },
        ],
    },
    {
        id: 'fee-analysis',
        title: 'Fee Analysis Report',
        description: 'Breakdown of all fee income: processing, insurance, penalties, and misc.',
        category: 'profitability',
        color: 'pink',
        icon: 'Receipt',
        actionKey: 'getFeeAnalysis',
        filters: ['dateRange'],
        columns: [
            { key: 'feeType', label: 'Fee Type' },
            { key: 'count', label: 'Count', align: 'right', format: 'number' },
            { key: 'totalAmount', label: 'Total Amount', align: 'right', format: 'currency' },
            { key: 'avgAmount', label: 'Average', align: 'right', format: 'currency' },
        ],
    },
    {
        id: 'net-interest-margin',
        title: 'Net Interest Margin Report',
        description: 'Interest income versus cost of funds and earning asset analysis.',
        category: 'profitability',
        color: 'indigo',
        icon: 'LineChart',
        actionKey: 'getNetInterestMargin',
        filters: ['dateRange'],
        columns: [
            { key: 'metric', label: 'Metric' },
            { key: 'value', label: 'Value', align: 'right', format: 'currency' },
            { key: 'percentage', label: '%', align: 'right', format: 'percent' },
        ],
    },
]


export const CATEGORY_LABELS: Record<Report['category'], string> = {
    loan: 'Loan Reports',
    financial: 'Financial Accounting',
    profitability: 'Profitability',
}

export const CATEGORY_ORDER: Report['category'][] = ['loan', 'financial', 'profitability']
