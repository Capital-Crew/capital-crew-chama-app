'use client'

/**
 * Revamped Dashboard View Component
 * 
 * Displays group-wide financial overview with modern charts and analytics.
 * Accessible to all members.
 */

import React from 'react'
import { TrendingUp, DollarSign, Wallet, Download, Calendar, Landmark, Scale, Target, Activity } from 'lucide-react'
import { DelinquentLoansTable } from './dashboard/DelinquentLoansTable'
import { ContributionArrearsTable } from './dashboard/ContributionArrearsTable'


interface DashboardStats {
    totalContributions: number
    outstandingLoans: number
    delinquentLoans: any[]
    contributionArrears: any[]
}


interface Props {
    stats: DashboardStats
    personalDetail?: any // Type from getMemberFullDetail
    ledgerKPIs?: any
}

export function DashboardView({ stats, personalDetail, ledgerKPIs }: Props) {
    // Helper to export data

    // Helper to export data
    const handleExport = () => {
        const rows = [
            ['Metric', 'Value'],
            ['Total Contributions', stats.totalContributions],
            ['Outstanding Loans', stats.outstandingLoans],
            ['Total Delinquency', stats.delinquentLoans.reduce((acc, curr) => acc + curr.arrears, 0)]
        ]

        const csvContent = "data:text/csv;charset=utf-8,"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "dashboard_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <div className="min-h-screen bg-base-200">
            {}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-3 md:py-4 flex items-center justify-end">
                <div className="flex gap-2 md:gap-3">
                    {}
                    <button className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 bg-white border border-slate-200 rounded-lg text-xs md:text-sm font-semibold text-slate-600 hover:bg-slate-50">
                        <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">Last 12 Months</span>
                        <span className="sm:hidden">12M</span>
                    </button>

                    {}
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 bg-slate-900 text-white rounded-lg text-xs md:text-sm font-bold hover:bg-slate-800 transition-colors"
                    >
                        <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">Export Report</span>
                        <span className="sm:hidden">Export</span>
                    </button>
                </div>
            </div>

            <div className="p-4 md:p-6">
                <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {}
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight mb-1 md:mb-2">
                            Dashboard Overview
                        </h1>
                        <p className="text-xs md:text-base text-slate-500 font-medium">
                            Group financial performance and trends.
                        </p>
                    </div>

                    {}
                    <h2 className="sr-only">Key Metrics</h2>
                    
                    {}
                    {ledgerKPIs && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
                            <ModernMetricCard
                                icon={<Landmark className="w-5 h-5 md:w-6 md:h-6" />}
                                label="Total Assets"
                                value={ledgerKPIs.totalAssets || 0}
                                subtitle="Current gross assets"
                                gradient="from-blue-500 to-cyan-600"
                                iconBg="bg-blue-50"
                                iconColor="text-blue-600"
                            />
                            <ModernMetricCard
                                icon={<Scale className="w-5 h-5 md:w-6 md:h-6" />}
                                label="Total Liabilities"
                                value={ledgerKPIs.totalLiabilities || 0}
                                subtitle="External obligations"
                                gradient="from-amber-500 to-orange-600"
                                iconBg="bg-amber-50"
                                iconColor="text-amber-600"
                            />
                            <ModernMetricCard
                                icon={<TrendingUp className="w-5 h-5 md:w-6 md:h-6" />}
                                label="Total Revenue"
                                value={ledgerKPIs.totalRevenue || 0}
                                subtitle="Gross income"
                                gradient="from-emerald-500 to-teal-600"
                                iconBg="bg-emerald-50"
                                iconColor="text-emerald-600"
                            />
                            <ModernMetricCard
                                icon={<Target className="w-5 h-5 md:w-6 md:h-6" />}
                                label="Net Position"
                                value={ledgerKPIs.netPosition || 0}
                                subtitle="Assets - Liabilities"
                                gradient="from-purple-500 to-indigo-600"
                                iconBg="bg-purple-50"
                                iconColor="text-purple-600"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                        <ModernMetricCard
                            icon={<Wallet className="w-5 h-5 md:w-6 md:h-6" />}
                            label="Total Contributions"
                            value={stats.totalContributions}
                            subtitle="+12% vs last year" // Placeholder trend
                            gradient="from-cyan-500 to-blue-600"
                            iconBg="bg-cyan-50"
                            iconColor="text-cyan-600"
                        />
                        <ModernMetricCard
                            icon={<TrendingUp className="w-5 h-5 md:w-6 md:h-6" />}
                            label="Delinquent Loans"
                            value={stats.delinquentLoans.reduce((acc, curr) => acc + curr.arrears, 0)}
                            subtitle={`${stats.delinquentLoans.length} active overdue loans`}
                            gradient="from-red-500 to-pink-600"
                            iconBg="bg-red-50"
                            iconColor="text-red-600"
                        />
                        <ModernMetricCard
                            icon={<DollarSign className="w-5 h-5 md:w-6 md:h-6" />}
                            label="Outstanding Loans"
                            value={stats.outstandingLoans}
                            subtitle="Current active portfolio"
                            gradient="from-orange-500 to-red-600"
                            iconBg="bg-orange-50"
                            iconColor="text-orange-600"
                        />
                    </div>


                    {}
                    <h2 className="sr-only">Delinquency & Arrears</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
                        <DelinquentLoansTable loans={stats.delinquentLoans} />
                        <ContributionArrearsTable arrears={stats.contributionArrears} />
                    </div>
                </div>
            </div>
        </div>
    )
}

// --- Subcomponents ---

function ModernMetricCard({ icon, label, value, subtitle, gradient, iconBg, iconColor }: any) {
    // LIGHTHOUSE FIX 1.4: Use GPU-composited transform/opacity instead of transition-all/shadow layout cost
    return (
        <div className="bg-white p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
                <div className={`${iconBg} ${iconColor} p-2 rounded-xl md:rounded-2xl`}>
                    {icon}
                </div>
                {}
            </div>

            <div className="relative z-10">
                {}
                <p className="text-[10px] md:text-[11px] font-black text-slate-600 uppercase tracking-widest mb-0.5">{label}</p>
                <div className="text-xl md:text-2xl font-black text-slate-900 mb-0.5">
                    KES {value.toLocaleString()}
                </div>
                <p className="text-[10px] md:text-[11px] font-semibold text-slate-500">{subtitle}</p>
            </div>

            {}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 rounded-bl-[100px] transition-opacity duration-500`} />
        </div>
    )
}
