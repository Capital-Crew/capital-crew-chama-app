'use client'

import React, { useEffect, useState } from 'react'
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react'

interface WalletTransaction {
    id: string
    type: string
    amount: number
    description: string
    balanceAfter: number
    createdAt: string
    relatedLoan?: {
        loanApplicationNumber: string
        amount: number
    }
}

export function WalletTransactionHistory({ memberId }: { memberId: string }) {
    const [transactions, setTransactions] = useState<WalletTransaction[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchTransactions() {
            try {
                setLoading(true)
                const response = await fetch(`/api/wallet/${memberId}`)
                const data = await response.json()
                setTransactions(data.transactions || [])
            } catch (err) {
            } finally {
                setLoading(false)
            }
        }

        fetchTransactions()
    }, [memberId])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'KES'
        }).format(amount)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getTransactionTypeInfo = (type: string) => {
        const types: Record<string, { label: string; color: string; icon: any }> = {
            CONTRIBUTION: { label: 'Contribution', color: 'bg-green-100 text-green-800', icon: ArrowUpIcon },
            LOAN_DISBURSEMENT: { label: 'Loan Disbursed', color: 'bg-blue-100 text-blue-800', icon: ArrowUpIcon },
            REPAYMENT: { label: 'Repayment', color: 'bg-purple-100 text-purple-800', icon: ArrowDownIcon },
            FEE: { label: 'Fee', color: 'bg-orange-100 text-orange-800', icon: ArrowDownIcon },
            PENALTY: { label: 'Penalty', color: 'bg-red-100 text-red-800', icon: ArrowDownIcon },
            REVERSAL: { label: 'Reversal', color: 'bg-gray-100 text-gray-800', icon: ArrowUpIcon },
        }
        return types[type] || { label: type, color: 'bg-slate-100 text-slate-800', icon: ArrowUpIcon }
    }

    if (loading) {
        return (
            <div className="bg-white rounded-3xl border border-slate-200 p-6">
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-slate-100 rounded-xl"></div>
                    ))}
                </div>
            </div>
        )
    }

    if (transactions.length === 0) {
        return (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center">
                <div className="text-slate-400 font-bold">No transactions yet</div>
                <p className="text-sm text-slate-500 mt-2">Wallet transactions will appear here</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {transactions.map((tx) => {
                const typeInfo = getTransactionTypeInfo(tx.type)
                const Icon = typeInfo.icon
                const isCredit = ['CONTRIBUTION', 'LOAN_DISBURSEMENT'].includes(tx.type)

                return (
                    <div key={tx.id} className="group bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-3 md:p-4 transition-all hover:shadow-md hover:border-slate-200">
                        <div className="flex items-start justify-between gap-3 md:gap-4">
                            <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                                <div className={`p-2.5 md:p-3 rounded-2xl ${typeInfo.color} group-hover:scale-110 transition-transform shrink-0 mt-0.5`}>
                                    <Icon className="w-4 h-4 md:w-5 md:h-5" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-0.5 md:mb-1">
                                        <h4 className="font-bold text-slate-900 text-sm md:text-base leading-tight line-clamp-1">{tx.description}</h4>
                                        {tx.relatedLoan && (
                                            <span className="bg-slate-100 text-slate-500 text-[9px] md:text-[10px] px-1.5 py-0.5 rounded font-mono border border-slate-200 whitespace-nowrap">
                                                {tx.relatedLoan.loanApplicationNumber}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] md:text-xs text-slate-500">
                                        <span className="font-medium whitespace-nowrap">{formatDate(tx.createdAt)}</span>
                                        <span className="w-0.5 h-0.5 md:w-1 md:h-1 bg-slate-300 rounded-full"></span>
                                        <span className="uppercase tracking-wider font-bold text-slate-400 line-clamp-1">{typeInfo.label}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="text-right shrink-0">
                                <div className={`text-sm md:text-lg font-black tracking-tight ${isCredit ? 'text-emerald-600' : 'text-slate-900'}`}>
                                    {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                                </div>
                                <div className="text-[10px] md:text-xs font-medium text-slate-400">
                                    Bal: {formatCurrency(tx.balanceAfter)}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
