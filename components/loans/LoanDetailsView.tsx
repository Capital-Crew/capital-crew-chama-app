
'use client';

import React, { useState, useMemo } from 'react';
import { LoanTransaction } from '@/lib/types/loan-transaction';
import { LoanTransactionTable } from './LoanTransactionTable';
import { formatCurrency } from '@/lib/utils';
import { Search, Filter, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface LoanDetailsViewProps {
    loan: any; // We'll type this loosely to accept the server object
    transactions: LoanTransaction[];
}

export function LoanDetailsView({ loan, transactions }: LoanDetailsViewProps) {
    const [filterType, setFilterType] = useState<'ALL' | 'PRINCIPAL' | 'INTEREST' | 'PENALTY'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // --- Derived Metrics ---
    // In a real app, these might come from the DB, but we can aggregate here for now
    const summary = useMemo(() => {
        const principalPaid = transactions
            .filter(t => t.entryType === 'PRINCIPAL' && t.amount > 0) // Assuming positive for repayment? Or negative? usually Repayment is Credit (+).
            // Actually, based on standard accounting:
            // Debit = Loan Issue (+)
            // Credit = Repayment (-)
            // But let's look at existing data. Usually Amount < 0 is Credit (Repayment).
            // Let's assume absolute values for the summary cards for now.
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const interestPaid = transactions
            .filter(t => t.entryType === 'INTEREST' && t.amount < 0) // Repayment of interest
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        return {
            principalPaid,
            interestPaid,
            outstanding: loan.current_balance || loan.outstandingBalance || 0
        };
    }, [transactions, loan]);

    // --- Filtering Logic ---
    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            // 1. Type Filter
            if (filterType !== 'ALL') {
                if (filterType === 'PRINCIPAL' && tx.entryType !== 'PRINCIPAL' && tx.entryType !== 'INITIAL') return false;
                // INITIAL is usually Principal issue.
                if (filterType === 'INTEREST' && tx.entryType !== 'INTEREST') return false;
                if (filterType === 'PENALTY' && tx.entryType !== 'PENALTY') return false;
            }

            // 2. Search Filter
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return (
                    tx.description?.toLowerCase().includes(q) ||
                    tx.documentRef?.toLowerCase().includes(q) ||
                    tx.glCode?.toLowerCase().includes(q) ||
                    tx.amount.toString().includes(q)
                );
            }

            return true;
        });
    }, [transactions, filterType, searchQuery]);

    return (
        <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard
                    title="Principal Paid"
                    amount={summary.principalPaid}
                    icon={<ArrowDownLeft className="w-4 h-4 text-emerald-500" />}
                    color="emerald"
                />
                <SummaryCard
                    title="Interest Paid"
                    amount={summary.interestPaid}
                    icon={<ArrowDownLeft className="w-4 h-4 text-blue-500" />}
                    color="blue"
                />
                <SummaryCard
                    title="Outstanding Balance"
                    amount={summary.outstanding}
                    icon={<ArrowUpRight className="w-4 h-4 text-amber-500" />}
                    color="amber"
                    highlight
                />
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                {/* Tabs */}
                <div className="flex p-1 bg-slate-100 rounded-lg">
                    {['ALL', 'PRINCIPAL', 'INTEREST', 'PENALTY'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type as any)}
                            className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${filterType === type
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {type === 'ALL' ? 'All Entries' : type}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Table */}
            <LoanTransactionTable transactions={filteredTransactions} />
        </div>
    );
}

function SummaryCard({ title, amount, icon, color, highlight }: any) {
    const colorClasses = {
        emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
        blue: 'bg-blue-50 border-blue-100 text-blue-700',
        amber: 'bg-amber-50 border-amber-100 text-amber-700',
    };

    return (
        <div className={`p-6 rounded-xl border ${highlight ? 'bg-white border-slate-200 shadow-md ring-1 ring-slate-100' : 'bg-white border-slate-200 shadow-sm'}`}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                {title}
                {icon}
            </p>
            <p className={`text-2xl font-black ${highlight ? 'text-slate-900' : 'text-slate-700'}`}>
                {formatCurrency(amount)}
            </p>
        </div>
    );
}
