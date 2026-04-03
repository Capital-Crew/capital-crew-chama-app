'use client'

import React, { useState, useTransition, useOptimistic } from 'react'
import { useRouter } from 'next/navigation'
import { ApprovalRequest } from '@prisma/client'
import { format } from 'date-fns'
import { LoanAppraisalCard } from '@/components/LoanAppraisalCard'
import { MemberDetailsCard } from './MemberDetailsCard'
import { UserCheck, FileText, DollarSign, Users, ChevronRight, Check, X, Loader2, Calendar, Hash, Percent } from 'lucide-react'
import { processApproval } from '@/app/actions/approval-actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useOptimisticAction } from '@/hooks/useOptimisticAction'

// Icon mapping
const TYPE_ICONS = {
    'LOAN': DollarSign,
    'MEMBER': Users,
    'EXPENSE': FileText,
    'WELFARE': Users,
    'OTHER': FileText
}

const TYPE_COLORS = {
    'LOAN': 'from-blue-400 to-blue-600',
    'MEMBER': 'from-purple-400 to-purple-600',
    'EXPENSE': 'from-emerald-400 to-emerald-600',
    'WELFARE': 'from-pink-400 to-pink-600',
    'OTHER': 'from-slate-400 to-slate-600'
}

export interface ExtendedApprovalRequest extends ApprovalRequest {
    canApprove?: boolean
    entityDetails?: any
}

interface ApprovalsDashboardProps {
    requests: ExtendedApprovalRequest[]
    currentUserId: string
}

