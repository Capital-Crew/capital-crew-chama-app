'use client';
import { toast } from 'sonner';
import { payPenalty } from '@/app/actions/meeting-actions';
import { approveMemberAction, activateMemberAction, deactivateMemberAction } from '@/app/actions/member-actions';
import { useState } from 'react';
import { UserPermissions } from '@/lib/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, ChevronRight, Receipt, Activity, XCircle } from 'lucide-react';
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
    unpaidPenalties?: any[];
    currentUserRole: string;
    currentUserId: string;
    currentUserPermissions?: UserPermissions;
    onBack?: () => void;
}

export function MemberProfileView({
    member,
    stats,
    contributions,
    loans,
    contributionStatus,
    nextOfKin,
    unpaidPenalties = [],
    currentUserRole,
    currentUserId,
    currentUserPermissions,
    onBack
}: MemberProfileViewProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'loans' | 'contributions' | 'kin'>('loans');
    const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);

    const [modalTab, setModalTab] = useState<'appraisal' | 'statement'>('appraisal');

    const handleLoanClick = (loanId: string, tab: 'appraisal' | 'statement' = 'appraisal') => {
        setSelectedLoanId(loanId);
        setModalTab(tab);
    };

    // Prepare quick stats data
    const quickStatsData = {
        identity: {
            firstName: member.name?.split(' ')[0] || '',
            lastName: member.name?.split(' ').slice(1).join(' ') || '',
            fullName: member.name || '',
            memberNumber: parseInt(member.memberNumber) || 0
        },
        financials: {
            memberSavings: stats?.memberSavings || 0,
            cumulativeContributions: stats?.cumulativeContributions || 0,
            outstandingLoans: stats?.outstandingLoans || stats?.totalOutstandingBalance || 0,
            // Legacy fallbacks
            totalContributions: stats?.cumulativeContributions || 0,
            cumulativeLoanBalance: stats?.outstandingLoans || 0
        }
    };

    return (
        <div className="bg-white min-h-full flex flex-col">
            {/* Header */}
            <div className="px-4 md:px-8 pt-6 md:pt-8 border-b border-slate-100">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-4">Member Profile</h1>
            </div>

            {/* TEMPORARY DEBUG — remove after fixing */}
            <div className="px-4 md:px-8 mt-2">
                <div className="bg-yellow-100 border border-yellow-300 rounded-xl p-3 text-xs font-mono text-yellow-800">
                    DEBUG: role=&quot;{currentUserRole}&quot; | status=&quot;{member.status}&quot; | match={String(member.status === 'ACTIVE' && (currentUserRole === 'SYSTEM_ADMIN' || currentUserRole === 'SYSTEM_ADMINISTRATOR'))}
                </div>
            </div>

            {/* Deactivate Control for ACTIVE members — standalone section */}
            {member.status === 'ACTIVE' && (currentUserRole === 'SYSTEM_ADMIN' || currentUserRole === 'SYSTEM_ADMINISTRATOR') && (
                <div className="px-4 md:px-8 mt-4">
                    <div className="bg-red-950 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-red-200 border border-red-900/50">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center backdrop-blur-sm">
                                    <XCircle className="w-6 h-6 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black uppercase tracking-tight">Member Deactivation</h3>
                                    <p className="text-red-300 text-xs font-bold mt-1">
                                        This will close the member&apos;s account and restrict system access.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={async () => {
                                    if (!window.confirm(`Deactivate ${member.name}? This will close their account and restrict access.`)) return;
                                    const res = await deactivateMemberAction(member.id);
                                    if (res.success) {
                                        toast.success('Member deactivated successfully');
                                        router.refresh();
                                    } else {
                                        toast.error(res.error || 'Failed to deactivate');
                                    }
                                }}
                                className="w-full md:w-auto bg-red-500 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-400 transition-all active:scale-95 shadow-lg shadow-red-900/30 flex items-center justify-center gap-2"
                            >
                                <XCircle className="w-4 h-4" /> Deactivate Member
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="px-4 md:px-8 mt-4 md:mt-8 mb-8 flex flex-col xl:flex-row justify-between items-start gap-4">
                <MemberQuickStats
                    stats={quickStatsData}
                    onViewLoans={() => setActiveTab('loans')}
                />

                {/* Administrative Onboarding Controls */}
                {(currentUserRole === 'SYSTEM_ADMIN' ||
                    currentUserRole === 'SYSTEM_ADMINISTRATOR' ||
                    (member.status === 'PENDING' && currentUserPermissions?.canApproveMember) ||
                    (member.status === 'APPROVED' && currentUserPermissions?.canActivateMember)) &&
                    ['PENDING', 'APPROVED'].includes(member.status) && (
                        <div className="flex-1 w-full xl:w-auto">
                            <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-slate-200 border border-white/10">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                                            <Activity className="w-6 h-6 text-cyan-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black uppercase tracking-tight">Onboarding Action</h3>
                                            <p className="text-slate-400 text-xs font-bold mt-1">
                                                Current Status: <span className="text-cyan-400">{member.status}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {member.status === 'PENDING' && (currentUserRole === 'SYSTEM_ADMIN' || currentUserRole === 'SYSTEM_ADMINISTRATOR' || currentUserPermissions?.canApproveMember) && (
                                        <button
                                            onClick={async () => {
                                                if (!window.confirm(`Approve ${member.name} as a member?`)) return;
                                                const res = await approveMemberAction(member.id);
                                                if (res.success) {
                                                    toast.success('Member approved successfully');
                                                    router.refresh();
                                                } else {
                                                    toast.error(res.error || 'Failed to approve');
                                                }
                                            }}
                                            className="w-full md:w-auto bg-cyan-500 text-slate-900 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-cyan-400 transition-all active:scale-95 shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 className="w-4 h-4" /> Approve Member
                                        </button>
                                    )}

                                    {member.status === 'APPROVED' && (currentUserRole === 'SYSTEM_ADMIN' || currentUserRole === 'SYSTEM_ADMINISTRATOR' || currentUserPermissions?.canActivateMember) && (
                                        <button
                                            onClick={async () => {
                                                if (!window.confirm(`Activate ${member.name}? This will grant full system access.`)) return;
                                                const res = await activateMemberAction(member.id);
                                                if (res.success) {
                                                    toast.success('Member activated successfully');
                                                    router.refresh();
                                                } else {
                                                    toast.error(res.error || 'Failed to activate');
                                                }
                                            }}
                                            className="w-full md:w-auto bg-green-500 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-400 transition-all active:scale-95 shadow-lg shadow-green-900/20 flex items-center justify-center gap-2"
                                        >
                                            <Activity className="w-4 h-4" /> Activate Member
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
            </div>

            {/* Penalty Alert Section (The "Red Card") */}
            {unpaidPenalties.length > 0 && (
                <div className="px-4 md:px-8 mb-8">
                    <div className="bg-red-600 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-red-200 animate-in fade-in zoom-in duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                    <AlertCircle className="w-10 h-10 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">Outstanding Penalties</h2>
                                    <p className="text-red-100 font-medium">You have {unpaidPenalties.length} pending penalty {unpaidPenalties.length === 1 ? 'bill' : 'bills'} that require your attention.</p>
                                </div>
                            </div>
                            <div className="text-center md:text-right">
                                <p className="text-3xl font-black tracking-tighter mb-1">
                                    {formatCurrency(unpaidPenalties.reduce((sum: number, p: any) => sum + p.amount, 0))}
                                </p>
                                <p className="text-xs font-bold text-red-100 uppercase tracking-widest">Total Due Immediately</p>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {unpaidPenalties.map((penalty: any) => (
                                <div key={penalty.id} className="bg-white/10 rounded-2xl p-5 backdrop-blur-md border border-white/20 flex justify-between items-center">
                                    <div>
                                        <p className="font-black text-sm uppercase tracking-wide text-red-50">{penalty.type} PENALTY</p>
                                        <p className="font-bold text-lg leading-tight mt-1">{penalty.meetingTitle}</p>
                                        <p className="text-xs font-medium text-red-100 mt-1 opacity-80">{format(new Date(penalty.date), 'PPPP')}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-3">
                                        <p className="font-black text-xl">{formatCurrency(penalty.amount)}</p>
                                        <button
                                            onClick={async () => {
                                                const confirmed = window.confirm(`Pay ${formatCurrency(penalty.amount)} penalty for ${penalty.meetingTitle}? This will be deducted from your wallet.`);
                                                if (!confirmed) return;

                                                const res = await payPenalty(penalty.id);
                                                if (res.success) {
                                                    toast.success('Penalty paid successfully');
                                                    router.refresh();
                                                } else {
                                                    toast.error(res.error || 'Failed to pay penalty');
                                                }
                                            }}
                                            className="bg-white text-red-600 px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-50 transition-all active:scale-95 shadow-lg shadow-red-900/20"
                                        >
                                            Pay Now
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Tab Navigation */}
            <div className="hidden md:flex px-8 gap-4 border-b border-slate-100">
                <button
                    onClick={() => setActiveTab('loans')}
                    className={cn(
                        "px-6 py-3 font-bold text-sm transition-all border-b-2",
                        activeTab === 'loans'
                            ? "border-cyan-500 text-cyan-600"
                            : "border-transparent text-slate-400 hover:text-slate-600"
                    )}
                >
                    Loans History
                </button>
                <button
                    onClick={() => setActiveTab('contributions')}
                    className={cn(
                        "px-6 py-3 font-bold text-sm transition-all border-b-2",
                        activeTab === 'contributions'
                            ? "border-cyan-500 text-cyan-600"
                            : "border-transparent text-slate-400 hover:text-slate-600"
                    )}
                >
                    Contributions
                </button>
                <button
                    onClick={() => setActiveTab('kin')}
                    className={cn(
                        "px-6 py-3 font-bold text-sm transition-all border-b-2",
                        activeTab === 'kin'
                            ? "border-cyan-500 text-cyan-600"
                            : "border-transparent text-slate-400 hover:text-slate-600"
                    )}
                >
                    Next of Kin
                </button>
            </div>


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

                    <CollapsibleSection
                        title="Contributions"
                        isOpen={activeTab === 'contributions'}
                        onToggle={() => setActiveTab('contributions')}
                        icon={Receipt}
                    >
                        <div className="p-4 space-y-4">
                            <div className={`p-4 rounded-xl border-2 ${contributionStatus?.balance! <= 0 ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
                                <h4 className={`text-xs font-bold uppercase mb-2 ${contributionStatus?.balance! <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                                    Current Month Status
                                </h4>
                                <p className="text-2xl font-black text-slate-800">
                                    {formatCurrency(Math.max(0, contributionStatus?.balance || 0))}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Due this month (Target: {formatCurrency(contributionStatus?.monthlyDue || 0)})
                                </p>
                            </div>
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Next of Kin"
                        isOpen={activeTab === 'kin'}
                        onToggle={() => setActiveTab('kin')}
                        icon={Activity}
                    >
                        <div className="p-4">
                            <NextOfKinManager
                                initialData={nextOfKin}
                                memberId={member.id}
                            />
                        </div>
                    </CollapsibleSection>
                </div>

                {/* DESKTOP */}
                <div className="hidden md:block px-8 pb-12">
                    {activeTab === 'loans' && (
                        <ResponsiveLoansList
                            loans={loans}
                            onLoanClick={handleLoanClick}
                        />
                    )}

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
                activeTab={modalTab}
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

function ResponsiveLoansList({ loans, onLoanClick }: { loans: any[], onLoanClick: (id: string, tab?: 'appraisal' | 'statement') => void }) {
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
                                className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm"
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
                                        <Link
                                            href={`/loans/${loan.id}`}
                                            className="font-black text-cyan-600 hover:text-cyan-800 transition-colors cursor-pointer text-left hover:underline decoration-cyan-500 underline-offset-2"
                                        >
                                            {formatCurrency(loan.totalLoanBalance)}
                                        </Link>
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
                                            className="hover:bg-slate-50 transition-colors group"
                                        >
                                            <td className="py-4 px-6 font-bold text-slate-700">{loan.loanNumber}</td>
                                            <td className="py-4 px-6 font-medium text-slate-600">{loan.productName}</td>
                                            <td className="py-4 px-6 text-right text-slate-500">{formatCurrency(loan.approvedAmount)}</td>
                                            <td className="py-4 px-6 text-right">
                                                <Link
                                                    href={`/loans/${loan.id}`}
                                                    className="font-black text-cyan-600 hover:text-cyan-800 transition-colors cursor-pointer hover:underline decoration-cyan-500 underline-offset-2"
                                                >
                                                    {formatCurrency(loan.totalLoanBalance)}
                                                </Link>
                                            </td>
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
                                className="bg-slate-50 border border-slate-100 rounded-xl p-4"
                            >
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold text-slate-500">#{loan.loanNumber}</span>
                                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">CLEARED</span>
                                </div>
                                <div className="text-xs text-slate-400 mb-2">{loan.productName}</div>
                                <div className="text-right">
                                    <button
                                        onClick={() => onLoanClick(loan.id)}
                                        className="text-sm font-bold text-cyan-600 hover:text-cyan-800 transition-colors cursor-pointer"
                                    >
                                        {formatCurrency(loan.totalLoanBalance)} / {formatCurrency(loan.approvedAmount)}
                                    </button>
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
                                        className="hover:bg-slate-100 transition-colors"
                                    >
                                        <td className="py-3 px-6 text-slate-500">{loan.loanNumber}</td>
                                        <td className="py-3 px-6 text-slate-500">{loan.productName}</td>
                                        <td className="py-3 px-6 text-right">
                                            <button
                                                onClick={() => onLoanClick(loan.id)}
                                                className="font-bold text-cyan-600 hover:text-cyan-800 transition-colors cursor-pointer"
                                            >
                                                {formatCurrency(loan.approvedAmount)}
                                            </button>
                                        </td>
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
