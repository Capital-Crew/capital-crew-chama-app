'use client'

import React, { useEffect, useState } from 'react'
import { getLoanSchedule } from '@/app/loan-schedule-actions'
import type { LoanScheduleResult } from '@/lib/services/loanCalculator'
import { AlertCircleIcon } from 'lucide-react'

interface LoanScheduleViewProps {
    loanId: string
    principal: number
    interestRate: number
    durationMonths: number
    interestType: 'FLAT' | 'DECLINING_BALANCE'
}

export function LoanScheduleView({ loanId }: { loanId: string }) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [schedule, setSchedule] = useState<LoanScheduleResult | null>(null)

    useEffect(() => {
        async function fetchSchedule() {
            try {
                setLoading(true)
                const result = await getLoanSchedule(loanId)
                if (result) {
                    setSchedule(result)
                } else {
                    setError('Unable to load loan schedule')
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load schedule')
            } finally {
                setLoading(false)
            }
        }

        fetchSchedule()
    }, [loanId])

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 bg-slate-200 rounded-xl"></div>
                        ))}
                    </div>
                    <div className="h-64 bg-slate-200 rounded-xl"></div>
                </div>
            </div>
        )
    }

    if (error || !schedule) {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3">
                    <AlertCircleIcon className="w-6 h-6 text-red-600" />
                    <div>
                        <h3 className="font-black text-red-900">Error Loading Schedule</h3>
                        <p className="text-sm text-red-700">{error || 'Unable to load payment schedule'}</p>
                    </div>
                </div>
            </div>
        )
    }

    const formatCurrency = (amount: number) => {
        return `KES ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    return (
        <div className="p-6 space-y-6">
            {/* Summary Cards */}
            <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Payment Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Monthly Payment */}
                    <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2">Monthly Payment</div>
                        <div className="text-3xl font-black">{formatCurrency(schedule.summary.monthlyPaymentAmount)}</div>
                    </div>

                    {/* Total Interest */}
                    <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2">Total Interest</div>
                        <div className="text-3xl font-black">{formatCurrency(schedule.summary.totalInterest)}</div>
                    </div>

                    {/* Total Payable */}
                    <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2">Total Payable</div>
                        <div className="text-3xl font-black">{formatCurrency(schedule.summary.totalPayable)}</div>
                    </div>
                </div>
            </div>

            {/* Payment Schedule Table */}
            <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                    Repayment Schedule ({schedule.schedule.length} months)
                </h3>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-4 py-3 text-left text-xs font-black text-slate-600 uppercase tracking-wider">Month</th>
                                    <th className="px-4 py-3 text-left text-xs font-black text-slate-600 uppercase tracking-wider">Date</th>
                                    <th className="px-4 py-3 text-right text-xs font-black text-slate-600 uppercase tracking-wider">Principal</th>
                                    <th className="px-4 py-3 text-right text-xs font-black text-slate-600 uppercase tracking-wider">Interest</th>
                                    <th className="px-4 py-3 text-right text-xs font-black text-slate-600 uppercase tracking-wider">Total Payment</th>
                                    <th className="px-4 py-3 text-right text-xs font-black text-slate-600 uppercase tracking-wider">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {schedule.schedule.map((item, index) => (
                                    <tr
                                        key={item.monthNo}
                                        className={`hover:bg-cyan-50 transition-colors ${index === schedule.schedule.length - 1 ? 'bg-green-50 font-bold' : ''
                                            }`}
                                    >
                                        <td className="px-4 py-3 text-sm font-bold text-slate-900">{item.monthNo}</td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{formatDate(item.date)}</td>
                                        <td className="px-4 py-3 text-sm text-right font-bold text-cyan-600">
                                            {formatCurrency(item.principalPayment)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-bold text-orange-600">
                                            {formatCurrency(item.interestPayment)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-black text-slate-900">
                                            {formatCurrency(item.totalPayment)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-bold text-purple-600">
                                            {formatCurrency(item.remainingBalance)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                                <tr>
                                    <td colSpan={2} className="px-4 py-3 text-sm font-black text-slate-900 uppercase">Totals</td>
                                    <td className="px-4 py-3 text-sm text-right font-black text-cyan-700">
                                        {formatCurrency(schedule.schedule.reduce((sum, item) => sum + item.principalPayment, 0))}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-black text-orange-700">
                                        {formatCurrency(schedule.summary.totalInterest)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-black text-slate-900">
                                        {formatCurrency(schedule.summary.totalPayable)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-black text-purple-700">
                                        KES 0.00
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            {/* Information Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-xs text-blue-800">
                    <strong>Note:</strong> This schedule shows the planned repayment structure. Actual payments may vary based on early settlements, penalties, or payment arrangements.
                </p>
            </div>
        </div>
    )
}
