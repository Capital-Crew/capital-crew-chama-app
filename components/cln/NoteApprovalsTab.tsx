'use client'

import React, { useState, useEffect } from 'react';
import { ShieldCheckIcon, HistoryIcon, CheckCircle2Icon, XCircleIcon, Loader2Icon, UserIcon, ClockIcon, CalculatorIcon, BanIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Money } from '@/components/Money';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const VotingRecordsModal = dynamic(
    () => import('../loan/VotingRecordsModal').then(mod => mod.VotingRecordsModal),
    { ssr: false }
);

interface WorkflowAction {
    id: string;
    actor: { name: string };
    actorId: string;
    stageId: string;
    action: string;
    notes?: string;
    timestamp: string | Date;
}

interface WorkflowRequest {
    id: string;
    status: string;
    entityType: string;
    entityId: string;
    currentStage?: {
        id: string;
        name: string;
        minVotesRequired: number;
    };
    approvalsRequired?: number; // Added for modal compatibility
    actions: WorkflowAction[];
    version: number;
}

interface NoteApprovalsTabProps {
    noteId: string;
    userId: string;
    userRole: string;
    isFloater: boolean;
    noteStatus: string;
    userPermissions?: any;
    onPostReturns: () => void;
    onEarlySettlement: () => void;
}

