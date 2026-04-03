'use client'

import React, { useState } from 'react'
import { PlusCircleIcon } from 'lucide-react'
import { useFormAction } from '@/hooks/useFormAction'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { FormError } from '@/components/ui/FormError'

interface TransactionFormProps {
    memberId: string
    memberName: string
    onSuccess?: () => void
}

export function WalletTransactionForm({ memberId, memberName, onSuccess }: TransactionFormProps) {
    const [isOpen, setIsOpen] = useState(false)
    const { isPending: loading, error, execute } = useFormAction()
    const [success, setSuccess] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const currentForm = e.currentTarget
        const formData = new FormData(currentForm)

        await execute(async () => {
            const payload = {
                type: formData.get('type'),
                amount: parseFloat(formData.get('amount') as string),
                description: formData.get('description'),
                relatedLoanId: formData.get('relatedLoanId') || undefined
            }

            const response = await fetch(`/api/wallet/${memberId}/transaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await response.json()

            if (!response.ok) {
                return { success: false, error: data.error || 'Failed to create transaction' }
            }

            setSuccess(true)
            setTimeout(() => {
                setIsOpen(false)
                setSuccess(false)
                onSuccess?.()
            }, 1500)

            return { success: true }
        })
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
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 step-container">
                        <h3 className="text-xl font-black text-slate-900 mb-4">
                            New Transaction for {memberName}
                        </h3>

                        {success && (
                            <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl mb-4 font-bold animate-in fade-in zoom-in duration-300">
                                ✓ Transaction created successfully!
                            </div>
                        )}

                        <FormError message={error} />

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
                                <SubmitButton
                                    isPending={loading}
                                    label={success ? 'Created!' : 'Create Transaction'}
                                    pendingLabel="Creating..."
                                    className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-cyan-500/20"
                                    disabled={success}
                                />
                                <button
                                    type="button"
                                    onClick={() => { setIsOpen(false); }}
                                    className="px-6 py-4 rounded-2xl text-slate-600 font-bold hover:bg-slate-100 transition-all font-sans"
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
