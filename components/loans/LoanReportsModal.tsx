'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CalendarIcon, TrendingUpIcon, LandmarkIcon, LayersIcon } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { getOperationalMetricsReport } from '@/app/actions/loan'
import { toast } from '@/lib/toast'
import { PortfolioReport } from './PortfolioReport'
import { FileTextIcon, BarChart3Icon } from 'lucide-react'

interface LoanReportsModalProps {
    isOpen: boolean
    onClose: () => void
}

export function LoanReportsModal({ isOpen, onClose }: LoanReportsModalProps) {
    const [activeTab, setActiveTab] = useState<'metrics' | 'portfolio'>('metrics')
    const [loading, setLoading] = useState(false)
    const [metrics, setMetrics] = useState<any>(null)
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    })

    const loadMetrics = async () => {
        setLoading(true)
        try {
            const data = await getOperationalMetricsReport(dateRange.startDate, dateRange.endDate)
            setMetrics(data)
        } catch (error: any) {
            toast.error("Error", "Failed to load operational metrics")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isOpen && activeTab === 'metrics') {
            loadMetrics()
        }
    }, [isOpen, activeTab])

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl bg-white rounded-3xl overflow-hidden border-none shadow-2xl p-0 h-[85vh] flex flex-col">
                <div className="bg-slate-900 p-8 text-white relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                    <div className="flex justify-between items-end relative z-10">
                        <div>
                            <LandmarkIcon className="w-12 h-12 text-cyan-400 mb-4 opacity-50" />
                            <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter mb-2">
                                Lending Reports
                            </DialogTitle>
                            <p className="text-slate-400 text-sm font-medium">Advanced portfolio analytics and operational insights.</p>
                        </div>

                        {/* Quick Tabs */}
                        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                            <button
                                onClick={() => setActiveTab('metrics')}
                                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'metrics' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'}`}
                            >
                                <BarChart3Icon className="w-4 h-4" />
                                Operational
                            </button>
                            <button
                                onClick={() => setActiveTab('portfolio')}
                                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'portfolio' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'}`}
                            >
                                <FileTextIcon className="w-4 h-4" />
                                Portfolio
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8 overflow-y-auto flex-1 scrollbar-none">
                    {activeTab === 'metrics' ? (
                        <>
                            {/* Filters */}
                            <div className="flex flex-wrap gap-4 items-end bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Start Date</label>
                                    <input
                                        type="date"
                                        value={dateRange.startDate}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="block w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">End Date</label>
                                    <input
                                        type="date"
                                        value={dateRange.endDate}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="block w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                                    />
                                </div>
                                <Button
                                    onClick={loadMetrics}
                                    disabled={loading}
                                    className="bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-tighter px-8 h-11 rounded-xl shadow-lg active:scale-95 transition-all ml-auto"
                                >
                                    {loading ? 'Crunching...' : 'Update Report'}
                                </Button>
                            </div>

                            {loading ? (
                                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                                    <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">Analyzing Transaction Data...</p>
                                </div>
                            ) : metrics ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Metric Cards... */}
                                    <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                                        <div className="w-12 h-12 bg-cyan-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-cyan-500 group-hover:text-white transition-all">
                                            <LayersIcon className="w-6 h-6 text-cyan-600 group-hover:text-white transition-all" />
                                        </div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Count</h4>
                                        <div className="text-3xl font-black text-slate-900 tracking-tighter">
                                            {metrics.count}
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-2">Disbursements in period</p>
                                    </div>

                                    <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                            <TrendingUpIcon className="w-6 h-6 text-blue-600 group-hover:text-white transition-all" />
                                        </div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Volume</h4>
                                        <div className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter">
                                            {formatCurrency(metrics.totalVolume)}
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-2">Aggregated principal value</p>
                                    </div>

                                    <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                            <CalendarIcon className="w-6 h-6 text-indigo-600 group-hover:text-white transition-all" />
                                        </div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Avg. Ticket Size</h4>
                                        <div className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter">
                                            {formatCurrency(metrics.averageSize)}
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-2">Mean disbursement amount</p>
                                    </div>
                                </div>
                            ) : null}
                        </>
                    ) : (
                        <PortfolioReport />
                    )}

                    <div className="pt-4 border-t border-slate-100">
                        <p className="text-[10px] text-slate-400 font-medium italic">
                            * Metric definitions: Volume includes all approved and processed disbursements within the selected range. Average size excludes cancelled or reversed entries. Risk buckets are calculated based on days past due date.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
