'use client'

import React, { useState } from 'react'
import { CheckCircleIcon, AlertCircleIcon, XIcon, BanknoteIcon } from 'lucide-react'
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
            onClose()
            setAmount('')
            setNotes('')
        } catch (err: any) {
            setError(err.message || 'Repayment failed')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const maxAmount = loan.outstandingBalance

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
                                Outstanding Balance
                            </label>
                            <p className="text-2xl font-black text-slate-700">
                                {formatCurrency(loan.outstandingBalance)}
                            </p>
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
