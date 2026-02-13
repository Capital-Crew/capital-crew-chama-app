'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { Loan, Member, LoanProduct } from '@/lib/types';
import { PlusCircleIcon } from '@/components/icons';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getSaccoSettings } from '@/app/sacco-settings-actions';
import { LoanStatusBadge } from './LoanStatusBadge';
import dynamic from 'next/dynamic';

const LoanAppraisalCard = dynamic(() => import('./LoanAppraisalCard').then(mod => mod.LoanAppraisalCard), {
    ssr: false,
    loading: () => <div className="p-4 text-center animate-pulse text-slate-400 font-bold uppercase tracking-tighter italic">Initializing Appraisal View...</div>
});
import { CreditSnapshot } from '@/lib/utils/credit-limit';
import { toast } from '@/lib/toast';
import { MobileDrawer } from './ui/MobileDrawer';
import { LoanApplicationForm } from './loan/LoanApplicationForm';
import { DraftsList } from './loans/DraftsList';
import { startLoanApplication } from '@/app/actions/loan-application-actions';
import { useRouter } from 'next/navigation';
import { BarChart3Icon } from 'lucide-react';
import { LoanReportsModal } from './loans/LoanReportsModal';
import { LoansPortfolioSummary } from './loans/LoansPortfolioSummary';

interface LoanManagementProps {
    loans: (Loan & { member?: Member })[];
    members: Member[];
    products: LoanProduct[];
    currentUserId: string;
    currentMemberId?: string;
    userRole: string;
    creditSnapshot?: CreditSnapshot | null;
    loanDraft?: { id: string; data: any } | null; // Add LoanDraft prop
}

