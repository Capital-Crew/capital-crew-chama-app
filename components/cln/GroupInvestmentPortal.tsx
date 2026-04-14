'use client'

import React, { useState } from 'react';
import { Group, GroupWallet, GroupRiskConfig, GroupInvestmentProposal, LoanNote, GroupInvestmentProposalVote, User } from '@/lib/types';
import { Money } from '@/components/Money';
import { Button } from '@/components/ui/button';
import { 
    ShieldCheckIcon, VoteIcon, AlertCircleIcon, 
    TrendingUpIcon, WalletIcon, CheckCircle2Icon,
    XCircleIcon, UsersIcon, HistoryIcon,
    InfoIcon, Loader2Icon
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { castProposalVote } from '@/app/actions/cln-governance-actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface GroupInvestmentPortalProps {
    group: Group & {
        wallet: GroupWallet;
        riskConfig: GroupRiskConfig;
        investmentProposals: (GroupInvestmentProposal & { 
            loanNote: LoanNote;
            votes: GroupInvestmentProposalVote[];
        })[];
    };
    userId: string;
}

export function GroupInvestmentPortal({ group, userId }: GroupInvestmentPortalProps) {
    const router = useRouter();
    const [comment, setComment] = useState('');
    const [isVoting, setIsVoting] = useState(false);

    const pendingProposals = group.investmentProposals.filter(p => p.status === 'PENDING_COMMITTEE_APPROVAL');

    const handleVote = async (proposalId: string, vote: 'APPROVE' | 'REJECT') => {
        setIsVoting(true);
        try {
            const result = await castProposalVote({
                proposalId,
                vote,
                comment
            });

            if (result.success) {
                toast.success(`Vote cast successfully: ${vote}`);
                setComment('');
                router.refresh();
            } else {
                toast.error(result.message || "Failed to cast vote");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsVoting(false);
        }
    };

    return (
        <div className="space-y-10 pb-20 bg-[#F0F2F5] min-h-screen -mx-4 px-4 pt-10">
            {/* Group Treasury Summary */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase mb-1">
                        TREASURY <span className="text-indigo-600">GOVERNANCE</span>
                    </h1>
                    <p className="text-[#64748B] font-bold text-[10px] uppercase tracking-[0.3em] font-black">{group.name} • Strategic Investment Panel</p>
                </div>
                <div className="px-8 py-5 border border-indigo-100 bg-white rounded-3xl shadow-sm flex items-center gap-8">
                    <div>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-2">Available Assets</p>
                        <Money amount={group.wallet.balance} className="text-2xl font-black text-[#0F172A]" />
                    </div>
                    <div className="h-10 w-px bg-slate-200" />
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Liquidity Buffer</p>
                        <span className="text-xl font-black text-[#0F172A]">{group.wallet.minReservePct}%</span>
                    </div>
                </div>
            </div>

            {/* Risk Configuration Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {[
                    { label: 'Max Allocation', value: group.riskConfig.maxAllocationPct + '%', icon: <AlertCircleIcon className="text-amber-600" />, bg: 'bg-amber-50', border: 'border-amber-100', desc: 'Of total treasury' },
                    { label: 'Issuer Cap', value: group.riskConfig.maxFloaterExposurePct + '%', icon: <UsersIcon className="text-indigo-600" />, bg: 'bg-indigo-50', border: 'border-indigo-100', desc: 'Per single person' },
                    { label: 'Risk Profile', value: 'CONSERVATIVE', icon: <ShieldCheckIcon className="text-emerald-600" />, bg: 'bg-emerald-50', border: 'border-emerald-100', desc: 'Current group rating' },
                ].map((conf, i) => (
                    <div key={i} className="p-6 md:p-8 bg-white rounded-[32px] border border-slate-200 shadow-sm transition-all hover:shadow-md">
                        <div className="flex justify-between items-start mb-4">
                           <p className="text-[11px] font-black text-[#64748B] uppercase tracking-widest">{conf.label}</p>
                           <div className={cn("p-2.5 rounded-2xl border", conf.bg, conf.border)}>{conf.icon}</div>
                        </div>
                        <h3 className="text-2xl font-black text-[#0F172A] tracking-tighter">{conf.value}</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">{conf.desc}</p>
                    </div>
                ))}
            </div>

            {/* Active Proposals Section */}
            <div className="space-y-8">
                <div className="flex items-center gap-3 px-2">
                    <div className="p-2 bg-indigo-600 rounded-xl">
                        <VoteIcon className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-black text-[#0F172A] uppercase tracking-tighter">Strategic Proposals</h2>
                    <span className="bg-[#4F46E5] text-white px-3 py-1 rounded-full text-[10px] font-black ml-2 shadow-lg shadow-indigo-100">{pendingProposals.length} Items</span>
                </div>

                {pendingProposals.length > 0 ? (
                    <div className="grid gap-8">
                        {pendingProposals.map(proposal => {
                            const hasVoted = proposal.votes.some(v => v.voterId === userId);
                            const approveVotes = proposal.votes.filter(v => v.vote === 'APPROVE').length;
                            const totalNeeded = group.riskConfig.id ? (group as any).committeeMembers?.length : 3;

                            return (
                                <div key={proposal.id} className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden flex flex-col lg:flex-row">
                                    {/* Proposal Content */}
                                    <div className="flex-1 p-8 md:p-12 space-y-8">
                                        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                                            <div>
                                                <h3 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase mb-2">
                                                    {proposal.loanNote.title}
                                                </h3>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">Note Ref: {proposal.loanNote.referenceNo}</span>
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                </div>
                                            </div>
                                            <div className="text-left md:text-right">
                                                <div className="text-3xl font-black text-[#0F172A] tracking-tighter">
                                                    <Money amount={proposal.proposedAmount} />
                                                </div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Requested Commitment</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 py-10 border-y border-slate-100">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Capital Exposure</span>
                                                    <span className="text-base font-black text-[#0F172A] leading-none">{proposal.pctOfTreasury}%</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
                                                    <div 
                                                        className="h-full bg-indigo-600 rounded-full transition-all duration-1000" 
                                                        style={{ width: `${proposal.pctOfTreasury}%` }} 
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Target Yield</span>
                                                    <span className="text-base font-black text-emerald-600 leading-none">{proposal.loanNote.interestRate}% P.A</span>
                                                </div>
                                                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                                                    <TrendingUpIcon className="w-5 h-5 text-emerald-600" />
                                                    <span className="text-xs font-black text-emerald-800 uppercase tracking-tight">Est. Revenue: <Money amount={Number(proposal.proposedAmount) * Number(proposal.loanNote.interestRate) / 100} /></span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200">
                                                <InfoIcon className="w-5 h-5 text-slate-500" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[11px] font-black text-[#0F172A] uppercase tracking-tight leading-none">Decision Requirement</p>
                                                <p className="text-xs text-slate-500 font-bold leading-relaxed">Proposal requires UNANIMOUS approval from the strategic committee member panel ({totalNeeded} votes).</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Governance Terminal */}
                                    <div className="w-full lg:w-[400px] bg-slate-50 p-8 md:p-12 border-l border-slate-200 flex flex-col justify-between">
                                        <div className="space-y-8">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Decision Terminal</p>
                                                <h4 className="text-lg font-black text-[#0F172A] tracking-tighter uppercase">Cast Authority</h4>
                                            </div>

                                            {hasVoted ? (
                                                <div className="py-12 bg-white rounded-[32px] border border-slate-200 text-center shadow-sm">
                                                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                                                        <CheckCircle2Icon className="w-8 h-8 text-emerald-600" />
                                                    </div>
                                                    <p className="text-sm font-black text-[#0F172A] uppercase tracking-tight">Decision Recorded</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Awaiting Outcome</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    <Textarea 
                                                        placeholder="Provide rationale for your decision..." 
                                                        value={comment}
                                                        onChange={(e) => setComment(e.target.value)}
                                                        className="bg-white border-slate-200 rounded-2xl min-h-[140px] text-[#0F172A] font-medium resize-none shadow-inner p-5 focus:ring-indigo-100"
                                                    />
                                                    <div className="grid grid-cols-1 gap-4">
                                                        <Button 
                                                            onClick={() => handleVote(proposal.id, 'APPROVE')}
                                                            disabled={isVoting}
                                                            className="h-16 rounded-[24px] bg-[#0F172A] hover:bg-slate-800 text-white font-black tracking-tight shadow-xl shadow-slate-200 hover:scale-[1.02] transition-all"
                                                        >
                                                            {isVoting ? <Loader2Icon className="animate-spin" /> : "GRANT APPROVAL"}
                                                        </Button>
                                                        <Button 
                                                            onClick={() => handleVote(proposal.id, 'REJECT')}
                                                            disabled={isVoting}
                                                            variant="outline"
                                                            className="h-14 rounded-[20px] border-slate-200 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 font-black tracking-widest text-[11px]"
                                                        >
                                                            DISSENT / REJECT
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-12 space-y-4">
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                <span>Approval Quorum</span>
                                                <span className="text-[#0F172A]">{approveVotes} / {totalNeeded}</span>
                                            </div>
                                            <div className="flex gap-2.5">
                                                {Array.from({ length: totalNeeded ?? 3 }).map((_, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        className={cn(
                                                            "h-1.5 flex-1 rounded-full border border-slate-201",
                                                            idx < approveVotes ? 'bg-[#4F46E5] border-indigo-200' : 'bg-slate-200 border-slate-300'
                                                        )} 
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-24 text-center bg-white rounded-[48px] border border-slate-200 border-dashed shadow-inner">
                        <HistoryIcon className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                        <h3 className="text-xl font-black text-[#0F172A] tracking-tighter uppercase">Registry Clear</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-3">No pending investment commitments found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
