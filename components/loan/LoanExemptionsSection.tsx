'use client'

import React, { useState } from 'react'
import { updateLoanExemptions } from '@/app/loan-exemption-actions'
import { toast } from '@/lib/toast'

interface LoanExemptionsSectionProps {
    loanId: string
    exemptions: {
        processingFee?: boolean
        insuranceFee?: boolean
        defaultCheck?: boolean
    }
    isOwnLoan: boolean
    loanStatus?: string // Optional: Current loan status
    isEditable?: boolean // Optional: Override editability
    onUpdate?: () => void
    onChange?: (exemptions: any) => void
}

export function LoanExemptionsSection({
    loanId,
    exemptions = {},
    isOwnLoan,
    loanStatus,
    isEditable = true,
    onUpdate,
    onChange
}: LoanExemptionsSectionProps) {
    const [updating, setUpdating] = useState(false)
    const [localExemptions, setLocalExemptions] = useState(exemptions)

    // Sync local state when prop changes (e.g. from parent state update)
    React.useEffect(() => {
        setLocalExemptions(exemptions)
    }, [exemptions])

    const handleToggle = async (field: 'processingFee' | 'insuranceFee' | 'defaultCheck') => {
        if (isOwnLoan) {
            toast.error('You cannot modify exemptions on your own loan')
            return
        }

        // Check if editing is allowed based on loan status
        if (!isEditable || (loanStatus && loanStatus !== 'APPLICATION')) {
            toast.error('Exemptions can only be modified when the loan is in Draft/Application stage')
            return
        }

        setUpdating(true)
        const newExemptions = {
            ...localExemptions,
            [field]: !localExemptions[field]
        }

        if (onChange) {
            // Local Mode
            onChange(newExemptions)
            setLocalExemptions(newExemptions)
            setUpdating(false)
            return
        }

        // Server Mode
        const result = await updateLoanExemptions(loanId, newExemptions)

        if (result.error) {
            toast.error(result.error)
        } else {
            setLocalExemptions(newExemptions)
            toast.success('Exemption updated successfully')
            onUpdate?.()
        }

        setUpdating(false)
    }

    const exemptionItems = [
        {
            key: 'processingFee' as const,
            label: 'Processing Fee Exemption',
        },
        {
            key: 'insuranceFee' as const,
            label: 'Insurance Fee Exemption',
        },
        {
            key: 'defaultCheck' as const,
            label: 'Exempt default check',
        }
    ]

    // Determine if toggles should be disabled
    const isDisabled = isOwnLoan || updating || !isEditable || Boolean(loanStatus && loanStatus !== 'APPLICATION')

    return (
        <div className="w-full">
            <h3 className="font-bold text-slate-700 text-sm mb-4 border-b border-slate-200 pb-2">Loan Exemptions</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                {exemptionItems.map(item => {
                    const isActive = localExemptions[item.key] === true

                    return (
                        <div key={item.key} className="flex items-center justify-between group">
                            <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-800 transition-colors whitespace-nowrap">
                                {item.label}
                            </span>

                            {/* Dotted spacer */}
                            <div className="flex-grow mx-3 border-b border-dotted border-slate-300 relative top-1"></div>

                            <button
                                type="button"
                                onClick={() => handleToggle(item.key)}
                                disabled={isDisabled}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${isActive ? 'bg-slate-600' : 'bg-slate-200'
                                    }`}
                            >
                                <span className="sr-only">Use setting</span>
                                <span
                                    aria-hidden={true}
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-4' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>
                    )
                })}
            </div>

            {isOwnLoan && (
                <p className="text-[10px] text-slate-400 mt-4 italic">
                    * Contact an administrator to request exemptions
                </p>
            )}

            {!isOwnLoan && loanStatus && loanStatus !== 'APPLICATION' && (
                <p className="text-[10px] text-amber-600 mt-4 italic font-semibold">
                    * Exemptions can only be modified when the loan is in Draft/Application stage
                </p>
            )}
        </div>
    )
}
