'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { MemberQuickStats } from './MemberQuickStats';
import { NextOfKinManager } from './NextOfKinManager';
import { LoanAppraisalCard } from '../LoanAppraisalCard';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface MemberProfileViewProps {
    member: any;
    stats: any;
    contributions: any[];
    loans: any[];
    contributionStatus: any;
    nextOfKin: any[];
    currentUserRole: string;
    currentUserId: string;
}

export function MemberProfileView({
    member,
    stats,
    contributions,
    loans,
    contributionStatus,
    nextOfKin,
    currentUserRole,
    currentUserId
}: MemberProfileViewProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'loans' | 'contributions' | 'kin'>('loans');
    const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);

    const handleLoanClick = (loanId: string) => {
        const loan = loans.find(l => l.id === loanId);
        if (loan && ['ACTIVE', 'OVERDUE', 'WRITTEN_OFF', 'DISBURSED', 'CLEARED'].includes(loan.status)) {
            router.push(`/loans/${loanId}`);
        } else {
            setSelectedLoanId(loanId);
        }
    };

    // Prepare quick stats data
    const quickStatsData = {
        totalLoans: stats?.totalLoans || 0,
        activeLoans: stats?.activeLoans || 0,
        totalContributions: stats?.totalContributions || 0,
        totalBorrowed: stats?.totalBorrowed || 0,
        outstandingBalance: stats?.outstandingBalance || 0,
        borrowingPower: stats?.borrowingPower || 0
    };

    return (
        <div className="bg-white min-h-full flex flex-col">
            {/* ... */}
            <div className="px-4 md:px-8 mt-4 md:mt-8 mb-8 flex flex-col xl:flex-row justify-between items-start gap-4">
                <MemberQuickStats
                    stats={quickStatsData}
                    onViewLoans={() => setActiveTab('loans')}
                />
                {/* ... */}
            </div>

            {/* ... */}

            <div className="flex-1 overflow-y-auto">
                {/* MOBILE */}
                <div className="md:hidden flex flex-col bg-white">
                    <CollapsibleSection
                        title="Loans History"
                        isOpen={activeTab === 'loans'}
                        onToggle={() => setActiveTab('loans')}
                        icon={Clock}
                    >
                        <ResponsiveLoansList
                            loans={loans}
                            onLoanClick={handleLoanClick}
                        />
                    </CollapsibleSection>
                    {/* ... */}
                </div>

                {/* DESKTOP */}
                <div className="hidden md:block px-8 pb-12">
                    {activeTab === 'loans' && (
                        <ResponsiveLoansList
                            loans={loans}
                            onLoanClick={handleLoanClick}
                        />
                    )}
                    {/* ... */}

                    {activeTab === 'contributions' && (
                        <div className="space-y-8">
                            {/* Status Engine Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Monthly Status Card */}
                                <div className={`p-6 rounded-2xl border-2 ${contributionStatus?.balance! <= 0 ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
                                    <h4 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${contributionStatus?.balance! <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                                        Current Month Status
                                    </h4>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-3xl font-black text-slate-800">
                                                {formatCurrency(Math.max(0, contributionStatus?.balance || 0))}
                                            </p>
                                            <p className="text-xs font-bold text-slate-400 mt-1">
                                                Due this month (Target: {formatCurrency(contributionStatus?.monthlyDue || 0)})
                                            </p>
                                            {(contributionStatus?.balance || 0) < 0 && (
                                                <span className="inline-block mt-1 bg-green-200 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                    Advance Payment: {formatCurrency(Math.abs(contributionStatus?.balance || 0))}
                                                </span>
                                            )}
                                        </div>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${contributionStatus?.balance! <= 0 ? 'bg-green-200 text-green-700' : 'bg-orange-200 text-orange-700'}`}>
                                            {contributionStatus?.balance! <= 0 ? (
                                                <CheckCircle2 className="w-6 h-6" />
                                            ) : (
                                                <AlertCircle className="w-6 h-6" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Arrears Card */}
                                {(Number((member as any).contributionArrears || 0) > 0 || Number((member as any).penaltyArrears || 0) > 0) ? (
                                    <div className="p-6 rounded-2xl border-2 bg-red-50 border-red-100">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 text-red-600">
                                            Outstanding Arrears
                                        </h4>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-3xl font-black text-red-700">
                                                    {formatCurrency(Number((member as any).contributionArrears || 0) + Number((member as any).penaltyArrears || 0))}
                                                </p>
                                                <div className="mt-2 text-xs font-bold text-red-600/70 space-y-0.5">
                                                    <p>Principal: {formatCurrency(Number((member as any).contributionArrears || 0))}</p>
                                                    <p>Penalties: {formatCurrency(Number((member as any).penaltyArrears || 0))}</p>
                                                </div>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-red-200 text-red-700 flex items-center justify-center animate-pulse">
                                                <AlertCircle className="w-6 h-6" />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-6 rounded-2xl border-2 bg-slate-50 border-slate-100 opacity-60">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 text-slate-400">
                                            Arrears Status
                                        </h4>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center">
                                                <CheckCircle2 className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-500">No outstanding arrears</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <ResponsiveContributionsList contributions={contributions} />
                        </div>
                    )}
                    {activeTab === 'kin' && (
                        <NextOfKinManager initialData={nextOfKin} memberId={member.id} />
                    )}
                </div>
            </div>

            {/* Loan Details Modal */}
            <LoanAppraisalCard
                loanId={selectedLoanId || ''}
                isOpen={!!selectedLoanId}
                onClose={() => setSelectedLoanId(null)}
                currentUserId={currentUserId!}
                activeTab="appraisal"
            />
        </div>
    );
}

// --- Sub Components ---

function CollapsibleSection({
    title,
    isOpen,
    onToggle,
    children,
    icon: Icon
}: {
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    icon?: any;
}) {
    return (
        <div className="md:hidden border-b border-slate-100 last:border-0">
            <button
                onClick={onToggle}
                className={`w-full py-4 px-4 flex items-center justify-between text-left transition-colors ${isOpen ? 'bg-slate-50' : 'bg-white'}`}
            >
                <div className="flex items-center gap-3">
                    {Icon && <Icon className={`w-5 h-5 ${isOpen ? 'text-cyan-600' : 'text-slate-400'}`} />}
                    <span className={`font-black text-sm uppercase tracking-wide ${isOpen ? 'text-cyan-900' : 'text-slate-500'}`}>
                        {title}
                    </span>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isOpen ? 'bg-cyan-100 rotate-90 text-cyan-600' : 'bg-slate-50 text-slate-400'}`}>
                    <ChevronRight className="w-4 h-4" />
                </div>
            </button>
            <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <div className="p-4 pt-0">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

function TabButton({ isActive, onClick, label }: { isActive: boolean; onClick: () => void; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`pb-4 text-sm font-black transition-all border-b-2 uppercase tracking-wide px-4 ${isActive
                ? 'border-cyan-500 text-cyan-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
        >
            {label}
        </button>
    );
}

function ResponsiveLoansList({ loans, onLoanClick }: { loans: any[], onLoanClick: (id: string) => void }) {
    const activeLoans = loans.filter(l => ['ACTIVE', 'OVERDUE', 'WRITTEN_OFF', 'DISBURSED'].includes(l.status || 'ACTIVE'));
    const historyLoans = loans.filter(l => l.status === 'CLEARED');

    if (loans.length === 0) {
        return <EmptyState message="No loan history found." />
    }

    return (
        <div className="space-y-8">
            {/* Active Loans */}
            {activeLoans.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-500" /> Active Portfolio
                    </h3>

                    {/* MOBILE: Card Stack */}
                    <div className="space-y-3 md:hidden">
                        {activeLoans.map(loan => (
                            <div
                                key={loan.id}
                                onClick={() => onLoanClick(loan.id)}
                                className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="font-bold text-slate-800 text-lg">#{loan.loanNumber}</div>
                                    <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${loan.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-600'
                                        }`}>
                                        {loan.status || 'Active'}
                                    </div>
                                </div>
                                <div className="text-sm text-slate-500 mb-4">{loan.productName}</div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400">Balance</p>
                                        <p className="font-black text-slate-900">{formatCurrency(loan.totalLoanBalance)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase font-bold text-slate-400">Next Payment</p>
                                        <p className="font-bold text-slate-700">
                                            {format(new Date(loan.nextExpectedDate || new Date()), 'MMM d')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* DESKTOP: Table */}
                    <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="py-3 px-6">Loan No</th>
                                        <th className="py-3 px-6">Product</th>
                                        <th className="py-3 px-6 text-right">Approved</th>
                                        <th className="py-3 px-6 text-right">Balance</th>
                                        <th className="py-3 px-6 text-right">Next Payment</th>
                                        <th className="py-3 px-6 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {activeLoans.map(loan => (
                                        <tr
                                            key={loan.id}
                                            onClick={() => onLoanClick(loan.id)}
                                            className="hover:bg-slate-50 transition-colors group cursor-pointer"
                                        >
                                            <td className="py-4 px-6 font-bold text-slate-700">{loan.loanNumber}</td>
                                            <td className="py-4 px-6 font-medium text-slate-600">{loan.productName}</td>
                                            <td className="py-4 px-6 text-right text-slate-500">{formatCurrency(loan.approvedAmount)}</td>
                                            <td className="py-4 px-6 text-right font-black text-slate-800">{formatCurrency(loan.totalLoanBalance)}</td>
                                            <td className="py-4 px-6 text-right text-slate-600">{loan.nextExpectedDate ? format(new Date(loan.nextExpectedDate), 'dd-MMM-yyyy') : '-'}</td>
                                            <td className="py-4 px-6 text-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent double click event
                                                        onLoanClick(loan.id);
                                                    }}
                                                    className="text-cyan-600 hover:text-cyan-800 font-bold text-xs uppercase"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* History Loans */}
            {historyLoans.length > 0 && (
                <div className="space-y-4 opacity-75 hover:opacity-100 transition-opacity">
                    <h3 className="text-lg font-black text-slate-500 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" /> Cleared History
                    </h3>

                    {/* Mobile Stack */}
                    <div className="space-y-3 md:hidden">
                        {historyLoans.map(loan => (
                            <div
                                key={loan.id}
                                onClick={() => onLoanClick(loan.id)}
                                className="bg-slate-50 border border-slate-100 rounded-xl p-4 cursor-pointer active:scale-[0.98] transition-transform"
                            >
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold text-slate-500">#{loan.loanNumber}</span>
                                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">CLEARED</span>
                                </div>
                                <div className="text-xs text-slate-400 mb-2">{loan.productName}</div>
                                <div className="text-right">
                                    <span className="text-sm font-bold text-slate-600">
                                        {formatCurrency(loan.totalLoanBalance)} / {formatCurrency(loan.approvedAmount)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table (Simplified) */}
                    <div className="hidden md:block bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="border-b border-slate-200">
                                <tr>
                                    <th className="py-3 px-6 font-medium text-slate-400">Loan No</th>
                                    <th className="py-3 px-6 font-medium text-slate-400">Product</th>
                                    <th className="py-3 px-6 font-medium text-slate-400 text-right">Cleared Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historyLoans.map(loan => (
                                    <tr
                                        key={loan.id}
                                        onClick={() => onLoanClick(loan.id)}
                                        className="cursor-pointer hover:bg-slate-100 transition-colors"
                                    >
                                        <td className="py-3 px-6 text-slate-500">{loan.loanNumber}</td>
                                        <td className="py-3 px-6 text-slate-500">{loan.productName}</td>
                                        <td className="py-3 px-6 text-right font-bold text-slate-600">{formatCurrency(loan.approvedAmount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}

function ResponsiveContributionsList({ contributions }: { contributions: any[] }) {
    if (contributions.length === 0) return <EmptyState message="No contributions recorded." />

    return (
        <div>
            {/* Mobile Stack */}
            <div className="md:hidden space-y-3">
                {contributions.map((c, i) => (
                    <div key={i} className="bg-white border border-slate-100 rounded-xl p-4 flex justify-between items-center shadow-sm">
                        <div>
                            <p className="font-bold text-slate-800">{c.description}</p>
                            <p className="text-xs text-slate-400 font-medium">{format(new Date(c.date), 'MMM d, yyyy')}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-black text-cyan-600 text-lg">{formatCurrency(c.amount)}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-bold text-slate-500">Date</th>
                            <th className="px-6 py-4 font-bold text-slate-500">Description</th>
                            <th className="px-6 py-4 font-bold text-slate-500 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {contributions.map((c, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                                <td className="px-6 py-4 text-slate-600 font-medium">{format(new Date(c.date), 'MMMM d, yyyy')}</td>
                                <td className="px-6 py-4 text-slate-800 font-bold">{c.description}</td>
                                <td className="px-6 py-4 text-right text-cyan-700 font-black">{formatCurrency(c.amount)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 font-bold text-sm">{message}</p>
        </div>
    )
}