export function ApprovalsDashboard({ requests, currentUserId }: ApprovalsDashboardProps) {
    const router = useRouter()
    const [selectedRequest, setSelectedRequest] = useState<ExtendedApprovalRequest | null>(null)
    const [filter, setFilter] = useState('ALL')
    
    // Optimistic state for the list of requests
    const [optimisticRequests, setOptimisticRequests] = useOptimistic(
        requests,
        (state, actionedId: string) => state.filter(r => r.id !== actionedId)
    );

    const { execute: executeAction, isPending: anyIsPending } = useOptimisticAction();
    const [processingId, setProcessingId] = useState<string | null>(null);

    const visibleRequests = filter === 'ALL'
        ? optimisticRequests
        : optimisticRequests.filter(r => r.type === filter)

    const handleClose = () => {
        setSelectedRequest(null)
        router.refresh()
    }

    const handleQuickAction = async (e: React.MouseEvent, req: ExtendedApprovalRequest, decision: 'APPROVED' | 'REJECTED') => {
        e.stopPropagation() // Prevent card click
        if (processingId) return

        // Final safety check
        if (!req.canApprove) {
            toast.error("You do not have permission to action this request")
            return
        }

        setProcessingId(req.id)

        await executeAction(async () => {
            const result = await processApproval(req.id, decision)
            if (result.error) {
                toast.error(`Failed: ${result.error}`)
                return { success: false, error: result.error }
            } else {
                toast.success(`${decision === 'APPROVED' ? 'Approved' : 'Rejected'} successfully`)
                router.refresh()
                return { success: true }
            }
        }, {
            onOptimisticUpdate: () => {
                setOptimisticRequests(req.id);
                // Also close selected request if it's the one being actioned (though this is quick action from list)
                if (selectedRequest?.id === req.id) {
                    setSelectedRequest(null);
                }
            }
        });
        
        setProcessingId(null)
    }

    return (
        <div className="space-y-6 font-sans">
            {}
            <div className="flex items-center gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                {['ALL', 'LOAN', 'MEMBER', 'EXPENSE'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                            "px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-sm whitespace-nowrap flex-shrink-0",
                            filter === f
                                ? 'bg-[#00c2e0] text-white shadow-lg shadow-[#00c2e0]/20 scale-105'
                                : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
                        )}
                    >
                        {f === 'ALL' ? 'All Requests' : f + 's'}
                    </button>
                ))}
            </div>

            {}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {visibleRequests.length === 0 ? (
                    <div className="col-span-full py-12 md:py-20 text-center bg-white/50 rounded-3xl border border-dashed border-slate-200">
                        <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <UserCheck className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-slate-900 font-bold text-lg">All caught up!</h3>
                        <p className="text-slate-500 text-sm mt-1">No pending approvals in this category.</p>
                    </div>
                ) : (
                    visibleRequests.map(req => {
                        const Icon = TYPE_ICONS[req.type as keyof typeof TYPE_ICONS] || FileText
                        const gradient = TYPE_COLORS[req.type as keyof typeof TYPE_COLORS] || 'from-slate-400 to-slate-600'
                        const isProcessing = processingId === req.id
                        const canAction = req.canApprove

                        return (
                            <div
                                key={req.id}
                                onClick={() => setSelectedRequest(req)}
                                className={cn(
                                    "group bg-white border border-slate-100 hover:border-[#00c2e0]/30 cursor-pointer transition-all duration-300 hover:shadow-xl shadow-sm rounded-2xl overflow-hidden flex flex-col",
                                    isProcessing && "opacity-50 pointer-events-none scale-[0.98]"
                                )}
                            >
                                <div className="p-5 flex-1 relative">
                                    {}
                                    <div className="absolute top-5 right-5">
                                        <span className={cn(
                                            "px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider bg-slate-50 text-slate-500",
                                            req.type === 'LOAN' && "bg-blue-50 text-blue-600",
                                            req.type === 'MEMBER' && "bg-purple-50 text-purple-600",
                                            req.type === 'EXPENSE' && "bg-emerald-50 text-emerald-600"
                                        )}>
                                            {req.type}
                                        </span>
                                    </div>

                                    {}
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-br ${gradient} text-white flex-shrink-0`}>
                                            <Icon className="w-6 h-6" />
                                        </div>

                                        <div className="flex-1 min-w-0 pr-16">
                                            <h3 className="font-bold text-slate-800 leading-tight truncate group-hover:text-[#00c2e0] transition-colors">
                                                {req.requesterName || 'Unknown'}
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                {req.description || `Request regarding ${req.referenceTable}`}
                                            </p>

                                            {}
                                            {req.entityDetails && req.type === 'LOAN' && (
                                                <div className="mt-3 space-y-2 bg-slate-50/80 rounded-lg p-3 border border-slate-100">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-slate-500 font-medium flex items-center gap-1">
                                                            <Hash className="w-3 h-3" />
                                                            {req.entityDetails.loanApplicationNumber}
                                                        </span>
                                                        <span className="text-slate-700 font-bold">
                                                            {req.entityDetails.loanProduct?.productName}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-lg font-black text-slate-900">
                                                            <span className="text-xs text-slate-400 font-bold mr-1">KES</span>
                                                            {Number(req.entityDetails.amount).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-[10px] text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {req.entityDetails.installments} months
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Percent className="w-3 h-3" />
                                                            {req.entityDetails.interestRate}% interest
                                                        </span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-600 font-medium pt-1 border-t border-slate-200">
                                                        Member: {req.entityDetails.member?.name} ({req.entityDetails.member?.memberNumber})
                                                    </div>
                                                </div>
                                            )}

                                            {req.entityDetails && req.type === 'MEMBER' && (
                                                <div className="mt-3 space-y-2 bg-slate-50/80 rounded-lg p-3 border border-slate-100">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-slate-500 font-medium">
                                                            {req.entityDetails.memberNumber}
                                                        </span>
                                                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-bold">
                                                            {req.entityDetails.status}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs space-y-1">
                                                        <div className="text-slate-600">
                                                            📧 {req.entityDetails.email || 'N/A'}
                                                        </div>
                                                        <div className="text-slate-600">
                                                            📱 {req.entityDetails.phoneNumber || 'N/A'}
                                                        </div>
                                                        <div className="text-slate-600">
                                                            🆔 {req.entityDetails.nationalId || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {}
                                            {!req.entityDetails && req.amount && (
                                                <div className="mt-2 flex items-baseline gap-1">
                                                    <span className="text-lg font-black text-slate-900">
                                                        <span className="text-xs text-slate-400 font-bold mr-1">KES</span>
                                                        {Number(req.amount).toLocaleString()}
                                                    </span>
                                                </div>
                                            )}

                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-3">
                                                {format(new Date(req.createdAt), 'MMM d, yyyy')}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {}
                                <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex gap-2">
                                    {canAction ? (
                                        <>
                                            <button
                                                onClick={(e) => handleQuickAction(e, req, 'REJECTED')}
                                                disabled={!!processingId}
                                                className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                                                Reject
                                            </button>
                                            <button
                                                onClick={(e) => handleQuickAction(e, req, 'APPROVED')}
                                                disabled={!!processingId}
                                                className="flex-1 py-2.5 rounded-xl bg-[#0A192F] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#00c2e0] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                                            >
                                                {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                Approve
                                            </button>
                                        </>
                                    ) : (
                                        <div className="w-full py-2.5 text-center text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-100/50 rounded-xl border border-slate-200 border-dashed">
                                            Permission Required
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {}
            {selectedRequest && selectedRequest.type === 'LOAN' && (
                <LoanAppraisalCard
                    loanId={selectedRequest.referenceId}
                    isOpen={true}
                    onClose={handleClose}
                    currentUserId={currentUserId}
                />
            )}

            {selectedRequest && selectedRequest.type === 'MEMBER' && (
                <MemberDetailsCard
                    requestId={selectedRequest.id}
                    memberId={selectedRequest.referenceId}
                    isOpen={true}
                    onClose={handleClose}
                />
            )}

            {}
            {selectedRequest && !['LOAN', 'MEMBER'].includes(selectedRequest.type) && (
                <DivWrapper onClose={handleClose}>
                    <div className="p-8 text-center bg-white rounded-3xl w-full max-w-sm mx-auto">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Review Request</h3>
                        <div className="bg-slate-50 p-4 rounded-xl text-left border border-slate-100 mt-6 space-y-3">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Requester</p>
                                <p className="text-sm font-bold text-slate-700">{selectedRequest.requesterName}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Description</p>
                                <p className="text-sm text-slate-600">{selectedRequest.description}</p>
                            </div>
                            {selectedRequest.amount && (
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Amount</p>
                                    <p className="text-lg font-black text-slate-800">KES {Number(selectedRequest.amount).toLocaleString()}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-8">
                            {selectedRequest.canApprove ? (
                                <>
                                    <button
                                        onClick={(e) => { handleQuickAction(e as any, selectedRequest, 'REJECTED'); handleClose(); }}
                                        className="flex-1 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={(e) => { handleQuickAction(e as any, selectedRequest, 'APPROVED'); handleClose(); }}
                                        className="flex-1 py-3 rounded-xl bg-[#00c2e0] text-white text-xs font-black uppercase tracking-wider hover:bg-[#00a0b8] transition-colors shadow-lg shadow-[#00c2e0]/20"
                                    >
                                        Approve
                                    </button>
                                </>
                            ) : (
                                <div className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider text-center border border-slate-200">
                                    Action Restricted
                                </div>
                            )}
                        </div>
                    </div>
                </DivWrapper>
            )}
        </div>
    )
}

function DivWrapper({ children, onClose }: { children: React.ReactNode, onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A192F]/80 backdrop-blur-md transition-all duration-300 animate-in fade-in">
            <div className="w-full relative animate-in zoom-in-95 duration-300">
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 text-white/50 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full p-2 backdrop-blur-md border border-white/10 z-50"
                >
                    <X className="w-6 h-6" />
                </button>
                {children}
            </div>
        </div>
    )
}
