'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Wallet, ArrowUpCircle, ArrowDownCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { postAdminWalletAdjustment } from '@/app/wallet-actions';

interface AdminWalletAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    member: {
        id: string;
        name: string;
        memberNumber: number;
    } | null;
    onSuccess?: () => void;
}

export function AdminWalletAdjustmentModal({
    isOpen,
    onClose,
    member,
    onSuccess
}: AdminWalletAdjustmentModalProps) {
    const [adjustmentType, setAdjustmentType] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT');
    const [amount, setAmount] = useState('');
    const [reference, setReference] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!member) return null;

    const isValid = Boolean(
        amount && 
        !isNaN(parseFloat(amount)) && 
        parseFloat(amount) > 0 && 
        reference.trim().length >= 4 && 
        description.trim().length >= 5
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('memberId', member.id);
            formData.append('type', adjustmentType);
            formData.append('amount', amount);
            formData.append('reference', reference);
            formData.append('description', description);

            const result = await postAdminWalletAdjustment(formData);

            if (result.success) {
                toast.success(result.message);
                // Reset form
                setAmount('');
                setReference('');
                setDescription('');
                onSuccess?.();
                onClose();
            } else {
                toast.error(result.error || "Failed to post adjustment");
            }
        } catch (error: any) {
            toast.error(error.message || "An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                                <Wallet className="w-6 h-6 text-cyan-400" />
                            </div>
                            Wallet Adjustment
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="mt-6 flex items-center justify-between bg-white/5 rounded-2xl p-4 border border-white/5">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Target Member</p>
                            <p className="text-lg font-bold">{member.name}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Member ID</p>
                            <p className="text-lg font-bold text-cyan-400">#{String(member.memberNumber).padStart(4, '0')}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Adjustment Type */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adjustment Type</label>
                        <div className="flex gap-4 p-1 bg-slate-100 rounded-2xl">
                            <button
                                type="button"
                                onClick={() => setAdjustmentType('DEPOSIT')}
                                className={`flex-1 py-3 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                                    adjustmentType === 'DEPOSIT' 
                                    ? 'bg-white text-emerald-600 shadow-xl shadow-emerald-500/10' 
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <ArrowUpCircle className={`w-4 h-4 ${adjustmentType === 'DEPOSIT' ? 'animate-bounce' : ''}`} />
                                DEPOSIT
                            </button>
                            <button
                                type="button"
                                onClick={() => setAdjustmentType('WITHDRAWAL')}
                                className={`flex-1 py-3 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                                    adjustmentType === 'WITHDRAWAL' 
                                    ? 'bg-white text-rose-600 shadow-xl shadow-rose-500/10' 
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <ArrowDownCircle className={`w-4 h-4 ${adjustmentType === 'WITHDRAWAL' ? 'animate-bounce' : ''}`} />
                                WITHDRAWAL
                            </button>
                        </div>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (KES)</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 group-focus-within:text-cyan-500 transition-colors">KES</div>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full pl-14 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-lg font-black focus:outline-none focus:border-cyan-500 focus:bg-white transition-all outline-none"
                                required
                            />
                        </div>
                    </div>

                    {/* M-Pesa Reference */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">M-Pesa Reference Number</label>
                            <span className="text-[9px] font-black bg-rose-50 text-rose-500 px-2 py-0.5 rounded border border-rose-100 uppercase">Mandatory</span>
                        </div>
                        <input
                            type="text"
                            value={reference}
                            onChange={(e) => setReference(e.target.value.toUpperCase())}
                            placeholder="e.g. SCN51ABC67"
                            className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black focus:outline-none focus:border-cyan-500 focus:bg-white transition-all outline-none tracking-widest"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Audit Description</label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Why is this manual adjustment being made?"
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-cyan-500 focus:bg-white transition-all outline-none resize-none min-h-[100px]"
                            required
                        />
                    </div>

                    {/* Submit Section */}
                    <div className="pt-4 flex gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1 py-7 rounded-2xl font-black text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all font-sans uppercase tracking-[0.2em] text-[10px]"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!isValid || isSubmitting}
                            className={`flex-[2] py-7 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl transition-all ${
                                !isValid || isSubmitting
                                ? 'bg-slate-200 text-slate-400'
                                : 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-cyan-500/20 hover:shadow-cyan-500/40 transform hover:-translate-y-0.5'
                            }`}
                        >
                            {isSubmitting ? 'Processing...' : (
                                <span className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Confirm Adjustment
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