export function NoteApprovalsTab({ 
    noteId, userId, userRole, isFloater, noteStatus, userPermissions,
    onPostReturns, onEarlySettlement 
}: NoteApprovalsTabProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [workflows, setWorkflows] = useState<WorkflowRequest[]>([]);
    const [settings, setSettings] = useState<any>({ clnFloaterSelfApproval: true });
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [scope, setScope] = useState<'listing' | 'all'>('listing');
    const [isFetchingAll, setIsFetchingAll] = useState(false);
    const [showVotingRecords, setShowVotingRecords] = useState(false);
    const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowRequest | null>(null);

    useEffect(() => {
        fetchWorkflows('listing');
    }, [noteId]);

    const fetchWorkflows = async (targetScope: 'listing' | 'all' = 'listing') => {
        setLoading(true);
        try {
            const response = await fetch(`/api/cln/workflows?noteId=${noteId}&scope=${targetScope}`);
            const data = await response.json();
            if (data.success) {
                setWorkflows(data.workflows);
                setScope(data.scope);
                if (data.settings) setSettings(data.settings);
            }
        } catch (error) {
            console.error('Fetch workflows error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFetchAll = async () => {
        setIsFetchingAll(true);
        await fetchWorkflows('all');
        setIsFetchingAll(false);
    };

    const handleWorkflowInitiation = async (action: 'SEND' | 'CANCEL') => {
        setIsSubmitting(true);
        try {
            const { handleWorkflowTransition } = await import('@/app/actions/approval-workflow');
            const result = await handleWorkflowTransition('LOAN_NOTE' as any, noteId, action);
            if (result.success) {
                toast.success(`Note ${action === 'SEND' ? 'submitted for review' : 'recalled to draft'}`);
                await fetchWorkflows();
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

    const handleReleaseEscrowAction = async () => {
        setIsSubmitting(true);
        try {
            const { releaseEscrow } = await import('@/app/actions/cln-actions');
            const result = await releaseEscrow(noteId, "Escrow released via Governance Terminal");
            if (result.success) {
                toast.success("Escrow released and note activated!");
                await fetchWorkflows();
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

    const handleVote = async (requestId: string, action: 'APPROVED' | 'REJECTED') => {
        if (action === 'REJECTED' && !notes.trim()) {
            toast.error("Please provide a reason for rejection");
            return;
        }

        setIsSubmitting(true);
        try {
            const { processWorkflowAction } = await import('@/app/actions/workflow-engine');
            const result = await processWorkflowAction(requestId, action, notes);
            
            if (result.success) {
                toast.success(`Decision recorded: ${action}`);
                setNotes('');
                await fetchWorkflows();
                router.refresh();
            } else {
                toast.error(result.error || "Failed to record decision");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-20 text-center">
                <Loader2Icon className="w-10 h-10 animate-spin mx-auto text-indigo-500 mb-4" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Governance Data...</p>
            </div>
        );
    }

    const pendingWorkflows = workflows.filter(w => w.status === 'PENDING');
    const completedWorkflows = workflows.filter(w => w.status !== 'PENDING');

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Floater Phase Actions */}
            {isFloater && (
                <div className="p-8 bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-[32px] shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <UserIcon className="w-5 h-5 text-indigo-600" />
                        <p className="text-[11px] font-black text-[#0F172A] uppercase tracking-widest">Issuer Management Panel</p>
                    </div>

                    {noteStatus === 'DRAFT' && (
                        <div className="flex items-center justify-between gap-6 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                             <div className="max-w-md">
                                <p className="text-sm font-bold text-slate-700 leading-relaxed mb-1">Your note is ready for review.</p>
                                <p className="text-[11px] text-slate-500 font-medium">Submit this listing to the committee for administrative clearance and market activation.</p>
                            </div>
                            <Button 
                                onClick={() => handleWorkflowInitiation('SEND')}
                                disabled={isSubmitting}
                                className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-500/20 whitespace-nowrap"
                            >
                                {isSubmitting ? <Loader2Icon className="animate-spin" /> : "Submit for Approval"}
                            </Button>
                        </div>
                    )}

                    {noteStatus === 'ACTIVE' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Button 
                                onClick={onPostReturns}
                                className="h-14 rounded-2xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-sky-500/10"
                            >
                                <CalculatorIcon className="w-5 h-5" />
                                Post Yield Returns
                            </Button>
                            <Button 
                                variant="outline"
                                onClick={onEarlySettlement}
                                className="h-14 rounded-2xl border-rose-200 text-rose-600 hover:bg-rose-50 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3"
                            >
                                <BanIcon className="w-4 h-4" />
                                Settle Note Early
                            </Button>
                        </div>
                    )}

                    {noteStatus !== 'DRAFT' && noteStatus !== 'ACTIVE' && (
                        <div className="text-center py-6">
                            <ClockIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waiting for next action phase</p>
                        </div>
                    )}
                </div>
            )}

            {/* Admin Phase Actions (Release Escrow) */}
            {userRole === 'SYSTEM_ADMIN' && noteStatus === 'OPEN' && (
                <div className="p-8 bg-indigo-900 border border-indigo-800 rounded-[32px] shadow-2xl text-white">
                    <div className="flex items-center gap-3 mb-6">
                        <ShieldCheckIcon className="w-5 h-5 text-indigo-300" />
                        <p className="text-[11px] font-black text-indigo-200 uppercase tracking-widest">Escrow Control Panel</p>
                    </div>
                    <div className="flex items-center justify-between gap-6">
                        <div>
                            <p className="text-lg font-black uppercase tracking-tight mb-1">Release Escrow & Activate</p>
                            <p className="text-xs text-indigo-300 font-medium">This will transfer core principal to the Floater and initiate the repayment clock.</p>
                        </div>
                        <Button 
                            onClick={handleReleaseEscrowAction}
                            disabled={isSubmitting}
                            className="h-14 px-8 rounded-2xl bg-white hover:bg-indigo-50 text-[#312E81] font-black text-sm uppercase tracking-widest shadow-xl whitespace-nowrap"
                        >
                            {isSubmitting ? <Loader2Icon className="animate-spin" /> : "Authorize Release"}
                        </Button>
                    </div>
                </div>
            )}

            {/* 1. Active Workflow Requests */}
            <div className="grid grid-cols-1 gap-6">
                {(pendingWorkflows.length > 0) ? pendingWorkflows.map((wf) => {
                    return (
                        <div key={wf.id} className="p-8 bg-white border-2 border-indigo-100 rounded-[32px] shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <ShieldCheckIcon className="w-16 h-16 text-indigo-600" />
                            </div>
                            
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Awaiting Decision</p>
                                        </div>
                                        <h3 className="text-xl font-black text-[#0F172A] uppercase tracking-tighter">
                                            {wf.entityType === 'LOAN_NOTE' ? 'Market Listing Review' : 
                                             wf.entityType === 'LOAN_NOTE_PAYMENT' ? 'Returns / Payout Approval' : 
                                             'Early Settlement Clearance'}
                                        </h3>
                                    </div>
                                    <div className="flex flex-col items-end gap-3">
                                        <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 uppercase">
                                            {wf.currentStage?.name || 'Review Stage'}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedWorkflow(wf);
                                                setShowVotingRecords(true);
                                            }}
                                            className="h-11 px-6 rounded-2xl bg-indigo-600 text-white border-none font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center gap-2 group/btn"
                                        >
                                            <HistoryIcon className="w-4 h-4 text-indigo-200 group-hover/btn:text-white transition-colors" /> Voting Log
                                        </Button>
                                    </div>
                                </div>

                                {/* Quorum Progress */}
                                <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Quorum Requirements</p>
                                        <p className="text-[11px] font-black text-[#0F172A] uppercase tracking-widest">
                                            {(() => {
                                                const totalApprovals = wf.actions.filter(a => a.action === 'APPROVED').length;
                                                const minRequired = wf.currentStage?.minVotesRequired || 1;
                                                const requesterVoted = wf.actions.some(a => (a as any).actorId === userId && a.action === 'APPROVED');
                                                
                                                // Case where floater's vote doesn't count for quorum
                                                if (!settings.clnFloaterSelfApproval && requesterVoted && wf.entityType !== 'LOAN_NOTE') {
                                                    return `${totalApprovals - 1} / ${minRequired} (Excl. Floater)`;
                                                }
                                                return `${totalApprovals} / ${minRequired}`;
                                            })()} Admins
                                        </p>
                                    </div>
                                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-indigo-600 transition-all duration-1000" 
                                            style={{ 
                                                width: `${(() => {
                                                    const totalApprovals = wf.actions.filter(a => a.action === 'APPROVED').length;
                                                    const minRequired = wf.currentStage?.minVotesRequired || 1;
                                                    const requesterVoted = wf.actions.some(a => (a as any).actorId === userId && a.action === 'APPROVED');
                                                    
                                                    const effectiveApprovals = (!settings.clnFloaterSelfApproval && requesterVoted && wf.entityType !== 'LOAN_NOTE') 
                                                        ? totalApprovals - 1 
                                                        : totalApprovals;
                                                        
                                                    return Math.min((effectiveApprovals / minRequired) * 100, 100);
                                                })()}%` 
                                            }}
                                        />
                                    </div>
                                    {(() => {
                                        const hasVoted = wf.actions.some(a => {
                                            const voterId = a.actorId || (a.actor as any)?.id;
                                            return voterId === userId && a.stageId === wf.currentStage?.id;
                                        });
                                        if (hasVoted) {
                                            const myVote = wf.actions.find(a => {
                                                const voterId = a.actorId || (a.actor as any)?.id;
                                                return voterId === userId && a.stageId === wf.currentStage?.id;
                                            });
                                            return (
                                                <div className="mt-4 flex items-center justify-center gap-2 py-2 px-4 bg-emerald-50 border border-emerald-100 rounded-xl animate-in fade-in zoom-in duration-300">
                                                    <CheckCircle2Icon className="w-4 h-4 text-emerald-600" />
                                                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                                                        Decision Recorded: {myVote?.action}
                                                    </span>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>

                                {/* History Snippet */}
                                {wf.actions.length > 0 && (
                                    <div className="space-y-3 mb-8">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Decision Trail</p>
                                        {wf.actions.map(action => (
                                            <div key={action.id} className="flex gap-3 items-start">
                                                <div className={cn(
                                                    "mt-1 w-2 h-2 rounded-full",
                                                    action.action === 'APPROVED' ? 'bg-emerald-500' : 'bg-rose-500'
                                                )} />
                                                <div>
                                                    <p className="text-xs font-bold text-slate-700">
                                                        <span className="font-black border-b border-indigo-100">{action.actor.name}</span> {action.action === 'APPROVED' ? 'granted approval' : 'rejected request'}
                                                    </p>
                                                    {action.notes && <p className="text-[11px] text-slate-500 italic mt-0.5">"{action.notes}"</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Voting Panel */}
                                {(() => {
                                    // 0. CHECK IF ALREADY VOTED
                                    const hasVoted = wf.actions.some(a => {
                                        const voterId = a.actorId || (a.actor as any)?.id;
                                        return voterId === userId && a.stageId === wf.currentStage?.id;
                                    });
                                    if (hasVoted) return false;

                                    // 1. Recognize either SYSTEM_ADMIN or ADMIN as high authority
                                    const isAdmin = userRole === 'SYSTEM_ADMIN' || userRole === 'ADMIN';
                                    if (isAdmin) return true;

                                    // 2. Floater always has participation rights on their own notes
                                    if (isFloater) return true;

                                    // 3. Specific permissions for other leadership roles
                                    const isNoteWorkflow = ['LOAN_NOTE', 'LOAN_NOTE_PAYMENT', 'LOAN_NOTE_SETTLEMENT'].includes(wf.entityType);
                                    if (!isNoteWorkflow) return false;

                                    const hasRight = userPermissions?.canApproveLoanNotes || 
                                                   userPermissions?.APPROVE_LOAN_NOTES ||
                                                   (Array.isArray(userPermissions) && userPermissions.includes("APPROVE_LOAN_NOTES"));
                                    
                                    const highRoles = ['CHAIRPERSON', 'TREASURER', 'SECRETARY'];
                                    if (highRoles.includes(userRole) && hasRight) return true;
                                    
                                    return false;
                                })() && (
                                    <div className="pt-6 border-t border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-1">
                                        <Textarea 
                                            placeholder="Add Internal Review Notes (Mandatory for rejection)..."
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="bg-slate-50 border-slate-200 rounded-2xl min-h-[100px] text-sm font-medium focus:ring-indigo-500 transition-all"
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <Button 
                                                onClick={() => handleVote(wf.id, 'APPROVED')}
                                                disabled={isSubmitting}
                                                className="h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest"
                                            >
                                                {isSubmitting ? <Loader2Icon className="animate-spin" /> : (
                                                    wf.entityType === 'LOAN_NOTE' ? 'Approve Listing' :
                                                    wf.entityType === 'LOAN_NOTE_PAYMENT' ? 'Authorize Payout' :
                                                    'Confirm Settlement'
                                                )}
                                            </Button>
                                            <Button 
                                                onClick={() => handleVote(wf.id, 'REJECTED')}
                                                disabled={isSubmitting}
                                                variant="outline"
                                                className="h-12 rounded-2xl border-rose-200 text-rose-600 hover:bg-rose-50 font-black text-xs uppercase tracking-widest"
                                            >
                                                {wf.entityType === 'LOAN_NOTE' ? 'Reject Listing' :
                                                 wf.entityType === 'LOAN_NOTE_PAYMENT' ? 'Deny Payout' :
                                                 'Block Settlement'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                }) : (
                    <div className="p-12 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                        <CheckCircle2Icon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No Pending Governance Actions</p>
                        <p className="text-[11px] text-slate-500 mt-2 font-medium">All lifecycle stages are currently finalized.</p>
                    </div>
                )}
            </div>

            {/* 2. Governance History */}
            {completedWorkflows.length > 0 && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <HistoryIcon className="w-4 h-4 text-indigo-400" />
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Decision History</h4>
                        </div>
                        {scope === 'listing' && (
                            <Button 
                                variant="ghost"
                                size="sm"
                                onClick={handleFetchAll}
                                disabled={isFetchingAll}
                                className="h-8 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 border border-indigo-100 hover:border-indigo-200 transition-all"
                            >
                                {isFetchingAll ? <Loader2Icon className="w-3 h-3 animate-spin mr-2" /> : <HistoryIcon className="w-3 h-3 mr-2" />}
                                Load Full History
                            </Button>
                        )}
                    </div>
                    
                    <div className="space-y-4">
                        {completedWorkflows.map(wf => (
                            <div key={wf.id} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm flex justify-between items-center opacity-70 hover:opacity-100 transition-opacity">
                                <div className="flex gap-4 items-center">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center",
                                        wf.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                    )}>
                                        {wf.status === 'APPROVED' ? <CheckCircle2Icon className="w-5 h-5" /> : <XCircleIcon className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-[#0F172A] uppercase tracking-tighter">
                                            {wf.entityType === 'LOAN_NOTE' ? 'Listing Approval' : 
                                             wf.entityType === 'LOAN_NOTE_PAYMENT' ? 'Payout Approval' : 
                                             'Settlement Approval'}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {wf.status === 'APPROVED' ? 'Finalized' : 'Rejected'} • v{wf.version}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-3">
                                    <div className="text-right">
                                        <p className="text-xs font-black text-slate-700">{wf.actions.length} Decisions</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Consensus Reached</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedWorkflow(wf);
                                            setShowVotingRecords(true);
                                        }}
                                        className="h-10 px-6 rounded-2xl bg-blue-50 text-blue-600 border-blue-100 font-black text-[9px] uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-2"
                                    >
                                        <HistoryIcon className="w-4 h-4" /> View Full Log
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {selectedWorkflow && (
                <VotingRecordsModal 
                    isOpen={showVotingRecords}
                    onOpenChange={setShowVotingRecords}
                    approvals={selectedWorkflow.actions.map(a => ({
                        id: a.id,
                        approver: {
                            name: a.actor.name,
                            memberNumber: (a.actor as any).member?.memberNumber || 0,
                            user: { role: (a.actor as any).role || 'ADMIN' }
                        },
                        decision: a.action,
                        notes: a.notes,
                        timestamp: a.timestamp,
                        version: selectedWorkflow.version
                    }))}
                    requiredApprovals={selectedWorkflow.currentStage?.minVotesRequired || 1}
                    currentVersion={selectedWorkflow.version}
                    // Active Voting Integration
                    canVote={(() => {
                        const wf = selectedWorkflow;
                        if (!wf || wf.status !== 'PENDING') return false;
                        
                        // 1. Recognize either SYSTEM_ADMIN or ADMIN as high authority
                        const isAdmin = userRole === 'SYSTEM_ADMIN' || userRole === 'ADMIN';
                        if (isAdmin) return true;

                        // 2. Floater always has participation rights on their own notes
                        if (isFloater) return true;

                        // 3. Specific permissions for other leadership roles
                        const isNoteWorkflow = ['LOAN_NOTE', 'LOAN_NOTE_PAYMENT', 'LOAN_NOTE_SETTLEMENT'].includes(wf.entityType);
                        if (!isNoteWorkflow) return false;

                        const hasRight = userPermissions?.canApproveLoanNotes || 
                                       userPermissions?.APPROVE_LOAN_NOTES ||
                                       (Array.isArray(userPermissions) && userPermissions.includes("APPROVE_LOAN_NOTES"));
                        
                        const highRoles = ['CHAIRPERSON', 'TREASURER', 'SECRETARY'];
                        if (highRoles.includes(userRole) && hasRight) return true;

                        return false;
                    })()}
                    isSubmitting={isSubmitting}
                    onVote={(action, vNotes) => {
                        setNotes(vNotes);
                        handleVote(selectedWorkflow.id, action);
                    }}
                    hasVoted={selectedWorkflow.actions.some(a => {
                        // Resilient comparison checking both actorId and nested actor.id
                        const voterId = a.actorId || (a.actor as any)?.id;
                        return voterId === userId && a.stageId === selectedWorkflow.currentStage?.id;
                    })}
                />
            )}
        </div>
    );
}
