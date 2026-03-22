'use client'

import React, { useState, useEffect } from 'react'
import { LoanStatusBadge } from './LoanStatusBadge'
import { LoanJourneyTimeline } from './LoanJourneyTimeline'
import { LoanScheduleView } from './LoanScheduleView'
import { LoanStatementView } from './LoanStatementView'
import { LoanAppraisalReport } from './LoanAppraisalReport'
import { ArrowLeft } from 'lucide-react'
import { submitLoanApproval, getLoanJourney, disburseLoanToWallet } from '@/app/loan-approval-actions'
import { PostLoanButton } from './loans/PostLoanButton';
import { toast } from '@/lib/toast';

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import dynamic from 'next/dynamic';

const VotingRecordsModal = dynamic(
    () => import('./loan/VotingRecordsModal').then(mod => mod.VotingRecordsModal),
    { ssr: false }
);

const RepaymentModal = dynamic(
    () => import('./loans/RepaymentModal').then(mod => mod.RepaymentModal),
    { ssr: false }
);

interface LoanAppraisalCardProps {
    loanId: string
    isOpen: boolean
    onClose: () => void
    currentUserId?: string
    activeTab?: string
    hideApprovalButtons?: boolean // Hide approve/reject buttons when true (e.g., from Approvals module)
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
    memberSharesAtApplication: number
    grossQualifyingAmount: number
    processingFee: number
    insuranceFee: number
    shareCapitalDeduction: number
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
        status: string // PENDING, APPROVED, etc.
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
}

