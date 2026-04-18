'use client'

import React, { useState, useEffect } from 'react'
import { LoanStatusBadge } from './LoanStatusBadge'
import { LoanJourneyTimeline } from './LoanJourneyTimeline'
import { LoanScheduleView } from './LoanScheduleView'
import { LoanStatementView } from './LoanStatementView'
import { LoanAppraisalReport } from './LoanAppraisalReport'
import { ArrowLeft, Check, X, History, FileText, Calendar, DollarSign, Clock, Layout, Loader2, BanknoteIcon } from 'lucide-react'
import { submitLoanApproval, getLoanJourney, disburseLoanToWallet } from '@/app/loan-approval-actions'
import { PostLoanButton } from './loans/PostLoanButton';
import { toast } from '@/lib/toast';
import { LoanRepaymentModal } from './wallet/LoanRepaymentModal'
import { LoanAuditLog } from './loans/LoanAuditLog'

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import dynamic from 'next/dynamic';
import { useOptimisticAction } from '@/hooks/useOptimisticAction';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { FormError } from '@/components/ui/FormError';

const VotingRecordsModal = dynamic(
    () => import('./loan/VotingRecordsModal').then(mod => mod.VotingRecordsModal),
    { ssr: false }
);

interface LoanAppraisalCardProps {
    loanId: string
    isOpen: boolean
    onClose: () => void
    currentUserId?: string
    activeTab?: string
    hideApprovalButtons?: boolean
    onUpdate?: () => void
}

interface LoanData {
    id: string
    loanApplicationNumber: string
    amount: number
    status: string
    applicationDate: Date
    disbursementDate?: Date
    feeExemptions?: {
        allowConcurrentApplication?: boolean
    }
    member: {
        id: string
        name: string
        memberNumber: number
    }

    loanProduct: {
        name: string
        interestRatePerPeriod: number
    }

    // Appraisal fields
    memberContributionsAtApplication: number
    grossQualifyingAmount: number
    processingFee: number
    insuranceFee: number
    contributionDeduction: number
    existingLoanOffset: number
    totalDeductions: number
    netDisbursementAmount: number
    installments: number
    monthlyInstallment: number

    // Approvals
    approvals: Array<{
        id: string
        approver: {
            name: string
            memberNumber: number
        }
        decision: string
        notes?: string
        timestamp: Date
        version?: number
    }>

    approvalsCount: number
    currentUserHasApproved: boolean
    approvalsRequired: number
    submissionVersion: number

    journeyEvents: any[]

    // TopUp Details
    topUps: Array<{
        id: string
        amount: number
        principalOffset: number
        interestOffset: number
        penaltyOffset: number
        otherCharges: number
        totalOffset: number
        clearedLoan?: {
            loanApplicationNumber: string
            loanProduct: {
                name: string
            }
        }
    }>

    // Audit History
    history?: {
        id: string
        actorName: string
        action: string
        timestamp: string
        version: number
    }[]

    // Workflow Engine
    workflowRequest?: {
        id: string
        status: string
        currentStage?: {
            id: string
            name: string
            stepNumber: number
            requiredRole: string
        }
        workflow: {
            name: string
            stages: any[]
        }
    }
    meta?: {
        isAdmin: boolean
        isRequester: boolean
    }
}

