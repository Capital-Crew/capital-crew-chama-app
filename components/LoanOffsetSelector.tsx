'use client'

import { useState, useEffect } from 'react'
import { CheckSquare, Square, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'

interface ActiveLoan {
    id: string
    loanApplicationNumber: string
    loanProduct: { name: string }
    current_balance: number
    outstandingBalance?: number
    penalties: number
    disbursementDate: Date
    interestRate: number
}

interface LoanOffsetSelectorProps {
    memberId: string
    onSelectionChange: (selectedLoanIds: string[]) => void
    disabled?: boolean
}

export function LoanOffsetSelector({
    memberId,
    onSelectionChange,
    disabled = false
}: LoanOffsetSelectorProps) {
    const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([])
    const [selectedLoanIds, setSelectedLoanIds] = useState<string[]>([])
    const [showDropdown, setShowDropdown] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!memberId) return

        // Fetch member's active loans
        setLoading(true)
        fetch(`/api/members/${memberId}/active-loans`)
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    setError(data.error)
                } else {
                    setActiveLoans(data.loans || [])
                }
            })
            .catch(err => {
                console.error('Failed to fetch active loans:', err)
                setError('Failed to load active loans')
            })
            .finally(() => setLoading(false))
    }, [memberId])

    const toggleLoan = (loanId: string) => {
        if (disabled) return

        const newSelection = selectedLoanIds.includes(loanId)
            ? selectedLoanIds.filter(id => id !== loanId)
            : [...selectedLoanIds, loanId]

        setSelectedLoanIds(newSelection)
        onSelectionChange(newSelection)
    }

    const toggleAll = () => {
        if (disabled) return

        if (selectedLoanIds.length === activeLoans.length) {
            // Deselect all
            setSelectedLoanIds([])
            onSelectionChange([])
        } else {
            // Select all
            const allIds = activeLoans.map(loan => loan.id)
            setSelectedLoanIds(allIds)
            onSelectionChange(allIds)
        }
    }

    const formatCurrency = (amount: number) => {
        return `Ksh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    return (
        <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 uppercase mb-2">
                Loans To Offset
            </label>

            <button
                type="button"
                onClick={() => !disabled && setShowDropdown(!showDropdown)}
                disabled={disabled || loading}
                className={`w-full px-4 py-3 border border-slate-200 rounded-xl flex justify-between items-center transition-all ${disabled
                    ? 'bg-slate-50 cursor-not-allowed border-slate-100'
                    : 'border-slate-200 hover:border-cyan-400 bg-slate-50'
                    }`}
            >
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${disabled ? 'text-slate-400' : 'text-slate-700'}`}>
                        {loading ? 'Loading active loans...' : selectedLoanIds.length > 0
                            ? `Selected ${selectedLoanIds.length} loan${selectedLoanIds.length > 1 ? 's' : ''}`
                            : 'Select loans to offset...'}
                    </span>
                    {selectedLoanIds.length > 0 && !disabled && (
                        <span className="bg-cyan-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase">
                            {selectedLoanIds.length}
                        </span>
                    )}
                </div>
                {!disabled && (showDropdown ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />)}
            </button>

            {showDropdown && !disabled && (
                <div className="border border-slate-200 rounded-xl p-4 space-y-2 max-h-60 overflow-y-auto bg-white shadow-xl ring-1 ring-slate-900/5">
                    {error ? (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <p className="text-[10px] text-red-600 font-bold uppercase">{error}</p>
                        </div>
                    ) : activeLoans.length === 0 ? (
                        <p className="text-xs text-slate-400 font-bold text-center py-4 italic">
                            No active loans available to offset
                        </p>
                    ) : (
                        <>
                            {/* Select All Button */}
                            <button
                                type="button"
                                onClick={toggleAll}
                                className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer border border-slate-100 bg-slate-50/50 transition-colors"
                            >
                                <span className="font-black text-[10px] text-slate-500 uppercase tracking-wider">
                                    {selectedLoanIds.length === activeLoans.length ? 'Deselect All' : 'Select All Available'}
                                </span>
                                {selectedLoanIds.length === activeLoans.length ? (
                                    <CheckSquare className="w-4 h-4 text-cyan-500" />
                                ) : (
                                    <Square className="w-4 h-4 text-slate-300" />
                                )}
                            </button>

                            {/* Loan List */}
                            {activeLoans.map(loan => (
                                <label
                                    key={loan.id}
                                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all ${selectedLoanIds.includes(loan.id)
                                        ? 'bg-cyan-50 border-cyan-200 shadow-sm'
                                        : 'hover:bg-slate-50 border-slate-100'
                                        }`}
                                >
                                    <div className="flex-1">
                                        <div className="font-black text-xs text-slate-900 uppercase tracking-tight">
                                            {loan.loanApplicationNumber}
                                        </div>
                                        <div className="text-[10px] text-orange-600 font-black mt-0.5">
                                            Balance: {formatCurrency(loan.outstandingBalance || loan.current_balance)}
                                        </div>
                                    </div>

                                    <div className="ml-4">
                                        {selectedLoanIds.includes(loan.id) ? (
                                            <CheckSquare className="w-5 h-5 text-cyan-500" />
                                        ) : (
                                            <Square className="w-5 h-5 text-slate-200" />
                                        )}
                                    </div>

                                    <input
                                        type="checkbox"
                                        checked={selectedLoanIds.includes(loan.id)}
                                        onChange={() => toggleLoan(loan.id)}
                                        className="hidden"
                                    />
                                </label>
                            ))}
                        </>
                    )}
                </div>
            )}

            <p className="text-[10px] text-slate-400 font-bold italic mt-1">
                Select existing loans to be deducted from the applied amount.
            </p>
        </div>
    )
}