export function LoanAppraisalCard({ loanId, isOpen, onClose, currentUserId, activeTab: parentActiveTab }: LoanAppraisalCardProps) {
    const [loan, setLoan] = useState<LoanData | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'appraisal' | 'journey' | 'schedule' | 'statement' | 'history'>('appraisal')
    const [approvalNotes, setApprovalNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [showVotingRecords, setShowVotingRecords] = useState(false)
    const [showRepaymentModal, setShowRepaymentModal] = useState(false)
    const [statementRefreshKey, setStatementRefreshKey] = useState(0)

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
        // Optimistic or Full Refresh
        fetchLoanData()
        setStatementRefreshKey(prev => prev + 1) // Force statement refresh
    }

    const handleApprove = async () => {
        if (!loan) return
        setSubmitting(true)
        try {
            if (loan.workflowRequest && loan.workflowRequest.status === 'PENDING') {
                // Use Workflow Engine
                const { processWorkflowAction } = await import('@/app/actions/workflow-engine')
                await processWorkflowAction(loan.workflowRequest.id, 'APPROVED', approvalNotes)
            } else {
                // Legacy Fallback
                const result: any = await submitLoanApproval(loan.id, 'APPROVED', approvalNotes)
                if (result?.error) throw new Error(result.error)
            }

            await fetchLoanData() // Refresh
            setApprovalNotes('')
            toast.success('Your approval has been recorded')
        } catch (error: any) {
            toast.error(error.message || 'Failed to submit approval')
        } finally {
            setSubmitting(false)
        }
    }

    const handleReject = async () => {
        if (!loan || !approvalNotes) {
            toast.error('Please provide a reason for rejection')
            return
        }
        setSubmitting(true)
        try {
            const result: any = await submitLoanApproval(loan.id, 'REJECTED', approvalNotes)
            if (result?.error) throw new Error(result.error)
            await fetchLoanData() // Refresh
            setApprovalNotes('')
            toast.success('Loan rejection recorded')
        } catch (error: any) {
            toast.error(error.message || 'Failed to submit rejection')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDisburse = async () => {
        if (!loan) return
        if (!confirm(`Are you sure you want to disburse KES ${loan.netDisbursementAmount.toLocaleString()} to ${loan.member.name}?`)) return

        setSubmitting(true)
        setSubmitting(true)
        try {
            await disburseLoanToWallet(loan.id)
            await fetchLoanData() // Refresh status to DISBURSED
            toast.success('Loan disbursed successfully')
            onClose() // Close modal on success
        } catch (error: any) {
            toast.error(error.message || 'Failed to disburse loan')
        } finally {
            setSubmitting(false)
        }
    }

    const handleBack = () => {
        toast.success("Changes saved. Returning to menu...")
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col">
                {loading ? (
                    <div className="p-12 text-center flex-1 flex flex-col items-center justify-center">
                        <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto" />
                        <p className="mt-4 text-slate-500 font-bold">Loading loan details...</p>
                    </div>
                ) : loan ? (
                    <>
                        {}
                        <div className="bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 p-4 md:p-8 text-white relative overflow-hidden shrink-0">
                            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleBack}
                                            className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg backdrop-blur-md transition-all mr-1 flex items-center gap-2"
                                            title="Save & Return to Loans"
                                        >
                                            <ArrowLeft className="w-5 h-5 text-white" />
                                            <span className="font-bold text-sm">Back</span>
                                        </button>
                                        <div>
                                            <h2 className="text-xl md:text-3xl font-black uppercase tracking-tight mb-1">
                                                {loan.loanApplicationNumber}
                                            </h2>
                                            <p className="text-white/80 text-xs md:text-sm font-bold">
                                                {loan.member.name}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="text-white/80 hover:text-white p-2"
                                    >
                                        <span className="text-2xl font-bold">✕</span>
                                    </button>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-2 md:gap-4 mb-3">
                                    <div className="flex items-center gap-2 md:gap-4">
                                        <LoanStatusBadge status={loan.status as any} size="sm" />
                                        <div className="text-xs md:text-sm font-bold text-white/90 bg-white/10 px-2 py-1 rounded-lg">
                                            {loan.loanProduct.name}
                                        </div>
                                        {loan.workflowRequest?.currentStage && (
                                            <div className="text-xs md:text-sm font-bold text-white/90 bg-purple-500/20 border border-purple-300/30 px-2 py-1 rounded-lg flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-purple-300 animate-pulse" />
                                                <span>{loan.workflowRequest.currentStage.name}</span>
                                            </div>
                                        )}
                                    </div>

                                    {}
                                    {['ACTIVE', 'OVERDUE', 'WRITTEN_OFF'].includes(loan.status) && (
                                        <button
                                            onClick={() => setShowRepaymentModal(true)}
                                            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-bold uppercase text-xs rounded-lg backdrop-blur-md transition-all flex items-center gap-2"
                                        >
                                            <span className="bg-white text-blue-600 rounded-full w-4 h-4 flex items-center justify-center font-black text-[10px]">$</span>
                                            Repay Loan
                                        </button>
                                    )}
                                </div>

                                {}
                                {loan.status === 'PENDING_APPROVAL' && (
                                    <div className="w-full">
                                        {}
                                        <div className="grid grid-cols-2 gap-2 md:hidden">
                                            {}
                                            <button
                                                onClick={() => setShowVotingRecords(true)}
                                                className="px-3 py-3 min-h-[48px] bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-xs rounded-lg transition-all shadow-md flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                                                <span>Approvals</span>
                                            </button>

                                            <button
                                                onClick={handleApprove}
                                                disabled={submitting}
                                                className="px-3 py-3 min-h-[48px] bg-green-600 hover:bg-green-700 text-white font-bold uppercase text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                                            >
                                                {submitting ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                                        <span>Approve</span>
                                                    </>
                                                )}
                                            </button>

                                            {}
                                            <button
                                                onClick={handleReject}
                                                disabled={submitting}
                                                className="px-3 py-3 min-h-[48px] bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-xs rounded-lg transition-all disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                <span>Reject</span>
                                            </button>

                                            <button
                                                onClick={async () => {
                                                    if (!confirm('Are you sure you want to cancel this approval request? It will be moved back to draft status.')) return;
                                                    setSubmitting(true);
                                                    try {
                                                        const res = await fetch(`/api/loans/${loan.id}/cancel`, { method: 'POST' });
                                                        const json = await res.json();
                                                        if (!res.ok) throw new Error(json.error || 'Failed to cancel');

                                                        toast.success('Approval request cancelled successfully');
                                                        onClose();
                                                        window.location.reload();
                                                    } catch (e: any) {
                                                        toast.error(e.message || 'Failed to cancel');
                                                    } finally {
                                                        setSubmitting(false);
                                                    }
                                                }}
                                                disabled={submitting}
                                                className="px-2 py-2 min-h-[48px] bg-orange-600 hover:bg-orange-700 text-white font-bold uppercase text-[10px] leading-tight rounded-lg transition-all disabled:opacity-50 shadow-md flex flex-col items-center justify-center gap-0.5"
                                            >
                                                {submitting ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        <span className="text-center">Cancel Approval</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {}
                                        <div className="hidden md:flex items-center gap-2">
                                            {}
                                            <button
                                                onClick={() => setShowVotingRecords(true)}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-xs rounded-lg transition-all shadow-md flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                                                Approvals
                                            </button>

                                            {}
                                            <button
                                                onClick={handleReject}
                                                disabled={submitting}
                                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-xs rounded-lg transition-all disabled:opacity-50 shadow-md"
                                            >
                                                Reject
                                            </button>

                                            {}
                                            <button
                                                onClick={handleApprove}
                                                disabled={submitting}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold uppercase text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50"
                                            >
                                                {submitting ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                                )}
                                                <span>Approve</span>
                                            </button>

                                            {}
                                            <Button
                                                onClick={async () => {
                                                    if (!confirm('Are you sure you want to cancel this approval request? It will be moved back to draft status.')) return;
                                                    setSubmitting(true);
                                                    try {
                                                        const res = await fetch(`/api/loans/${loan.id}/cancel`, { method: 'POST' });
                                                        const json = await res.json();
                                                        if (!res.ok) throw new Error(json.error || 'Failed to cancel');

                                                        toast.success('Approval request cancelled successfully');
                                                        onClose();
                                                        window.location.reload();
                                                    } catch (e: any) {
                                                        toast.error(e.message || 'Failed to cancel');
                                                    } finally {
                                                        setSubmitting(false);
                                                    }
                                                }}
                                                disabled={submitting}
                                                className="bg-orange-600 hover:bg-orange-700 shadow-md"
                                            >
                                                {submitting ? (
                                                    <>
                                                        <Spinner className="mr-2 h-4 w-4" />
                                                        Cancelling...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        <span>Cancel Approval Request</span>
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {}
                        <div className="border-b border-slate-200 px-4 md:px-8 shrink-0 bg-white sticky top-0 z-20">
                            <div className="flex gap-4 overflow-x-auto scrollbar-none pb-0.5" style={{ scrollbarWidth: 'none' }}>
                                <TabButton
                                    active={activeTab === 'appraisal'}
                                    onClick={() => setActiveTab('appraisal')}
                                    label="Appraisal"
                                />
                                <TabButton
                                    active={activeTab === 'journey'}
                                    onClick={() => setActiveTab('journey')}
                                    label="Timeline"
                                />
                                <TabButton
                                    active={activeTab === 'schedule'}
                                    onClick={() => setActiveTab('schedule')}
                                    label="Schedule"
                                />
                                <TabButton
                                    active={activeTab === 'statement'}
                                    onClick={() => setActiveTab('statement')}
                                    label="Statement"
                                />
                                <TabButton
                                    active={activeTab === 'history'}
                                    onClick={() => setActiveTab('history')}
                                    label="History"
                                />
                            </div>
                        </div>

                        {}
                        <div className="p-4 md:p-8 overflow-y-auto flex-1 bg-white scrollbar-thin scrollbar-thumb-slate-200">
                            {activeTab === 'appraisal' ? (
                                <>
                                    <LoanAppraisalReport
                                        loanNo={loan.loanApplicationNumber}
                                        applicationDate={new Date(loan.applicationDate).toLocaleDateString('en-GB')}
                                        loanType={loan.loanProduct.name}
                                        memberNo={loan.member.memberNumber.toString()}
                                        memberName={loan.member.name}
                                        amountApplied={loan.amount}
                                        memberContribution={loan.memberSharesAtApplication}
                                        maxAvailable={loan.grossQualifyingAmount}
                                        depositsMultiplier={loan.memberSharesAtApplication > 0 ? Number((loan.grossQualifyingAmount / loan.memberSharesAtApplication).toFixed(2)) : 0}
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
                                        shareCapitalDeduction={loan.shareCapitalDeduction}
                                        existingLoanOffset={loan.existingLoanOffset}
                                        totalDeductions={loan.totalDeductions}
                                        netDisbursed={loan.netDisbursementAmount}
                                    />
                                </>
                            ) : activeTab === 'journey' ? (
                                <LoanJourneyTimeline events={loan.journeyEvents} />
                            ) : activeTab === 'schedule' ? (
                                <LoanScheduleView loanId={loan.id} />
                            ) : activeTab === 'statement' ? (
                                <LoanStatementView loanId={loan.id} refreshKey={statementRefreshKey} />
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Audit Trail</h3>
                                        <span className="text-xs text-slate-500 font-bold bg-slate-100 px-2 py-1 rounded">
                                            v{loan.history ? loan.history[0]?.version : 1}
                                        </span>
                                    </div>
                                    <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 pb-8">
                                        {loan.history?.map((h, i) => (
                                            <div key={h.id} className="relative pl-8">
                                                <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${h.action === 'SUBMITTED' ? 'bg-blue-500' :
                                                    h.action === 'CANCELLED' ? 'bg-orange-500' :
                                                        h.action === 'VOTED_APPROVE' ? 'bg-green-500' :
                                                            h.action === 'VOTED_REJECT' ? 'bg-red-500' : 'bg-slate-400'
                                                    }`} />
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-black text-slate-700 uppercase">{h.actorName}</span>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold border border-slate-200">{h.action.replace('_', ' ')}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 font-medium">
                                                        {new Date(h.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                                    </p>
                                                    {h.version && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Version {h.version}</p>}
                                                </div>
                                            </div>
                                        ))}
                                        {(!loan.history || loan.history.length === 0) && (
                                            <p className="pl-6 text-sm text-slate-400 italic">No history recorded yet.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {}
                        {loan.status === 'APPROVED' && (
                            <div className="p-6 bg-purple-50 border-t border-purple-100 flex items-center justify-between shrink-0">
                                <div>
                                    <h4 className="text-sm font-black text-purple-900 uppercase">Ready for Disbursement</h4>
                                    <p className="text-xs text-purple-700 mt-1">
                                        Funds will be transferred to user's wallet immediately.
                                    </p>
                                </div>
                                <button
                                    onClick={handleDisburse}
                                    disabled={submitting}
                                    className="px-8 py-3 bg-purple-600 text-white font-black uppercase text-xs rounded-xl hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {submitting ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    )}
                                    Disburse Funds
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="p-12 text-center flex-1 flex flex-col items-center justify-center">
                        <p className="text-slate-500 font-bold">Failed to load loan details</p>
                        <button
                            onClick={onClose}
                            className="mt-4 px-6 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg font-bold text-sm transition-colors"
                        >
                            Close
                        </button>
                    </div>
                )}
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
                <RepaymentModal
                    isOpen={showRepaymentModal}
                    onClose={() => setShowRepaymentModal(false)}
                    loan={{
                        id: loan.id,
                        loanApplicationNumber: loan.loanApplicationNumber,
                        outstandingBalance: loan.topUps ? loan.amount - loan.existingLoanOffset : (loan as any).outstandingBalance || 0, // Fallback if API structure varies.
                        memberId: loan.member.id
                    }}
                    onSuccess={onRepaymentSuccess}
                />
            )}
        </div >
    )
}

const TabButton = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
    <button
        onClick={onClick}
        className={`px-4 py-3 min-h-[44px] text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border-b-2 ${active
            ? 'text-cyan-500 border-cyan-500'
            : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
    >
        {label}
    </button>
)
