'use client'

import React, { useState } from 'react';
import { Member, LoanProduct } from '@/lib/types';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { toast } from '@/lib/toast';
import { directLoadLoan } from '@/app/actions/direct-loan-loader-action';
import { XIcon, CheckCircle2Icon, Loader2Icon, AlertCircleIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface DirectLoanLoaderProps {
    members: Member[];
    products: LoanProduct[];
    isOpen: boolean;
    onClose: () => void;
}

export function DirectLoanLoader({ members, products, isOpen, onClose }: DirectLoanLoaderProps) {
    const [memberId, setMemberId] = useState('');
    const [productId, setProductId] = useState('');
    const [amount, setAmount] = useState('');
    const [installments, setInstallments] = useState('');
    const [disbursementDate, setDisbursementDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const selectedProduct = products.find(p => p.id === productId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!memberId || !productId || !amount || !installments || !disbursementDate) {
            toast.error("Please fill all required fields");
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await directLoadLoan({
                memberId,
                loanProductId: productId,
                amount: parseFloat(amount),
                installments: parseInt(installments),
                disbursementDate,
                purpose: "Back-loaded existing loan"
            });

            if (result.success) {
                toast.success(`Success! Loan #${result.loanNumber} has been loaded.`);
                onClose();
                // Clear form
                setMemberId('');
                setProductId('');
                setAmount('');
                setInstallments('');
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to load loan");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl border-4 border-white overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
                {/* Header */}
                <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-white shadow-lg shadow-cyan-200">
                                <CheckCircle2Icon className="w-5 h-5" />
                            </span>
                            Direct Loan Loader
                        </h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Administrative Injection Tool</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-all hover:text-slate-900"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 mb-2">
                        <AlertCircleIcon className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-700 font-bold leading-relaxed">
                            <span className="uppercase tracking-wider mr-1 text-amber-800">Note:</span> 
                            This tool bypasses all approvals and immediately disburses the loan to the selected account. Used for migrating already approved loans.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Member Selection */}
                        <div className="col-span-full space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Member</label>
                            <SearchableSelect 
                                options={members.map(m => ({ value: m.id, label: `${m.name} (${m.memberNumber || 'No ID'})` }))}
                                value={memberId}
                                onChange={setMemberId}
                                placeholder="Search for a member..."
                            />
                        </div>

                        {/* Product Selection */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Loan Product</label>
                            <select 
                                value={productId}
                                onChange={(e) => setProductId(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-cyan-500 transition-all appearance-none"
                            >
                                <option value="">Select Product...</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.interestRate}%)</option>
                                ))}
                            </select>
                        </div>

                        {/* Disbursement Date */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Start Date</label>
                            <input 
                                type="date"
                                value={disbursementDate}
                                onChange={(e) => setDisbursementDate(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-cyan-500 transition-all"
                            />
                        </div>

                        {/* Principal Amount */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Principal Amount</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">KES</span>
                                <input 
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-black text-slate-900 focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        {/* Repayment Period */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Installments (Months)</label>
                            <input 
                                type="number"
                                value={installments}
                                onChange={(e) => setInstallments(e.target.value)}
                                placeholder="e.g. 12"
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-cyan-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Summary Card */}
                    {selectedProduct && amount && installments && (
                        <div className="bg-cyan-50 rounded-3xl p-5 border border-cyan-100 animate-in slide-in-from-top-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-600 mb-3 ml-1">Summary Snapshot</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/80 p-3 rounded-2xl">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Rate</p>
                                    <p className="font-black text-cyan-600 italic tracking-tighter">{selectedProduct.interestRate}% <span className="text-[8px] font-bold uppercase opacity-60">Fixed</span></p>
                                </div>
                                <div className="bg-white/80 p-3 rounded-2xl">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Est. Monthly</p>
                                    <p className="font-black text-slate-900 italic tracking-tighter">
                                        {formatCurrency((parseFloat(amount) + (parseFloat(amount) * (selectedProduct.interestRate / 100))) / parseInt(installments))}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button 
                        disabled={isSubmitting}
                        className="w-full bg-slate-900 text-white rounded-[1.5rem] py-5 font-black uppercase tracking-tighter italic text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2Icon className="w-6 h-6 animate-spin text-cyan-400" />
                                Processing Injection...
                            </>
                        ) : (
                            <>
                                <CheckCircle2Icon className="w-6 h-6 text-cyan-400" />
                                Load Loan Record
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
