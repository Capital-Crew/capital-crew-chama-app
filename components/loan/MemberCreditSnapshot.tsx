'use client'

import React from 'react'
import { Info, ShieldCheck, TrendingDown, Wallet } from 'lucide-react'
import { CreditSnapshot } from '@/lib/utils/credit-limit'

interface MemberCreditSnapshotProps {
    data: CreditSnapshot
}

export function MemberCreditSnapshot({ data }: MemberCreditSnapshotProps) {
    const formatCurrency = (amount: number) => {
        const value = isNaN(amount) || amount === undefined || amount === null ? 0 : amount;
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0,
        }).format(value)
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mb-6">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100">
                        <ShieldCheck className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Borrowing Power Snapshot</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{data.memberName} ({data.memberNumber})</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Multiplier</div>
                    <div className="text-sm font-black text-slate-700">x{data.loanLimitMultiplier.toFixed(1)}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                {}
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Wallet className="w-4 h-4 text-slate-400" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Contributions</span>
                    </div>
                    <div className="text-xl font-black text-slate-900">
                        {formatCurrency(data.contributionBalance)}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 font-bold italic">GL 1200 - Qualifying Contributions</p>
                </div>

                {}
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="w-4 h-4 text-slate-400" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Current Exposure</span>
                    </div>
                    <div className="text-xl font-black text-slate-900">
                        {formatCurrency(data.currentExposure)}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 font-bold italic">Total Active Debt</p>
                </div>

                {}
                <div className="p-6 bg-cyan-50/30">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-cyan-600" />
                            <span className="text-[10px] font-black text-cyan-700 uppercase tracking-wider">Max Qualifying Amount</span>
                        </div>
                        <div className="group relative">
                            <Info className="w-4 h-4 text-cyan-400 cursor-help" />
                            <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl font-bold">
                                Based on x{data.loanLimitMultiplier} Multiplier of Contributions minus existing loans.
                            </div>
                        </div>
                    </div>
                    <div className="text-2xl font-black text-cyan-600">
                        {formatCurrency(data.netQualifyingAmount)}
                    </div>
                    <p className="text-[10px] text-cyan-600/70 mt-1 font-black uppercase">Direct Eligibility</p>
                </div>
            </div>
        </div>
    )
}
