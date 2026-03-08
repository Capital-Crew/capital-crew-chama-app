'use client'

import React, { useState } from 'react'
import { checkSystemIntegrity } from '@/app/actions/integrity-actions'
import { ActivityIcon, CheckCircleIcon, AlertTriangleIcon, RefreshCwIcon, ShieldCheckIcon } from 'lucide-react'

export default function IntegrityPage() {
    const [result, setResult] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const runCheck = async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await checkSystemIntegrity()
            setResult(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Integrity</h1>
                    <p className="text-slate-500 mt-2">Verify double-entry consistency and account balance caches.</p>
                </div>
                <button
                    onClick={runCheck}
                    disabled={loading}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-indigo-200"
                >
                    {loading ? <RefreshCwIcon className="w-5 h-5 animate-spin" /> : <ShieldCheckIcon className="w-5 h-5" />}
                    Run Integrity Check
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 flex items-center gap-3">
                    <AlertTriangleIcon className="w-6 h-6" />
                    <span className="font-bold">{error}</span>
                </div>
            )}

            {result && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* General Ledger Status */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                            <ActivityIcon className="w-6 h-6 text-slate-400" />
                            General Ledger Status
                        </h2>

                        <div className={`p-6 rounded-2xl mb-6 flex items-center gap-4 ${result.isBalanced ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                            {result.isBalanced ? (
                                <CheckCircleIcon className="w-8 h-8 flex-shrink-0" />
                            ) : (
                                <AlertTriangleIcon className="w-8 h-8 flex-shrink-0" />
                            )}
                            <div>
                                <div className="font-black text-lg">{result.isBalanced ? 'BALANCED' : 'IMBALANCED'}</div>
                                <div className="text-sm opacity-80">{result.isBalanced ? 'Total Debits match Total Credits.' : 'There is a discrepancy in the ledger!'}</div>
                            </div>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                <span className="font-bold text-slate-600">Total Debits</span>
                                <span className="font-mono text-slate-900">{(BigInt(result.totalDebit) / 100n).toLocaleString()} KES</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                <span className="font-bold text-slate-600">Total Credits</span>
                                <span className="font-mono text-slate-900">{(BigInt(result.totalCredit) / 100n).toLocaleString()} KES</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border-t border-slate-200">
                                <span className="font-bold text-slate-600">Difference</span>
                                <span className={`font-mono font-bold ${result.difference !== '0' ? 'text-red-600' : 'text-slate-900'}`}>
                                    {(BigInt(result.difference) / 100n).toLocaleString()} KES
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Account Cache Status */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                            <ActivityIcon className="w-6 h-6 text-slate-400" />
                            Account Balance Caches
                        </h2>

                        {result.mismatches.length === 0 ? (
                            <div className="p-6 rounded-2xl bg-green-50 text-green-800 flex items-center gap-4">
                                <CheckCircleIcon className="w-8 h-8 flex-shrink-0" />
                                <div>
                                    <div className="font-black text-lg">ALL SYNCED</div>
                                    <div className="text-sm opacity-80">All account balances match their ledger entries.</div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl bg-red-50 text-red-800 flex items-center gap-3">
                                    <AlertTriangleIcon className="w-6 h-6" />
                                    <div>
                                        <div className="font-black">{result.mismatches.length} Mismatches Found</div>
                                        <div className="text-sm">Cached balances do not match calculated ledger sums.</div>
                                    </div>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                                    {result.mismatches.map((m: any) => (
                                        <div key={m.accountId} className="p-3 border border-red-100 rounded-xl bg-red-50/50 text-xs text-slate-700">
                                            <div className="flex justify-between font-bold mb-1">
                                                <span>{m.code}</span>
                                                <span className="text-red-700">Diff: {Number(m.difference) / 100} KES</span>
                                            </div>
                                            <div className="flex justify-between text-slate-500 font-mono">
                                                <span>Cached: {Number(m.cachedBalance) / 100}</span>
                                                <span>Calculated: {Number(m.calculatedBalance) / 100}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
