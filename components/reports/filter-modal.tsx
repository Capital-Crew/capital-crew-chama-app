'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { type Report, type FilterOptions, getColorClasses, ICON_MAP } from '@/lib/report-types'
import { getFilterOptionsAction } from '@/app/actions/reporting-actions'
import { DatePickerField } from '@/components/ui/date-picker-field'
import { Loader2, Search } from 'lucide-react'

interface FilterModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    report: Report
    onPreview: (filters: FilterOptions) => void
    loading: boolean
    error: string | null
}

// The loan statuses that make sense for the disbursement report
const LOAN_STATUSES = [
    { value: '', label: 'All Statuses' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'DISBURSED', label: 'Disbursed' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'CLEARED', label: 'Cleared' },
    { value: 'OVERDUE', label: 'Overdue' },
    { value: 'WRITTEN_OFF', label: 'Written Off' },
]

const inputClass = "w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition-all"
const labelClass = "text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"

export function FilterModal({ open, onOpenChange, report, onPreview, loading, error }: FilterModalProps) {
    const colors = getColorClasses(report.color)
    const Icon = ICON_MAP[report.icon]

    // Filter state
    const today = new Date()
    const yearStart = new Date(today.getFullYear(), 0, 1)
    const [startDate, setStartDate] = useState<Date | undefined>(yearStart)
    const [endDate, setEndDate] = useState<Date | undefined>(today)
    const [asOfDate, setAsOfDate] = useState<Date | undefined>(today)
    const [productId, setProductId] = useState('')
    const [memberId, setMemberId] = useState('')
    const [status, setStatus] = useState('')
    const [memberSearch, setMemberSearch] = useState('')

    // Dropdown options loaded from server
    const [members, setMembers] = useState<{ id: string; name: string }[]>([])
    const [products, setProducts] = useState<{ id: string; name: string }[]>([])
    const [optionsLoading, setOptionsLoading] = useState(false)

    // Computed flags
    const needsDateRange = report.filters.includes('dateRange')
    const needsAsOfDate = report.filters.includes('asOfDate')
    const needsMember = report.filters.includes('member')
    const needsProduct = report.filters.includes('product')
    const needsStatus = report.filters.includes('status')
    const needsDropdowns = needsMember || needsProduct

    // Load dropdown options on open when needed
    useEffect(() => {
        if (open && needsDropdowns && members.length === 0) {
            setOptionsLoading(true)
            getFilterOptionsAction()
                .then(opts => {
                    setMembers(opts.members)
                    setProducts(opts.products)
                })
                .finally(() => setOptionsLoading(false))
        }
    }, [open, needsDropdowns])

    // Filtered member list for search
    const filteredMembers = memberSearch.trim()
        ? members.filter(m => m.name.toLowerCase().includes(memberSearch.toLowerCase()))
        : members

    const handleSubmit = () => {
        const filters: FilterOptions = {}
        if (needsDateRange) {
            filters.startDate = startDate
            filters.endDate = endDate
        }
        if (needsAsOfDate) {
            filters.asOfDate = asOfDate
        }
        if (needsProduct && productId) filters.productId = productId
        if (needsMember && memberId) filters.memberId = memberId
        if (needsStatus && status) filters.status = status
        onPreview(filters)
    }

    // Find selected member name for display
    const selectedMember = members.find(m => m.id === memberId)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-2xl p-0 overflow-hidden max-h-[85vh] flex flex-col">
                {}
                <div className={`px-6 pt-6 pb-4 ${colors.bg} border-b ${colors.border} flex-shrink-0`}>
                    <DialogHeader className="gap-0">
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`w-9 h-9 rounded-lg ${colors.text} ${colors.bg} flex items-center justify-center ring-1 ring-inset ring-black/5 dark:ring-white/10`}>
                                <Icon className="w-4.5 h-4.5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                                    {report.title}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                                    Configure filters and generate this report
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                {}
                <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
                    {}
                    {needsDateRange && (
                        <div className="grid grid-cols-2 gap-3">
                            <DatePickerField label="From" value={startDate} onChange={setStartDate} />
                            <DatePickerField label="To" value={endDate} onChange={setEndDate} />
                        </div>
                    )}

                    {}
                    {needsAsOfDate && (
                        <DatePickerField label="As of Date" value={asOfDate} onChange={setAsOfDate} />
                    )}

                    {}
                    {needsMember && (
                        <div className="space-y-1.5">
                            <span className={labelClass}>Member</span>
                            {optionsLoading ? (
                                <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading members…
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search members…"
                                            value={memberSearch}
                                            onChange={e => setMemberSearch(e.target.value)}
                                            className={`${inputClass} pl-9`}
                                        />
                                    </div>
                                    {}
                                    {selectedMember && (
                                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1.5">
                                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex-1">
                                                {selectedMember.name}
                                            </span>
                                            <button
                                                onClick={() => { setMemberId(''); setMemberSearch('') }}
                                                className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                    {}
                                    {memberSearch && !memberId && (
                                        <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
                                            {filteredMembers.length === 0 ? (
                                                <div className="px-3 py-2 text-xs text-slate-400">No members found</div>
                                            ) : (
                                                filteredMembers.slice(0, 20).map(m => (
                                                    <button
                                                        key={m.id}
                                                        onClick={() => { setMemberId(m.id); setMemberSearch('') }}
                                                        className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                    >
                                                        {m.name}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {}
                    {needsProduct && (
                        <label className="block space-y-1.5">
                            <span className={labelClass}>Loan Product</span>
                            {optionsLoading ? (
                                <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading products…
                                </div>
                            ) : (
                                <select value={productId} onChange={e => setProductId(e.target.value)} className={inputClass}>
                                    <option value="">All Products</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            )}
                        </label>
                    )}

                    {}
                    {needsStatus && (
                        <label className="block space-y-1.5">
                            <span className={labelClass}>Loan Status</span>
                            <select value={status} onChange={e => setStatus(e.target.value)} className={inputClass}>
                                {LOAN_STATUSES.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </label>
                    )}

                    {}
                    {error && (
                        <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2">
                            {error}
                        </div>
                    )}
                </div>

                {}
                <DialogFooter className="px-6 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex-row gap-2 flex-shrink-0">
                    <button
                        onClick={() => onOpenChange(false)}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all
                            ${loading ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90 active:scale-[0.98]'}
                            bg-slate-900 dark:bg-white dark:text-slate-900`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Generating…
                            </span>
                        ) : (
                            'Preview Report'
                        )}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