export function LoanManagement({ loans, members, products, currentUserId, currentMemberId, userRole, creditSnapshot, loanDraft }: LoanManagementProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'application' | 'approvals' | 'approved' | 'disbursed'>('application');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
    const [requiredApprovals, setRequiredApprovals] = useState(3);

    useEffect(() => {
        getSaccoSettings().then(settings => {
            setRequiredApprovals(settings.requiredApprovals || 3);
        });
    }, []);

    const handleLoanClick = (loanId: string) => {
        const loan = loans.find(l => l.id === loanId);
        // If Draft (APPLICATION status), redirect to edit page
        if (loan && (String(loan.status) === 'APPLICATION' || String(loan.status) === 'DRAFT')) {
            router.push(`/loans/application/${loan.id}`);
            return;
        }
        // Otherwise View Appraisal Card
        setSelectedLoanId(loanId);
    };

    // Memoized tab filtering
    const drafts = useMemo(() => {
        const d = loans.filter(l =>
            String(l.status) === 'APPLICATION' ||
            String(l.status) === 'DRAFT'
        );

        // If Member, only show MY drafts
        if (userRole === 'MEMBER' && currentMemberId) {
            return d.filter(l => l.memberId === currentMemberId);
        }

        // Admins see all drafts
        return d;
    }, [loans, userRole, currentMemberId]);

    // Check if current user has a draft for button text
    const myDraft = useMemo(() =>
        currentMemberId
            ? loans.find(l =>
                l.memberId === currentMemberId &&
                (String(l.status) === 'DRAFT' || String(l.status) === 'APPLICATION')
            )
            : null
        , [loans, currentMemberId]);

    const otherApplications = useMemo(() => loans.filter(l =>
        String(l.status) === 'REJECTED' ||
        String(l.status) === 'CANCELLED' ||
        String(l.status) === 'WRITTEN_OFF'
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
            case 'application': return otherApplications; // Only show non-drafts here? Or separate drafts?
            // Actually, we want to show Drafts specially at the top, then other "Application" status items (like Rejected/Cancelled history) in the list?
            // The user requested "In the section called DRAFTS /RETURNED".
            // So we can show DraftsList component, and then the table for others.
            case 'approvals': return pendingApprovals;
            case 'approved': return approvedLoans;
            case 'disbursed': return disbursedLoans;
            default: return [];
        }
    };

    const handleNewApplication = async () => {
        // Check if current user has their own draft - use the filtered drafts array
        const myDraft = currentMemberId
            ? loans.find(l =>
                l.memberId === currentMemberId &&
                (l.status === 'DRAFT' || l.status === 'APPLICATION')
            )
            : null;

        // Block if MY draft exists - force user to resume
        if (myDraft) {
            toast.info('You have an incomplete application. Please resume your draft first.');
            router.push(`/loans/application/${myDraft.id}`);
            return;
        }

        // 1. Check Credit/Pending Limits (Frontend check)
        if (currentMemberId) {
            const myPending = loans.some(l =>
                l.memberId === currentMemberId &&
                (l.status === 'PENDING_APPROVAL' || l.status === 'APPROVED')
            );

            if (myPending) {
                toast.error(
                    "Application Pending",
                    "You already have a loan that is Pending Approval or Approved."
                );
                return;
            }
        }

        // 2. Navigate directly to form (no Loan creation)
        router.push('/loans/apply');
    };

    return (
        <div className="space-y-6 md:space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Lending Operations</h2>
                    <p className="text-xs md:text-sm text-slate-500">Manage the complete lifecycle of group loans.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsReportsModalOpen(true)}
                        className="bg-white border-2 border-slate-200 text-slate-700 px-4 md:px-6 py-2 md:py-3 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2 text-xs md:text-sm shadow-sm"
                    >
                        <BarChart3Icon className="w-4 h-4 md:w-5 md:h-5 text-cyan-500" />
                        <span className="hidden md:inline">Reports</span>
                        <span className="md:hidden">Reports</span>
                    </button>
                    <button
                        onClick={handleNewApplication}
                        className="bg-cyan-500 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-bold shadow-lg hover:bg-cyan-600 transition-all flex items-center gap-2 text-xs md:text-sm"
                    >
                        <PlusCircleIcon className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="hidden md:inline">{myDraft ? 'Resume Draft' : 'New Application'}</span>
                        <span className="md:hidden">{myDraft ? 'Resume' : 'New App'}</span>
                    </button>
                </div>
            </div>

            {/* Portfolio Summary */}
            <LoansPortfolioSummary
                loans={loans}
                onViewBreakdown={() => {
                    // Placeholder: Could navigate to a detailed view or filter the list below
                    // For now, we scroll to the "Disbursed" tab and activate it
                    setActiveTab('disbursed');
                    const el = document.getElementById('loans-list');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
            />

            {/* Scrollable Tabs */}
            <div id="loans-list" className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-2 shadow-inner overflow-x-auto scrollbar-none">
                <div className="flex gap-2 min-w-max">
                    <TabButton
                        label="Drafts"
                        fullLabel="Drafts / Returned"
                        active={activeTab === 'application'}
                        onClick={() => setActiveTab('application')}
                        count={drafts.length}
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

            {/* DRAFTS SECTION - Separated for Admin/Chairperson */}
            {
                activeTab === 'application' && (
                    <div className="mb-6 space-y-8">
                        {/* MY DRAFTS */}
                        {(() => {
                            const myDrafts = drafts.filter(d => d.memberId === currentMemberId);
                            if (myDrafts.length > 0) {
                                return (
                                    <DraftsList
                                        title="My Applications (Drafts)"
                                        drafts={myDrafts.map(d => ({
                                            id: d.id,
                                            loanApplicationNumber: d.loanApplicationNumber,
                                            amount: d.amount ? Number(d.amount) : 0,
                                            createdAt: d.applicationDate || d.createdAt,
                                            updatedAt: d.updatedAt,
                                            member: members.find(m => m.id === d.memberId),
                                            status: d.status
                                        }))}
                                    />
                                );
                            }
                            return null;
                        })()}

                        {/* MEMBER DRAFTS (Admin/Chair only) */}
                        {(() => {
                            const isAdmin = ['SYSTEM_ADMIN', 'CHAIRPERSON'].includes(userRole);
                            if (isAdmin) {
                                const otherDrafts = drafts.filter(d => d.memberId !== currentMemberId);
                                if (otherDrafts.length > 0) {
                                    return (
                                        <DraftsList
                                            title="Member Applications (Review Exemptions)"
                                            drafts={otherDrafts.map(d => ({
                                                id: d.id,
                                                loanApplicationNumber: d.loanApplicationNumber,
                                                amount: d.amount ? Number(d.amount) : 0,
                                                createdAt: d.applicationDate || d.createdAt,
                                                updatedAt: d.updatedAt, // Fix missing property here too if needed
                                                member: members.find(m => m.id === d.memberId),
                                                status: d.status
                                            }))}
                                        />
                                    );
                                }
                            }
                            return null;
                        })()}

                        {/* Fallback for regular members if they have no drafts but filter returned them (should be covered by myDrafts above) */}
                        {/* The original code just rendered all filtered drafts. Now strictly separated. */}
                    </div>
                )
            }

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

            {/* Desktop Modal Removed - Using Page Flow */}

            {
                selectedLoanId && (
                    <LoanAppraisalCard
                        loanId={selectedLoanId}
                        isOpen={!!selectedLoanId}
                        onClose={() => setSelectedLoanId(null)}
                        currentUserId={currentUserId}
                        activeTab={activeTab === 'application' ? 'appraisal' : 'journey'}
                    />
                )
            }

            <LoanReportsModal
                isOpen={isReportsModalOpen}
                onClose={() => setIsReportsModalOpen(false)}
            />
        </div >
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
