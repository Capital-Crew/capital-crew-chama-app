'use client';

import React, { useState, useEffect } from 'react';
import {
    PlusCircle,
    ChevronRight,
    ChevronDown,
    Shield,
    CheckCircle,
    XCircle,
    Clock,
    Layers,
    ArrowRightLeft,
    Calendar,
    AlertCircle,
    History as HistoryIcon,
    RotateCcw,
    Power
} from 'lucide-react';
import { toast } from 'sonner';
import {
    getAllLedgers as getChartOfAccounts,
    approveLedgerAction,
    closeLedgerAction,
    reactivateLedgerAction,
    rejectLedgerAction
} from '@/app/actions/accounting-actions';
import { getAccountingPeriods, closeAccountingPeriodAction, openAccountingPeriodAction } from '@/app/actions/accounting-period-actions';
import { LedgerForm } from './LedgerForm';
import { PeriodForm } from './PeriodForm';
import { JournalHistory } from './JournalHistory';
import { LedgerStatus, AccountType, NormalBalance, AccountingPeriodStatus, LedgerAccount } from '@/lib/types/ledger';

export function LedgerManager() {
    const [ledgers, setLedgers] = useState<LedgerAccount[]>([]);
    const [periods, setPeriods] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [activeView, setActiveView] = useState<'coa' | 'periods' | 'journal'>('coa');

    // Modal states
    const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
    const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [ledgerData, periodData] = await Promise.all([
                getAllLedgers(),
                getAccountingPeriods()
            ]);
            setLedgers(ledgerData);
            setPeriods(periodData);
        } catch (error) {
            toast.error("Failed to load ledger data");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleNode = (id: string) => {
        const next = new Set(expandedNodes);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedNodes(next);
    };

    const handleApprove = async (id: string) => {
        try {
            await approveLedgerAction(id);
            toast.success("Ledger approved and activated");
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Approval failed");
        }
    };

    const handleClose = async (id: string) => {
        if (!confirm("Are you sure you want to close this ledger? This will prevent any further postings.")) return;
        try {
            await closeLedgerAction(id);
            toast.success("Ledger closed successfully");
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Failed to close ledger");
        }
    };

    const handleReactivate = async (id: string) => {
        if (!confirm("Are you sure you want to reactivate this ledger?")) return;
        try {
            await reactivateLedgerAction(id);
            toast.success("Ledger reactivated successfully");
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Failed to reactivate ledger");
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm("Are you sure you want to reject this ledger? It will be permanently deleted.")) return;
        try {
            await rejectLedgerAction(id);
            toast.success("Ledger rejected and removed");
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Failed to reject ledger");
        }
    };

    const pendingLedgers = ledgers.filter(l => l.status === 'PENDING');
    const handleClosePeriod = async (id: string) => {
        if (!confirm("Are you sure you want to close this accounting period? This will prevent any further postings to this date range.")) return;
        try {
            await closeAccountingPeriodAction(id);
            toast.success("Accounting period closed");
            loadData();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const renderLedgerRow = (ledger: LedgerAccount, depth: number = 0) => {
        const hasChildren = ledger.children && ledger.children.length > 0;
        const isExpanded = expandedNodes.has(ledger.id);

        return (
            <React.Fragment key={ledger.id}>
                <tr className="hover:bg-slate-50 transition-colors border-b border-slate-100 group">
                    <td className="py-3 pl-4">
                        <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 24}px` }}>
                            {hasChildren ? (
                                <button onClick={() => toggleNode(ledger.id)} className="p-1 hover:bg-slate-200 rounded transition-colors">
                                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>
                            ) : (
                                <div className="w-6" />
                            )}
                            <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{ledger.code}</span>
                            <span className="font-semibold text-slate-800">{ledger.name}</span>
                        </div>
                    </td>
                    <td>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${ledger.type === 'ASSET' ? 'bg-blue-100 text-blue-700' :
                            ledger.type === 'LIABILITY' ? 'bg-amber-100 text-amber-700' :
                                ledger.type === 'EQUITY' ? 'bg-purple-100 text-purple-700' :
                                    ledger.type === 'REVENUE' || ledger.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700' :
                                        'bg-rose-100 text-rose-700'
                            }`}>
                            {ledger.type}
                        </span>
                    </td>
                    <td className="text-right font-mono font-bold text-slate-700 pr-8">
                        {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(Number(ledger.balance))}
                        <span className="text-[10px] text-slate-400 ml-1 ml-1">{ledger.normalBalance === 'DEBIT' ? 'Dr' : 'Cr'}</span>
                    </td>
                    <td>
                        <div className={`flex items-center gap-1.5 font-bold text-[11px] ${ledger.status === 'ACTIVE' ? 'text-emerald-600' :
                            ledger.status === 'PENDING' ? 'text-amber-600' :
                                'text-slate-400'
                            }`}>
                            {ledger.status === 'ACTIVE' ? <CheckCircle className="w-3.5 h-3.5" /> :
                                ledger.status === 'PENDING' ? <Clock className="w-3.5 h-3.5" /> :
                                    <XCircle className="w-3.5 h-3.5" />}
                            {ledger.status}
                        </div>
                    </td>
                    <td className="text-right pr-4">
                        <div className="flex justify-end gap-2">
                            {ledger.status === 'PENDING' && (
                                <button
                                    onClick={() => handleApprove(ledger.id)}
                                    className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                                >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Approve
                                </button>
                            )}
                            {ledger.status === 'PENDING' && (
                                <button
                                    onClick={() => handleReject(ledger.id)}
                                    className="flex items-center gap-1.5 border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    <XCircle className="w-3.5 h-3.5" />
                                    Reject
                                </button>
                            )}
                            {ledger.status === 'ACTIVE' && (
                                <button
                                    onClick={() => handleClose(ledger.id)}
                                    className="flex items-center gap-1.5 border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    <Power className="w-3.5 h-3.5" />
                                    Close Ledger
                                </button>
                            )}
                            {ledger.status === 'CLOSED' && (
                                <button
                                    onClick={() => handleReactivate(ledger.id)}
                                    className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Reactivate
                                </button>
                            )}
                        </div>
                    </td>
                </tr>
                {isExpanded && hasChildren && ledger.children!.map(child => renderLedgerRow(child, depth + 1))}
            </React.Fragment>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                    <button
                        onClick={() => setActiveView('coa')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeView === 'coa' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Layers className="w-4 h-4" />
                        Hierarchy
                    </button>
                    <button
                        onClick={() => setActiveView('periods')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeView === 'periods' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Calendar className="w-4 h-4" />
                        Accounting Periods
                    </button>
                    <button
                        onClick={() => setActiveView('journal')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeView === 'journal' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <HistoryIcon className="w-4 h-4" />
                        Journal
                    </button>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-bold text-sm border border-indigo-100 hover:bg-indigo-100 transition-all">
                        <ArrowRightLeft className="w-4 h-4" />
                        Journal Postings
                    </button>
                    <button
                        onClick={() => setIsLedgerModalOpen(true)}
                        className="flex items-center gap-2 bg-[#00c2e0] text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
                    >
                        <PlusCircle className="w-4 h-4" />
                        New Ledger
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <span className="loading loading-spinner loading-lg text-indigo-500"></span>
                </div>
            ) : (
                <>
                    {/* Pending Approvals Banner */}
                    {pendingLedgers.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Shield className="w-5 h-5 text-amber-600" />
                                <h3 className="font-bold text-amber-800 text-sm">Pending Approvals ({pendingLedgers.length})</h3>
                                <span className="text-[10px] uppercase tracking-widest font-black text-amber-500 bg-amber-100 px-2 py-0.5 rounded-full">Maker-Checker</span>
                            </div>
                            <div className="space-y-3">
                                {pendingLedgers.map(ledger => (
                                    <div key={`pending-${ledger.id}`} className="flex items-center justify-between bg-white rounded-xl p-4 border border-amber-100">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-amber-100 rounded-lg">
                                                <Clock className="w-5 h-5 text-amber-600" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{ledger.code}</span>
                                                    <span className="font-bold text-slate-800">{ledger.name}</span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${ledger.type === 'ASSET' ? 'bg-blue-100 text-blue-700' :
                                                        ledger.type === 'LIABILITY' ? 'bg-amber-100 text-amber-700' :
                                                            ledger.type === 'EQUITY' ? 'bg-purple-100 text-purple-700' :
                                                                ledger.type === 'REVENUE' || ledger.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700' :
                                                                    'bg-rose-100 text-rose-700'
                                                        }`}>{ledger.type}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Requested by <span className="font-semibold text-slate-700">{ledger.createdByName || 'Unknown'}</span>
                                                    {ledger.createdAt && <> on {new Date(ledger.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</>}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleApprove(ledger.id)}
                                                className="btn btn-sm btn-success text-white border-none gap-1"
                                            >
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(ledger.id)}
                                                className="btn btn-sm btn-outline btn-error gap-1"
                                            >
                                                <XCircle className="w-3.5 h-3.5" />
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeView === 'coa' ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="table w-full">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-widest font-black">
                                    <tr>
                                        <th className="py-4 pl-6">Ledger Account (Hierarchy)</th>
                                        <th>Account Type</th>
                                        <th className="text-right pr-8">Current Balance</th>
                                        <th>Status</th>
                                        <th className="text-right pr-6">Management</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ledgers
                                        .filter(l => !l.parentId)
                                        .sort((a, b) => {
                                            const order: Record<string, number> = { PENDING: 0, ACTIVE: 1, CLOSED: 2, ARCHIVED: 3 };
                                            return (order[a.status as string] ?? 1) - (order[b.status as string] ?? 1);
                                        })
                                        .map(ledger => renderLedgerRow(ledger))}
                                </tbody>
                            </table>
                        </div>
                    ) : activeView === 'periods' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {periods.map(period => (
                                <div key={period.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-slate-50 rounded-xl">
                                            <Calendar className="w-6 h-6 text-indigo-500" />
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${period.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            {period.status}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-slate-800">
                                        {new Date(period.startDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} -
                                        {new Date(period.endDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1">{period.memo || 'Regular accounting period'}</p>

                                    <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center">
                                        <div className="text-[10px] text-slate-400 italic">
                                            {period.status === 'CLOSED' ? `Closed by Admin at ${new Date(period.closedAt).toLocaleDateString()}` : 'Period remains open for postings'}
                                        </div>
                                        {period.status === 'OPEN' && (
                                            <button
                                                onClick={() => handleClosePeriod(period.id)}
                                                className="btn btn-xs btn-outline btn-error font-bold"
                                            >
                                                Close Period
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={() => setIsPeriodModalOpen(true)}
                                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                            >
                                <PlusCircle className="w-10 h-10 text-slate-300 group-hover:text-indigo-400 mb-2 transition-colors" />
                                <span className="font-bold text-slate-400 group-hover:text-indigo-700">Open New Period</span>
                            </button>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <JournalHistory />
                        </div>
                    )
                    }

                    {/* Modals */}
                    {
                        isLedgerModalOpen && (
                            <LedgerForm
                                onClose={() => setIsLedgerModalOpen(false)}
                                onSuccess={loadData}
                                existingLedgers={ledgers}
                            />
                        )
                    }

                    {
                        isPeriodModalOpen && (
                            <PeriodForm
                                onClose={() => setIsPeriodModalOpen(false)}
                                onSuccess={loadData}
                            />
                        )
                    }

                    {
                        !isLoading && activeView === 'coa' && ledgers.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="font-bold text-slate-800">No Ledgers Initialized</h3>
                                <p className="text-sm text-slate-500 max-w-sm mx-auto mt-2">
                                    Get started by defining your primary Chart of Accounts using the "New Ledger" button.
                                </p>
                            </div>
                        )
                    }
                </>
            )}
        </div >
    );
}
