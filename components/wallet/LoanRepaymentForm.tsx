'use client'

import React, { useState, useEffect } from 'react'
import {
    addLoanRepayment,
    getActiveLoansByMember,
    getLoanFreshBalance
} from '@/app/wallet-add-funds-actions'
import {
    TrendingUpIcon,
    AlertCircleIcon,
    CheckCircleIcon,
    Clock,
    DollarSign,
    Info,
    ChevronDown,
    Loader2
} from 'lucide-react'
import { useFormAction } from '@/hooks/useFormAction'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { FormError } from '@/components/ui/FormError'
import { formatCurrency, cn } from '@/lib/utils'
import dynamic from 'next/dynamic'
import type { ReceiptData } from '@/components/receipts/RepaymentReceipt'
import { format } from 'date-fns'

import { RepaymentReceipt } from '@/components/receipts/RepaymentReceipt'

const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
    { ssr: false }
)

interface ActiveLoan {
    id: string
    loanApplicationNumber: string
    productName: string
    disbursedAmount: number
    outstandingBalance: number
    penaltyBalance: number
    feesBalance: number
    interestBalance: number
    principalBalance: number
    status: string
}

interface LoanRepaymentFormProps {
    memberId: string
    initialLoanId?: string
    onSuccess?: (newBalance: number) => void
    onCancel?: () => void
    showAsCard?: boolean
}

