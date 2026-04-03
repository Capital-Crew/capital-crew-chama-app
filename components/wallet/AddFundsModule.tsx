'use client'

import React, { useState, useEffect } from 'react'
import { addContribution, addPenaltyPayment, addLoanRepayment, getActiveLoansByMember } from '@/app/wallet-add-funds-actions'
import { CoinsIcon, AlertCircleIcon, TrendingUpIcon, CheckCircleIcon } from 'lucide-react'
import { PremiumTabs } from '../shared/PremiumTabs'
import { useFormAction } from '@/hooks/useFormAction'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { FormError } from '@/components/ui/FormError'

type DepositType = 'share' | 'penalty' | 'loan'

interface ActiveLoan {
    id: string
    loanApplicationNumber: string
    productName: string
    disbursedAmount: number
    outstandingBalance: number
    penaltyBalance: number
    interestBalance: number
    principalBalance: number
    status: string
}

export function AddFundsModule({ memberId, userRole }: { memberId: string; userRole: string }) {
    const [activeTab, setActiveTab] = useState<DepositType>('share')
    const { isPending: loading, error, execute, reset } = useFormAction()
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Share Capital state
    const [shareAmount, setShareAmount] = useState('')
    const [shareDescription, setShareDescription] = useState('')

    // Penalty Payment state
    const [penaltyAmount, setPenaltyAmount] = useState('')
    const [penaltyDescription, setPenaltyDescription] = useState('')

    // Loan Repayment state
    const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([])
    const [selectedLoanId, setSelectedLoanId] = useState('')
    const [selectedLoan, setSelectedLoan] = useState<ActiveLoan | null>(null)
    const [repaymentAmount, setRepaymentAmount] = useState('')
    const [repaymentDescription, setRepaymentDescription] = useState('')
    const [repaymentAllocation, setRepaymentAllocation] = useState({ penalty: 0, interest: 0, principal: 0 })

    // Load active loans when loan tab is selected
    useEffect(() => {
        if (activeTab === 'loan') {
            loadActiveLoans()
        }
    }, [activeTab, memberId])

    // Update selected loan when loan ID changes
    useEffect(() => {
        const loan = activeLoans.find(l => l.id === selectedLoanId)
        setSelectedLoan(loan || null)
        setRepaymentAmount('')
        calculateAllocation(loan || null, 0)
    }, [selectedLoanId, activeLoans])

    // Recalculate allocation when amount changes
    useEffect(() => {
        if (selectedLoan && repaymentAmount) {
            calculateAllocation(selectedLoan, parseFloat(repaymentAmount) || 0)
        }
    }, [repaymentAmount, selectedLoan])

    const handleTabChange = (id: string) => {
        setActiveTab(id as DepositType)
        reset()
        setMessage(null)
    }

    const loadActiveLoans = async () => {
        try {
            const loans = await getActiveLoansByMember(memberId)
            setActiveLoans(loans)
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message })
        }
    }

    const calculateAllocation = (loan: ActiveLoan | null, amount: number) => {
        if (!loan || amount <= 0) {
            setRepaymentAllocation({ penalty: 0, interest: 0, principal: 0 })
            return
        }

        let remaining = amount
        const allocation = { penalty: 0, interest: 0, principal: 0 }

        // Waterfall: Penalty → Interest → Principal
        if (remaining > 0 && loan.penaltyBalance > 0) {
            allocation.penalty = Math.min(remaining, loan.penaltyBalance)
            remaining -= allocation.penalty
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

    const handleShareContribution = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage(null)

        await execute(async (idempotencyKey) => {
            const result = await addContribution({
                memberId,
                amount: parseFloat(shareAmount),
                description: shareDescription,
                idempotencyKey
            })

            setMessage({
                type: 'success',
                text: `Contribution successful! New contribution balance: KES ${result.newShareBalance.toLocaleString()}`
            })
            setShareAmount('')
            setShareDescription('')
            return { success: true }
        }, { useIdempotency: true })
    }

    const handlePenaltyPayment = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage(null)

        await execute(async (idempotencyKey) => {
            const result = await addPenaltyPayment({
                memberId,
                amount: parseFloat(penaltyAmount),
                description: penaltyDescription,
                idempotencyKey
            })

            setMessage({
                type: 'success',
                text: `Penalty payment successful! New balance: KES ${result.newWithdrawableBalance.toLocaleString()}`
            })
            setPenaltyAmount('')
            setPenaltyDescription('')
            return { success: true }
        }, { useIdempotency: true })
    }

    const handleLoanRepayment = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage(null)

        await execute(async (idempotencyKey) => {
            const result = await addLoanRepayment({
                memberId,
                loanId: selectedLoanId,
                amount: parseFloat(repaymentAmount),
                description: repaymentDescription,
                idempotencyKey
            })

            const allocationText = `Penalty: ${result.allocation.paidPenalty}, Interest: ${result.allocation.paidInterest}, Principal: ${result.allocation.paidPrincipal}`
            setMessage({
                type: 'success',
                text: `Loan repayment successful! ${allocationText}. ${result.isFullyPaid ? '✓ LOAN CLEARED!' : `Remaining: KES ${result.newOutstanding.toLocaleString()}`}`
            })

            setSelectedLoanId('')
            setRepaymentAmount('')
            setRepaymentDescription('')
            loadActiveLoans() // Reload to update balances
            return { success: true }
        }, { useIdempotency: true })
    }

    const isRepaymentValid = selectedLoan && parseFloat(repaymentAmount) > 0 && parseFloat(repaymentAmount) <= selectedLoan.outstandingBalance

    return (
        <div className="bg-white border border-slate-200 rounded-3xl p-8">
            <h2 className="text-2xl font-black text-slate-900 mb-6 uppercase">Add Funds</h2>

            <div className="border-b border-slate-200 mb-6">
                <PremiumTabs 
                    tabs={[
                        { id: 'share', label: 'Contributions', icon: CoinsIcon },
                        { id: 'penalty', label: 'Penalty & Fines', icon: AlertCircleIcon },
                        { id: 'loan', label: 'Loan Repayment', icon: TrendingUpIcon }
                    ]}
                    activeTab={activeTab}
                    onChange={handleTabChange}
                />
            </div>

            {message && (
                <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                    {message.type === 'success' ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    ) : (
                        <AlertCircleIcon className="w-5 h-5 text-red-600" />
                    )}
                    <p className={`text-sm font-bold ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                        {message.text}
                    </p>
                </div>
            )}

            <FormError message={error} className="mb-6" />

            <div className="step-container">
                {activeTab === 'share' && (
                    <form onSubmit={handleShareContribution} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Amount (KES)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={shareAmount}
                                onChange={(e) => setShareAmount(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                placeholder="0.00"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                            <textarea
                                value={shareDescription}
                                onChange={(e) => setShareDescription(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                placeholder="Purpose of contribution..."
                                rows={3}
                                required
                            />
                        </div>

                        <SubmitButton
                            isPending={loading}
                            label="Add Contribution"
                            pendingLabel="Processing..."
                            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-3 rounded-xl font-black uppercase text-sm transition-colors"
                        />
                    </form>
                )}

                {activeTab === 'penalty' && (
                    <form onSubmit={handlePenaltyPayment} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Amount (KES)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={penaltyAmount}
                                onChange={(e) => setPenaltyAmount(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                placeholder="0.00"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                            <textarea
                                value={penaltyDescription}
                                onChange={(e) => setPenaltyDescription(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                placeholder="Reason for penalty/fine payment..."
                                rows={3}
                                required
                            />
                        </div>

                        <SubmitButton
                            isPending={loading}
                            label="Pay Penalty/Fine"
                            pendingLabel="Processing..."
                            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-3 rounded-xl font-black uppercase text-sm transition-colors"
                        />
                    </form>
                )}

                {activeTab === 'loan' && (
                    <form onSubmit={handleLoanRepayment} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Select Loan</label>
                            <select
                                value={selectedLoanId}
                                onChange={(e) => setSelectedLoanId(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                required
                            >
                                <option value="">-- Select a loan --</option>
                                {activeLoans.map(loan => (
                                    <option key={loan.id} value={loan.id}>
                                        {loan.loanApplicationNumber} - {loan.productName} (Outstanding: KES {loan.outstandingBalance.toLocaleString()})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedLoan && (
                            <>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                    <h4 className="font-black text-slate-900 text-sm uppercase">Outstanding Balance</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="text-slate-600">Penalty:</div>
                                        <div className="font-bold text-right">KES {selectedLoan.penaltyBalance.toLocaleString()}</div>

                                        <div className="text-slate-600">Interest:</div>
                                        <div className="font-bold text-right">KES {selectedLoan.interestBalance.toLocaleString()}</div>

                                        <div className="text-slate-600">Principal:</div>
                                        <div className="font-bold text-right">KES {selectedLoan.principalBalance.toLocaleString()}</div>

                                        <div className="text-slate-900 font-black border-t pt-2">Total:</div>
                                        <div className="font-black text-right border-t pt-2">KES {selectedLoan.outstandingBalance.toLocaleString()}</div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Repayment Amount (KES) - Max: {selectedLoan.outstandingBalance.toLocaleString()}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            max={selectedLoan.outstandingBalance}
                                            value={repaymentAmount}
                                            onChange={(e) => setRepaymentAmount(e.target.value)}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                            placeholder="0.00"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setRepaymentAmount(selectedLoan.outstandingBalance.toString())}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-cyan-100 text-cyan-700 rounded-lg text-xs font-bold uppercase hover:bg-cyan-200"
                                        >
                                            Max
                                        </button>
                                    </div>
                                    {repaymentAmount && parseFloat(repaymentAmount) > selectedLoan.outstandingBalance && (
                                        <p className="text-red-600 text-xs mt-1 font-bold">⚠ Amount exceeds outstanding balance</p>
                                    )}
                                </div>

                                {repaymentAmount && parseFloat(repaymentAmount) > 0 && isRepaymentValid && (
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                                        <h4 className="font-black text-green-900 text-sm uppercase">Payment Allocation</h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm text-green-800">
                                            <div>To Penalty:</div>
                                            <div className="font-bold text-right">KES {repaymentAllocation.penalty.toLocaleString()}</div>

                                            <div>To Interest:</div>
                                            <div className="font-bold text-right">KES {repaymentAllocation.interest.toLocaleString()}</div>

                                            <div>To Principal:</div>
                                            <div className="font-bold text-right">KES {repaymentAllocation.principal.toLocaleString()}</div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                                    <textarea
                                        value={repaymentDescription}
                                        onChange={(e) => setRepaymentDescription(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                        placeholder="Payment notes..."
                                        rows={2}
                                        required
                                    />
                                </div>
                            </>
                        )}

                        <SubmitButton
                            isPending={loading}
                            disabled={!isRepaymentValid}
                            label="Submit Repayment"
                            pendingLabel="Processing..."
                            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-3 rounded-xl font-black uppercase text-sm transition-colors"
                        />
                    </form>
                )}
            </div>
        </div>
    )
}
