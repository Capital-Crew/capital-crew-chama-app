'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircleIcon, AlertCircleIcon, XIcon, BanknoteIcon, Download, Printer } from 'lucide-react'
import dynamic from 'next/dynamic'
import { RepaymentReceipt, type ReceiptData } from '@/components/receipts/RepaymentReceipt'

const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
    { ssr: false }
)
import { formatCurrency } from '@/lib/utils'
import { addLoanRepayment } from '@/app/wallet-add-funds-actions'
import { toast } from 'sonner' // Assuming sonner or similar usage, adapting to project style

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
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [balanceInfo, setBalanceInfo] = useState({
        outstandingBalance: loan.outstandingBalance,
        principalBalance: 0,
        interestBalance: 0,
        feesBalance: 0,
        penaltyBalance: 0
    })
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Fetch fresh balance on open
    React.useEffect(() => {
        if (isOpen && loan.id) {
            import('@/app/wallet-add-funds-actions').then(({ getLoanFreshBalance }) => {
                getLoanFreshBalance(loan.id).then((fresh) => {
                    setBalanceInfo({
                        outstandingBalance: fresh.outstandingBalance,
                        principalBalance: fresh.principalBalance,
                        interestBalance: fresh.interestBalance,
                        feesBalance: fresh.feesBalance,
                        penaltyBalance: fresh.penaltyBalance
                    })
                }).catch(err => console.error('Failed to refresh balance:', err))
            })
        }
    }, [isOpen, loan.id])

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const result = await addLoanRepayment({
                memberId: loan.memberId,
                loanId: loan.id,
                amount: parseFloat(amount),
                description: notes || 'Manual Repayment via Admin'
            })

            if (result && 'error' in result) {
                throw new Error((result as any).error)
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
        } catch (err: any) {
            setError(err.message || 'Repayment failed')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const maxAmount = balanceInfo.outstandingBalance

    // Success View with Receipt
    if (receiptData) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col text-center">
                    <div className="bg-green-600 p-8 flex flex-col items-center justify-center text-white">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                            <CheckCircleIcon className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-tight">Payment Successful</h3>
                        <p className="opacity-90 font-medium mt-1">KES {receiptData.amount.toLocaleString()}</p>
                    </div>

                    <div className="p-8 flex flex-col gap-4">
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-left space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-bold">Transaction ID</span>
                                <span className="font-mono font-bold text-slate-700">{receiptData.transactionId.slice(-8).toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-bold">Date</span>
                                <span className="font-bold text-slate-700">{new Date(receiptData.date).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {isMounted && (
                            <PDFDownloadLink
                                document={<RepaymentReceipt data={receiptData} />}
                                fileName={`Receipt-${receiptData.transactionId}.pdf`}
                                className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2"
                            >
                                {/* @ts-ignore - React-PDF types issue with dynamic import rendering children function */}
                                {({ loading }: any) => (
                                    <>
                                        <Download className="w-5 h-5" />
                                        {loading ? 'Preparing Receipt...' : 'Download Receipt'}
                                    </>
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
                            className="w-full py-4 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold uppercase tracking-widest text-sm transition-all"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 flex justify-between items-start shrink-0">
                    <div className="text-white">
                        <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                            <BanknoteIcon className="w-6 h-6" />
                            Repay Loan
                        </h3>
                        <p className="opacity-90 text-sm font-medium mt-1">{loan.loanApplicationNumber}</p>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700">
                            <AlertCircleIcon className="w-5 h-5 shrink-0" />
                            <p className="text-sm font-bold">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                                Total Outstanding Balance
                            </label>
                            <p className="text-2xl font-black text-slate-700">
                                {formatCurrency(balanceInfo.outstandingBalance)}
                            </p>
                            <div className="mt-2 pt-2 border-t border-slate-200 grid grid-cols-4 gap-2 text-center">
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Prin</div>
                                    <div className="text-xs font-bold text-slate-600">{balanceInfo.principalBalance.toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Int</div>
                                    <div className="text-xs font-bold text-slate-600">{balanceInfo.interestBalance.toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Fees</div>
                                    <div className="text-xs font-bold text-slate-600">{balanceInfo.feesBalance.toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Pen</div>
                                    <div className="text-xs font-bold text-slate-600">{balanceInfo.penaltyBalance.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Repayment Amount (KES)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    required
                                    min={1}
                                    max={maxAmount}
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full pl-4 pr-16 py-3 rounded-xl border-2 border-slate-200 focus:border-cyan-500 focus:ring-0 font-bold text-lg text-slate-800 transition-all"
                                    placeholder="0.00"
                                />
                                <button
                                    type="button"
                                    onClick={() => setAmount(maxAmount.toString())}
                                    className="absolute right-2 top-2 bottom-2 px-3 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 rounded-lg text-xs font-black uppercase tracking-wider transition-colors"
                                >
                                    MAX
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Notes / Reference
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-cyan-500 focus:ring-0 text-sm font-medium text-slate-700 resize-none transition-all"
                                placeholder="e.g. M-Pesa Ref QH..."
                                rows={2}
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading || !amount || parseFloat(amount) <= 0}
                                className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-black uppercase tracking-widest text-sm shadow-lg shadow-cyan-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        Submit Payment
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