export function LoanRepaymentForm({ memberId, initialLoanId, onSuccess, onCancel, showAsCard = false }: LoanRepaymentFormProps) {
    const { isPending: loading, error, execute, setError } = useFormAction()
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Form State
    const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([])
    const [selectedLoanId, setSelectedLoanId] = useState(initialLoanId || '')
    const [selectedLoan, setSelectedLoan] = useState<ActiveLoan | null>(null)
    const [repaymentAmount, setRepaymentAmount] = useState('')
    const [repaymentDescription, setRepaymentDescription] = useState('')
    const [repaymentAllocation, setRepaymentAllocation] = useState({ penalty: 0, fees: 0, interest: 0, principal: 0 })
    const [fetchingLoans, setFetchingLoans] = useState(false)
    const [refreshingBalance, setRefreshingBalance] = useState(false)
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
    const [isMounted, setIsMounted] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Initial Load
    useEffect(() => {
        loadActiveLoans()
    }, [memberId])

    const loadActiveLoans = async () => {
        setFetchingLoans(true)
        try {
            const loans = await getActiveLoansByMember(memberId)
            setActiveLoans(loans)
            
            // If we have an initialLoanId, and it's in the list, set it
            if (initialLoanId && loans.some(l => l.id === initialLoanId)) {
                setSelectedLoanId(initialLoanId)
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message })
        } finally {
            setFetchingLoans(false)
        }
    }

    // Loan Selection Logic - With REAL-TIME Refresh
    useEffect(() => {
        const loan = activeLoans.find(l => l.id === selectedLoanId)
        if (!loan) {
            setSelectedLoan(null)
            setRepaymentAmount('')
            return
        }

        // 1. Instant optimistic update from list
        setSelectedLoan(loan)
        setRepaymentAmount('')
        calculateAllocation(loan, 0)

        // 2. Fetch fresh balance in background
        const fetchFresh = async () => {
            setRefreshingBalance(true)
            try {
                const fresh = await getLoanFreshBalance(loan.id)
                setSelectedLoan(prev => prev ? {
                    ...prev,
                    outstandingBalance: fresh.outstandingBalance,
                    penaltyBalance: fresh.penaltyBalance,
                    interestBalance: fresh.interestBalance,
                    principalBalance: fresh.principalBalance,
                    feesBalance: fresh.feesBalance
                } : null)
            } catch (err) {
                console.error("Failed to refresh balance:", err)
            } finally {
                setRefreshingBalance(false)
            }
        }
        fetchFresh()
    }, [selectedLoanId, activeLoans])

    useEffect(() => {
        if (selectedLoan && repaymentAmount) {
            calculateAllocation(selectedLoan, parseFloat(repaymentAmount) || 0)
        }
    }, [repaymentAmount, selectedLoan])

    const calculateAllocation = (loan: ActiveLoan, amount: number) => {
        if (amount <= 0) {
            setRepaymentAllocation({ penalty: 0, fees: 0, interest: 0, principal: 0 })
            return
        }

        let remaining = amount
        const allocation = { penalty: 0, fees: 0, interest: 0, principal: 0 }

        // Waterfall: Penalty -> Fees -> Interest -> Principal
        if (remaining > 0 && loan.penaltyBalance > 0) {
            allocation.penalty = Math.min(remaining, loan.penaltyBalance)
            remaining -= allocation.penalty
        }
        if (remaining > 0 && loan.feesBalance > 0) {
            allocation.fees = Math.min(remaining, loan.feesBalance)
            remaining -= allocation.fees
        }
        if (remaining > 0 && loan.interestBalance > 0) {
            allocation.interest = Math.min(remaining, loan.interestBalance)
            remaining -= allocation.interest
        }
        if (remaining > 0 && loan.principalBalance > 0) {
            allocation.principal = Math.min(remaining, loan.principalBalance)
            remaining -= allocation.principal
        }
        setRepaymentAllocation(allocation)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isSubmitted) return;
        setMessage(null)
        
        await execute(async (idempotencyKey) => {
            const result = await addLoanRepayment({
                memberId,
                loanId: selectedLoanId,
                amount: parseFloat(repaymentAmount),
                description: repaymentDescription,
                idempotencyKey
            })

            if (result && 'error' in result) {
                return { success: false, error: (result as any).error }
            }

            setMessage({ type: 'success', text: `Repayment successful! Remaining: KES ${result.newOutstanding.toLocaleString()}` })
            setRepaymentAmount('')
            setRepaymentDescription('')
            setIsSubmitted(true); // Lock form on success
            
            onSuccess?.(result.newOutstanding)
            
            if (result.receiptData) {
                setReceiptData(result.receiptData as ReceiptData)
            }

            // Optionally reload loans to update the list
            loadActiveLoans()
            
            return { success: true }
        }, { useIdempotency: true })
    }

    const isRepaymentValid = selectedLoan && parseFloat(repaymentAmount) > 0 && parseFloat(repaymentAmount) <= selectedLoan.outstandingBalance

    if (receiptData) {
        return (
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col font-sans border border-slate-100 mx-auto animate-in zoom-in-95 duration-300">
                <div className="bg-emerald-600 p-10 flex flex-col items-center justify-center text-white relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-10 -mr-8 -mt-8">
                        <CheckCircleIcon className="w-40 h-40" />
                    </div>
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center mb-6 shadow-lg border border-white/20">
                        <CheckCircleIcon className="w-10 h-10 text-white" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-1 opacity-80 text-center">Transaction Finalized</p>
                    <h3 className="text-3xl font-black tracking-tighter">KES {receiptData.amount.toLocaleString()}</h3>
                </div>

                <div className="p-10 flex flex-col gap-6">
                    <div className="bg-slate-50 rounded-[1.5rem] p-6 border border-slate-100 text-left space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Internal Ref</span>
                            <span className="font-mono font-black text-slate-900 bg-white px-2 py-1 rounded-md border border-slate-100 text-xs">{receiptData.transactionId.slice(-12).toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processed On</span>
                            <span className="font-black text-slate-900 text-xs">{format(new Date(receiptData.date), 'dd MMM yyyy, HH:mm')}</span>
                        </div>
                    </div>

                    {isMounted && (
                        <PDFDownloadLink
                            document={<RepaymentReceipt data={receiptData} />}
                            fileName={`Receipt-${receiptData.transactionId}.pdf`}
                        >
                            {({ loading }: any) => (
                                <button 
                                    disabled={loading}
                                    className="w-full py-5 bg-[#0A192F] hover:bg-[#00c2e0] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUpIcon className="w-4 h-4" />}
                                    {loading ? 'Preparing Digital Copy...' : 'Download Receipt'}
                                </button>
                            )}
                        </PDFDownloadLink>
                    )}

                    <button
                        onClick={() => {
                            setReceiptData(null)
                            setRepaymentAmount('')
                            setRepaymentDescription('')
                            onCancel?.()
                        }}
                        className="w-full py-5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className={cn("space-y-6", showAsCard ? "p-6" : "")}>
            {message && (
                <div className={cn(
                    "p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
                    message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
                )}>
                    {message.type === 'success' ? <CheckCircleIcon className="w-5 h-5 text-green-600" /> : <AlertCircleIcon className="w-5 h-5 text-red-600" />}
                    <p className="font-bold text-sm">{message.text}</p>
                </div>
            )}

            <FormError message={error} className="mb-4" />

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.15em] mb-2 block ml-1">Target Account</label>
                    <div className="relative group">
                        <select
                            required
                            disabled={fetchingLoans || refreshingBalance || loading || isSubmitted}
                            value={selectedLoanId}
                            onChange={e => setSelectedLoanId(e.target.value)}
                            className="w-full appearance-none px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all outline-none font-bold text-slate-800 pr-12 disabled:opacity-50"
                        >
                            <option value="">-- Select Active Loan --</option>
                            {activeLoans.map(l => (
                                <option key={l.id} value={l.id}>
                                    {l.loanApplicationNumber} - {l.productName} (Bal: {l.outstandingBalance.toLocaleString()})
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-blue-500 transition-colors">
                            {fetchingLoans || refreshingBalance ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                    </div>
                </div>

                {selectedLoan && (
                    <div className="animate-in slide-in-from-top-4 duration-500 space-y-6">
                        <div className="bg-[#0A192F] p-8 rounded-[2rem] border border-slate-800/10 relative overflow-hidden group shadow-2xl shadow-slate-200/50">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -z-0"></div>
                            
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <div className="text-[10px] font-black text-cyan-500/60 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                            <Info className="w-3 h-3" />
                                            Outstanding Exposure
                                        </div>
                                        <p className="text-4xl font-black text-white tracking-tighter">
                                            <span className="text-xs text-cyan-400 mr-1 italic font-bold">KES</span>
                                            {selectedLoan.outstandingBalance.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-2xl backdrop-blur-md border border-white/10">
                                        <TrendingUpIcon className="w-6 h-6 text-cyan-400" />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-4 gap-2">
                                    <BalanceItem label="Penalty" value={selectedLoan.penaltyBalance} active={repaymentAllocation.penalty > 0} />
                                    <BalanceItem label="Fees" value={selectedLoan.feesBalance} active={repaymentAllocation.fees > 0} />
                                    <BalanceItem label="Interest" value={selectedLoan.interestBalance} active={repaymentAllocation.interest > 0} />
                                    <BalanceItem label="Principal" value={selectedLoan.principalBalance} active={repaymentAllocation.principal > 0} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.15em] ml-1">Repayment Volume (KES)</label>
                            <div className="relative group">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    required
                                    value={repaymentAmount}
                                    onChange={e => setRepaymentAmount(e.target.value)}
                                    className="w-full px-6 py-5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400/50 transition-all outline-none font-black text-2xl text-slate-800 placeholder:text-slate-200"
                                    placeholder="0.00"
                                    disabled={loading || isSubmitted}
                                />
                                <button
                                    type="button"
                                    onClick={() => setRepaymentAmount(selectedLoan.outstandingBalance.toString())}
                                    disabled={loading || isSubmitted}
                                    className="absolute right-3 top-3 bottom-3 px-6 bg-[#0A192F] text-white hover:bg-cyan-600 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all shadow-lg active:scale-95 group-hover:shadow-blue-500/20 disabled:opacity-50"
                                >
                                    MAX
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.15em] ml-1">Ledger Rationale</label>
                            <textarea
                                value={repaymentDescription}
                                onChange={e => setRepaymentDescription(e.target.value)}
                                className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm font-bold text-slate-700 placeholder:text-slate-200 resize-none"
                                placeholder="Add payment reference or internal notes..."
                                rows={2}
                                disabled={loading || isSubmitted}
                            />
                        </div>
                    </div>
                )}

                <div className="pt-4 flex gap-3">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 py-5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all"
                        >
                            Dismiss
                        </button>
                    )}
                    <SubmitButton
                        isPending={loading}
                        disabled={!selectedLoanId || !isRepaymentValid || refreshingBalance || isSubmitted}
                        label={isSubmitted ? "Repayment Processed" : "Authorize Payment"}
                        pendingLabel="Processing..."
                        className={cn(
                            "py-5 bg-[#0A192F] hover:bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl shadow-slate-200",
                            onCancel ? "flex-[2]" : "w-full"
                        )}
                        icon={<DollarSign className="w-4 h-4 mr-2" />}
                    />
                </div>
            </form>
        </div>
    )
}

function BalanceItem({ label, value, active }: { label: string, value: number, active: boolean }) {
    return (
        <div className={cn(
            "p-3 rounded-xl border transition-all duration-500",
            active 
                ? "bg-cyan-500/20 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]" 
                : "bg-white/5 border-white/5 opacity-40"
        )}>
            <div className="text-[7px] font-black text-cyan-400 uppercase tracking-widest mb-1">{label}</div>
            <div className="text-[11px] font-black text-white tracking-tight">{value.toLocaleString()}</div>
        </div>
    )
}
