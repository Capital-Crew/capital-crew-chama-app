'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from '@/lib/toast';
import { applyForLoan } from '@/app/actions';
import { calculateLoanQualification, getMemberActiveLoans } from '@/app/sacco-settings-actions';
import { useDebounce } from '@/hooks/useDebounce';
import { LoanOffsetSelector } from '../LoanOffsetSelector';
import { MemberCreditSnapshot } from './MemberCreditSnapshot';
import { Member, LoanProduct, Loan } from '@/lib/types'; // Adjust imports as needed
import { CreditSnapshot } from '@/lib/utils/credit-limit';
import { formatCurrency } from '@/lib/utils';

interface LoanApplicationFormProps {
    members: Member[];
    products: LoanProduct[];
    currentMemberId?: string;
    creditSnapshot?: CreditSnapshot | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export function LoanApplicationForm({
    members,
    products,
    currentMemberId,
    creditSnapshot,
    onSuccess,
    onCancel
}: LoanApplicationFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedLoansToOffset, setSelectedLoansToOffset] = useState<string[]>([]);
    const [activeLoans, setActiveLoans] = useState<any[]>([]);

    // Qualification calculation state
    const [qualification, setQualification] = useState<any>(null);
    const [calculatingQualification, setCalculatingQualification] = useState(false);
    const [calcError, setCalcError] = useState<string | null>(null);

    const { register, watch, setValue, reset } = useForm({
        defaultValues: {
            memberId: currentMemberId || '',
            loanProductId: '',
            amount: '',
            installments: 12
        }
    });

    const watchedMemberId = watch('memberId');
    const watchedProductId = watch('loanProductId');
    const watchedAmount = watch('amount');
    const watchedInstallments = watch('installments');

    const debouncedAmount = useDebounce(watchedAmount, 500);
    const debouncedMemberId = useDebounce(watchedMemberId, 300);

    // Memoize selected product
    const selectedProduct = useMemo(() =>
        products.find(p => p.id === watchedProductId),
        [products, watchedProductId]
    );

    // Update installments when product changes
    useEffect(() => {
        if (selectedProduct) {
            setValue('installments', selectedProduct.numberOfRepayments || 12);
        }
    }, [selectedProduct, setValue]);

    // Fetch active loans for selected member
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

    // Calculate qualification
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

    return (
        <form action={async (formData) => {
            if (isSubmitting) return;

            setIsSubmitting(true);
            toast.loading('Processing loan application...');

            try {
                const memberId = watchedMemberId || currentMemberId;
                if (memberId && !formData.get('memberId')) {
                    formData.set('memberId', memberId);
                }

                const res = await applyForLoan(null, formData);
                if (res?.error) {
                    toast.error(res.error);
                    setIsSubmitting(false);
                } else {
                    toast.success('Loan application submitted successfully!');
                    reset();
                    onSuccess();
                    window.location.reload();
                }
            } catch (err: any) {
                toast.error(err.message || 'Failed to submit application');
                setIsSubmitting(false);
            }
        }} className="space-y-8 pb-8">
            {/* Hidden Failsafe Input - React Hook Form */}
            <input type="hidden" {...register('memberId')} />

            {/* 1. Applicant Identity & Snapshot */}
            <div className="space-y-6">
                <div className="space-y-2 px-1">
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

            {/* 2. Loan Configuration */}
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
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Applied Amount</p>
                                <div className="text-4xl font-black text-slate-900 mb-1">
                                    KES {(watchedAmount ? parseFloat(watchedAmount) : qualification.grossQualifyingAmount).toLocaleString()}
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                                        {selectedProduct?.name}
                                    </span>
                                </div>
                            </div>

                            {/* Net Disbursement */}
                            <div className="bg-purple-50 text-left border border-purple-100 p-6 rounded-2xl shadow-sm relative overflow-hidden">
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

                                {qualification.topUpFee > 0 && (
                                    <div className="flex justify-between items-center py-2 border-b border-slate-200/50 border-dashed">
                                        <span className="text-slate-600 font-bold italic">Top Up / Refinance Fees</span>
                                        <span className="font-black text-red-500 text-xs text-right">
                                            - KES {qualification.topUpFee.toLocaleString()}
                                        </span>
                                    </div>
                                )}

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
                                <div className="space-y-1">
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
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
