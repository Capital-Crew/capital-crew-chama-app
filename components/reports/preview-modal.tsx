'use client'

import { format } from 'date-fns'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { type Report, type FilterOptions, type ColumnDef, getColorClasses, ICON_MAP } from '@/lib/report-types'
import { Download, ArrowLeft, FileBarChart } from 'lucide-react'

interface PreviewModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    report: Report
    data: any[]
    rawData: any
    filters: FilterOptions
    onExport: () => void
    onBackToFilters: () => void
}

function formatCell(value: any, col: ColumnDef): string {
    if (value === null || value === undefined) return '—'
    switch (col.format) {
        case 'currency':
            return Number(value).toLocaleString('en-KE', {
                style: 'currency',
                currency: 'KES',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            })
        case 'percent':
            return `${Number(value).toFixed(2)}%`
        case 'number':
            return Number(value).toLocaleString()
        case 'date':
            try {
                return format(new Date(value), 'dd MMM yyyy')
            } catch {
                return String(value)
            }
        default:
            return String(value)
    }
}

function FilterBadges({ filters }: { filters: FilterOptions }) {
    const badges: string[] = []
    if (filters.startDate && filters.endDate) {
        badges.push(`${format(filters.startDate, 'dd MMM yyyy')} — ${format(filters.endDate, 'dd MMM yyyy')}`)
    }
    if (filters.asOfDate) {
        badges.push(`As of ${format(filters.asOfDate, 'dd MMM yyyy')}`)
    }
    if (badges.length === 0) return null
    return (
        <div className="flex flex-wrap gap-1.5">
            {badges.map((b, i) => (
                <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {b}
                </span>
            ))}
        </div>
    )
}

export function PreviewModal({ open, onOpenChange, report, data, rawData, filters, onExport, onBackToFilters }: PreviewModalProps) {
    const colors = getColorClasses(report.color)
    const Icon = ICON_MAP[report.icon]

    // Summary metrics from rawData
    const summary = rawData?.summary || {}
    const summaryEntries = Object.entries(summary).filter(([_, v]) => typeof v === 'number')

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[85vh] rounded-2xl border-0 shadow-2xl p-0 overflow-hidden flex flex-col">

                {/* ── Colored Header ── */}
                <div className={`px-6 pt-5 pb-4 ${colors.bg} border-b ${colors.border} flex-shrink-0`}>
                    <DialogHeader className="gap-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-lg ${colors.text} ${colors.bg} flex items-center justify-center ring-1 ring-inset ring-black/5 dark:ring-white/10`}>
                                    <Icon className="w-4.5 h-4.5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                                        {report.title}
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        <span>{data.length} records</span>
                                    </DialogDescription>
                                </div>
                            </div>
                            <FilterBadges filters={filters} />
                        </div>
                    </DialogHeader>
                </div>

                {/* ── Summary KPIs ── */}
                {summaryEntries.length > 0 && (
                    <div className="px-6 pt-4 pb-2 flex-shrink-0 border-b border-slate-100 dark:border-slate-800">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {summaryEntries.slice(0, 4).map(([key, value]) => (
                                <div key={key} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl px-3 py-2.5">
                                    <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                                    </div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                                        {typeof value === 'number' && Math.abs(value as number) >= 100
                                            ? (value as number).toLocaleString('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 })
                                            : typeof value === 'number' && (key.toLowerCase().includes('margin') || key.toLowerCase().includes('par') || key.toLowerCase().includes('nim'))
                                                ? `${(value as number).toFixed(2)}%`
                                                : Number(value).toLocaleString()
                                        }
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Data Table ── */}
                <div className="flex-1 overflow-auto">
                    {data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <FileBarChart className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                No data found for the selected filters
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">
                                Try adjusting the date range
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
                                        {report.columns.map(col => (
                                            <th
                                                key={col.key}
                                                className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 whitespace-nowrap
                                                    ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                                            >
                                                {col.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {data.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            {report.columns.map(col => (
                                                <td
                                                    key={col.key}
                                                    className={`px-4 py-2.5 whitespace-nowrap text-slate-700 dark:text-slate-300
                                                        ${col.align === 'right' ? 'text-right tabular-nums' : col.align === 'center' ? 'text-center' : 'text-left'}
                                                        ${col.format === 'currency' ? 'font-medium' : ''}`}
                                                >
                                                    {formatCell(row[col.key], col)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <DialogFooter className="px-6 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex-row gap-2 flex-shrink-0">
                    <button
                        onClick={onBackToFilters}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Filters
                    </button>
                    <div className="flex-1" />
                    <button
                        onClick={onExport}
                        disabled={data.length === 0}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Export
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
