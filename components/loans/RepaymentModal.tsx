'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircleIcon, AlertCircleIcon, XIcon, BanknoteIcon, Download, CheckCircle2, Info, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { ReceiptData } from '@/components/receipts/RepaymentReceipt'
import { formatCurrency, cn } from '@/lib/utils'
import { addLoanRepayment } from '@/app/wallet-add-funds-actions'
import { toast } from 'sonner'
import { useFormAction } from '@/hooks/useFormAction'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { FormError } from '@/components/ui/FormError'

const RepaymentReceipt = dynamic(
    () => import('@/components/receipts/RepaymentReceipt').then((mod) => mod.RepaymentReceipt),
    { ssr: false }
)

const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
    { ssr: false }
)

interface RepaymentModalProps {
    isOpen: boolean
    onClose: () => void
    loan: {
        id: string
        loanApplicationNumber: string
        outstandingBalance: number
        memberId: string
    }
    onSuccess: (newBalance: number) => void
}

export function RepaymentModal({ isOpen, onClose, loan, onSuccess }: RepaymentModalProps) {
    const [amount, setAmount] = useState('')
    const [notes, setNotes] = useState('')
    const { execute, isPending: loading, error } = useFormAction()
    const [balanceInfo, setBalanceInfo] = useState({
        outstandingBalance: loan.outstandingBalance,
        principalBalance: 0,
        interestBalance: 0,
        feesBalance: 0,
        penaltyBalance: 0
    })
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
    const [isMounted, setIsMounted] = useState(false)
    const [fetchingBalance, setFetchingBalance] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Fetch fresh balance on open
    useEffect(() => {
        if (isOpen && loan.id) {
            setFetchingBalance(true)
            import('@/app/wallet-add-funds-actions').then(({ getLoanFreshBalance }) => {
                getLoanFreshBalance(loan.id)
                    .then((fresh) => {
                        setBalanceInfo({
                            outstandingBalance: fresh.outstandingBalance,
                            principalBalance: fresh.principalBalance,
                            interestBalance: fresh.interestBalance,
                            feesBalance: fresh.feesBalance,
                            penaltyBalance: fresh.penaltyBalance
                        })
                    })
                    .finally(() => setFetchingBalance(false))
            })
        }
    }, [isOpen, loan.id])

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        await execute(async () => {
            try {
                const result = await addLoanRepayment({
                    memberId: loan.memberId,
                    loanId: loan.id,
                    amount: parseFloat(amount),
                    description: notes || 'Manual Repayment via Admin'
                })

                if (result && 'error' in result) {
                    return { success: false, error: (result as any).error }
                }

                toast.success('Repayment successful')
                onSuccess(result.newOutstanding)

                if (result.receiptData) {
                    setReceiptData(result.receiptData as ReceiptData)
                } else {
                    onClose()
                    setAmount('')
                    setNotes('')
                }
                return { success: true }
            } catch (err: any) {
                return { success: false, error: err.message || 'Repayment failed' }
            }
        })
    }

    const maxAmount = balanceInfo.outstandingBalance

    // Success View with Receipt
    if (receiptData) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0A192F]/40 backdrop-blur-md animate-in fade-in duration-300">
                <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col font-sans border border-slate-100">
                    <div className="bg-emerald-600 p-10 flex flex-col items-center justify-center text-white relative overflow-hidden">
                        <div className="absolute right-0 top-0 opacity-10 -mr-8 -mt-8">
                            <CheckCircle2 className="w-40 h-40" />
                        </div>
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center mb-6 shadow-lg border border-white/20">
                            <CheckCircle2 className="w-10 h-10 text-white" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-1 opacity-80">Transaction Finalized</p>
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
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                        {loading ? 'Preparing Digital Copy...' : 'Download Receipt'}
                                    </button>
                                )}
                            </PDFDownloadLink>
                        )}

                        <button
                            onClick={() => {
                                setReceiptData(null)
                                setAmount('')
                                setNotes('')
                                onClose()
                            }}
                            className="w-full py-5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0A192F]/40 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 font-sans">

                {}
                <div className="bg-gradient-to-br from-[#0A192F] to-[#001E2B] p-8 flex justify-between items-start shrink-0 relative overflow-hidden text-white">
                    <div className="absolute right-0 top-0 opacity-10 -mr-10 -mt-10">
                        <BanknoteIcon className="w-48 h-48 rotate-12" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-2 font-mono">Loan Liquidation Protocol</p>
                        <h3 className="text-3xl font-black tracking-tighter flex items-center gap-3">
                            <BanknoteIcon className="w-8 h-8 text-cyan-400" />
                            Repay <span className="text-cyan-400">Loan</span>
                        </h3>
                        <p className="opacity-70 text-xs font-bold mt-1 tracking-widest uppercase">{loan.loanApplicationNumber}</p>
                    </div>
                    <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all text-white relative z-10">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {}
                <div className="p-10 overflow-y-auto space-y-8">
                    <FormError message={error} className="animate-in slide-in-from-top-2" />

                    <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 relative group transition-all hover:bg-slate-100/50">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Outstanding Exposure
                                </label>
                                {fetchingBalance ? (
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span className="text-xl font-black italic">Synchronizing...</span>
                                    </div>
                                ) : (
                                    <p className="text-4xl font-black text-[#0A192F] tracking-tighter">
                                        <span className="text-xs text-cyan-600 mr-1 italic font-bold">KES</span>
                                        {formatCurrency(balanceInfo.outstandingBalance).replace('KES', '').trim()}
                                    </p>
                                )}
                            </div>
                            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 opacity-50">
                                <Info className="w-6 h-6 text-slate-400" />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-4 text-center">
                            <BalanceDetail label="Principal" value={balanceInfo.principalBalance} />
                            <BalanceDetail label="Interest" value={balanceInfo.interestBalance} />
                            <BalanceDetail label="Fees" value={balanceInfo.feesBalance} />
                            <BalanceDetail label="Penalty" value={balanceInfo.penaltyBalance} />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                Repayment Volume (KES)
                            </label>
                            <div className="relative group">
                                <input
                                    type="number"
                                    required
                                    min={1}
                                    max={maxAmount}
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full pl-6 pr-24 py-5 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 transition-all outline-none font-black text-2xl text-slate-800 placeholder:text-slate-200"
                                    placeholder="0.00"
                                />
                                <button
                                    type="button"
                                    onClick={() => setAmount(maxAmount.toString())}
                                    className="absolute right-3 top-3 bottom-3 px-5 bg-[#0A192F] text-white hover:bg-cyan-600 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-slate-200 group-hover:scale-105"
                                >
                                    MAX
                                </button>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 ml-1 italic opacity-70">Enter the amount to be credited against the outstanding balance.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                Ledger Rationale
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 transition-all outline-none text-sm font-bold text-slate-700 placeholder:text-slate-200 resize-none"
                                placeholder="Add payment reference or internal notes..."
                                rows={3}
                            />
                        </div>

                        <div className="pt-4">
                            <SubmitButton
                                isPending={loading}
                                disabled={!amount || parseFloat(amount) <= 0 || fetchingBalance}
                                label="Authorize Payment"
                                pendingLabel="Processing Transaction..."
                                className="w-full py-6 bg-[#0A192F] hover:bg-[#00c2e0] text-white rounded-[1.5rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-slate-200 transition-all duration-500"
                            />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

function BalanceDetail({ label, value }: { label: string, value: number }) {
    return (
        <div className="p-3 bg-white/60 rounded-xl border border-white">
            <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1">{label}</div>
            <div className="text-[10px] font-black text-slate-700 tracking-tight">{value.toLocaleString()}</div>
        </div>
    )
}
