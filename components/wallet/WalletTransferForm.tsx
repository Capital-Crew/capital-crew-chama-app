/**
 * Wallet Transfer Component
 * 
 * Refactored to use standard form action hooks and premium UI components.
 */

'use client';

import React, { useState } from 'react';
import { processTransfer } from '@/app/actions/process-transfer';
import type { DestinationType } from '@/lib/types';
import { useFormAction } from '@/hooks/useFormAction';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { FormError } from '@/components/ui/FormError';
import { Wallet, ArrowRightLeft, CheckCircle2, Info, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WalletTransferFormProps {
    walletId: string;
    walletBalance: number;
    activeLoans?: Array<{
        id: string;
        loanApplicationNumber: string;
        productName: string;
        outstandingBalance: number;
    }>;
    memberId: string;
}

export function WalletTransferForm({
    walletId,
    walletBalance,
    activeLoans = [],
    memberId
}: WalletTransferFormProps) {
    const [destinationType, setDestinationType] = useState<DestinationType>('LOAN_REPAYMENT');
    const [destinationId, setDestinationId] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [result, setResult] = useState<any>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const { execute, isPending: loading, error } = useFormAction();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitted) return;
        setResult(null);

        await execute(async (idempotencyKey) => {
            const amountNum = parseFloat(amount);

            if (isNaN(amountNum) || amountNum <= 0) {
                return { success: false, error: 'Please enter a valid amount' };
            }

            if (amountNum > walletBalance) {
                return { success: false, error: 'Insufficient wallet balance' };
            }

            // If it's a loan repayment, we must have a destination ID
            if (destinationType === 'LOAN_REPAYMENT' && !destinationId) {
                return { success: false, error: 'Please select a loan for repayment' };
            }

            try {
                const transferResult = await processTransfer({
                    walletId,
                    destinationType,
                    destinationId: destinationType === 'CONTRIBUTION' ? memberId : destinationId,
                    amount: amountNum,
                    description: description || undefined,
                    idempotencyKey
                });

                setResult(transferResult);
                setAmount('');
                setDescription('');
                setIsSubmitted(true); // Lock the form on success
                return { success: true };
            } catch (err: any) {
                return { success: false, error: err.message || 'An error occurred during transfer' };
            }
        }, { useIdempotency: true });
    };

    return (
        <div className="max-w-2xl mx-auto p-0 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden font-sans">
            {}
            <div className="bg-gradient-to-br from-[#0A192F] to-[#001E2B] p-10 text-white relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 -mr-10 -mt-10">
                    <ArrowRightLeft className="w-48 h-48 rotate-12" />
                </div>
                <div className="relative z-10">
                    <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-2 font-mono">Internal Funds Transfer</p>
                    <h2 className="text-3xl font-black tracking-tighter mb-6">Wallet <span className="text-cyan-400">Hub</span></h2>
                    
                    <div className="p-6 bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 flex items-center justify-between group hover:bg-white/10 transition-all duration-500">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Available Liquidity</p>
                            <p className="text-3xl font-black text-white tracking-tight">
                                <span className="text-xs text-cyan-500 mr-1">KES</span>
                                {walletBalance.toLocaleString()}
                            </p>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                            <Wallet className="w-8 h-8" />
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8">
                <FormError message={error} className="animate-in fade-in slide-in-from-top-2" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Transfer Destination</label>
                        <div className="relative group">
                            <select
                                value={destinationType}
                                onChange={(e) => {
                                    setDestinationType(e.target.value as DestinationType);
                                    setDestinationId('');
                                }}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 appearance-none focus:ring-4 focus:ring-cyan-500/10 transition-all outline-none"
                                disabled={loading || isSubmitted}
                            >
                                <option value="LOAN_REPAYMENT">Loan Repayment</option>
                                <option value="CONTRIBUTION">Share Contribution</option>
                            </select>
                            <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 rotate-90 pointer-events-none" />
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Volume (KES)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-lg font-black text-slate-800 placeholder:text-slate-200 focus:ring-4 focus:ring-cyan-500/10 transition-all outline-none"
                            required
                            disabled={loading || isSubmitted}
                        />
                    </div>
                </div>

                {/* Destination Dropdown (Loans) */}
                {destinationType === 'LOAN_REPAYMENT' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Account / Loan</label>
                        <div className="relative group">
                            <select
                                value={destinationId}
                                onChange={(e) => setDestinationId(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 appearance-none focus:ring-4 focus:ring-cyan-500/10 transition-all outline-none"
                                required
                                disabled={loading || isSubmitted}
                            >
                                <option value="">-- Select active loan --</option>
                                {activeLoans.map((loan) => (
                                    <option key={loan.id} value={loan.id}>
                                        {loan.loanApplicationNumber} — {loan.productName} (BAL: {loan.outstandingBalance.toLocaleString()})
                                    </option>
                                ))}
                            </select>
                            <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 rotate-90 pointer-events-none" />
                        </div>
                    </div>
                )}

                {/* Description */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Reference Notes</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Internal notes for tracking..."
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 placeholder:text-slate-200 focus:ring-4 focus:ring-cyan-500/10 transition-all outline-none resize-none"
                        disabled={loading || isSubmitted}
                    />
                </div>

                <div className="pt-4">
                    <SubmitButton
                        isPending={loading}
                        disabled={isSubmitted}
                        label={isSubmitted ? "Transfer Executed" : "Execute Transfer"}
                        pendingLabel="Authorizing..."
                        icon={<ArrowRightLeft className="w-4 h-4 mr-2" />}
                        className="w-full bg-[#0A192F] hover:bg-cyan-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-slate-200 transition-all duration-500"
                    />
                </div>
            </form>

            {}
            {result && (
                <div className="m-10 mt-0 p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100 animate-in zoom-in duration-500 relative overflow-hidden">
                    <div className="absolute right-5 top-5 opacity-10">
                        <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                    </div>
                    
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-200">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Transaction Success</p>
                            <p className="text-xl font-black text-emerald-900 tracking-tight">{result.message}</p>
                        </div>
                    </div>

                    <div className="space-y-4 bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-emerald-100/50">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">New Balance</span>
                            <span className="text-lg font-black text-slate-900">
                                <span className="text-xs text-slate-400 mr-1 italic">KES</span>
                                {result.newWalletBalance.toLocaleString()}
                            </span>
                        </div>

                        {result.allocation && (
                            <div className="pt-4 border-t border-emerald-100 space-y-2">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Info className="w-3 h-3" /> Allocation Digest
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    <AllocationMetric label="Principal" value={result.allocation.principal} />
                                    <AllocationMetric label="Interest" value={result.allocation.interest} />
                                    <AllocationMetric label="Penalty" value={result.allocation.penalty} />
                                </div>
                            </div>
                        )}

                        {result.journalEntryNumber && (
                            <div className="flex justify-between items-center pt-4 border-t border-emerald-100">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Journal Ref</span>
                                <span className="font-mono text-[10px] text-emerald-700 bg-emerald-100/50 px-2.5 py-1 rounded-md font-bold tracking-tight">{result.journalEntryNumber}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function AllocationMetric({ label, value }: { label: string, value: number }) {
    return (
        <div className="p-3 bg-white/80 rounded-xl border border-emerald-50">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1">{label}</p>
            <p className="text-xs font-black text-slate-800 tracking-tight">{value.toLocaleString()}</p>
        </div>
    );
}
