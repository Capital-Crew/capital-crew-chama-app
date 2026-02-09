'use client'

import React, { useState, useEffect } from 'react'
import {
    getPortfolioReport,
    getMembersForFilter,
    PortfolioFilterParams
} from '@/app/actions/portfolio-report-actions'
import { LoanStatus } from '@prisma/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getRiskBucketColor } from '@/lib/reporting-utils'
import { SearchableSelect, Option } from '@/components/ui/searchable-select'
import {
    SearchIcon,
    DownloadIcon,
    FilterIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    AlertCircleIcon,
    UserIcon,
    CalendarIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'

export function PortfolioReport() {
    // State
    const [filters, setFilters] = useState<PortfolioFilterParams>({
        status: undefined,
        memberId: '',
        startDate: '',
        endDate: '',
        minArrears: 0
    })
    const [page, setPage] = useState(1)
    const [data, setData] = useState<any[]>([])
    const [totalPages, setTotalPages] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [loading, setLoading] = useState(false)
    const [members, setMembers] = useState<any[]>([])

    // Load Data
    const runReport = async (resetPage = false) => {
        setLoading(true)
        try {
            const activePage = resetPage ? 1 : page
            if (resetPage) setPage(1)

            const result = await getPortfolioReport(filters, activePage)
            setData(result.data)
            setTotalPages(result.totalPages)
            setTotalCount(result.totalCount)
        } catch (error: any) {
            toast.error("Report Error", "Failed to fetch portfolio data.")
        } finally {
            setLoading(false)
        }
    }

    // Load Members
    useEffect(() => {
        getMembersForFilter().then(setMembers).catch(() => toast.error("Error", "Failed to load members"))
        runReport()
    }, [])

    // Handle Export
    const handleExport = () => {
        const params = new URLSearchParams()
        if (filters.status) params.append('status', filters.status)
        if (filters.memberId) params.append('memberId', filters.memberId)
        if (filters.startDate) params.append('startDate', filters.startDate)
        if (filters.endDate) params.append('endDate', filters.endDate)
        if (filters.minArrears) params.append('minArrears', filters.minArrears.toString())

        window.location.href = `/api/reports/export?${params.toString()}`
    }

    return (
        <div className="space-y-6">
            {/* Header & Main Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter flex items-center gap-2">
                        Portfolio Performance
                        <span className="bg-cyan-500 text-white text-[10px] not-italic px-2 py-0.5 rounded-full tracking-normal">Live</span>
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">Found {totalCount} matching loans.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => runReport(true)}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-tighter px-6 rounded-xl shadow-lg active:scale-95 transition-all h-11"
                    >
                        <SearchIcon className="w-4 h-4 mr-2" />
                        Run Report
                    </Button>
                    <Button
                        onClick={handleExport}
                        variant="outline"
                        className="border-2 border-slate-200 text-slate-700 font-black uppercase tracking-tighter px-6 rounded-xl hover:bg-slate-50 active:scale-95 transition-all h-11"
                    >
                        <DownloadIcon className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Smart Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-inner">
                {/* Status Filter */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                        <FilterIcon className="w-3 h-3" /> Status
                    </label>
                    <select
                        value={filters.status || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as LoanStatus }))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
                    >
                        <option value="">All Statuses</option>
                        {Object.values(LoanStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                {/* Borrower Filter */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                        <UserIcon className="w-3 h-3" /> Borrower
                    </label>
                    <SearchableSelect
                        options={members.map(m => ({
                            value: m.id,
                            label: `${m.name} (#${m.memberNumber})`
                        }))}
                        value={filters.memberId || ''}
                        onChange={(val) => setFilters(prev => ({ ...prev, memberId: val }))}
                        placeholder="Select borrower..."
                        emptyMessage="No borrower found."
                    />
                </div>

                {/* Date Start Filter */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                        <CalendarIcon className="w-3 h-3" /> Start Date
                    </label>
                    <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
                    />
                </div>

                {/* Date End Filter */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                        <CalendarIcon className="w-3 h-3" /> End Date
                    </label>
                    <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
                    />
                </div>

                {/* Min Arrears Filter */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                        <AlertCircleIcon className="w-3 h-3" /> Min. Arrears
                    </label>
                    <input
                        type="number"
                        placeholder="0.00"
                        value={filters.minArrears || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, minArrears: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
                    />
                </div>
            </div>

            {/* Performance Table */}
            <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest text-[10px] border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-5">Member Name</th>
                                <th className="px-6 py-5">Loan Amount</th>
                                <th className="px-6 py-5">Outstanding</th>
                                <th className="px-6 py-5">Days Late</th>
                                <th className="px-6 py-5">Risk Bucket</th>
                                <th className="px-6 py-5 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-8">
                                            <div className="h-4 bg-slate-100 rounded-full w-3/4 mb-2"></div>
                                            <div className="h-4 bg-slate-50 rounded-full w-1/2"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                                <SearchIcon className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">No matching loans found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                data.map((loan) => (
                                    <tr key={loan.id} className={`hover:bg-slate-50 transition-colors group ${loan.daysLate > 0 ? 'bg-rose-50/20' : ''}`}>
                                        <td className="px-6 py-5">
                                            <div className="font-black text-slate-900">{loan.member?.name || 'Unknown'}</div>
                                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{loan.loanApplicationNumber}</div>
                                        </td>
                                        <td className="px-6 py-5 font-bold text-slate-700">
                                            {formatCurrency(loan.amount)}
                                        </td>
                                        <td className="px-6 py-5 font-black text-slate-900">
                                            {formatCurrency(loan.outstandingBalance)}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className={`font-mono font-bold ${loan.daysLate > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                                {loan.daysLate}d
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${getRiskBucketColor(loan.riskBucket)}`}>
                                                {loan.riskBucket}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <span className="text-[10px] font-black uppercase px-2 py-1 bg-slate-100 text-slate-500 rounded-lg">
                                                {loan.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="bg-slate-50/50 px-6 py-4 flex justify-between items-center border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Page {page} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1 || loading}
                            onClick={() => {
                                setPage(p => p - 1)
                                runReport()
                            }}
                            className="h-8 w-8 p-0 rounded-lg border-slate-200"
                        >
                            <ChevronLeftIcon className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages || loading}
                            onClick={() => {
                                setPage(p => p + 1)
                                runReport()
                            }}
                            className="h-8 w-8 p-0 rounded-lg border-slate-200"
                        >
                            <ChevronRightIcon className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
