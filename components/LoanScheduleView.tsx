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
        <div className="p-4 md:p-6 space-y-6">
            {}
            <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Payment Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {}
                    <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2">Monthly Payment</div>
                        <div className="text-3xl font-black">{formatCurrency(schedule.summary.monthlyPaymentAmount)}</div>
                    </div>

                    {}
                    <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2">Total Interest</div>
                        <div className="text-3xl font-black">{formatCurrency(schedule.summary.totalInterest)}</div>
                    </div>

                    {}
                    <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2">Total Payable</div>
                        <div className="text-3xl font-black">{formatCurrency(schedule.summary.totalPayable)}</div>
                    </div>
                </div>
            </div>

            {}
            <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                    Repayment Schedule ({schedule.schedule.length} months)
                </h3>

                {}
                <div className="md:hidden space-y-3">
                    {schedule.schedule.map((item, index) => (
                        <div key={item.monthNo} className={`p-4 rounded-xl border ${index === schedule.schedule.length - 1 ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'
                            }`}>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Month {item.monthNo}</span>
                                    <div className="font-bold text-slate-700 text-sm">{formatDate(item.date)}</div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Balance</span>
                                    <div className="font-black text-purple-600 text-sm">{formatCurrency(item.remainingBalance)}</div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg p-3 border border-slate-100">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-slate-500">Total Payment</span>
                                    <span className="text-sm font-black text-slate-900">{formatCurrency(item.totalPayment)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-slate-400">
                                    <span>Prin: <span className="font-bold text-cyan-600">{formatCurrency(item.principalPayment)}</span></span>
                                    <span>Int: <span className="font-bold text-orange-600">{formatCurrency(item.interestPayment)}</span></span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {}
                    <div className="bg-slate-800 text-white p-4 rounded-xl shadow-lg mt-4">
                        <h4 className="text-xs font-black uppercase tracking-widest mb-3 opacity-90">Schedule Totals</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-300">Total Principal</span>
                                <span className="font-bold text-cyan-400">{formatCurrency(schedule.schedule.reduce((sum, item) => sum + item.principalPayment, 0))}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-300">Total Interest</span>
                                <span className="font-bold text-orange-400">{formatCurrency(schedule.summary.totalInterest)}</span>
                            </div>
                            <div className="pt-2 mt-2 border-t border-slate-700 flex justify-between text-base">
                                <span className="font-black">Total Payable</span>
                                <span className="font-black">{formatCurrency(schedule.summary.totalPayable)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {}
                <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-4 py-3 text-left text-xs font-black text-slate-600 uppercase tracking-wider whitespace-nowrap">Month</th>
                                    <th className="px-4 py-3 text-left text-xs font-black text-slate-600 uppercase tracking-wider whitespace-nowrap">Date</th>
                                    <th className="px-4 py-3 text-right text-xs font-black text-slate-600 uppercase tracking-wider whitespace-nowrap">Principal</th>
                                    <th className="px-4 py-3 text-right text-xs font-black text-slate-600 uppercase tracking-wider whitespace-nowrap">Interest</th>
                                    <th className="px-4 py-3 text-right text-xs font-black text-slate-600 uppercase tracking-wider whitespace-nowrap">Total Payment</th>
                                    <th className="px-4 py-3 text-right text-xs font-black text-slate-600 uppercase tracking-wider whitespace-nowrap">Balance</th>
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
                                        <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{formatDate(item.date)}</td>
                                        <td className="px-4 py-3 text-sm text-right font-bold text-cyan-600 whitespace-nowrap">
                                            {formatCurrency(item.principalPayment)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-bold text-orange-600 whitespace-nowrap">
                                            {formatCurrency(item.interestPayment)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-black text-slate-900 whitespace-nowrap">
                                            {formatCurrency(item.totalPayment)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-bold text-purple-600 whitespace-nowrap">
                                            {formatCurrency(item.remainingBalance)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                                <tr>
                                    <td colSpan={2} className="px-4 py-3 text-sm font-black text-slate-900 uppercase">Totals</td>
                                    <td className="px-4 py-3 text-sm text-right font-black text-cyan-700 whitespace-nowrap">
                                        {formatCurrency(schedule.schedule.reduce((sum, item) => sum + item.principalPayment, 0))}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-black text-orange-700 whitespace-nowrap">
                                        {formatCurrency(schedule.summary.totalInterest)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-black text-slate-900 whitespace-nowrap">
                                        {formatCurrency(schedule.summary.totalPayable)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-black text-purple-700 whitespace-nowrap">
                                        KES 0.00
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            {}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-xs text-blue-800">
                    <strong>Note:</strong> This schedule shows the planned repayment structure. Actual payments may vary based on early settlements, penalties, or payment arrangements.
                </p>
            </div>
        </div>
    )
}
