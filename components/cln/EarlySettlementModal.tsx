'use client'

import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogContent, DialogHeader, 
    DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Money } from '@/components/Money';
import { 
    AlertCircleIcon, Loader2Icon, 
    ArrowRightIcon, ShieldCheckIcon,
    TrendingUpIcon, WalletIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { getEarlySettlementPreview, submitEarlySettlementRequest } from '@/app/actions/cln-actions';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

interface EarlySettlementModalProps {
    isOpen: boolean;
    onClose: () => void;
    note: {
        id: string;
        title: string;
        referenceNo: string;
    };
}

export function EarlySettlementModal({ isOpen, onClose, note }: EarlySettlementModalProps) {
    const [preview, setPreview] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchPreview();
        }
    }, [isOpen]);

    const fetchPreview = async () => {
        setIsLoading(true);
        try {
            const result = await getEarlySettlementPreview(note.id);
            if (result.success) {
                setPreview(result.data);
            } else {
                toast.error(result.message);
                onClose();
            }
        } catch (error) {
            toast.error("Failed to calculate settlement");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!isConfirmed) return;

        setIsSubmitting(true);
        try {
            const result = await submitEarlySettlementRequest({
                noteId: note.id,
                idempotencyKey: `SETTLE_${note.id}_${uuidv4()}`
            });

            if (result.success) {
                toast.success("Settlement request submitted successfully!");
                onClose();
            } else {
                toast.error(result.message || "Failed to submit settlement");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white border-none rounded-[32px] shadow-2xl">
                <div className="flex flex-col">
                    {/* Header */}
                    <DialogHeader className="p-8 bg-rose-600 text-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <DialogTitle className="text-2xl font-black tracking-tight uppercase">Early Termination</DialogTitle>
                                <DialogDescription className="text-rose-100 font-bold uppercase text-[10px] tracking-widest mt-1">
                                    Full Debt Settlement • {note.referenceNo}
                                </DialogDescription>
                            </div>
                            <div className="p-3 bg-white/20 rounded-2xl border border-white/20">
                                <ShieldCheckIcon className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-8 space-y-8">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-4">
                                <Loader2Icon className="w-8 h-8 text-rose-600 animate-spin" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculating Remaining Principal...</p>
                            </div>
                        ) : preview ? (
                            <div className="space-y-6">
                                {/* Summary Card */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">Remaining Principal</p>
                                        <div className="text-xl font-black text-[#0F172A]"><Money amount={preview.remainingPrincipal} /></div>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">Accrued Interest</p>
                                        <div className="text-xl font-black text-emerald-600"><Money amount={preview.interestToDate} /></div>
                                    </div>
                                </div>

                                {/* Total Warning Card */}
                                <div className={cn(
                                    "p-6 rounded-[24px] border border-dashed",
                                    preview.isSufficient ? "bg-indigo-50 border-indigo-200" : "bg-rose-50 border-rose-200"
                                )}>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("p-2 rounded-xl", preview.isSufficient ? "bg-indigo-500/10" : "bg-rose-500/10")}>
                                                <WalletIcon className={cn("w-5 h-5", preview.isSufficient ? "text-indigo-600" : "text-rose-600")} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-[#0F172A] uppercase tracking-tight">Lump Sum Settlement</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">Settles all {preview.unpaidSchedules} remaining cycles</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Money amount={preview.totalAmount} className="text-2xl font-black tracking-tighter text-[#0F172A]" />
                                        </div>
                                    </div>
                                </div>

                                {!preview.isSufficient && (
                                    <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                                        <AlertCircleIcon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                        <p className="text-[10px] font-bold text-rose-700 leading-relaxed">
                                            Insufficient funds in your wallet to cover the full settlement of <span className="font-black"><Money amount={preview.totalAmount} /></span>. Please top up your wallet to proceed.
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-4">
                                     <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200">
                                        <Checkbox 
                                            id="confirm-settlement" 
                                            checked={isConfirmed}
                                            onCheckedChange={(val) => setIsConfirmed(!!val)}
                                            disabled={!preview.isSufficient}
                                            className="mt-1 w-5 h-5 rounded-lg border-2 border-slate-300"
                                        />
                                        <label htmlFor="confirm-settlement" className="text-xs font-bold text-slate-600 leading-relaxed cursor-pointer select-none">
                                            I understand that settling this note early will collapse all remaining payment cycles into this single lump sum and mark the investment as <span className="text-[#0F172A] font-black uppercase">Matured & Settled</span> upon admin approval.
                                        </label>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100 sm:flex-row gap-4">
                        <Button 
                            variant="ghost" 
                            onClick={onClose}
                            className="flex-1 h-14 rounded-[20px] text-slate-400 font-black uppercase text-xs tracking-widest"
                        >
                            Back
                        </Button>
                        <Button 
                            disabled={!isConfirmed || !preview?.isSufficient || isSubmitting}
                            onClick={handleSubmit}
                            className="flex-[2] h-14 rounded-[20px] bg-rose-600 hover:bg-rose-700 text-white font-black text-sm tracking-widest active:scale-95 transition-all shadow-xl shadow-rose-900/10 group"
                        >
                            {isSubmitting ? <Loader2Icon className="w-5 h-5 animate-spin" /> : (
                                <span className="flex items-center gap-3">
                                    Initiate Full Repayment <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
