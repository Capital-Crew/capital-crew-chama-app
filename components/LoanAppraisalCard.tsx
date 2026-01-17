'use client'

import React, { useState, useEffect } from 'react'
import { LoanStatusBadge } from './LoanStatusBadge'
import { LoanJourneyTimeline } from './LoanJourneyTimeline'
import { LoanScheduleView } from './LoanScheduleView'
import { LoanStatementView } from './LoanStatementView'
import { LoanAppraisalReport } from './LoanAppraisalReport'
import { submitLoanApproval, getLoanJourney } from '@/app/loan-approval-actions'
import { PostLoanButton } from './loans/PostLoanButton';
import { toast } from '@/lib/toast';

interface LoanAppraisalCardProps {
    loanId: string
    isOpen: boolean
    onClose: () => void
    currentUserId: string
    activeTab?: string
}

interface LoanData {
    id: string
    loanApplicationNumber: string
    amount: number
    status: string
    applicationDate: Date
    disbursementDate?: Date

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
    }>

    approvalsCount: number
    currentUserHasApproved: boolean
    approvalsRequired: number

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
}

export function LoanAppraisalCard({ loanId, isOpen, onClose, currentUserId, activeTab: parentActiveTab }: LoanAppraisalCardProps) {
    const [loan, setLoan] = useState<LoanData | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'appraisal' | 'journey' | 'schedule' | 'statement'>('appraisal')
    const [approvalNotes, setApprovalNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (isOpen && loanId) {
            fetchLoanData()
        }
    }, [isOpen, loanId])

    const fetchLoanData = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/loans/${loanId}`)
            const data = await response.json()
            setLoan(data.loan)
        } catch (error) {
            console.error('Failed to fetch loan:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async () => {
        if (!loan) return
        setSubmitting(true)
        try {
            await submitLoanApproval(loan.id, 'APPROVED', approvalNotes)
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
            await submitLoanApproval(loan.id, 'REJECTED', approvalNotes)
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
        const { disburseLoanToWallet } = await import('@/app/loan-approval-actions')
        try {
            await disburseLoanToWallet(loan.id)
            await fetchLoanData() // Refresh status to DISBURSED
            toast.success('Loan disbursed successfully')
            onClose() // Close modal on success
        } catch (error: any) {
            console.error('Disbursement error:', error)
            toast.error(error.message || 'Failed to disburse loan')
        } finally {
            setSubmitting(false)
        }
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
                        {/* Glassmorphic Header */}
                        <div className="bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 p-8 text-white relative overflow-hidden shrink-0">
                            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h2 className="text-3xl font-black uppercase tracking-tight mb-2">
                                            {loan.loanApplicationNumber}
                                        </h2>
                                        <p className="text-white/80 text-sm font-bold">
                                            {loan.member.name} • Member #{loan.member.memberNumber}
                                        </p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="text-white/80 hover:text-white text-2xl font-bold transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="flex items-center gap-4">
                                    <LoanStatusBadge status={loan.status as any} size="lg" />
                                    <div className="text-sm font-bold text-white/90">
                                        {loan.loanProduct.name} • {loan.loanProduct.interestRatePerPeriod}% interest
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="border-b border-slate-200 px-8 shrink-0">
                            <div className="flex gap-6">
                                <button
                                    onClick={() => setActiveTab('appraisal')}
                                    className={`px-4 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'appraisal'
                                        ? 'text-cyan-500 border-cyan-500'
                                        : 'text-slate-400 border-transparent'
                                        }`}
                                >
                                    Appraisal Report
                                </button>
                                <button
                                    onClick={() => setActiveTab('journey')}
                                    className={`px-4 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'journey'
                                        ? 'text-cyan-500 border-cyan-500'
                                        : 'text-slate-400 border-transparent'
                                        }`}
                                >
                                    Loan Journey
                                </button>
                                <button
                                    onClick={() => setActiveTab('schedule')}
                                    className={`px-4 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'schedule'
                                        ? 'text-cyan-500 border-cyan-500'
                                        : 'text-slate-400 border-transparent'
                                        }`}
                                >
                                    Loan Schedule
                                </button>
                                <button
                                    onClick={() => setActiveTab('statement')}
                                    className={`px-4 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'statement'
                                        ? 'text-cyan-500 border-cyan-500'
                                        : 'text-slate-400 border-transparent'
                                        }`}
                                >
                                    Loan Statement
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 overflow-y-auto flex-1 bg-white">
                            {activeTab === 'appraisal' ? (
                                <div className="space-y-6">
                                    {/* SECTION 1: Key Financials (Hero) - Updated Structure */}
                                    <div className="bg-white border text-left border-slate-200 p-6 rounded-2xl shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <div className="w-32 h-32 bg-slate-900 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-8 relative z-10">
                                            {/* Column 1: Applied Amount */}
                                            <div>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Applied Amount</p>
                                                <div className="text-4xl font-black text-slate-900 mb-1">
                                                    KES {loan.amount.toLocaleString()}
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                                                        {loan.loanProduct.name}
                                                    </span>
                                                    <span className="text-xs font-medium text-slate-500">
                                                        @ {loan.loanProduct.interestRatePerPeriod}% Interest
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Column 2: Loan Term & Details */}
                                            <div className="flex flex-col justify-center border-l border-slate-100 pl-8">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Period</p>
                                                        <p className="text-lg font-black text-slate-700">{loan.installments} Months</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Installment</p>
                                                        <p className="text-lg font-black text-slate-700">KES {(loan.monthlyInstallment || 0).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECTION 2: Deductions Breakdown - ENHANCED STRUCTURE */}
                                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                                        {/* Header */}
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                            Financial Deductions Receipt
                                        </h3>

                                        <div className="space-y-4 text-sm relative z-10">
                                            {/* Standard Fees */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                                                <div className="flex justify-between items-center pb-2 border-b border-slate-200 border-dashed">
                                                    <span className="text-slate-600 font-bold italic">Processing Fee</span>
                                                    <span className="font-black text-red-500 text-xs">
                                                        - KES {loan.processingFee.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center pb-2 border-b border-slate-200 border-dashed">
                                                    <span className="text-slate-600 font-bold italic">Insurance Fee</span>
                                                    <span className="font-black text-red-500 text-xs">
                                                        - KES {loan.insuranceFee.toLocaleString()}
                                                    </span>
                                                </div>

                                                {loan.shareCapitalDeduction > 0 && (
                                                    <div className="flex justify-between items-center pb-2 border-b border-slate-200 border-dashed">
                                                        <span className="text-slate-600 font-bold italic">Share Capital Boost</span>
                                                        <span className="font-black text-red-500 text-xs">
                                                            - KES {loan.shareCapitalDeduction.toLocaleString()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Loan Offsets (if any) */}
                                            {(loan.topUps && loan.topUps.length > 0) || loan.existingLoanOffset > 0 ? (
                                                <div className="bg-orange-50/50 rounded-xl p-4 border border-orange-100 mt-4">
                                                    <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-3">Loan Clearance</p>
                                                    <div className="space-y-3">
                                                        {loan.topUps && loan.topUps.length > 0 ? (
                                                            loan.topUps.map(t => (
                                                                <div key={t.id} className="flex justify-between items-center">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-orange-900 font-black text-xs uppercase">
                                                                            {t.clearedLoan?.loanProduct?.name || 'Previous Loan'}
                                                                        </span>
                                                                        <span className="text-orange-700/60 font-medium text-[10px]">
                                                                            Ref: {t.clearedLoan?.loanApplicationNumber}
                                                                        </span>
                                                                    </div>
                                                                    <span className="font-black text-orange-700 text-xs whitespace-nowrap">
                                                                        - KES {t.totalOffset.toLocaleString()}
                                                                    </span>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-orange-900 font-black text-xs uppercase">Existing Debt Clearance</span>
                                                                <span className="font-black text-orange-700 text-xs">
                                                                    - KES {loan.existingLoanOffset.toLocaleString()}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : null}

                                            {/* Total Deductions Footer */}
                                            <div className="pt-4 flex justify-between items-end mt-4 border-t-2 border-slate-200/60">
                                                <div>
                                                    <span className="font-black text-slate-400 text-[10px] uppercase tracking-widest block mb-1">Total Deductions</span>
                                                    <p className="text-[10px] text-slate-400 font-bold italic">Automatically withheld from gross</p>
                                                </div>
                                                <span className="font-black text-slate-900 text-lg">KES {loan.totalDeductions.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECTION 3: Net To Disburse (Hero Bottom) */}
                                    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl shadow-purple-200 relative overflow-hidden">
                                        {/* Background Decoration */}
                                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                                        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-purple-500/30 rounded-full blur-2xl"></div>

                                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
                                            <div>
                                                <p className="text-sm font-bold text-purple-200 uppercase tracking-widest mb-2">Net to Disburse</p>
                                                <div className="text-5xl md:text-6xl font-black tracking-tight text-white mb-2">
                                                    KES {loan.netDisbursementAmount.toLocaleString()}
                                                </div>
                                                <p className="text-purple-200/80 text-sm font-medium">
                                                    Funds will be transferred to user's wallet
                                                </p>
                                            </div>

                                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 min-w-[200px]">
                                                <p className="text-[10px] font-bold text-purple-200 uppercase mb-1">Qualifying Limit</p>
                                                <div className="text-xl font-bold text-white mb-2">
                                                    KES {loan.grossQualifyingAmount.toLocaleString()}
                                                </div>
                                                <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-green-400 h-full rounded-full shadow-[0_0_10px_rgba(74,222,128,0.5)]"
                                                        style={{ width: `${Math.min((loan.amount / loan.grossQualifyingAmount) * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <p className="text-[9px] text-purple-200 mt-1 text-right">
                                                    {Math.round((loan.amount / loan.grossQualifyingAmount) * 100)}% utilized
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : activeTab === 'journey' ? (
                                <LoanJourneyTimeline events={loan.journeyEvents} />
                            ) : activeTab === 'schedule' ? (
                                <LoanScheduleView loanId={loan.id} />
                            ) : (
                                <LoanStatementView loanId={loan.id} />
                            )}
                        </div>

                        {/* Approval Footer - Only show if PENDING_APPROVAL and user hasn't approved */}
                        {loan.status === 'PENDING_APPROVAL' && !loan.currentUserHasApproved && (
                            <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col gap-4 shrink-0">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <textarea
                                            placeholder="Add notes for your decision (optional for approval, required for rejection)..."
                                            className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[50px] resize-none bg-white"
                                            value={approvalNotes}
                                            onChange={(e) => setApprovalNotes(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleReject}
                                            disabled={submitting}
                                            className="px-6 py-3 bg-white border border-red-200 text-red-600 font-black uppercase text-xs rounded-xl hover:bg-red-50 hover:border-red-300 transition-all disabled:opacity-50"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={handleApprove}
                                            disabled={submitting}
                                            className="px-8 py-3 bg-cyan-500 text-white font-black uppercase text-xs rounded-xl hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {submitting ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                            )}
                                            Approve Application
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-end border-t border-slate-200/50 pt-2">
                                    <button
                                        onClick={async () => {
                                            if (!confirm('Are you sure you want to cancel this request? It will be moved to the applications history.')) return;
                                            setSubmitting(true);
                                            try {
                                                const { cancelLoanApplication } = await import('@/app/loan-approval-actions');
                                                await cancelLoanApplication(loan.id);
                                                toast.success('Application cancelled successfully');
                                                onClose();
                                            } catch (e: any) {
                                                toast.error(e.message || 'Failed to cancel');
                                            } finally {
                                                setSubmitting(false);
                                            }
                                        }}
                                        disabled={submitting}
                                        className="text-[10px] font-bold text-slate-400 uppercase hover:text-red-500 transition-colors flex items-center gap-1"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                        Cancel Approval Request
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Disbursement Footer - Only show if APPROVED */}
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
        </div>
    )
}
