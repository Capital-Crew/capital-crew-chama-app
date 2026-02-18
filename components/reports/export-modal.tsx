'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { type Report, type ColumnDef, getColorClasses, ICON_MAP } from '@/lib/report-types'
import { FileSpreadsheet, FileText, Download, Check } from 'lucide-react'

interface ExportModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    report: Report
    data: any[]
}

function toCsv(data: any[], columns: ColumnDef[]): string {
    const header = columns.map(c => c.label).join(',')
    const rows = data.map(row =>
        columns.map(c => {
            const val = row[c.key]
            if (val === null || val === undefined) return ''
            const str = String(val)
            return str.includes(',') || str.includes('"') || str.includes('\n')
                ? `"${str.replace(/"/g, '""')}"`
                : str
        }).join(',')
    )
    return [header, ...rows].join('\n')
}

function downloadFile(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

export function ExportModal({ open, onOpenChange, report, data }: ExportModalProps) {
    const colors = getColorClasses(report.color)
    const Icon = ICON_MAP[report.icon]
    const [format, setFormat] = useState<'csv' | 'pdf'>('csv')
    const [filename, setFilename] = useState(
        `${report.id}_${new Date().toISOString().slice(0, 10)}`
    )
    const [downloaded, setDownloaded] = useState(false)

    const handleDownload = () => {
        if (format === 'csv') {
            const csv = toCsv(data, report.columns)
            downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;')
        } else {
            // Simple HTML-based printable table for PDF
            const tableHtml = `
                <html>
                <head>
                    <title>${report.title}</title>
                    <style>
                        body { font-family: 'Segoe UI', sans-serif; padding: 30px; }
                        h1 { font-size: 18px; margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; font-size: 12px; }
                        th { background: #f1f5f9; text-align: left; padding: 8px 12px; border-bottom: 2px solid #e2e8f0; font-weight: 600; }
                        td { padding: 6px 12px; border-bottom: 1px solid #e2e8f0; }
                        .right { text-align: right; }
                    </style>
                </head>
                <body>
                    <h1>${report.title}</h1>
                    <p style="color: #64748b; font-size: 11px; margin-bottom: 16px;">Generated on ${new Date().toLocaleDateString()}</p>
                    <table>
                        <thead><tr>${report.columns.map(c => `<th${c.align === 'right' ? ' class="right"' : ''}>${c.label}</th>`).join('')}</tr></thead>
                        <tbody>${data.map(row => `<tr>${report.columns.map(c => `<td${c.align === 'right' ? ' class="right"' : ''}>${row[c.key] ?? '—'}</td>`).join('')}</tr>`).join('')}</tbody>
                    </table>
                </body>
                </html>
            `
            const win = window.open('', '_blank')
            if (win) {
                win.document.write(tableHtml)
                win.document.close()
                win.print()
            }
        }
        setDownloaded(true)
        setTimeout(() => setDownloaded(false), 2000)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm rounded-2xl border-0 shadow-2xl p-0 overflow-hidden">

                {/* ── Header ── */}
                <div className={`px-6 pt-6 pb-4 ${colors.bg} border-b ${colors.border}`}>
                    <DialogHeader className="gap-0">
                        <div className="flex items-center gap-3 mb-1">
                            <div className={`w-9 h-9 rounded-lg ${colors.text} ${colors.bg} flex items-center justify-center ring-1 ring-inset ring-black/5 dark:ring-white/10`}>
                                <Icon className="w-4.5 h-4.5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                                    Export Report
                                </DialogTitle>
                                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                                    {data.length} records ready
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                {/* ── Body ── */}
                <div className="px-6 py-5 space-y-4">
                    {/* Format Selection */}
                    <div className="space-y-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Format
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setFormat('csv')}
                                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all
                                    ${format === 'csv'
                                        ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                            >
                                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                <div className="text-left">
                                    <div className="text-xs font-bold text-slate-900 dark:text-white">CSV</div>
                                    <div className="text-[10px] text-slate-400">Spreadsheet</div>
                                </div>
                            </button>
                            <button
                                onClick={() => setFormat('pdf')}
                                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all
                                    ${format === 'pdf'
                                        ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                            >
                                <FileText className="w-4 h-4 text-red-500" />
                                <div className="text-left">
                                    <div className="text-xs font-bold text-slate-900 dark:text-white">PDF</div>
                                    <div className="text-[10px] text-slate-400">Print-ready</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Filename */}
                    <label className="block space-y-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Filename
                        </span>
                        <input
                            type="text"
                            value={filename}
                            onChange={e => setFilename(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition-all"
                        />
                    </label>
                </div>

                {/* ── Footer ── */}
                <DialogFooter className="px-6 pb-5 pt-0 flex-row gap-2">
                    <button
                        onClick={() => onOpenChange(false)}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={data.length === 0}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40"
                    >
                        {downloaded ? (
                            <>
                                <Check className="w-3.5 h-3.5" />
                                Downloaded!
                            </>
                        ) : (
                            <>
                                <Download className="w-3.5 h-3.5" />
                                Download
                            </>
                        )}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
