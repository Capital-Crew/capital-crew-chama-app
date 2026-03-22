'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/lib/toast';
import { applyForLoan } from '@/app/actions';
import { calculateLoanQualification, getMemberActiveLoans } from '@/app/sacco-settings-actions';
import { useDebounce } from '@/hooks/useDebounce';
import { LoanOffsetSelector } from '../LoanOffsetSelector';
import { MemberCreditSnapshot } from './MemberCreditSnapshot';
import { Member, LoanProduct, Loan } from '@/lib/types'; // Adjust imports as needed
import { CreditSnapshot } from '@/lib/utils/credit-limit';
import { formatCurrency } from '@/lib/utils';
import { ChevronLeft, Send, X, FileText } from 'lucide-react';
import { useFormAutoSave } from '@/hooks/useFormAutoSave';
import { AutoSaveIndicator } from './AutoSaveIndicator';
// import { deleteLoanDraft } from '@/app/loan-draft-actions'; // Removed
import { LoanExemptionsSection } from './LoanExemptionsSection';
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface LoanApplicationFormProps {
    members: Member[];
    products: LoanProduct[];
    currentMemberId?: string;
    creditSnapshot?: CreditSnapshot | null;
    initialData?: Loan; // Added initialData prop
    draftData?: any; // Auto-saved draft data
    onSuccess?: () => void;
    onCancel?: () => void;
    canEditDetails?: boolean;
    canEditExemptions?: boolean;
}

