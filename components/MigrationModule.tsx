'use client'

import React, { useState } from 'react'
import { seedChartOfAccounts } from '@/app/seed-accounts-actions'
import { AlertCircleIcon, CheckCircleIcon, DatabaseIcon } from 'lucide-react'

export function MigrationModule() {
    // Only keeping Seeding functionality as legacy migration (manual/CSV) relied on deleted JournalEntry
    const [seeding, setSeeding] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleSeedAccounts = async () => {
        setSeeding(true)
        setMessage(null)

        try {
            const result = await seedChartOfAccounts()
            setMessage({ type: 'success', text: `Successfully seeded ${result.accountsCreated} accounts!` })
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message })
        } finally {
            setSeeding(false)
        }
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {}
            <div className="mb-6">
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">System & Data Setup</h1>
                <p className="text-slate-600 mt-2">Configure core system accounting.</p>
            </div>

            {}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="text-sm font-black text-amber-900 mb-1">⚠️ CHART OF ACCOUNTS</h3>
                        <p className="text-xs text-amber-700">
                            Seed the Chart of Accounts to create the necessary accounting structure (accounts like Cash, Savings, Share Capital, etc.).
                            This is safe to run if your database is empty.
                        </p>
                    </div>
                    <button
                        onClick={handleSeedAccounts}
                        disabled={seeding}
                        className="ml-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-xs uppercase transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                        {seeding ? 'Seeding...' : 'Seed Accounts'}
                    </button>
                </div>
            </div>

            {}
            {message && (
                <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
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

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
                <p className="text-slate-500 text-sm">Legacy data migration tools have been removed as part of the system upgrade.</p>
            </div>
        </div>
    )
}
