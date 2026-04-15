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
    ClockIcon, CheckCircle2Icon, AlertCircleIcon, 
    Loader2Icon, ArrowRightIcon, WalletIcon 
} from 'lucide-react';
import { toast } from 'sonner';
import { getDisbursementPreview, submitReturnsForApproval } from '@/app/actions/cln-actions';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

interface PostReturnsModalProps {
    isOpen: boolean;
    onClose: () => void;
    note: {
        id: string;
        title: string;
        referenceNo: string;
        paymentSchedule: any[];
    };
}

export function PostReturnsModal({ isOpen, onClose, note }: PostReturnsModalProps) {
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [preview, setPreview] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);

    // Initial event selection
    useEffect(() => {
        if (isOpen && note.paymentSchedule) {
            const now = new Date();
            // 1. Try to find the first due event
            let initialEvent = note.paymentSchedule.find(evt => 
                (evt.status === 'UPCOMING' || evt.status === 'SHORTFALL') && 
                new Date(evt.dueDate) <= now
            );
            
            // 2. If nothing is due, pick the first actionable one (early payment)
            if (!initialEvent) {
                initialEvent = note.paymentSchedule.find(evt => 
                    evt.status === 'UPCOMING' || evt.status === 'SHORTFALL'
                );
            }
            
            if (initialEvent) setSelectedEventId(initialEvent.id);
        }
    }, [isOpen, note.paymentSchedule]);

    // Fetch preview when selection changes
    useEffect(() => {
        if (selectedEventId) {
            fetchPreview(selectedEventId);
        }
    }, [selectedEventId]);

    const fetchPreview = async (id: string) => {
        setIsLoading(true);
        try {
            const result = await getDisbursementPreview(id);
            if (result.success) {
                setPreview(result.data);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Failed to load breakdown");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedEventId || !isConfirmed) return;

        setIsSubmitting(true);
        try {
            const result = await submitReturnsForApproval({
                scheduleId: selectedEventId,
                idempotencyKey: `POST_RETURNS_${selectedEventId}_${uuidv4()}`
            });

            if (result.success) {
                toast.success("Payment submitted for admin approval!");
                onClose();
            } else {
                toast.error(result.message || "Failed to submit");
                // Refresh preview in case status changed (e.g. to SHORTFALL)
                fetchPreview(selectedEventId);
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedEvent = note.paymentSchedule.find(e => e.id === selectedEventId);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white border-none rounded-[32px] shadow-2xl">
                <div className="flex flex-col h-[85vh]">
                    {/* Header */}
                    <DialogHeader className="p-8 bg-[#0F172A] text-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <DialogTitle className="text-2xl font-black tracking-tight uppercase">Post Returns</DialogTitle>
                                <DialogDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">
                                    {note.title} • {note.referenceNo}
                                </DialogDescription>
                            </div>
                            <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
                                <WalletIcon className="w-6 h-6 text-indigo-400" />
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                        {/* Section 1: Event Selector */}
                        <section className="space-y-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">1. Select Payment Event</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {note.paymentSchedule.map((evt: any) => {
                                    const isDue = new Date(evt.dueDate) <= new Date();
                                    const isActionable = evt.status === 'UPCOMING' || evt.status === 'SHORTFALL';
                                    const isPending = evt.status === 'AWAITING_CONFIRMATION';
                                    const isSelected = selectedEventId === evt.id;
                                    const canSelect = evt.status !== 'PAID';

                                    return (
                                        <button
                                            key={evt.id}
                                            disabled={!canSelect}
                                            onClick={() => setSelectedEventId(evt.id)}
                                            className={cn(
                                                "flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden",
                                                isSelected ? "border-indigo-600 bg-indigo-50/50" : "border-slate-100 hover:border-slate-200 bg-white shadow-sm",
                                                !canSelect && "opacity-50 grayscale cursor-not-allowed border-dashed",
                                                !isDue && isActionable && "border-amber-100 bg-amber-50/20"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black",
                                                    isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                                                )}>
                                                    {evt.eventNumber}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-[#0F172A] uppercase leading-none">{evt.periodLabel}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Due {new Date(evt.dueDate).toLocaleDateString()}</p>
                                                        {!isDue && isActionable && (
                                                            <span className="text-[7px] font-black text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">Early Payout</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {evt.status === 'PAID' && <CheckCircle2Icon className="w-4 h-4 text-emerald-500" />}
                                                {evt.status === 'UPCOMING' && isDue && <ClockIcon className="w-4 h-4 text-amber-500" />}
                                                {isPending && <Loader2Icon className="w-4 h-4 text-indigo-500 animate-spin" />}
                                                {evt.status === 'SHORTFALL' && <AlertCircleIcon className="w-4 h-4 text-rose-500" />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Section 2: Breakdown */}
                        {selectedEventId && (
                            <section className="space-y-6">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">2. Disbursement Breakdown</h3>
                                
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                                        <Loader2Icon className="w-8 h-8 text-indigo-600 animate-spin" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculating Allocations...</p>
                                    </div>
                                ) : preview && (
                                    <div className="space-y-6">
                                        {/* Wallet Sufficiency Card */}
                                        <div className={cn(
                                            "p-6 rounded-[24px] border transition-all",
                                            preview.isSufficient ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"
                                        )}>
                                            <div className="flex justify-between items-center mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("p-2 rounded-xl", preview.isSufficient ? "bg-emerald-500/10" : "bg-rose-500/10")}>
                                                        {preview.isSufficient ? <CheckCircle2Icon className="w-5 h-5 text-emerald-600" /> : <AlertCircleIcon className="w-5 h-5 text-rose-600" />}
                                                    </div>
                                                    <p className="text-xs font-black text-[#0F172A] uppercase tracking-tight">Floater Wallet Integrity</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Current Balance</p>
                                                    <Money amount={preview.floaterBalance} className="font-black text-sm" />
                                                </div>
                                            </div>
                                            <div className="flex justify-between p-4 bg-white/50 rounded-xl border border-white">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase">Payout Requirement</p>
                                                    <Money amount={preview.totalAmount} className="font-black text-[#0F172A]" />
                                                </div>
                                                <div className="text-right space-y-1">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase">{preview.isSufficient ? "Projected Balance" : "Shortfall"}</p>
                                                    <span className={cn("font-black", preview.isSufficient ? "text-emerald-600" : "text-rose-600")}>
                                                        {preview.isSufficient ? <Money amount={preview.floaterBalance - preview.totalAmount} /> : <Money amount={preview.shortfall} />}
                                                    </span>
                                                </div>
                                            </div>
                                            {!preview.isSufficient && (
                                                <p className="text-[10px] font-bold text-rose-700 mt-3 px-1 leading-relaxed">
                                                    ⚠️ You cannot post returns until your wallet holds the full amount. Please deposit KES {preview.shortfall.toLocaleString()} to continue.
                                                </p>
                                            )}
                                        </div>

                                        {/* Breakdown Table */}
                                        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                                            <div className="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-12 text-[9px] font-black text-slate-400 uppercase tracking-widest px-6">
                                                <div className="col-span-4">Subscriber</div>
                                                <div className="col-span-2 text-center">Share</div>
                                                <div className="col-span-2 text-right">Principal</div>
                                                <div className="col-span-2 text-right">Interest</div>
                                                <div className="col-span-2 text-right text-indigo-600">Total</div>
                                            </div>
                                            <div className="max-h-[300px] overflow-y-auto">
                                                {preview.allocations.map((alloc: any, i: number) => (
                                                    <div key={i} className="grid grid-cols-12 items-center p-4 border-b border-slate-50 hover:bg-slate-50/50 transition-colors px-6">
                                                        <div className="col-span-4">
                                                            <p className="text-[11px] font-black text-[#0F172A] uppercase truncate">{alloc.subscriberName}</p>
                                                            {alloc.isResidualRecipient && <span className="text-[8px] font-black text-indigo-500 uppercase tracking-tighter bg-indigo-50 px-1 rounded">+ Residual Adjustment</span>}
                                                        </div>
                                                        <div className="col-span-2 text-center text-[10px] font-bold text-slate-500">{alloc.sharePct.toFixed(1)}%</div>
                                                        <div className="col-span-2 text-right text-[10px] font-bold"><Money amount={alloc.principal} /></div>
                                                        <div className="col-span-2 text-right text-[10px] font-bold"><Money amount={alloc.interest} /></div>
                                                        <div className="col-span-2 text-right font-black text-[11px] text-[#4F46E5]"><Money amount={alloc.total} /></div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="p-4 bg-indigo-600 text-white grid grid-cols-12 px-6">
                                                <div className="col-span-10 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                                    Total Disbursement
                                                </div>
                                                <div className="col-span-2 text-right text-sm font-black tracking-tighter">
                                                    <Money amount={preview.totalAmount} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </section>
                        )}
                    </div>

                    {/* Footer / Section 3 */}
                    <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100 flex-col sm:flex-col gap-6">
                        <div className={cn(
                            "flex items-start gap-4 p-5 rounded-2xl border transition-all",
                            selectedEvent?.status === 'AWAITING_CONFIRMATION' ? "bg-indigo-50/50 border-indigo-100" : "bg-white border-slate-200"
                        )}>
                            <Checkbox 
                                id="confirm" 
                                checked={isConfirmed}
                                onCheckedChange={(val) => setIsConfirmed(!!val)}
                                disabled={!preview?.isSufficient || selectedEvent?.status === 'AWAITING_CONFIRMATION'}
                                className="mt-1 w-5 h-5 rounded-lg border-2"
                            />
                            <label htmlFor="confirm" className="text-xs font-bold text-slate-600 leading-relaxed cursor-pointer select-none">
                                {selectedEvent?.status === 'AWAITING_CONFIRMATION' ? (
                                    <span className="text-indigo-600">This payment is already <span className="font-black uppercase">Pending Approval</span> from the system administrator.</span>
                                ) : (
                                    <>
                                        I confirm the above disbursement amounts are correct and I authorise <span className="text-[#0F172A] font-black"><Money amount={preview?.totalAmount || 0} /></span> to be deducted from my wallet upon admin approval.
                                    </>
                                )}
                            </label>
                        </div>
                        
                        <div className="flex gap-4 w-full">
                            <Button 
                                variant="ghost" 
                                onClick={onClose}
                                className="flex-1 h-16 rounded-[24px] text-slate-400 font-black uppercase text-xs tracking-widest"
                            >
                                Cancel
                            </Button>
                            <Button 
                                disabled={!isConfirmed || !preview?.isSufficient || isSubmitting || selectedEvent?.status === 'AWAITING_CONFIRMATION'}
                                onClick={handleSubmit}
                                className={cn(
                                    "flex-[2] h-16 rounded-[24px] font-black text-sm tracking-widest active:scale-95 transition-all shadow-xl shadow-slate-900/20 group",
                                    selectedEvent?.status === 'AWAITING_CONFIRMATION' ? "bg-slate-300 cursor-not-allowed" : "bg-[#0F172A] hover:bg-[#1E293B] text-white"
                                )}
                            >
                                {isSubmitting ? <Loader2Icon className="w-5 h-5 animate-spin" /> : (
                                    <span className="flex items-center gap-3">
                                        {selectedEvent?.status === 'AWAITING_CONFIRMATION' ? 'Awaiting Approval' : 'Send for Approval'} 
                                        {selectedEvent?.status !== 'AWAITING_CONFIRMATION' && <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                                    </span>
                                )}
                            </Button>
                        </div>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