export function LoanApplicationForm({
    members,
    products,
    currentMemberId,
    creditSnapshot,
    initialData, // Destructure initialData
    draftData, // Auto-saved draft
    onSuccess,
    onCancel,
    canEditDetails = true, // Default to true if not provided (e.g. new application)
    canEditExemptions = false,
}: LoanApplicationFormProps) {
    const router = useRouter() // Ensure next/navigation is imported

    // Validation Schema
    const loanApplicationSchema = z.object({
        memberId: z.string().min(1, 'Member is required'),
        loanProductId: z.string().min(1, 'Loan product is required'),
        amount: z.string()
            .min(1, 'Amount is required')
            .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
                message: 'Amount must be greater than 0'
            }),
        installments: z.number()
            .min(1, 'Installments must be at least 1')
            .max(60, 'Installments cannot exceed 60 months')
    });

    // Default handlers if not provided
    const handleSuccess = onSuccess || (() => router.push('/loans'))
    const handleCancel = onCancel || (() => router.push('/loans'))
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedLoansToOffset, setSelectedLoansToOffset] = useState<string[]>(
        initialData?.existingLoanOffset && (initialData as any).topUps
            ? (initialData as any).topUps.map((t: any) => t.oldLoanId)
            : []
    );
    const [feeExemptions, setFeeExemptions] = useState<any>((initialData?.feeExemptions as any) || {});
    const [activeLoans, setActiveLoans] = useState<any[]>([]);

    // Qualification calculation state
    const [qualification, setQualification] = useState<any>(null);
    const [calculatingQualification, setCalculatingQualification] = useState(false);
    const [calcError, setCalcError] = useState<string | null>(null);



    // Status check for read-only mode or auto-save disable
    const isPending = initialData?.status &&
        initialData.status !== 'APPLICATION' &&
        initialData.status !== 'DRAFT';

    const { register, watch, setValue, reset, formState: { errors } } = useForm({
        resolver: zodResolver(loanApplicationSchema),
        defaultValues: {
            // SECURITY: Always use currentMemberId (logged-in user's member)
            // Never trust memberId from draftData or initialData
            memberId: currentMemberId || draftData?.memberId || initialData?.memberId || '',
            loanProductId: draftData?.loanProductId || initialData?.loanProductId || '',
            amount: draftData?.amount || (initialData?.amount ? String(initialData.amount) : ''),
            installments: draftData?.installments || initialData?.installments || 12
        }
    });

    // Auto-save hook
    const { status: autoSaveStatus, lastSaved, error: autoSaveError, save: saveDraft } = useFormAutoSave({
        watch,
        debounceMs: 1000,
        enabled: !isPending, // Enabled for drafts/application, disabled if Pending/Approved
        onSave: async (data: any) => {
            if (initialData?.id) {
                // Editing existing Loan record (DRAFT/APPLICATION status)
                const { updateLoanDraft } = await import('@/app/actions/loan-application-actions');
                await updateLoanDraft(initialData.id, data);
            } else {
                // New application - save to LoanDraft table
                const { saveLoanDraft } = await import('@/app/loan-draft-actions');
                await saveLoanDraft({ formData: data });
            }
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
        }
    }, [debouncedMemberId]);

    // Eligibility state
    const [eligibility, setEligibility] = useState<{ isEligible: boolean; message?: string } | null>(null);

    // Calculate qualification
    // Calculate qualification
    useEffect(() => {
        if (debouncedMemberId) {
            setCalculatingQualification(true);
            setCalcError(null);
            const amount = debouncedAmount ? parseFloat(debouncedAmount) : undefined;
            // Pass feeExemptions to calculation
            calculateLoanQualification(debouncedMemberId, selectedLoansToOffset, amount, feeExemptions)
                .then(result => setQualification(result))
                .catch(error => {
                    setCalcError(error.message || 'Failed to calculate fees. Please try again.');
                })
                .finally(() => setCalculatingQualification(false));

            // NEW: Check Eligibility
            import('@/app/actions/loan-eligibility').then(({ checkLoanEligibility }) => {
                checkLoanEligibility(debouncedMemberId).then(result => {
                    setEligibility(result);
                    if (!result.isEligible) {
                        toast.error(result.message || 'You are not eligible for a new loan.');
                    }
                });
            });

        } else {
            setQualification(null);
            setCalcError(null);
            setEligibility(null);
        }
    }, [debouncedMemberId, selectedLoansToOffset, debouncedAmount, feeExemptions]);

    // Button Visibility Logic
    const isEditMode = !!initialData;
    const isDraft = !initialData || initialData.status === 'APPLICATION';

    return (
        <form action={async (formData) => {
            // Prevent duplicate submissions
            if (isSubmitting) {
                return;
            }

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
                    // SUCCESS
                    toast.success('Loan application submitted successfully!');
                    reset();
                    handleSuccess();
                }
            } catch (err: any) {
                toast.error(err.message || 'Failed to submit application');
                setIsSubmitting(false);
            }
        }} className="space-y-8 pb-8">
            {}
            <input type="hidden" {...register('memberId')} />
            {initialData && <input type="hidden" name="loanId" value={initialData.id} />}

            {}
            <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 -mx-8 -mt-8 px-8 py-3 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        {}
                        <button
                            type="button"
                            onClick={async () => {
                                // Save draft as APPLICATION status before navigating away (only for new applications)
                                if (!initialData) {
                                    const formData = new FormData();
                                    formData.append('memberId', watchedMemberId || '');
                                    formData.append('loanProductId', watchedProductId || '');
                                    formData.append('amount', watchedAmount || '0');
                                    formData.append('installments', String(watchedInstallments || 12));
                                    formData.append('submitAction', 'save'); // Mark as draft

                                    // Add selected loans to offset
                                    selectedLoansToOffset.forEach(loanId => {
                                        formData.append('loansToOffset', loanId);
                                    });

                                    try {
                                        await applyForLoan(null, formData);
                                    } catch (error) {
                                    }
                                }
                                handleCancel();
                            }}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-slate-300 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm disabled:opacity-50"
                            title="Go Back"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Back</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-3">


                        {}
                        <AutoSaveIndicator
                            status={autoSaveStatus}
                            lastSaved={lastSaved}
                            error={autoSaveError}
                        />
                        <Button
                            type="submit"
                            name="submitAction"
                            value="send"
                            disabled={isSubmitting || !canEditDetails} // Disable Send if only allowed to edit exemptions
                            className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Send Approval Request
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {}
            {eligibility && !eligibility.isEligible && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm mb-6 animate-pulse">
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">🚫</div>
                        <div>
                            <h3 className="text-red-800 font-black text-sm uppercase mb-1">Application Blocked</h3>
                            <p className="text-red-700 text-xs font-medium leading-relaxed">
                                {eligibility.message}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {}
            <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider border-b-2 border-cyan-500 pb-2">
                    1. Member & Loan Details
                </h3>

                {}
                <div className="space-y-2 px-1">
                    <label className="block text-xs font-black text-slate-700 uppercase">Applicant Profile <span className="text-red-500">*</span></label>
                    <select
                        {...register('memberId')}
                        value={watchedMemberId || currentMemberId || ''}
                        onChange={(e) => setValue('memberId', e.target.value)}
                        disabled={!!currentMemberId || !canEditDetails}
                        className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 text-sm font-bold focus:border-cyan-500 outline-none disabled:bg-slate-50 disabled:cursor-not-allowed"
                    >
                        <option value="">Select Member...</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.name} • #{m.memberNumber}</option>)}
                    </select>
                    {currentMemberId && (
                        <p className="text-[10px] text-cyan-600 font-bold">
                            🔒 Locked to your account: {members.find(m => m.id === currentMemberId)?.name || 'Your Account'}
                        </p>
                    )}
                    {errors.memberId && (
                        <p className="text-red-600 text-xs font-semibold mt-1">{errors.memberId.message}</p>
                    )}
                </div>

                {}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-700 uppercase">Loan Product <span className="text-red-500">*</span></label>
                        <select
                            {...register('loanProductId', { required: false })}
                            disabled={!canEditDetails}
                            className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 text-sm font-bold focus:border-cyan-500 outline-none disabled:bg-slate-50 disabled:cursor-not-allowed"
                        >
                            <option value="">Select Product...</option>
                            {products.filter(p => p.isActive).map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} ({typeof p.interestRatePerPeriod === 'object' ? (p.interestRatePerPeriod as any).toString() : p.interestRatePerPeriod}% p.m.)
                                </option>
                            ))}
                        </select>
                        {errors.loanProductId && (
                            <p className="text-red-600 text-xs font-semibold mt-1">{errors.loanProductId.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-700 uppercase">Requested Amount (KES) <span className="text-red-500">*</span></label>
                        <input
                            {...register('amount', { required: false })}
                            type="number"
                            placeholder="Enter amount"
                            readOnly={!canEditDetails}
                            className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 text-sm font-bold focus:border-cyan-500 outline-none read-only:bg-slate-50 read-only:cursor-not-allowed"
                        />
                        {errors.amount && (
                            <p className="text-red-600 text-xs font-semibold mt-1">{errors.amount.message}</p>
                        )}
                    </div>
                </div>

                {}
                <div className="space-y-2">
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
                        disabled={!canEditDetails}
                        className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 text-sm font-bold focus:border-cyan-500 outline-none disabled:bg-slate-50 disabled:cursor-not-allowed"
                    >
                        {Array.from({ length: selectedProduct?.numberOfRepayments || 12 }, (_, i) => i + 1).map(month => (
                            <option key={month} value={month}>
                                {month} {month === 1 ? 'Month' : 'Months'}
                            </option>
                        ))}
                    </select>
                    {errors.installments && (
                        <p className="text-red-600 text-xs font-semibold mt-1">{errors.installments.message}</p>
                    )}
                    <p className="text-xs text-slate-500 font-medium">
                        Repayment: <strong className="text-slate-700">{watchedInstallments} monthly installments</strong> @ {selectedProduct?.interestRatePerPeriod ? (typeof selectedProduct.interestRatePerPeriod === 'object' ? (selectedProduct.interestRatePerPeriod as any).toString() : selectedProduct.interestRatePerPeriod) : 0}% p.m.
                    </p>
                </div>

                {}
                <LoanOffsetSelector
                    memberId={watchedMemberId}
                    onSelectionChange={setSelectedLoansToOffset}
                    disabled={!canEditDetails} // Pass disabled prop if supported
                />
            </div>

            {}
            {
                selectedLoansToOffset.map(loanId => (
                    <input key={loanId} type="hidden" name="loansToOffset" value={loanId} />
                ))
            }

            {}
            {
                creditSnapshot && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider border-b-2 border-cyan-500 pb-2">
                            2. Qualification Details
                        </h3>
                        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                            <header className="bg-slate-50 px-4 py-2 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase">
                                Borrowing Power Baseline
                            </header>
                            <MemberCreditSnapshot data={creditSnapshot} />
                        </div>
                    </div>
                )
            }

            {}
            <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider border-b-2 border-amber-500 pb-2">
                    2.5. Loan Exemptions
                </h3>
                <LoanExemptionsSection
                    loanId={initialData?.id || ''}
                    exemptions={feeExemptions}
                    isOwnLoan={currentMemberId === watchedMemberId}
                    loanStatus={initialData?.status}
                    loanStatus={initialData?.status}
                    isEditable={canEditExemptions}
                    onChange={setFeeExemptions}
                />
            </div>
            {}
            {
                Object.entries(feeExemptions).map(([key, value]) => (
                    <input key={key} type="hidden" name={`exemptions[${key}]`} value={String(value)} />
                ))
            }
            <input type="hidden" name="feeExemptions" value={JSON.stringify(feeExemptions)} />

            {}
            <div className="space-y-6 relative">
                {calculatingQualification && (
                    <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-[2px] rounded-2xl transition-all">
                        <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculating...</span>
                        </div>
                    </div>
                )}

                {qualification ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {}
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider border-b-2 border-orange-500 pb-2">
                                3. Deductions
                            </h3>

                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-sm">
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center py-2 border-b border-slate-200/50 border-dashed">
                                        <span className="text-slate-600 font-bold">Processing Fee</span>
                                        <span className="font-black text-red-500 text-xs">
                                            - KES {qualification.processingFee.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center py-2 border-b border-slate-200/50 border-dashed">
                                        <span className="text-slate-600 font-bold">Insurance Fee</span>
                                        <span className="font-black text-red-500 text-xs">
                                            - KES {qualification.insuranceFee.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>

                                    {qualification.shareCapitalDeduction > 0 && (
                                        <div className="flex justify-between items-center py-2 border-b border-slate-200/50 border-dashed">
                                            <span className="text-slate-600 font-bold">Contributions Deduction</span>
                                            <span className="font-black text-red-500 text-xs">
                                                - KES {qualification.shareCapitalDeduction.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    )}

                                    {qualification.topUpFee > 0 && (
                                        <div className="flex justify-between items-center py-2 border-b border-slate-200/50 border-dashed">
                                            <span className="text-slate-600 font-bold">Refinance Fee</span>
                                            <span className="font-black text-red-500 text-xs">
                                                - KES {qualification.topUpFee.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    )}

                                    {selectedLoansToOffset.length > 0 && (
                                        <div className="my-2 space-y-2">
                                            {activeLoans
                                                .filter((l: any) => selectedLoansToOffset.includes(l.id))
                                                .map((l: any) => (
                                                    <div key={l.id} className="flex justify-between items-center py-3 bg-orange-100/50 px-3 rounded-xl border border-orange-200/50">
                                                        <span className="text-orange-900 font-black text-[10px] uppercase">
                                                            Loan Offset: {l.productName} ({l.loanApplicationNumber})
                                                        </span>
                                                        <span className="font-black text-orange-700 text-xs">
                                                            - KES {l.outstandingBalance.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    )}

                                    <div className="pt-4 flex justify-between items-center mt-2 border-t-2 border-slate-300">
                                        <span className="font-black text-slate-700 text-sm uppercase">Total Deductions</span>
                                        <span className="font-black text-red-600 text-lg">
                                            KES {(
                                                qualification.processingFee +
                                                qualification.insuranceFee +
                                                (qualification.shareCapitalDeduction || 0) +
                                                (qualification.topUpFee || 0) +
                                                (qualification.selectedLoansOffset || 0)
                                            ).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {}
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider border-b-2 border-purple-500 pb-2">
                                4. Net Disbursement Amount
                            </h3>

                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 p-8 rounded-2xl shadow-lg text-center">
                                <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Amount to be Disbursed</p>
                                <div className="text-5xl font-black text-purple-700 mb-2">
                                    KES {(
                                        (watchedAmount && parseFloat(watchedAmount) > 0 ? parseFloat(watchedAmount) : 0) -
                                        qualification.processingFee -
                                        qualification.insuranceFee -
                                        (qualification.shareCapitalDeduction || 0) -
                                        (qualification.topUpFee || 0) -
                                        (qualification.selectedLoansOffset || 0)
                                    ).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <p className="text-xs font-bold text-purple-600/70 mt-2">
                                    This amount will be credited to member's wallet
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-12 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3">
                        {calcError ? (
                            <>
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                                    <span className="text-xl">⚠️</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-red-600 font-black text-sm uppercase">Calculation Error</p>
                                    <p className="text-red-400 text-xs max-w-xs mx-auto">{calcError}</p>
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
                                        {!watchedMemberId ? 'Select an applicant to proceed' : 'Enter loan details to see breakdown'}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {}
        </form >
    );
}
