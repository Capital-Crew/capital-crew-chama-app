import { formatCurrency } from '@/lib/utils'
import { Wallet, PiggyBank, Receipt, Activity } from 'lucide-react'

interface MemberQuickStatsProps {
    stats: {
        identity: {
            firstName: string
            lastName: string
            fullName: string
            memberNumber: number
        }
        financials: {
            memberSavings?: number
            contributions?: number
            outstandingLoans?: number
            // Legacy fields fallback
            totalContributions?: number
            cumulativeLoanBalance?: number
        }
    }
}

export function MemberQuickStats({ stats }: MemberQuickStatsProps) {
    // Correctly prioritize real-time fields
    const memberSavings = stats.financials.memberSavings ?? 0
    // Contributions can be 0 if new member
    const contributions = stats.financials.contributions ?? stats.financials.totalContributions ?? 0

    // Loan balance might be computed
    const outstandingLoans = stats.financials.outstandingLoans ?? stats.financials.cumulativeLoanBalance ?? 0

    return (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 mb-8 w-full">
            {/* Identity Section */}
            <div className="flex flex-col md:flex-row justify-between items-center border-b border-slate-100 pb-6 mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-200">
                        {stats.identity.firstName[0]}{stats.identity.lastName[0]}
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                            {stats.identity.fullName}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600 uppercase tracking-wider">
                                Member #{stats.identity.memberNumber}
                            </span>
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-full text-xs font-bold text-green-700 uppercase tracking-wider">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                Active
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Stats Grid - Buttons Style */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Member Savings (Wallet) */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg shadow-blue-200 transition-all hover:-translate-y-1 hover:shadow-xl cursor-default">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet className="w-24 h-24 text-white transform rotate-12" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-blue-100 font-bold text-xs uppercase tracking-widest">Member Savings</p>
                            <span className="flex items-center gap-1 bg-blue-400/30 px-2 py-0.5 rounded text-[10px] font-bold text-white">
                                <Activity className="w-3 h-3" /> LIVE
                            </span>
                        </div>
                        <div className="text-3xl font-black text-white tracking-tight">
                            {formatCurrency(memberSavings)}
                        </div>
                        <p className="text-blue-100/80 text-xs mt-1 font-medium">Available Wallet Balance</p>
                    </div>
                </div>

                {/* Contributions (Asset Pool Share) */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 shadow-lg shadow-emerald-200 transition-all hover:-translate-y-1 hover:shadow-xl cursor-default">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <PiggyBank className="w-24 h-24 text-white transform -rotate-12" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-emerald-100 font-bold text-xs uppercase tracking-widest">Contributions</p>
                            <span className="flex items-center gap-1 bg-emerald-400/30 px-2 py-0.5 rounded text-[10px] font-bold text-white">
                                <Activity className="w-3 h-3" /> LIVE
                            </span>
                        </div>
                        <div className="text-3xl font-black text-white tracking-tight">
                            {formatCurrency(contributions)}
                        </div>
                        <p className="text-emerald-100/80 text-xs mt-1 font-medium">Total Share Contributions</p>
                    </div>
                </div>

                {/* Outstanding Loans */}
                <div className="group relative overflow-hidden bg-white border-2 border-slate-100 rounded-2xl p-6 transition-all hover:border-orange-200 hover:shadow-lg hover:shadow-orange-100/50 cursor-pointer">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                        <Receipt className="w-24 h-24 text-orange-500 transform rotate-6" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest group-hover:text-orange-600 transition-colors">Outstanding Loans</p>
                        </div>
                        <div className="text-3xl font-black text-slate-900 tracking-tight group-hover:text-orange-600 transition-colors">
                            {formatCurrency(outstandingLoans)}
                        </div>
                        <p className="text-slate-400 text-xs mt-1 font-medium flex items-center gap-1">
                            Current Debt Load
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
