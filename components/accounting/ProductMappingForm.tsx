'use client'

import { useState } from 'react'
import { updateProductMappings } from '@/app/actions/accounting'
import { Loader2 } from 'lucide-react'

type Account = {
    id: string
    name: string
    code: string
    type: string // Assuming AccountType is string
}

interface ProductMappingFormProps {
    productId: string
    glAccounts: Account[]
    initialMappings?: Record<string, string> // Optional pre-fill
}

const MAPPING_TYPES = [
    { key: 'INTEREST_INCOME', label: 'Interest Revenue Account', typeFilter: 'INCOME' },
    { key: 'INTEREST_RECEIVABLE', label: 'Interest Receivable Account', typeFilter: 'ASSET' },
    { key: 'PENALTY_INCOME', label: 'Penalty Revenue Account', typeFilter: 'INCOME' },
    { key: 'PENALTY_RECEIVABLE', label: 'Penalty Receivable Account', typeFilter: 'ASSET' },
    { key: 'LOAN_PORTFOLIO', label: 'Loan Portfolio Account', typeFilter: 'ASSET' },
    { key: 'FUND_SOURCE', label: 'Fund Source (Bank/Cash)', typeFilter: 'ASSET' }, // Could be Liability or Equity too depending on structure
]

export function ProductMappingForm({ productId, glAccounts, initialMappings = {} }: ProductMappingFormProps) {
    const [mappings, setMappings] = useState<Record<string, string>>(initialMappings)
    const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState('')

    const handleChange = (key: string, value: string) => {
        setMappings(prev => ({ ...prev, [key]: value }))
        setStatus('idle')
    }

    const isValid = MAPPING_TYPES.every(t => mappings[t.key] && mappings[t.key] !== '')

    const handleSave = async () => {
        if (!isValid) return
        setStatus('saving')
        setErrorMessage('')

        const result = await updateProductMappings(productId, mappings)

        if (result.success) {
            setStatus('success')
        } else {
            setStatus('error')
            setErrorMessage(result.error || 'Failed to save configuration')
        }
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900">Accounting Configuration</h3>
                <p className="text-sm text-gray-500">Map GL accounts for automated transaction processing.</p>
            </div>

            {status === 'success' && (
                <div className="p-3 bg-green-50 text-green-700 rounded text-sm mb-4">
                    ✅ Configuration saved successfully.
                </div>
            )}

            {status === 'error' && (
                <div className="p-3 bg-red-50 text-red-700 rounded text-sm mb-4">
                    ❌ {errorMessage}
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                {MAPPING_TYPES.map((field) => {
                    // Simple Filter Logic (Optional - if 'type' matches)
                    // If typeFilter is 'ASSET', we show 'ASSET' accounts.
                    // But we should allow flexibility or strictness depending on User request.
                    // User Request: 'Filtering: ... ideally only show ...'
                    const filteredAccounts = glAccounts.filter(acc => {
                        // Loose matching since we don't know exact Enum values in runtime props without checking
                        // Assuming standard convention: 'ASSET', 'INCOME', etc.
                        // But also Fund Source could be Cash (Asset) or Overdraft (Liability).
                        if (field.key === 'FUND_SOURCE') return true // Allow all for Fund Source just in case
                        return acc.type === field.typeFilter
                    })

                    // Fallback: If filter yields 0 results, show all (to prevent blocking if types mismatch)
                    const accountsToShow = filteredAccounts.length > 0 ? filteredAccounts : glAccounts

                    return (
                        <div key={field.key} className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                {field.label} <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={mappings[field.key] || ''}
                                onChange={(e) => handleChange(field.key, e.target.value)}
                                className="w-full text-zinc-900 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                disabled={status === 'saving'}
                            >
                                <option value="">Select Account...</option>
                                {accountsToShow.map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.code} - {acc.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-400">Target Type: {field.typeFilter}</p>
                        </div>
                    )
                })}
            </div>

            <div className="pt-4 border-t flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={!isValid || status === 'saving'}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
                        ${!isValid || status === 'saving' ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
                >
                    {status === 'saving' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Configuration
                </button>
            </div>
        </div>
    )
}
