'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import { LoanAppraisalCard } from '@/components/LoanAppraisalCard'

interface LoanProp {
    id: string
    loanNumber: string
    productName: string
    amount: number
    balance: number
    status: string
    date: Date
}

export default function LoansTab({ loans }: { loans: LoanProp[] }) {
    const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null)

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Loan Portfolio</h3>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{loans.length} Active / Past Loans</span>
            </div>

            {loans.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    <p className="text-slate-500">No active or past loans found for this member.</p>
                </div>
            ) : (
                <div className="bg-white border boundary-slate-200 rounded-lg overflow-hidden shadow-sm">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Loan Details</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Disbursed</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Repayment</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Balance</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {loans.map((loan) => {
                                const paid = loan.amount - loan.balance
                                const progress = Math.min(100, Math.max(0, (paid / loan.amount) * 100))

                                // Status Badge Colors
                                const getStatusColor = (s: string) => {
                                    switch (s) {
                                        case 'ACTIVE': return 'bg-green-100 text-green-700 border-green-200'
                                        case 'CLEARED': return 'bg-gray-100 text-gray-600 border-gray-200'
                                        case 'DEFAULTED':
                                        case 'OVERDUE': return 'bg-red-100 text-red-700 border-red-200'
                                        case 'PENDING_APPROVAL': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                        default: return 'bg-blue-50 text-blue-600 border-blue-100'
                                    }
                                }

                                return (
                                    <tr key={loan.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800">{loan.productName}</span>
                                                <button
                                                    onClick={() => setSelectedLoanId(loan.id)}
                                                    className="text-xs text-teal-600 font-mono mt-0.5 hover:underline font-medium w-fit text-left"
                                                >
                                                    {loan.loanNumber}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {format(new Date(loan.date), 'dd MMM yyyy')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded border ${getStatusColor(loan.status)}`}>
                                                {loan.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 w-48">
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] font-medium text-slate-500 mb-1">
                                                    <span>{Math.round(progress)}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${loan.status === 'OVERDUE' ? 'bg-red-500' : 'bg-teal-500'}`}
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-slate-900">
                                            {new Intl.NumberFormat('en-KE').format(loan.balance)}
                                            <div className="text-[10px] text-slate-400 font-normal">
                                                / {new Intl.NumberFormat('en-KE', { notation: "compact" }).format(loan.amount)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedLoanId(loan.id)}
                                                className="text-xs font-medium text-slate-400 hover:text-teal-600 transition-colors"
                                            >
                                                Manage &rarr;
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {}
            {selectedLoanId && (
                <LoanAppraisalCard
                    loanId={selectedLoanId}
                    isOpen={!!selectedLoanId}
                    onClose={() => setSelectedLoanId(null)}
                />
            )}
        </div>
    )
}
