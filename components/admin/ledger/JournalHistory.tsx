'use client';

import React, { useState, useEffect } from 'react';
import {
    Search,
    Calendar,
    ArrowRightLeft,
    ChevronDown,
    ChevronRight,
    User as UserIcon,
    Hash,
    FileText,
    History as HistoryIcon,
    CheckCircle,
    XCircle,
    RotateCcw,
    AlertCircle
} from 'lucide-react';
import { getJournalTransactions, reverseJournalEntryAction } from '@/app/actions/accounting-actions';
import { toast } from 'sonner';

interface JournalEntryLine {
    id: string;
    ledgerAccount: {
        code: string;
        name: string;
    };
    debitAmount: number;
    creditAmount: number;
    description: string | null;
}

import { TransactionStatus } from '@/lib/types/ledger';

interface JournalTransaction {
    id: string;
    transactionDate: Date;
    description: string;
    totalAmount: number;
    status: TransactionStatus | string;
    referenceType: string;
    referenceId: string;
    createdByName: string | null;
    isReversed?: boolean;
    ledgerEntries: JournalEntryLine[];
}

export function JournalHistory() {
    const [transactions, setTransactions] = useState<JournalTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [reversingId, setReversingId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await getJournalTransactions();
            setTransactions(data);
        } catch (error) {
            toast.error("Failed to load journal history");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReverse = async (txId: string) => {
        const reason = prompt('Enter reason for reversal:');
        if (!reason || reason.trim() === '') return;

        setReversingId(txId);
        try {
            await reverseJournalEntryAction(txId, reason.trim());
            toast.success('Journal entry reversed successfully');
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to reverse journal entry');
        } finally {
            setReversingId(null);
        }
    };

    const filtered = transactions.filter(tx =>
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 text-slate-700">
                    <HistoryIcon className="w-5 h-5 text-indigo-500" />
                    <h2 className="font-bold">Transaction Journal</h2>
                </div>
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by description or reference..."
                        className="input input-sm input-bordered w-full pl-10 rounded-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="table w-full">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-widest font-black">
                        <tr>
                            <th className="w-10"></th>
                            <th>Date / Ref</th>
                            <th>Description</th>
                            <th className="text-right">Total Amount</th>
                            <th>Status</th>
                            <th>Posted By</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="py-20 text-center">
                                    <span className="loading loading-spinner text-indigo-500"></span>
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr className="hover:bg-slate-50">
                                <td colSpan={6} className="py-20 text-center text-slate-400 text-sm">
                                    <HistoryIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p>No transactions found matching your search.</p>
                                </td>
                            </tr>
                        ) : (
                            filtered.map(tx => (
                                <React.Fragment key={tx.id}>
                                    <tr
                                        className={`hover:bg-slate-50 cursor-pointer transition-colors ${expandedTxId === tx.id ? 'bg-indigo-50/30' : ''}`}
                                        onClick={() => setExpandedTxId(expandedTxId === tx.id ? null : tx.id)}
                                    >
                                        <td className="w-10 pl-4">
                                            {expandedTxId === tx.id ? <ChevronDown className="w-4 h-4 text-indigo-600" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                        </td>
                                        <td className="py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800 text-sm">{new Date(tx.transactionDate).toLocaleDateString()}</span>
                                                <span className="text-[10px] font-mono text-slate-400 uppercase">{tx.id.slice(-8)}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-700">{tx.description}</span>
                                                <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">{tx.referenceType.replace(/_/g, ' ')}</span>
                                            </div>
                                        </td>
                                        <td className="text-right font-mono font-black text-slate-900 pr-8">
                                            {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(Number(tx.totalAmount))}
                                        </td>
                                        <td>
                                            <span className={`badge badge-sm font-bold text-[10px] ${tx.status === 'POSTED' ? 'badge-success text-white' :
                                                tx.status === 'REVERSED' ? 'badge-error text-white' : 'badge-ghost'
                                                }`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <UserIcon className="w-3 h-3" />
                                                {tx.createdByName || 'System'}
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedTxId === tx.id && (
                                        <tr>
                                            <td colSpan={6} className="p-0 border-b border-indigo-100 bg-indigo-50/10">
                                                <div className="p-6 bg-white/50 animate-in slide-in-from-top-2 duration-200">
                                                    <table className="table table-compact w-full border border-indigo-100/50 rounded-xl overflow-hidden">
                                                        <thead className="bg-indigo-50 text-indigo-700 text-[10px] uppercase font-bold">
                                                            <tr>
                                                                <th className="rounded-tl-xl border-none">Account</th>
                                                                <th className="text-right border-none">Debit (Dr)</th>
                                                                <th className="text-right border-none">Credit (Cr)</th>
                                                                <th className="rounded-tr-xl border-none">Notes</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-indigo-50/50">
                                                            {tx.ledgerEntries.map(entry => (
                                                                <tr key={entry.id} className="text-sm">
                                                                    <td className="font-medium text-slate-800">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-xs font-mono text-indigo-600 bg-indigo-50 w-fit px-1 rounded">{entry.ledgerAccount.code}</span>
                                                                            <span>{entry.ledgerAccount.name}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="text-right font-mono font-bold text-slate-700">
                                                                        {entry.debitAmount > 0 ? new Intl.NumberFormat('en-KE').format(entry.debitAmount) : '-'}
                                                                    </td>
                                                                    <td className="text-right font-mono font-bold text-slate-700">
                                                                        {entry.creditAmount > 0 ? new Intl.NumberFormat('en-KE').format(entry.creditAmount) : '-'}
                                                                    </td>
                                                                    <td className="text-xs text-slate-500 italic">
                                                                        {entry.description || '-'}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    <div className="flex justify-end mt-4 pt-3 border-t border-indigo-100">
                                                        {!tx.isReversed && tx.status !== 'REVERSED' && tx.referenceType !== 'REVERSAL' ? (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleReverse(tx.id);
                                                                }}
                                                                disabled={reversingId === tx.id}
                                                                className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                                            >
                                                                <RotateCcw className={`w-3.5 h-3.5 ${reversingId === tx.id ? 'animate-spin' : ''}`} />
                                                                {reversingId === tx.id ? 'Reversing...' : 'Reverse Entry'}
                                                            </button>
                                                        ) : (
                                                            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                                                <AlertCircle className="w-3.5 h-3.5" />
                                                                {tx.referenceType === 'REVERSAL' ? 'This is a reversal entry' : 'Already reversed'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
