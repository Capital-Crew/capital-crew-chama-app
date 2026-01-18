'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Loan, Member, LoanProduct, LoanStatus } from '@/lib/types';
import { PlusCircleIcon } from '@/components/icons';
import { formatCurrency, formatDate } from '@/lib/utils';
import { applyForLoan } from '@/app/actions';
import { calculateLoanQualification, getSaccoSettings, getMemberActiveLoans } from '@/app/sacco-settings-actions';
import { LoanAppraisalCard } from './LoanAppraisalCard';
import { LoanStatusBadge } from './LoanStatusBadge';
import { LoanOffsetSelector } from './LoanOffsetSelector';
import { MemberCreditSnapshot } from './loan/MemberCreditSnapshot';
import { CreditSnapshot } from '@/lib/utils/credit-limit';
import { Badge } from '@/components/ui/badge'
import { toast } from '@/lib/toast';
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { fadeIn, slideUp } from '@/lib/animation-variants';
import { useDebounce } from '@/hooks/useDebounce';

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

    // Loan offset state
    const [selectedLoansToOffset, setSelectedLoansToOffset] = useState<string[]>([]);
    const [activeLoans, setActiveLoans] = useState<any[]>([]);

    // SACCO settings state
    const [requiredApprovals, setRequiredApprovals] = useState(3);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Qualification calculation state
    const [qualification, setQualification] = useState<any>(null);
    const [calculatingQualification, setCalculatingQualification] = useState(false);
    const [calcError, setCalcError] = useState<string | null>(null);

    // React Hook Form setup
    const { register, watch, setValue, reset } = useForm({
        defaultValues: {
            memberId: currentMemberId || '',
            loanProductId: '',
            amount: '',
            installments: 12
        }
    });

    // Memoize selected product lookup
    const selectedProduct = useMemo(() =>
        products.find(p => p.id === watch('loanProductId')),
        [products, watch('loanProductId')]
    );

    // Update default installments when selectedProduct changes
    useEffect(() => {
        if (selectedProduct) {
            setValue('installments', selectedProduct.numberOfRepayments || 12);
        }
    }, [selectedProduct, setValue]);

    // Watch form values
    const watchedMemberId = watch('memberId');
    const watchedProductId = watch('loanProductId');
    const watchedAmount = watch('amount');
    const watchedInstallments = watch('installments');

    // Debounce expensive values to reduce API calls
    const debouncedAmount = useDebounce(watchedAmount, 500);
    const debouncedMemberId = useDebounce(watchedMemberId, 300);

    useEffect(() => {
        getSaccoSettings().then(settings => {
            setRequiredApprovals(settings.requiredApprovals || 3);
        });
    }, []);

    useEffect(() => {
        if (debouncedMemberId) {
            getMemberActiveLoans(debouncedMemberId)
                .then(setLoans => {
                    setActiveLoans(setLoans);
                    setSelectedLoansToOffset([]);
                })
                .catch(err => console.error('Error fetching active loans:', err));
        }
    }, [debouncedMemberId]);

    // Memoized calculation trigger - only runs when debounced values change
    useEffect(() => {
        if (debouncedMemberId) {
            setCalculatingQualification(true);
            setCalcError(null);
            const amount = debouncedAmount ? parseFloat(debouncedAmount) : undefined;
            calculateLoanQualification(debouncedMemberId, selectedLoansToOffset, amount)
                .then(result => setQualification(result))
                .catch(error => {
                    console.error('Failed to calculate qualification:', error);
                    setCalcError(error.message || 'Failed to calculate fees. Please try again.');
                })
                .finally(() => setCalculatingQualification(false));
        } else {
            setQualification(null);
            setCalcError(null);
        }
    }, [debouncedMemberId, selectedLoansToOffset, debouncedAmount]);

    // Memoize selected member lookup
    const selectedMember = useMemo(() =>
        members.find(m => m.id === watchedMemberId),
        [members, watchedMemberId]
    );

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

    // const [errorModalOpen, setErrorModalOpen] = useState(false); // Removed manual state

    const handleNewApplication = () => {
        if (currentMemberId) {
            // Member View: Check MY loans
            const myPending = loans.some(l =>
                l.memberId === currentMemberId &&
                (l.status === 'PENDING_APPROVAL' || l.status === 'APPROVED')
            );

            if (myPending) {
                // Show prominent modal via Global Toast
                toast.error(
                    "Application Pending",
                    "You already have a loan that is Pending Approval or Approved (waiting for disbursement).",
                    {
                        action: {
                            label: "Understood",
                            onClick: () => { }
                        }
                    }
                );
                return;
            }
        }
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-8">


            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Lending Operations</h2>
                    <p className="text-sm text-slate-500">Manage the complete lifecycle of group loans.</p>
                </div>
                <button
                    onClick={handleNewApplication}
                    className="bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-cyan-600 transition-all flex items-center gap-2"
                >
                    <PlusCircleIcon className="w-5 h-5" /> New Application
                </button>
            </div>

            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-2 shadow-inner">
                <div className="flex gap-2">
                    <TabButton label="All Applications" active={activeTab === 'application'} onClick={() => setActiveTab('application')} count={allApplications.length} />
                    <TabButton label="Pending Approvals" active={activeTab === 'approvals'} onClick={() => setActiveTab('approvals')} count={pendingApprovals.length} />
                    <TabButton label="APPROVED LOANS" active={activeTab === 'approved'} onClick={() => setActiveTab('approved')} count={approvedLoans.length} />
                    <TabButton label="LOANS DISBURSED" active={activeTab === 'disbursed'} onClick={() => setActiveTab('disbursed')} count={disbursedLoans.length} />
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
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
                        {activeTab === 'application' && allApplications.map(l => (
                            <tr key={l.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => handleLoanClick(l.id)}>
                                <td className="px-6 py-4 font-mono text-slate-600">{l.loanApplicationNumber}</td>
                                <td className="px-6 py-4 text-slate-900 font-bold">{l.member?.name}</td>
                                <td className="px-6 py-4 font-black">{formatCurrency(typeof l.amount === 'object' ? (l.amount as any).toNumber() : Number(l.amount))}</td>
                                <td className="px-6 py-4"><LoanStatusBadge status={l.status as any} size="sm" /></td>
                                <td className="px-6 py-4 text-right text-slate-400">{formatDate(l.applicationDate)}</td>
                            </tr>
                        ))}
                        {activeTab === 'approvals' && pendingApprovals.map(l => (
                            <tr key={l.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => handleLoanClick(l.id)}>
                                <td className="px-6 py-4 font-mono text-cyan-600 font-bold">{l.loanApplicationNumber}</td>
                                <td className="px-6 py-4 text-slate-900 font-bold">{l.member?.name}</td>
                                <td className="px-6 py-4 font-black text-cyan-500">{formatCurrency(typeof l.amount === 'object' ? (l.amount as any).toNumber() : Number(l.amount))}</td>
                                <td className="px-6 py-4"><LoanStatusBadge status={l.status as any} size="sm" /></td>
                                <td className="px-6 py-4 text-right text-slate-400">{formatDate(l.applicationDate)}</td>
                            </tr>
                        ))}
                        {activeTab === 'approved' && approvedLoans.map(l => (
                            <tr key={l.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => handleLoanClick(l.id)}>
                                <td className="px-6 py-4 font-mono text-green-600 font-bold">{l.loanApplicationNumber}</td>
                                <td className="px-6 py-4 text-slate-900 font-bold">{l.member?.name}</td>
                                <td className="px-6 py-4 font-black text-green-600">{formatCurrency(typeof l.amount === 'object' ? (l.amount as any).toNumber() : Number(l.amount))}</td>
                                <td className="px-6 py-4"><LoanStatusBadge status={l.status as any} size="sm" /></td>
                                <td className="px-6 py-4 text-right text-slate-400">{formatDate(l.applicationDate)}</td>
                            </tr>
                        ))}
                        {activeTab === 'disbursed' && disbursedLoans.map(l => (
                            <tr key={l.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => handleLoanClick(l.id)}>
                                <td className="px-6 py-4 font-mono text-slate-500">{l.loanApplicationNumber}</td>
                                <td className="px-6 py-4 text-slate-900 font-bold">{l.member?.name}</td>
                                <td className="px-6 py-4 font-black text-slate-900">{formatCurrency(typeof l.amount === 'object' ? (l.amount as any).toNumber() : Number(l.amount))}</td>
                                <td className="px-6 py-4"><LoanStatusBadge status={l.status as any} size="sm" /></td>
                                <td className="px-6 py-4 text-right text-slate-400">{l.disbursementDate ? formatDate(l.disbursementDate) : 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
                        <div className="bg-gradient-to-br from-cyan-500 to-blue-500 p-6 text-white sticky top-0 z-10">
                            <h3 className="text-2xl font-black uppercase tracking-tight">New Loan Application</h3>
                            <p className="text-white/80 text-sm mt-1">Provide details to calculate your borrowing power</p>
                        </div>

                        <form action={async (formData) => {
                            if (isSubmitting) return; // Prevent double submission

                            setIsSubmitting(true);
                            toast.loading('Processing loan application...');

                            try {
                                // Failsafe: Ensure memberId is always present
                                const memberId = watchedMemberId || currentMemberId;
                                if (memberId && !formData.get('memberId')) {
                                    formData.set('memberId', memberId);
                                }

                                const res = await applyForLoan(null, formData);
                                if (res?.error) {
                                    toast.error(res.error);
                                    setIsSubmitting(false); // Re-enable on error
                                } else {
                                    toast.success('Loan application submitted successfully!');
                                    setIsModalOpen(false);
                                    reset(); // Reset form
                                    window.location.reload();
                                }
                            } catch (err: any) {
                                toast.error(err.message || 'Failed to submit application');
                                setIsSubmitting(false); // Re-enable on error
                            }
                        }} className="p-8 space-y-8 overflow-x-hidden">
                            {/* Hidden Failsafe Input - React Hook Form */}
                            <input type="hidden" {...register('memberId')} />

                            {/* 1. Applicant Identity & Snapshot (Moved to Top) */}
                            <div className="space-y-6">
                                <div className="space-y-2 px-2">
                                    <label className="block text-xs font-black text-slate-700 uppercase italic">Applicant Profile</label>
                                    <select
                                        {...register('memberId')}
                                        disabled={!!currentMemberId}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold opacity-80"
                                    >
                                        <option value="">Select Member...</option>
                                        {members.map(m => <option key={m.id} value={m.id}>{m.name} • #{m.memberNumber}</option>)}
                                    </select>
                                    {currentMemberId && <p className="text-[10px] text-cyan-600 font-bold">Locked to your account</p>}
                                </div>

                                {creditSnapshot && (
                                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                                        <header className="bg-slate-50 px-4 py-2 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase">Borrowing Power Baseline</header>
                                        <MemberCreditSnapshot data={creditSnapshot} />
                                    </div>
                                )}
                            </div>

                            {/* 2. Loan Configuration (Inputs) */}
                            <div className="bg-cyan-50/30 p-6 rounded-2xl border-2 border-cyan-100 flex flex-col gap-6">
                                <h4 className="text-xs font-black text-cyan-700 uppercase tracking-widest">2. Loan Configuration</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black text-slate-700 uppercase">Loan Product <span className="text-red-500">*</span></label>
                                        <select
                                            {...register('loanProductId', { required: true })}
                                            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-black shadow-sm outline-none focus:border-cyan-500"
                                        >
                                            <option value="">Select Product...</option>
                                            {products.filter(p => p.isActive).map(p => (
                                                <option key={p.id} value={p.id}>{p.name} ({typeof p.interestRatePerPeriod === 'object' ? (p.interestRatePerPeriod as any).toString() : p.interestRatePerPeriod}% p.m.)</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black text-slate-700 uppercase">Requested Amount (KES) <span className="text-red-500">*</span></label>
                                        <input
                                            {...register('amount', { required: true })}
                                            type="number"
                                            placeholder="Enter amount"
                                            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-black shadow-sm outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 3. Repayment Period */}
                            <div className="p-6 bg-white border-2 border-slate-100 rounded-2xl space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-black text-slate-700 uppercase">Repayment Period (Months)</label>
                                    <span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-black text-slate-500">
                                        MAX: {selectedProduct?.numberOfRepayments || 12} MONTHS
                                    </span>
                                </div>

                                <select
                                    {...register('installments', {
                                        required: true,
                                        valueAsNumber: true,
                                        min: 1,
                                        max: selectedProduct?.numberOfRepayments || 12
                                    })}
                                    className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 text-sm font-black shadow-sm outline-none focus:border-cyan-500 hover:border-cyan-400 transition-colors"
                                >
                                    {Array.from({ length: selectedProduct?.numberOfRepayments || 12 }, (_, i) => i + 1).map(month => (
                                        <option key={month} value={month}>
                                            {month} {month === 1 ? 'Month' : 'Months'}
                                        </option>
                                    ))}
                                </select>

                                <p className="text-xs text-slate-500 font-medium">
                                    Repayment: <strong className="text-slate-700">{watchedInstallments} monthly installments</strong> @ {selectedProduct?.interestRatePerPeriod ? (typeof selectedProduct.interestRatePerPeriod === 'object' ? (selectedProduct.interestRatePerPeriod as any).toString() : selectedProduct.interestRatePerPeriod) : 0}% p.m.
                                </p>
                            </div>

                            {/* Hidden inputs for selected loans to offset */}
                            {selectedLoansToOffset.map(loanId => (
                                <input key={loanId} type="hidden" name="loansToOffset" value={loanId} />
                            ))}

                            {/* 4. Qualification Logic & Receipt */}
                            <div className="space-y-6 relative">
                                {calculatingQualification && (
                                    <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-[2px] rounded-2xl transition-all">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculating Fees...</span>
                                        </div>
                                    </div>
                                )}

                                {qualification ? (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        {/* Section 1: Key Financials (Hero) */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Applied Amount */}
                                            <div className="bg-white border text-left border-slate-200 p-6 rounded-2xl shadow-sm relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                    <div className="w-24 h-24 bg-slate-900 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                                </div>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Applied Amount</p>
                                                <div className="text-4xl font-black text-slate-900 mb-1">
                                                    KES {(watchedAmount ? parseFloat(watchedAmount) : qualification.grossQualifyingAmount).toLocaleString()}
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                                                        {selectedProduct?.name}
                                                    </span>
                                                    <span className="text-xs font-medium text-slate-500">
                                                        @ {selectedProduct?.interestRatePerPeriod ? (typeof selectedProduct.interestRatePerPeriod === 'object' ? (selectedProduct.interestRatePerPeriod as any).toString() : selectedProduct.interestRatePerPeriod) : 0}% Interest
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Net Disbursement */}
                                            <div className="bg-purple-50 text-left border border-purple-100 p-6 rounded-2xl shadow-sm relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                                    <div className="w-20 h-20 bg-purple-600 rounded-full blur-xl -mr-10 -mt-10"></div>
                                                </div>
                                                <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Net To Disburse</p>
                                                <div className="text-4xl font-black text-purple-700 mb-1">
                                                    KES {qualification.netDisbursementAmount.toLocaleString()}
                                                </div>
                                                <p className="text-xs font-bold text-purple-600/70 mt-2">
                                                    After {qualification.totalDeductions > 0 ? `deducting KES ${qualification.totalDeductions.toLocaleString()}` : 'no deductions'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Section 2: Deductions Receipt */}
                                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-sm relative">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                                Financial Deductions Receipt
                                            </h3>

                                            <div className="space-y-3 text-sm">
                                                <div className="flex justify-between items-center py-2 border-b border-slate-200/50 border-dashed">
                                                    <span className="text-slate-600 font-bold italic">Processing Fee</span>
                                                    <span className="font-black text-red-500 text-xs text-right">
                                                        - KES {qualification.processingFee.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b border-slate-200/50 border-dashed">
                                                    <span className="text-slate-600 font-bold italic">Insurance Fee</span>
                                                    <span className="font-black text-red-500 text-xs text-right">
                                                        - KES {qualification.insuranceFee.toLocaleString()}
                                                    </span>
                                                </div>

                                                {qualification.shareCapitalDeduction > 0 && (
                                                    <div className="flex justify-between items-center py-2 border-b border-slate-200/50 border-dashed">
                                                        <span className="text-slate-600 font-bold italic">Share Capital Boost</span>
                                                        <span className="font-black text-red-500 text-xs text-right">
                                                            - KES {qualification.shareCapitalDeduction.toLocaleString()}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Top Up / Refinance Fees */}
                                                {qualification.topUpFee > 0 && (
                                                    <div className="flex justify-between items-center py-2 border-b border-slate-200/50 border-dashed">
                                                        <span className="text-slate-600 font-bold italic">Top Up / Refinance Fees</span>
                                                        <span className="font-black text-red-500 text-xs text-right">
                                                            - KES {qualification.topUpFee.toLocaleString()}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Itemized Offsets */}
                                                {selectedLoansToOffset.length > 0 && (
                                                    <div className="my-2 space-y-2">
                                                        {activeLoans
                                                            .filter((l: any) => selectedLoansToOffset.includes(l.id))
                                                            .map((l: any) => (
                                                                <div key={l.id} className="flex justify-between items-center py-3 bg-orange-100/50 px-3 rounded-xl border border-orange-200/50">
                                                                    <span className="text-orange-900 font-black text-[10px] uppercase tracking-tighter">
                                                                        Clearance: {l.productName} ({l.loanApplicationNumber})
                                                                    </span>
                                                                    <span className="font-black text-orange-700 text-xs text-right">
                                                                        {/* Note: In application stage, we show the full clearance amount here. The fee is separated above. */}
                                                                        - KES {l.outstandingBalance.toLocaleString()}
                                                                    </span>
                                                                </div>
                                                            ))
                                                        }
                                                    </div>
                                                )}

                                                <div className="pt-4 flex justify-between items-center mt-2 border-t border-slate-200">
                                                    <span className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Total Applied Deductions</span>
                                                    <div className="text-right">
                                                        <span className="font-black text-slate-900">KES {qualification.totalDeductions.toLocaleString()}</span>
                                                        <p className="text-[9px] text-slate-400 font-bold italic">Automatically withheld from gross</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Blocking Validation Overlay */}
                                            {qualification.netDisbursementAmount <= 0 && (
                                                <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center rounded-2xl z-10 p-6">
                                                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-xs text-red-700 font-black leading-relaxed shadow-lg max-w-sm text-center">
                                                        <p className="mb-2 text-2xl">🚫</p>
                                                        <p>APPLICATION HALTED: Deductions ({formatCurrency(qualification.totalDeductions)}) exceed the loan amount.</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-12 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 transition-all">
                                        {calcError ? (
                                            <>
                                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                                                    <span className="text-xl">⚠️</span>
                                                </div>
                                                <div>
                                                    <p className="text-red-600 font-black text-sm uppercase">Calculation Error</p>
                                                    <p className="text-red-400 text-xs max-w-xs mx-auto">{calcError}</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => setValue('amount', watch('amount'), { shouldValidate: true })}
                                                        className="mt-2 text-[10px] bg-red-50 text-red-600 px-3 py-1 rounded-full font-bold hover:bg-red-100"
                                                    >
                                                        Retry
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                                                    <span className="text-2xl">🧮</span>
                                                </div>
                                                <div>
                                                    <p className="text-slate-600 font-black text-sm uppercase">Waiting for input</p>
                                                    <p className="text-slate-400 text-xs">
                                                        {!watchedMemberId ? 'Select an applicant to proceed' : 'Enter a valid amount to see your fee breakdown'}
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="pt-2 border-t border-slate-100">
                                <LoanOffsetSelector
                                    memberId={watchedMemberId}
                                    onSelectionChange={setSelectedLoansToOffset}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !qualification || qualification.netDisbursementAmount <= 0}
                                    className="flex-1 bg-cyan-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin w-5 h-5 border-3 border-white border-t-transparent rounded-full" />
                                            Processing...
                                        </>
                                    ) : (
                                        'Submit Application'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={isSubmitting}
                                    className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div >
            )
            }

            {
                selectedLoanId && (
                    <LoanAppraisalCard
                        loanId={selectedLoanId}
                        isOpen={!!selectedLoanId}
                        onClose={() => setSelectedLoanId(null)}
                        currentUserId={currentUserId}
                        activeTab={activeTab}
                    />
                )
            }
        </div >
    );
}

const TabButton: React.FC<{ label: string, active: boolean, onClick: () => void, count?: number }> = ({ label, active, onClick, count }) => (
    <button
        onClick={onClick}
        className={`flex-1 px-6 py-4 text-sm font-black uppercase tracking-wider rounded-xl transition-all ${active ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
    >
        <div className="flex items-center justify-center gap-2">
            <span>{label}</span>
            {count !== undefined && count > 0 && <span className={`px-2 py-1 rounded-full text-xs font-black ${active ? 'bg-white/20' : 'bg-cyan-500/10 text-cyan-600'}`}>{count}</span>}
        </div>
    </button>
);
