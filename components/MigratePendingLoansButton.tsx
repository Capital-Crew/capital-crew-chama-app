'use client'

import { useState } from 'react'
import { migratePendingLoansDirectSQL } from '@/app/migrate-pending-loans'
import { CheckCircleIcon, AlertCircleIcon, LoaderIcon } from 'lucide-react'

export function MigratePendingLoansButton() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const handleMigration = async () => {
        if (!confirm('This will update all pending loans with sufficient approvals to APPROVED status. Continue?')) {
            return
        }

        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const migrationResult = await migratePendingLoansDirectSQL()
            setResult(migrationResult)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <button
                onClick={handleMigration}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold uppercase text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
            >
                {loading ? (
                    <>
                        <LoaderIcon className="w-4 h-4 animate-spin" />
                        Migrating...
                    </>
                ) : (
                    'Migrate Pending Loans to Approved'
                )}
            </button>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-red-900">Error</h3>
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                </div>
            )}

            {result && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-4">
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        <h3 className="font-bold text-green-900">Migration Complete</h3>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-white rounded p-3">
                            <p className="text-xs text-slate-500">Total Pending</p>
                            <p className="text-2xl font-black text-slate-900">{result.total}</p>
                        </div>
                        <div className="bg-white rounded p-3">
                            <p className="text-xs text-slate-500">Updated to APPROVED</p>
                            <p className="text-2xl font-black text-green-600">{result.updated}</p>
                        </div>
                        <div className="bg-white rounded p-3">
                            <p className="text-xs text-slate-500">Skipped</p>
                            <p className="text-2xl font-black text-slate-600">{result.skipped}</p>
                        </div>
                    </div>

                    {result.details.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-bold text-slate-700">Details:</h4>
                            <div className="max-h-60 overflow-y-auto space-y-1">
                                {result.details.map((detail: any, index: number) => (
                                    <div key={index} className="bg-white rounded p-2 text-xs">
                                        <span className="font-bold">{detail.loanNumber}</span> - {detail.member}
                                        <span className="ml-2 text-slate-500">({detail.approvals} approvals)</span>
                                        <span className={`ml-2 font-medium ${detail.action.includes('Updated') ? 'text-green-600' : 'text-slate-500'}`}>
                                            {detail.action}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
