
'use client';

import React from 'react';
import { formatCurrency } from '@/lib/utils';
import { ArrowUpRight } from 'lucide-react';

interface LoansPortfolioSummaryProps {
    loans: any[]; // Using any for now to be flexible with the serialized Loan object from page.tsx
    onViewBreakdown?: () => void;
}

export function LoansPortfolioSummary({ loans, onViewBreakdown }: LoansPortfolioSummaryProps) {
    // Calculate Total Outstanding Balance
    // We filter for active loans that have a balance > 0
    // Based on page.tsx serialization, use 'outstandingBalance' or 'current_balance'

    const activeLoans = loans.filter(l =>
        ['ACTIVE', 'OVERDUE', 'DISBURSED'].includes(l.status) &&
        Number(l.outstandingBalance || l.current_balance || 0) > 0
    );

    const totalOutstanding = activeLoans.reduce((sum, loan) => {
        return sum + Number(loan.outstandingBalance || loan.current_balance || 0);
    }, 0);

    const activeCount = activeLoans.length;

    return (
        <div
            onClick={onViewBreakdown}
            className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 md:p-8 text-white shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all cursor-pointer border border-blue-500/50"
        >
            {/* Background Texture/Pattern */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/15 transition-all"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-black/10 rounded-full blur-xl"></div>

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-blue-100 text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                        Total Portfolio Balance
                        <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-y-1 translate-x-1" />
                    </h2>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl md:text-5xl font-black tracking-tight">
                            {formatCurrency(totalOutstanding)}
                        </span>
                    </div>
                    <p className="mt-2 text-blue-200 text-sm font-medium">
                        across <span className="text-white font-bold">{activeCount}</span> active loans
                    </p>
                </div>

                <div className="flex gap-3">
                    <button className="bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                        View Breakdown
                    </button>
                </div>
            </div>
        </div>
    );
}
