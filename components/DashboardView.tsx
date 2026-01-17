'use client'

/**
 * Revamped Dashboard View Component
 * 
 * Displays group-wide financial overview with modern charts and analytics.
 * Accessible to all members.
 */

import React from 'react'
import { TrendingUp, DollarSign, Wallet, Download, Calendar, PieChart } from 'lucide-react'
import Link from 'next/link'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend
} from 'recharts'

interface DashboardStats {
    totalContributions: number
    totalLoansIssued: number
    outstandingLoans: number
    topContributors: Array<{ name: string; amount: number; id?: string }> // Added ID for linking
    topBorrowers: Array<{ name: string; amount: number; id?: string }>   // Added ID for linking
}

interface TrendData {
    name: string
    contributions: number
    loans: number
}

interface Props {
    stats: DashboardStats
    trends: TrendData[]
    personalDetail?: any // Type from getMemberFullDetail
}

export function DashboardView({ stats, trends, personalDetail }: Props) {
    // Helper to export data

    // Helper to export data
    const handleExport = () => {
        const rows = [
            ['Metric', 'Value'],
            ['Total Contributions', stats.totalContributions],
            ['Total Loans Issued', stats.totalLoansIssued],
            ['Outstanding Loans', stats.outstandingLoans],
            [],
            ['Month', 'Contributions', 'Loan Disbursements'],
            ...trends.map(t => [t.name, t.contributions, t.loans])
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
        <div className="min-h-screen bg-slate-50/50">
            {/* Header Actions */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-end">
                <div className="flex gap-3">
                    {/* Date Filter Placeholder */}
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50">
                        <Calendar className="w-4 h-4" />
                        Last 12 Months
                    </button>

                    {/* Export Button */}
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Export Report
                    </button>
                </div>
            </div>

            <div className="p-8">
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">
                            Financial Performance
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Real-time insights and growth trends
                        </p>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <ModernMetricCard
                            icon={<Wallet className="w-8 h-8" />}
                            label="Total Contributions"
                            value={stats.totalContributions}
                            subtitle="+12% vs last year" // Placeholder trend
                            gradient="from-cyan-500 to-blue-600"
                            iconBg="bg-cyan-50"
                            iconColor="text-cyan-600"
                        />
                        <ModernMetricCard
                            icon={<TrendingUp className="w-8 h-8" />}
                            label="Total Loans Disbursed"
                            value={stats.totalLoansIssued}
                            subtitle="All-time principal"
                            gradient="from-purple-500 to-pink-600"
                            iconBg="bg-purple-50"
                            iconColor="text-purple-600"
                        />
                        <ModernMetricCard
                            icon={<DollarSign className="w-8 h-8" />}
                            label="Outstanding Loans"
                            value={stats.outstandingLoans}
                            subtitle="Current active portfolio"
                            gradient="from-orange-500 to-red-600"
                            iconBg="bg-orange-50"
                            iconColor="text-orange-600"
                        />
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Trend Chart */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-cyan-500" />
                                Growth Trends
                            </h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trends}>
                                        <defs>
                                            <linearGradient id="colorContrib" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorLoan" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value: any) => [`KES ${Number(value).toLocaleString()}`, '']}
                                        />
                                        <Legend />
                                        <Area
                                            type="monotone"
                                            dataKey="contributions"
                                            name="Contributions"
                                            stroke="#06b6d4"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorContrib)"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="loans"
                                            name="Loans"
                                            stroke="#8b5cf6"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorLoan)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Comparison Chart */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <PieChart className="w-5 h-5 text-purple-500" />
                                Monthly Volume
                            </h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={trends}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#f8fafc' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value: any) => [`KES ${Number(value).toLocaleString()}`, '']}
                                        />
                                        <Legend />
                                        <Bar
                                            dataKey="contributions"
                                            name="Inflow (Contributions)"
                                            fill="#06b6d4"
                                            radius={[4, 4, 0, 0]}
                                            barSize={20}
                                        />
                                        <Bar
                                            dataKey="loans"
                                            name="Outflow (Loans)"
                                            fill="#ef4444"
                                            radius={[4, 4, 0, 0]}
                                            barSize={20}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Top Lists Analysis */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <TopListCard
                            title="Top Contributors"
                            subtitle="Highest capital builders"
                            items={stats.topContributors}
                            type="contributor"
                            icon="🏆"
                            theme="green"
                        />
                        <TopListCard
                            title="Top Borrowers"
                            subtitle="Active loan utilization"
                            items={stats.topBorrowers}
                            type="borrower"
                            icon="💰"
                            theme="blue"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

// --- Subcomponents ---

function ModernMetricCard({ icon, label, value, subtitle, gradient, iconBg, iconColor }: any) {
    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
                <div className={`${iconBg} ${iconColor} p-3 rounded-2xl`}>
                    {icon}
                </div>
                {/* Sparkline placeholder or decoration could go here */}
            </div>

            <div className="relative z-10">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{label}</h3>
                <div className="text-3xl font-black text-slate-900 mb-1">
                    KES {value.toLocaleString()}
                </div>
                <p className="text-xs font-semibold text-slate-500">{subtitle}</p>
            </div>

            {/* Hover Gradient */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 rounded-bl-[100px] transition-opacity duration-500`} />
        </div>
    )
}

function TopListCard({ title, subtitle, items, type, icon, theme }: any) {
    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-${theme}-50`}>
                    {icon}
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                    <p className="text-xs text-slate-500 font-semibold">{subtitle}</p>
                </div>
            </div>

            <div className="space-y-3">
                {items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 group transition-colors">
                        <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center`}>
                                {idx + 1}
                            </span>
                            <Link href={`/members/${item.id}`} className="font-bold text-sm text-slate-700 hover:text-cyan-600 transition-colors">
                                {item.name}
                            </Link>
                        </div>
                        <span className="font-bold text-sm text-slate-900">
                            {Number(item.amount).toLocaleString()}
                        </span>
                    </div>
                ))}
                {items.length === 0 && <p className="text-center text-slate-400 text-sm py-4">No data available</p>}
            </div>
        </div>
    )
}
