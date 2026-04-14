'use client'

import React, { useState } from 'react';
import { LoanNote, LoanNoteSubscription, User, LoanNotePaymentSchedule } from '@/lib/types';
import { Money } from '@/components/Money';
import { NoteStatusBadge } from './NoteStatusBadge';
import { 
    CalendarIcon, TrendingUpIcon, 
    ArrowLeft, UsersIcon, ShieldCheckIcon,
    HistoryIcon, DollarSignIcon, ClockIcon,
    InfoIcon, Loader2Icon, CheckCircle2Icon,
    BanIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { handleWorkflowTransition } from '@/app/actions/approval-workflow';
import { approveLoanNote, rejectLoanNote, subscribeToLoanNote, releaseEscrow, executeScheduledPaymentBatch } from '@/app/actions/cln-actions';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { PostReturnsModal } from './PostReturnsModal';
import { EarlySettlementModal } from './EarlySettlementModal';
import { useSearchParams } from 'next/navigation';
import { CalculatorIcon } from 'lucide-react';

interface NoteDetailViewProps {
    note: LoanNote & { 
        floater: User;
        subscriptions: (LoanNoteSubscription & { user: User })[];
        paymentSchedule: LoanNotePaymentSchedule[];
        auditLogs: any[];
    };
    userId: string;
    userRole: string;
    walletBalance: number;
}

export function NoteDetailView({ note, userId, userRole, walletBalance }: NoteDetailViewProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [subscribeAmount, setSubscribeAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPostReturnsOpen, setIsPostReturnsOpen] = useState(searchParams.get('action') === 'post-returns');
    const [isEarlySettlementOpen, setIsEarlySettlementOpen] = useState(false);

    const progress = (Number(note.subscribedAmount) / Number(note.totalAmount)) * 100;
    const isFloater = note.floaterId === userId;
    const mySubscription = note.subscriptions?.find(s => s.subscriberId === userId);

    const handleSubscribe = async () => {
        const amount = Number(subscribeAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await subscribeToLoanNote({
                loanNoteId: note.id,
                amount,
                idempotencyKey: uuidv4()
            });

            if (result.success) {
                toast.success("Subscription successful!");
                setSubscribeAmount('');
                router.refresh();
            } else {
                toast.error(result.message || "Subscription failed");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleWorkflowAction = async (action: 'SEND' | 'CANCEL') => {
        setIsSubmitting(true);
        try {
            const result = await handleWorkflowTransition('LOAN_NOTE' as any, note.id, action);
            if (result.success) {
                toast.success(`Note ${action === 'SEND' ? 'submitted for review' : 'recalled to draft'}`);
                router.refresh();
            } else {
                toast.error(result.error || "Workflow action failed");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAdminApproval = async (approve: boolean) => {
        setIsSubmitting(true);
        try {
            const result = approve 
                ? await approveLoanNote(note.id, "System Review Approved")
                : await rejectLoanNote(note.id, "Does not meet market criteria");
            
            if (result.success) {
                toast.success(`Note ${approve ? 'Approved' : 'Rejected'}`);
                router.refresh();
            } else {
                toast.error(result.message || "Action failed");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReleaseEscrow = async () => {
        setIsSubmitting(true);
        try {
            const result = await releaseEscrow(note.id, "Escrow released by Admin");
            if (result.success) {
                toast.success("Escrow released and note activated!");
                router.refresh();
            } else {
                toast.error(result.message || "Failed to release escrow");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExecutePayout = async (scheduleId: string) => {
        if (!confirm("Are you sure you want to execute this payout immediately? Funds will be debited from the issuer's wallet and distributed to all subscribers.")) return;
        
        setIsSubmitting(true);
        try {
            const result = await executeScheduledPaymentBatch(scheduleId);
            if (result.success) {
                toast.success("Payout executed successfully!");
                router.refresh();
            } else {
                toast.error(result.message || "Payout failed");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 pb-20 bg-[#F0F2F5] min-h-screen -mx-4 px-4 pt-4">
            <div className="flex items-center gap-4">
                <Button 
                    variant="ghost" 
                    onClick={() => router.back()}
                    className="rounded-full w-12 h-12 p-0 text-slate-500 hover:text-indigo-600 border border-slate-200 bg-white shadow-sm transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase leading-none">{note.title}</h1>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">{note.referenceNo}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
                <div className="lg:col-span-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: 'Target Amount', value: note.totalAmount, icon: <DollarSignIcon className="text-indigo-600" />, bg: 'bg-indigo-50' },
                            { label: 'Annual ROI', value: note.interestRate + '%', icon: <TrendingUpIcon className="text-emerald-600" />, bg: 'bg-emerald-50' },
                            { label: 'Tenor / Duration', value: `${note.tenorValue} ${note.tenorUnit}`, icon: <ClockIcon className="text-indigo-600" />, bg: 'bg-indigo-50' },
                        ].map((stat, i) => (
                            <div key={i} className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                                <div className="flex items-center gap-4">
                                    <div className={cn("p-3 rounded-2xl border", stat.bg, "border-white/50")}>{stat.icon}</div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                                        <div className="text-lg font-black text-[#0F172A] tracking-tight">
                                            {typeof stat.value === 'string' && stat.value.includes('%') ? stat.value : <Money amount={stat.value as any} />}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="bg-slate-200/50 p-1.5 rounded-2xl w-fit mb-8 border border-slate-200">
                            {['overview', 'schedule', 'subscribers'].map(t => (
                                <TabsTrigger 
                                    key={t}
                                    value={t} 
                                    className="rounded-xl px-8 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 data-[state=active]:bg-white data-[state=active]:text-[#4F46E5] data-[state=active]:shadow-sm transition-all"
                                >
                                    {t}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <TabsContent value="overview" className="space-y-8 outline-none">
                            <div className="p-8 md:p-10 bg-white border border-slate-200 rounded-[32px] shadow-sm">
                                <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
                                    <div className="p-2 bg-indigo-50 rounded-lg">
                                        <InfoIcon className="w-5 h-5 text-[#4F46E5]" />
                                    </div>
                                    <h3 className="text-lg font-black text-[#0F172A] uppercase tracking-tighter">Note Strategy & Justification</h3>
                                </div>
                                <p className="text-slate-700 font-medium leading-relaxed text-sm md:text-base whitespace-pre-wrap">{note.purpose}</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 p-8 bg-slate-50 rounded-3xl border border-slate-100">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">Primary Repayment Source</p>
                                        <p className="text-[#0F172A] font-black text-sm">{note.repaymentSource}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">Yield Disbursement Mode</p>
                                        <p className="text-[#0F172A] font-black text-sm capitalize">{note.repaymentMode.replace(/_/g, ' ')}</p>
                                    </div>
                                    {note.collateral && (
                                        <div className="col-span-1 md:col-span-2 pt-4 border-t border-slate-200 mt-2">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">Collateral Reference</p>
                                            <p className="text-[#0F172A] font-black text-sm">{note.collateral}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="schedule" className="outline-none">
                            <div className="p-8 md:p-10 bg-white border border-slate-200 rounded-[32px] shadow-sm">
                                <div className="space-y-4">
                                    {note.paymentSchedule?.length > 0 ? note.paymentSchedule.map((evt, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-5 rounded-2xl bg-slate-50 border border-slate-200 group hover:border-[#4F46E5] transition-all">
                                            <div className="flex gap-5 items-center">
                                                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[11px] font-black text-[#4F46E5] shadow-sm group-hover:bg-[#4F46E5] group-hover:text-white transition-all">
                                                    {evt.eventNumber}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-[#0F172A] uppercase tracking-tight">{evt.periodLabel}</p>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(evt.dueDate).toLocaleDateString()}</p>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                        <span className={cn(
                                                            "text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md",
                                                            evt.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                                                            evt.status === 'AWAITING_CONFIRMATION' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                                                            evt.status === 'SHORTFALL' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                                            'bg-amber-50 text-amber-600 border border-amber-100'
                                                        )}>
                                                            {evt.status.replace(/_/g, ' ')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <div className="text-[#0F172A] text-base font-black">
                                                        <Money amount={evt.groupAmount as any} />
                                                    </div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Payout Volume</p>
                                                </div>

                                                {userRole === 'SYSTEM_ADMIN' && evt.status !== 'PAID' && (
                                                    <Button 
                                                        size="sm"
                                                        disabled={isSubmitting}
                                                        onClick={() => handleExecutePayout(evt.id)}
                                                        className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-900/20"
                                                    >
                                                        {isSubmitting ? <Loader2Icon className="animate-spin w-4 h-4" /> : "Execute Payout"}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                            <ClockIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                            <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Schedule generation pending activation</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="subscribers" className="outline-none">
                            <div className="p-8 md:p-10 bg-white border border-slate-200 rounded-[32px] shadow-sm">
                                <div className="space-y-4">
                                    {note.subscriptions?.map((sub, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                                            <div className="flex gap-5 items-center">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-[#4F46E5] border border-indigo-100 shadow-inner font-black">
                                                    {sub.user?.name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-[#0F172A] uppercase tracking-tight leading-none mb-1">{sub.user?.name || 'Anonymous'}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(sub.subscribedAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[#4F46E5] text-base font-black">
                                                    <Money amount={sub.amount as any} />
                                                </div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Position Size</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!note.subscriptions || note.subscriptions.length === 0) && (
                                        <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                            <UsersIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                            <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">Market awaiting first subscribers</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    {(isFloater || userRole === 'SYSTEM_ADMIN') && (
                        <div className="p-8 bg-white border-2 border-indigo-100 rounded-[40px] shadow-sm space-y-6">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                <ShieldCheckIcon className="w-5 h-5 text-indigo-600" />
                                <p className="text-[11px] font-black text-[#0F172A] uppercase tracking-widest">Governance Terminal</p>
                            </div>

                            {(note.status as any) === 'DRAFT' && isFloater && (
                                <div className="space-y-4">
                                    <p className="text-xs font-bold text-slate-500 leading-relaxed">This note is currently in **DRAFT**. Submit it for review to list it on the market.</p>
                                    <Button 
                                        onClick={() => handleWorkflowAction('SEND')}
                                        disabled={isSubmitting}
                                        className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-widest"
                                    >
                                        {isSubmitting ? <Loader2Icon className="animate-spin" /> : "Submit for Approval"}
                                    </Button>
                                </div>
                            )}

                            {note.status === 'PENDING_APPROVAL' && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Status: Under Review</p>
                                        <p className="text-xs font-bold text-amber-800 leading-relaxed">This note is locked and awaiting administrative clearance.</p>
                                    </div>
                                    
                                    {userRole === 'SYSTEM_ADMIN' && (
                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                            <Button 
                                                onClick={() => handleAdminApproval(true)}
                                                disabled={isSubmitting}
                                                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 h-12 font-bold text-xs uppercase"
                                            >
                                                Approve
                                            </Button>
                                            <Button 
                                                onClick={() => handleAdminApproval(false)}
                                                disabled={isSubmitting}
                                                variant="outline"
                                                className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 h-12 font-bold text-xs uppercase"
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    )}

                                    {isFloater && (
                                        <Button 
                                            variant="ghost"
                                            onClick={() => handleWorkflowAction('CANCEL')}
                                            disabled={isSubmitting}
                                            className="w-full text-slate-400 hover:text-rose-600 text-[10px] font-black uppercase"
                                        >
                                            Recall to Draft
                                        </Button>
                                    )}
                                </div>
                            )}

                            {note.status === 'OPEN' && userRole === 'SYSTEM_ADMIN' && (
                                <div className="pt-4 border-t border-slate-100 space-y-4">
                                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Escrow Management</p>
                                        <p className="text-xs font-bold text-indigo-800 leading-relaxed">
                                            Release funds to the floater and activate the repayment schedule.
                                        </p>
                                    </div>
                                    <Button 
                                        onClick={handleReleaseEscrow}
                                        disabled={isSubmitting || Number(note.subscribedAmount) <= 0}
                                        className="w-full h-12 rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-500/20"
                                    >
                                        {isSubmitting ? <Loader2Icon className="animate-spin" /> : "Release Escrow & Activate"}
                                    </Button>
                                    {Number(note.subscribedAmount) <= 0 && (
                                        <p className="text-[9px] text-center font-bold text-rose-500 uppercase tracking-tight">Cannot activate note with 0 subscriptions</p>
                                    )}
                                </div>
                            )}

                            {note.status === 'REJECTED' && (
                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Status: Declined</p>
                                    <p className="text-xs font-bold text-rose-800">{note.adminReviewComment || "Note did not meet criteria."}</p>
                                </div>
                            )}

                            {note.status === 'ACTIVE' && isFloater && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CheckCircle2Icon className="w-4 h-4 text-emerald-600" />
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active & Operational</p>
                                        </div>
                                        <p className="text-xs font-bold text-emerald-800 leading-relaxed">
                                            You can now post returns for upcoming payment cycles.
                                        </p>
                                    </div>
                                    <Button 
                                        onClick={() => setIsPostReturnsOpen(true)}
                                        className="w-full h-14 rounded-2xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-black text-sm uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-sky-500/10"
                                    >
                                        <CalculatorIcon className="w-5 h-5" />
                                        Post Returns
                                    </Button>

                                    <Button 
                                        variant="outline"
                                        onClick={() => setIsEarlySettlementOpen(true)}
                                        className="w-full h-12 rounded-2xl border-rose-200 text-rose-600 hover:bg-rose-50 font-black text-[10px] uppercase tracking-widest flex items-center gap-3"
                                    >
                                        <BanIcon className="w-4 h-4" />
                                        Settle Note Early
                                    </Button>
                                </div>
                            )}

                            {note.status === 'ACTIVE' && userRole === 'SYSTEM_ADMIN' && !isFloater && (
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Management View</p>
                                    <p className="text-xs font-bold text-slate-700 leading-relaxed">
                                        Monitoring active note performance and payout schedules.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="p-8 md:p-10 bg-[#312E81] rounded-[40px] shadow-2xl sticky top-8 overflow-hidden group">
                        <div className="absolute -right-20 -top-20 w-40 h-40 bg-indigo-400/10 blur-[80px]" />
                        
                        <div className="relative z-10 space-y-10">
                            <div className="flex justify-between items-start pt-2">
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-black text-indigo-300/60 uppercase tracking-widest leading-none">Live Status</p>
                                    <NoteStatusBadge status={note.status} />
                                </div>
                                <div className="text-right space-y-1.5">
                                    <p className="text-[10px] font-black text-indigo-300/60 uppercase tracking-widest leading-none">Security Rating</p>
                                    <span className="text-[11px] font-black text-emerald-400 border border-emerald-400/30 bg-emerald-400/5 px-2 py-0.5 rounded-lg">AA+ PRIME</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between text-[11px] font-black tracking-widest text-indigo-200 uppercase">
                                    <span>Allocation Progress</span>
                                    <span className="text-white">{progress.toFixed(1)}%</span>
                                </div>
                                <div className="h-2.5 bg-indigo-950/40 rounded-full border border-white/5 overflow-hidden p-0.5">
                                    <Progress value={progress} className="h-full bg-gradient-to-r from-indigo-500 to-indigo-300 rounded-full" />
                                </div>
                                <div className="flex justify-between items-end pt-2">
                                    <div className="text-white text-2xl font-black tracking-tighter">
                                        <Money amount={note.subscribedAmount as any} />
                                    </div>
                                    <div className="text-indigo-300/50 text-[10px] font-black tracking-widest pb-1 border-b border-indigo-300/20">
                                        TARGET <Money amount={note.totalAmount as any} />
                                    </div>
                                </div>
                            </div>

                            {note.status === 'OPEN' && (
                                <div className="space-y-6 pt-6 border-t border-white/10">
                                    <div className="space-y-3">
                                        <p className="text-[11px] font-black text-indigo-300 uppercase tracking-widest text-center">Deployment Terminal</p>
                                        <div className="relative group/input">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-400 font-black text-sm group-focus-within/input:text-white transition-colors">KES</span>
                                            <Input 
                                                type="number" 
                                                placeholder="Amount" 
                                                value={subscribeAmount}
                                                onChange={(e) => setSubscribeAmount(e.target.value)}
                                                max={walletBalance}
                                                className="bg-indigo-950/40 border-indigo-800/50 rounded-2xl h-16 pl-14 text-white font-black text-xl focus:ring-white/10 transition-all placeholder:text-indigo-400/30"
                                            />
                                        </div>
                                        <div className="flex justify-between px-2">
                                            <p className="text-[9px] font-black text-indigo-300/60 uppercase tracking-widest">Available to invest</p>
                                            <p className="text-[9px] font-black text-white uppercase tracking-widest"><Money amount={walletBalance} /></p>
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={handleSubscribe}
                                        disabled={isSubmitting}
                                        className="w-full h-16 rounded-[24px] bg-white hover:bg-indigo-50 text-[#312E81] font-black text-lg tracking-tight hover:scale-[1.02] transition-all shadow-2xl active:scale-95 group/btn"
                                    >
                                        {isSubmitting ? <Loader2Icon className="w-6 h-6 animate-spin" /> : (
                                            <span className="flex items-center gap-3">
                                                SECURE PORTFOLIO <ArrowLeft className="w-5 h-5 rotate-180 group-hover/btn:translate-x-1 transition-transform" />
                                            </span>
                                        )}
                                    </Button>
                                    <div className="flex items-center justify-center gap-2 opacity-40">
                                        <ShieldCheckIcon className="w-4 h-4 text-indigo-200" />
                                        <p className="text-[9px] text-white font-black uppercase tracking-tight">Regulated Escrow Custody</p>
                                    </div>
                                </div>
                            )}

                            {isFloater && (
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-center space-y-3 mt-4">
                                    <ShieldCheckIcon className="w-6 h-6 text-emerald-400 mx-auto" />
                                    <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest">Issuer Oversight Active</p>
                                    {note.status !== 'OPEN' && (
                                        <p className="text-[10px] font-bold text-indigo-200/60 leading-relaxed px-2">You are the fund manager. Monitor deployments and revenue distributions from this terminal.</p>
                                    )}
                                </div>
                            )}

                            {mySubscription && (
                                <div className="p-8 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 text-center space-y-4">
                                    <CheckCircle2Icon className="w-10 h-10 text-emerald-500 mx-auto" />
                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Portfolio Exposure</p>
                                    <div className="text-2xl font-black text-white tracking-tighter">
                                        <Money amount={mySubscription.amount as any} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-8 bg-white border border-slate-200 rounded-[40px] shadow-sm space-y-8">
                         <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <HistoryIcon className="w-5 h-5 text-indigo-600" />
                            <p className="text-[11px] font-black text-[#0F172A] uppercase tracking-widest">Market Intelligence</p>
                        </div>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Issuance Date</span>
                                <span className="text-sm font-black text-[#0F172A]">{new Date(note.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Global Interest</span>
                                <div className="text-right">
                                    <div className="text-sm font-black text-[#0F172A] uppercase leading-none">{note.subscriptions?.length || 0} Investors</div>
                                    <p className="text-[9px] font-black text-emerald-600 uppercase mt-1">Prime Verified</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <PostReturnsModal 
                isOpen={isPostReturnsOpen}
                onClose={() => setIsPostReturnsOpen(false)}
                note={note as any}
            />

            <EarlySettlementModal 
                isOpen={isEarlySettlementOpen}
                onClose={() => setIsEarlySettlementOpen(false)}
                note={note as any}
            />
        </div>
    );
}
