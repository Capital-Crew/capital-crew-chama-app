'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { Loan, Member, LoanProduct } from '@/lib/types';
import { PlusCircleIcon } from '@/components/icons';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getSaccoSettings } from '@/app/sacco-settings-actions';
import { LoanAppraisalCard } from './LoanAppraisalCard';
import { LoanStatusBadge } from './LoanStatusBadge';
import { CreditSnapshot } from '@/lib/utils/credit-limit';
import { toast } from '@/lib/toast';
import { MobileDrawer } from './ui/MobileDrawer';
import { LoanApplicationForm } from './loan/LoanApplicationForm';

interface LoanManagementProps {
    loans: (Loan & { member?: Member })[];
    members: Member[];
    products: LoanProduct[];
    currentUserId: string;
    currentMemberId?: string;
    userRole: string;
    creditSnapshot?: CreditSnapshot | null;
}

export function LoanManagement({ loans, members, products, currentUserId, currentMemberId, userRole, creditSnapshot }: LoanManagementProps) {
    const [activeTab, setActiveTab] = useState<'application' | 'approvals' | 'approved' | 'disbursed'>('application');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
    const [requiredApprovals, setRequiredApprovals] = useState(3);

    useEffect(() => {
        getSaccoSettings().then(settings => {
            setRequiredApprovals(settings.requiredApprovals || 3);
        });
    }, []);

    const handleLoanClick = (loanId: string) => {
        setSelectedLoanId(loanId);
    };

    // Memoized tab filtering
    const allApplications = useMemo(() => loans.filter(l =>
        String(l.status) !== 'PENDING_APPROVAL' &&
        String(l.status) !== 'APPROVED' &&
        String(l.status) !== 'DISBURSED' &&
        String(l.status) !== 'ACTIVE' &&
        String(l.status) !== 'CLEARED' &&
        String(l.status) !== 'OVERDUE'
    ), [loans]);

    const pendingApprovals = useMemo(() =>
        loans.filter(l => String(l.status) === 'PENDING_APPROVAL'),
        [loans]
    );

    const approvedLoans = useMemo(() =>
        loans.filter(l => String(l.status) === 'APPROVED'),
        [loans]
    );

    const disbursedLoans = useMemo(() => loans.filter(l =>
        String(l.status) === 'DISBURSED' || String(l.status) === 'ACTIVE' || String(l.status) === 'CLEARED' || String(l.status) === 'OVERDUE'
    ), [loans]);

    const getActiveData = () => {
        switch (activeTab) {
            case 'application': return allApplications;
            case 'approvals': return pendingApprovals;
            case 'approved': return approvedLoans;
            case 'disbursed': return disbursedLoans;
            default: return [];
        }
    };

    const handleNewApplication = () => {
        if (currentMemberId) {
            const myPending = loans.some(l =>
                l.memberId === currentMemberId &&
                (l.status === 'PENDING_APPROVAL' || l.status === 'APPROVED')
            );

            if (myPending) {
                toast.error(
                    "Application Pending",
                    "You already have a loan that is Pending Approval or Approved (waiting for disbursement)."
                );
                return;
            }
        }
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6 md:space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Lending Operations</h2>
                    <p className="text-xs md:text-sm text-slate-500">Manage the complete lifecycle of group loans.</p>
                </div>
                <button
                    onClick={handleNewApplication}
                    className="bg-cyan-500 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-bold shadow-lg hover:bg-cyan-600 transition-all flex items-center gap-2 text-xs md:text-sm"
                >
                    <PlusCircleIcon className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="hidden md:inline">New Application</span>
                    <span className="md:hidden">New App</span>
                </button>
            </div>

            {/* Scrollable Tabs */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-2 shadow-inner overflow-x-auto scrollbar-none">
                <div className="flex gap-2 min-w-max">
                    <TabButton
                        label="All"
                        fullLabel="All Applications"
                        active={activeTab === 'application'}
                        onClick={() => setActiveTab('application')}
                        count={allApplications.length}
                    />
                    <TabButton
                        label="Pending"
                        fullLabel="Pending Approvals"
                        active={activeTab === 'approvals'}
                        onClick={() => setActiveTab('approvals')}
                        count={pendingApprovals.length}
                    />
                    <TabButton
                        label="Approved"
                        fullLabel="Approved Loans"
                        active={activeTab === 'approved'}
                        onClick={() => setActiveTab('approved')}
                        count={approvedLoans.length}
                    />
                    <TabButton
                        label="Disbursed"
                        fullLabel="Loans Disbursed"
                        active={activeTab === 'disbursed'}
                        onClick={() => setActiveTab('disbursed')}
                        count={disbursedLoans.length}
                    />
                </div>
            </div>

            {/* Mobile: Card List */}
            <div className="md:hidden space-y-3">
                {getActiveData().map(l => (
                    <div
                        key={l.id}
                        onClick={() => handleLoanClick(l.id)}
                        className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-all"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">
                                    {l.member?.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm">{l.member?.name}</h4>
                                    <p className="text-[10px] text-slate-500 font-mono">{l.loanApplicationNumber}</p>
                                </div>
                            </div>
                            <LoanStatusBadge status={l.status as any} size="sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-50">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400">Amount</p>
                                <p className="font-black text-slate-900 text-sm">
                                    {formatCurrency(typeof l.amount === 'object' ? (l.amount as any).toNumber() : Number(l.amount))}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] uppercase font-bold text-slate-400">Date</p>
                                <p className="font-bold text-slate-600 text-sm">
                                    {formatDate(l.applicationDate)}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop: Table */}
            <div className="hidden md:block bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest text-[10px]">
                        <tr>
                            <th className="px-6 py-4">App #</th>
                            <th className="px-6 py-4">Member</th>
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {getActiveData().map(l => (
                            <tr key={l.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => handleLoanClick(l.id)}>
                                <td className="px-6 py-4 font-mono text-slate-600 font-bold">{l.loanApplicationNumber}</td>
                                <td className="px-6 py-4 text-slate-900 font-bold">{l.member?.name}</td>
                                <td className="px-6 py-4 font-black text-slate-900">
                                    {formatCurrency(typeof l.amount === 'object' ? (l.amount as any).toNumber() : Number(l.amount))}
                                </td>
                                <td className="px-6 py-4"><LoanStatusBadge status={l.status as any} size="sm" /></td>
                                <td className="px-6 py-4 text-right text-slate-400">{formatDate(l.applicationDate)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Drawer */}
            <MobileDrawer
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="New Loan Application"
            >
                <LoanApplicationForm
                    members={members}
                    products={products}
                    currentMemberId={currentMemberId}
                    creditSnapshot={creditSnapshot}
                    onSuccess={() => setIsModalOpen(false)}
                    onCancel={() => setIsModalOpen(false)}
                />
            </MobileDrawer>

            {/* Desktop Modal (Only visible on MD+) */}
            {isModalOpen && (
                <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
                        <div className="bg-gradient-to-br from-cyan-500 to-blue-500 p-6 text-white sticky top-0 z-10">
                            <h3 className="text-2xl font-black uppercase tracking-tight">New Loan Application</h3>
                            <p className="text-white/80 text-sm mt-1">Provide details to calculate your borrowing power</p>
                        </div>
                        <div className="p-8">
                            <LoanApplicationForm
                                members={members}
                                products={products}
                                currentMemberId={currentMemberId}
                                creditSnapshot={creditSnapshot}
                                onSuccess={() => setIsModalOpen(false)}
                                onCancel={() => setIsModalOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {selectedLoanId && (
                <LoanAppraisalCard
                    loanId={selectedLoanId}
                    isOpen={!!selectedLoanId}
                    onClose={() => setSelectedLoanId(null)}
                    currentUserId={currentUserId}
                    activeTab={activeTab === 'application' ? 'appraisal' : 'journey'}
                />
            )}
        </div>
    );
}

const TabButton: React.FC<{ label: string, fullLabel: string, active: boolean, onClick: () => void, count?: number }> = ({ label, fullLabel, active, onClick, count }) => (
    <button
        onClick={onClick}
        className={`flex-1 px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-black uppercase tracking-wider rounded-xl transition-all whitespace-nowrap ${active ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
    >
        <div className="flex items-center justify-center gap-2">
            <span className="md:hidden">{label}</span>
            <span className="hidden md:inline">{fullLabel}</span>
            {count !== undefined && count > 0 && <span className={`px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-black ${active ? 'bg-white/20' : 'bg-cyan-500/10 text-cyan-600'}`}>{count}</span>}
        </div>
    </button>
);
