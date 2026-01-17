'use client'

import React, { useState } from 'react'
import { PlusCircleIcon } from 'lucide-react'

interface TransactionFormProps {
    memberId: string
    memberName: string
    onSuccess?: () => void
}

export function WalletTransactionForm({ memberId, memberName, onSuccess }: TransactionFormProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()

        const formData = new FormData(e.currentTarget)

        const payload = {
            type: formData.get('type'),
            amount: parseFloat(formData.get('amount') as string),
            description: formData.get('description'),
            relatedLoanId: formData.get('relatedLoanId') || undefined
        }

        try {
            setLoading(true)
            setError('')

            const response = await fetch(`/api/wallet/${memberId}/transaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create transaction')
            }

            setSuccess(true)
            setTimeout(() => {
                setIsOpen(false)
                setSuccess(false)
                onSuccess?.()
            }, 1500)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-cyan-600 transition-all flex items-center gap-2"
            >
                <PlusCircleIcon className="w-5 h-5" />
                New Transaction
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
                        <h3 className="text-xl font-black text-slate-900 mb-4">
                            New Transaction for {memberName}
                        </h3>

                        {success && (
                            <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl mb-4 font-bold">
                                ✓ Transaction created successfully!
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-4">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">
                                    Transaction Type
                                </label>
                                <select
                                    name="type"
                                    required
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-black"
                                >
                                    <option value="">Select type...</option>
                                    <option value="CONTRIBUTION">Contribution</option>
                                    <option value="LOAN_DISBURSEMENT">Loan Disbursement</option>
                                    <option value="REPAYMENT">Repayment</option>
                                    <option value="FEE">Fee</option>
                                    <option value="PENALTY">Penalty</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">
                                    Amount (KES)
                                </label>
                                <input
                                    name="amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    required
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-black"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    required
                                    maxLength={500}
                                    rows={3}
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-black resize-none"
                                    placeholder="Enter transaction details..."
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">
                                    Related Loan ID (Optional)
                                </label>
                                <input
                                    name="relatedLoanId"
                                    type="text"
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-black"
                                    placeholder="Leave empty if not related to a loan"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={loading || success}
                                    className="flex-1 bg-cyan-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-cyan-500/20 hover:bg-cyan-600 transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Creating...' : success ? 'Created!' : 'Create Transaction'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setIsOpen(false); setError(''); }}
                                    className="px-6 py-4 rounded-2xl text-slate-600 font-bold hover:bg-slate-100 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
