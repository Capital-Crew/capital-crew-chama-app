'use client'

import React, { useState, useTransition } from 'react';
import { disburseLoan } from '@/app/actions/disburse-loan';
import { formatCurrency } from '@/lib/utils';
import { CheckCircleIcon } from '@/components/icons';
import { toast } from '@/lib/toast';

interface PostLoanButtonProps {
    loanId: string;
    amount: number;
    memberName: string;
    status: string;
    activeTab?: string;
    currentUserId: string;
    applicantId: string;
}

export function PostLoanButton({
    loanId,
    amount,
    memberName,
    status,
    activeTab,
    currentUserId,
    applicantId
}: PostLoanButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    // VISIBILITY RULE 1: Only show on "Approved Loans" tab
    if (activeTab && activeTab !== 'approved') {
        return null;
    }

    // VISIBILITY RULE 2: Only render if loan status === 'APPROVED'
    if (status !== 'APPROVED') {
        return null;
    }

    // MAKER-CHECKER RULE: Cannot disburse own loan
    const isSelfApproval = currentUserId === applicantId;

    const handleDisburse = () => {
        const toastId = toast.loading('Processing disbursement...');

        startTransition(async () => {
            try {
                const result = await disburseLoan(loanId);

                if (result && 'error' in result && result.error) {
                    toast.error(result.error, { id: toastId });
                } else {
                    toast.success('Loan successfully posted and disbursed', { id: toastId });
                    setIsOpen(false);
                }
            } catch (error: any) {
                toast.error(error.message || 'Failed to disburse loan', { id: toastId });
            }
        });
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                disabled={isSelfApproval}
                className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest shadow-lg transition-all flex items-center gap-2 ${isSelfApproval
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-cyan-500/20'
                    }`}
                title={isSelfApproval ? 'Compliance: You cannot process your own loan' : 'Disburse loan to member wallet'}
            >
                <CheckCircleIcon className="w-5 h-5" />
                Post Loan & Disburse
            </button>

            {isSelfApproval && (
                <p className="text-xs text-red-600 font-bold mt-2">
                    ⚠️ Compliance: You cannot process your own loan
                </p>
            )}

            {/* Confirmation Modal */}
            {isOpen && !isSelfApproval && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-gradient-to-br from-cyan-500 to-blue-500 p-6 text-white">
                            <h3 className="text-xl font-black uppercase tracking-tight">Confirm Disbursement</h3>
                            <p className="text-white/80 text-sm mt-1">Immediate financial transfer</p>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Disbursing To</p>
                                    <p className="font-black text-slate-800 text-lg">{memberName}</p>
                                </div>
                                <div className="p-4 bg-cyan-50 border border-cyan-100 rounded-2xl space-y-2">
                                    <p className="text-[10px] font-black text-cyan-600 uppercase tracking-widest">Amount to Wallet</p>
                                    <p className="font-black text-cyan-700 text-2xl">{formatCurrency(amount)}</p>
                                </div>
                            </div>

                            <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
                                <p className="text-xs text-amber-800 font-bold leading-relaxed">
                                    ⚠️ <strong>Warning:</strong> This action triggers a financial transfer and cannot be undone. Funds will be credited to the member's wallet immediately.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleDisburse}
                                    disabled={isPending}
                                    className="flex-1 bg-cyan-500 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isPending ? (
                                        <>
                                            <div className="animate-spin w-5 h-5 border-3 border-white border-t-transparent rounded-full" />
                                            Disbursing...
                                        </>
                                    ) : (
                                        'Confirm & Disburse'
                                    )}
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    disabled={isPending}
                                    className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black uppercase text-xs transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