export function LoanAppraisalCard({ loanId, isOpen, onClose, currentUserId, activeTab: parentActiveTab, onUpdate }: LoanAppraisalCardProps) {
    const [loan, setLoan] = useState<LoanData | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'appraisal' | 'journey' | 'schedule' | 'statement' | 'history'>('appraisal')
    const [approvalNotes, setApprovalNotes] = useState('')
    const [repayModalOpen, setRepayModalOpen] = useState(false)
    const [showVotingRecords, setShowVotingRecords] = useState(false)
    const [statementRefreshKey, setStatementRefreshKey] = useState(0)

    const { execute: executeApproval, isPending: approvalPending, error: approvalError } = useOptimisticAction();
    const { execute: executeDisburse, isPending: disbursePending, error: disburseError } = useOptimisticAction();
    const { execute: executeRecall, isPending: recallPending, error: recallError } = useOptimisticAction();

    useEffect(() => {
        if (isOpen && loanId) {
            fetchLoanData()
        }
    }, [isOpen, loanId])

    const fetchLoanData = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/loans/${loanId}`, {
                cache: 'no-store',
                credentials: 'include'
            })
            const data = await response.json()
            setLoan(data.loan)
        } catch (error) {
        } finally {
            setLoading(false)
        }
    }

    const onRepaymentSuccess = (newBalance: number) => {
        fetchLoanData()
        setStatementRefreshKey(prev => prev + 1)
        onUpdate?.()
    }

    const handleApprove = async () => {
        if (!loan) return
        await executeApproval(async () => {
            try {
                if (loan.workflowRequest && loan.workflowRequest.status === 'PENDING') {
                    const { processWorkflowAction } = await import('@/app/actions/workflow-engine')
                    const result: any = await processWorkflowAction(loan.workflowRequest.id, 'APPROVED', approvalNotes)
                    if (result?.success === false) {
                        return { success: false, error: result.error || 'Failed to submit approval' }
                    }
                } else {
                    const result: any = await submitLoanApproval(loan.id, 'APPROVED', approvalNotes)
                    if (result?.error) throw new Error(result.error)
                }

                toast.success('Your approval has been recorded')
                setApprovalNotes('')
                await fetchLoanData()
                return { success: true }
            } catch (error: any) {
                return { success: false, error: error.message || 'Failed to submit approval' }
            }
        }, {
            onOptimisticUpdate: () => {
                // Optimistically mark as approved-by-me
                setLoan(prev => prev ? ({ ...prev, currentUserHasApproved: true, status: 'APPROVED' }) : null);
            }
        });
    }

    const handleReject = async () => {
        if (!loan || !approvalNotes) {
            toast.error('Please provide a reason for rejection')
            return
        }
        await executeApproval(async () => {
            try {
                const result: any = await submitLoanApproval(loan.id, 'REJECTED', approvalNotes)
                if (result?.error) throw new Error(result.error)
                toast.success('Loan rejection recorded')
                setApprovalNotes('')
                await fetchLoanData()
                return { success: true }
            } catch (error: any) {
                return { success: false, error: error.message || 'Failed to submit rejection' }
            }
        }, {
            onOptimisticUpdate: () => {
                setLoan(prev => prev ? ({ ...prev, status: 'REJECTED' }) : null);
            }
        });
    }

    const handleRecall = async () => {
        if (!loan) return
        if (!confirm("Are you sure you want to recall this application? It will revert to Draft status and all existing votes will be cleared.")) return

        await executeRecall(async () => {
            try {
                const { handleWorkflowTransition } = await import('@/app/actions/approval-workflow')
                const result = await handleWorkflowTransition('LOAN', loan.id, 'CANCEL')
                if (result.error) throw new Error(result.error)

                toast.success('Application recalled successfully')
                onClose()
                return { success: true }
            } catch (error: any) {
                return { success: false, error: error.message || 'Failed to recall application' }
            }
        }, {
            onOptimisticUpdate: () => {
                setLoan(prev => prev ? ({ ...prev, status: 'APPLICATION' }) : null);
            }
        });
    }

    const handleDisburse = async () => {
        if (!loan) return
        if (!confirm(`Are you sure you want to disburse KES ${loan.netDisbursementAmount.toLocaleString()} to ${loan.member.name}?`)) return

        await executeDisburse(async () => {
            try {
                const { disburseLoanToWallet } = await import('@/app/loan-approval-actions')
                await disburseLoanToWallet(loan.id)
                toast.success('Loan disbursed successfully')
                onClose()
                return { success: true }
            } catch (error: any) {
                return { success: false, error: error.message || 'Failed to disburse loan' }
            }
        }, {
            onOptimisticUpdate: () => {
                setLoan(prev => prev ? ({ ...prev, status: 'DISBURSED' }) : null);
            }
        });
    }

    const handleBack = () => {
        toast.success("Changes saved. Returning to menu...")
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                {loading ? (
                    <div className="p-12 text-center flex-1 flex flex-col items-center justify-center">
                        <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto" />
                        <p className="mt-4 text-slate-500 font-bold">Loading loan details...</p>
                    </div>
                ) : loan ? (
                    <>
                        <div className="bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 p-4 md:p-8 text-white relative overflow-hidden shrink-0">
                            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleBack}
                                            className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg backdrop-blur-md transition-all mr-1 flex items-center gap-2"
                                        >
                                            <ArrowLeft className="w-5 h-5 text-white" />
                                            <span className="font-bold text-sm">Back</span>
                                        </button>
                                        <div>
                                            <h2 className="text-xl md:text-3xl font-black uppercase tracking-tight leading-tight">
                                                {loan.loanApplicationNumber}
                                            </h2>
                                            <p className="text-white/80 text-xs md:text-sm font-bold opacity-90">
                                                {loan.member.name} • #{loan.member.memberNumber}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="text-white/80 hover:text-white p-2 transition-colors"
                                    >
                                        <span className="text-2xl font-bold">✕</span>
                                    </button>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <LoanStatusBadge status={loan.status as any} size="sm" />
                                        <div className="text-xs font-black text-white/90 bg-white/10 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                                            {loan.loanProduct.name}
                                        </div>
                                        {loan.workflowRequest?.currentStage && (
                                            <div className="text-xs font-black text-white/90 bg-purple-500/20 border border-purple-300/30 px-3 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-md">
                                                <div className="w-1.5 h-1.5 rounded-full bg-purple-300 animate-pulse" />
                                                <span>{loan.workflowRequest.currentStage.name}</span>
                                            </div>
                                        )}
                                    </div>

                                    {['ACTIVE', 'OVERDUE', 'WRITTEN_OFF'].includes(loan.status) && (
                                        <button
                                            onClick={() => setRepayModalOpen(true)}
                                            className="px-5 py-2.5 bg-white text-blue-600 font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                        >
                                            <DollarSign className="w-3.5 h-3.5" />
                                            Repay Loan
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="border-b border-slate-200 px-4 md:px-8 bg-white flex items-center justify-between z-30 sticky top-0">
                            <div className="flex gap-2 md:gap-4 overflow-x-auto scrollbar-none py-1">
                                <NavTab active={activeTab === 'appraisal'} onClick={() => setActiveTab('appraisal')} icon={<FileText className="w-3.5 h-3.5" />} label="Appraisal" />
                                <NavTab active={activeTab === 'journey'} onClick={() => setActiveTab('journey')} icon={<Clock className="w-3.5 h-3.5" />} label="Timeline" />
                                <NavTab active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} icon={<Calendar className="w-3.5 h-3.5" />} label="Schedule" />
                                <NavTab active={activeTab === 'statement'} onClick={() => setActiveTab('statement')} icon={<DollarSign className="w-3.5 h-3.5" />} label="Statement" />
                                <NavTab active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History className="w-3.5 h-3.5" />} label="Audit" />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/30 scrollbar-thin scrollbar-thumb-slate-200">
                            <FormError message={approvalError || disburseError} className="mb-6" />
                            
                            {activeTab === 'appraisal' ? (
                                <div className="animate-in fade-in slide-in-from-bottom-2">
                                    <LoanAppraisalReport
                                        loanNo={loan.loanApplicationNumber}
                                        applicationDate={new Date(loan.applicationDate).toLocaleDateString('en-GB')}
                                        loanType={loan.loanProduct.name}
                                        memberNo={loan.member.memberNumber.toString()}
                                        memberName={loan.member.name}
                                        amountApplied={loan.amount}
                                        memberContribution={loan.memberContributionsAtApplication}
                                        maxAvailable={loan.grossQualifyingAmount}
                                        depositsMultiplier={loan.memberContributionsAtApplication > 0 ? Number((loan.grossQualifyingAmount / loan.memberContributionsAtApplication).toFixed(2)) : 0}
                                        loanBalance={loan.existingLoanOffset}
                                        topUpAmount={loan.existingLoanOffset}
                                        balanceAfterTopup={0}
                                        netLoan={loan.amount - loan.existingLoanOffset}
                                        interestRate={loan.loanProduct.interestRatePerPeriod}
                                        installments={loan.installments}
                                        monthlyRepayment={loan.monthlyInstallment || 0}
                                        topUpItems={loan.topUps?.map(t => ({
                                            loanNo: t.clearedLoan?.loanApplicationNumber || '-',
                                            product: t.clearedLoan?.loanProduct?.name || 'Top Up',
                                            principalTopUp: t.principalOffset,
                                            interestTopUp: t.interestOffset,
                                            penalty: t.penaltyOffset,
                                            refinanceFee: t.otherCharges,
                                            totalTopUp: t.totalOffset
                                        })) || []}
                                        recommendedAmount={loan.grossQualifyingAmount}
                                        approvedAmount={loan.amount}
                                        processingFee={loan.processingFee}
                                        insuranceFee={loan.insuranceFee}
                                        contributionDeduction={loan.contributionDeduction}
                                        existingLoanOffset={loan.existingLoanOffset}
                                        totalDeductions={loan.totalDeductions}
                                        netDisbursed={loan.netDisbursementAmount}
                                    />
                                </div>
                            ) : activeTab === 'journey' ? (
                                <LoanJourneyTimeline events={loan.journeyEvents} />
                            ) : activeTab === 'schedule' ? (
                                <LoanScheduleView loanId={loan.id} />
                            ) : activeTab === 'statement' ? (
                                <LoanStatementView loanId={loan.id} refreshKey={statementRefreshKey} />
                            ) : (
                                <div className="space-y-6 animate-in fade-in">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">System Audit Log</h3>
                                        <span className="text-[10px] text-slate-400 font-bold bg-white border border-slate-100 px-2.5 py-1 rounded-full shadow-sm">
                                            VERSION {loan.history ? loan.history[0]?.version : 1}.0
                                        </span>
                                    </div>
                                    <div className="relative border-l-2 border-slate-200 ml-4 space-y-10 pb-10 mt-6">
                                        {loan.history?.map((h, i) => (
                                            <div key={h.id} className="relative pl-10 group">
                                                <div className={cn(
                                                    "absolute -left-[11px] top-0.5 w-5 h-5 rounded-full border-4 border-white shadow-md transition-transform group-hover:scale-125 z-10",
                                                    h.action === 'SUBMITTED' ? 'bg-blue-500' :
                                                    h.action === 'CANCELLED' ? 'bg-orange-500' :
                                                    h.action === 'APPROVED' ? 'bg-green-500' :
                                                    h.action === 'REJECTED' ? 'bg-red-500' : 'bg-slate-400'
                                                )} />
                                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm group-hover:shadow-md transition-shadow">
                                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                                        <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{h.actorName}</span>
                                                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 font-black uppercase tracking-widest border border-slate-100 italic">
                                                            {h.action.replace(/_/g, ' ')}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(h.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                                    </p>
                                                    {h.version && <div className="mt-2 text-[8px] text-slate-300 font-black tracking-[0.2em] uppercase">Snapshot Version {h.version}</div>}
                                                </div>
                                            </div>
                                        ))}
                                        {(!loan.history || loan.history.length === 0) && (
                                            <div className="pl-8 py-10 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
                                                <History className="w-8 h-8 text-slate-100 mx-auto mb-2" />
                                                <p className="text-xs text-slate-300 font-bold italic">No audit records found.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {loan.status === 'PENDING_APPROVAL' && (
                            <div className="p-6 md:p-8 bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.02)] z-30">
                                <div className="max-w-3xl mx-auto space-y-6">
                                    <div className="relative group">
                                        <textarea
                                            className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:ring-4 focus:ring-cyan-500/10 min-h-[100px] resize-none transition-all outline-none"
                                            placeholder="Write appraisal notes or rejection reason here..."
                                            value={approvalNotes}
                                            onChange={(e) => setApprovalNotes(e.target.value)}
                                        />
                                        <div className="absolute top-4 right-4 opacity-10 group-focus-within:opacity-30 transition-opacity">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setShowVotingRecords(true)}
                                                className="px-4 py-3 bg-blue-50 text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-2 border border-blue-100"
                                            >
                                                <Layout className="w-4 h-4" /> Voting Log
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {(loan.meta?.isRequester || loan.meta?.isAdmin) && (
                                                <button
                                                    onClick={handleRecall}
                                                    disabled={recallPending}
                                                    className="px-6 py-4 rounded-2xl border-2 border-amber-100 text-amber-600 font-black text-[10px] uppercase tracking-widest hover:bg-amber-50 transition-all disabled:opacity-50 flex items-center gap-2"
                                                >
                                                    {recallPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <History className="w-4 h-4" />}
                                                    Recall Request
                                                </button>
                                            )}
                                            <button
                                                onClick={handleReject}
                                                disabled={approvalPending}
                                                className="px-6 py-4 rounded-2xl border-2 border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:border-red-100 hover:bg-red-50 hover:text-red-500 transition-all disabled:opacity-50"
                                            >
                                                Reject Loan
                                            </button>
                                            <SubmitButton
                                                isPending={approvalPending}
                                                label="Cast Approval Vote"
                                                pendingLabel="Casting Vote..."
                                                onClick={handleApprove}
                                                icon={<Check className="w-4 h-4 mr-2" />}
                                                className="bg-[#0A192F] hover:bg-green-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {loan.status === 'APPROVED' && (
                            <div className="p-8 bg-purple-900 text-white border-t border-purple-800 flex flex-wrap items-center justify-between gap-6 z-30">
                                <div>
                                    <h4 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                                        <Check className="w-5 h-5 text-emerald-400" /> Authorized for Disbursement
                                    </h4>
                                    <p className="text-purple-300 text-xs font-bold mt-1 max-w-md">
                                        Quorum reached. Finalize disbursement of <strong className="text-white">KES {loan.netDisbursementAmount.toLocaleString()}</strong> to {loan.member.name}'s wallet.
                                    </p>
                                </div>
                                <SubmitButton
                                    isPending={disbursePending}
                                    label="Confirm Disbursement"
                                    pendingLabel="Disbursing..."
                                    onClick={handleDisburse}
                                    className="bg-[#00c2e0] hover:bg-white hover:text-cyan-600 text-white px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-cyan-500/20 transition-all flex items-center gap-2"
                                />
                            </div>
                        )}
                    </>
                ) : null}
            </div>

            {loan && (
                <VotingRecordsModal
                    isOpen={showVotingRecords}
                    onOpenChange={setShowVotingRecords}
                    approvals={loan.approvals || []}
                    requiredApprovals={loan.approvalsRequired || 3}
                    currentVersion={loan.submissionVersion}
                />
            )}

            {loan && (
                <LoanRepaymentModal
                    isOpen={repayModalOpen}
                    onClose={() => setRepayModalOpen(false)}
                    memberId={loan.member.id}
                    initialLoanId={loan.id}
                    onSuccess={onRepaymentSuccess}
                />
            )}
        </div >
    )
}

function NavTab({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-5 py-4 border-b-4 transition-all flex items-center gap-2 whitespace-nowrap",
                active 
                    ? "border-cyan-500 text-cyan-600 bg-cyan-50/10" 
                    : "border-transparent text-slate-400 hover:text-slate-600"
            )}
        >
            <span className={cn("transition-colors", active ? "text-cyan-500" : "text-slate-300")}>{icon}</span>
            <span className="text-[10px] font-black uppercase tracking-[0.1em]">{label}</span>
        </button>
    );
}
