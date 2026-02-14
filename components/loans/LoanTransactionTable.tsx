
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { LoanTransaction } from '@/lib/types/loan-transaction';
import { formatCurrency } from '@/lib/utils';
import { ArrowUpDown, Search, Filter, AlertCircle } from 'lucide-react';
import { TransactionActionMenu } from './TransactionActionMenu';

interface LoanTransactionTableProps {
    transactions: LoanTransaction[];
    isLoading?: boolean;
}

export function LoanTransactionTable({ transactions, isLoading }: LoanTransactionTableProps) {
    const router = useRouter();

    const handleRowClick = (txId: string) => {
        router.push(`/loans/transactions/${txId}`);
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'INTEREST': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'PRINCIPAL': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'PENALTY': return 'bg-red-100 text-red-700 border-red-200';
            case 'REVERSAL': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white border rounded-lg p-12 text-center animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/3 mx-auto mb-4"></div>
                <div className="h-4 bg-slate-100 rounded w-1/2 mx-auto"></div>
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-6 h-6 text-slate-300" />
                </div>
                <h3 className="text-slate-900 font-bold mb-1">No Transactions Found</h3>
                <p className="text-slate-500 text-sm">Try adjusting your search or filters.</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="py-3 px-6 whitespace-nowrap font-mono text-xs uppercase tracking-wider">GL Code</th>
                            <th className="py-3 px-6 whitespace-nowrap cursor-pointer hover:text-slate-800 transition-colors group">
                                <div className="flex items-center gap-1">
                                    Date <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                                </div>
                            </th>
                            <th className="py-3 px-6 whitespace-nowrap">Type</th>
                            <th className="py-3 px-6 whitespace-nowrap">Description</th>
                            <th className="py-3 px-6 whitespace-nowrap">Ref / Doc No.</th>
                            <th className="py-3 px-6 text-right whitespace-nowrap cursor-pointer hover:text-slate-800 transition-colors group">
                                <div className="flex items-center justify-end gap-1">
                                    Amount <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                                </div>
                            </th>
                            <th className="py-3 px-6 text-right whitespace-nowrap">User</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {transactions.map((tx) => (
                            <tr
                                key={tx.id}
                                onClick={() => handleRowClick(tx.id)}
                                className="hover:bg-slate-50 transition-colors cursor-pointer group"
                            >
                                <td className="py-3 px-6 font-mono text-xs text-slate-500 group-hover:text-blue-600 transition-colors">
                                    {tx.glCode || '-'}
                                </td>
                                <td className="py-3 px-6 text-slate-600">
                                    {format(new Date(tx.postingDate), 'dd-MMM-yyyy')}
                                </td>
                                <td className="py-3 px-6">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getTypeColor(tx.entryType)}`}>
                                        {tx.entryType}
                                    </span>
                                </td>
                                <td className="py-3 px-6 font-medium text-slate-800 max-w-[200px] truncate" title={tx.description}>
                                    {tx.description}
                                </td>
                                <td className="py-3 px-6 text-slate-500 font-mono text-xs">
                                    {tx.documentRef || '-'}
                                </td>
                                <td className={`py-3 px-6 text-right font-bold ${tx.amount < 0 ? 'text-slate-900' : 'text-emerald-600'
                                    }`}>
                                    {formatCurrency(Math.abs(tx.amount))}
                                </td>
                                <td className="py-3 px-6 text-right">
                                    <div className="flex justify-end items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200">
                                            {tx.user?.name ? tx.user.name.substring(0, 2).toUpperCase() : 'SYS'}
                                        </div>
                                        <TransactionActionMenu transactionId={tx.id} isReversed={tx.isReversed} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 text-xs text-slate-500 flex justify-between items-center">
                <span>Showing {transactions.length} entries</span>
                <span className="italic">Click row for GL breakdown</span>
            </div>
        </div>
    );
}
