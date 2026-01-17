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
                console.error('Failed to fetch transactions:', err)
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
                    <div key={tx.id} className="group bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 transition-all hover:shadow-md hover:border-slate-200">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1">
                                <div className={`p-3 rounded-2xl ${typeInfo.color} group-hover:scale-110 transition-transform`}>
                                    <Icon className="w-5 h-5" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-slate-900 truncate">{tx.description}</h4>
                                        {tx.relatedLoan && (
                                            <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-mono border border-slate-200">
                                                {tx.relatedLoan.loanApplicationNumber}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                        <span className="font-medium">{formatDate(tx.createdAt)}</span>
                                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                        <span className="uppercase tracking-wider font-bold text-slate-400">{typeInfo.label}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className={`text-lg font-black tracking-tight ${isCredit ? 'text-emerald-600' : 'text-slate-900'}`}>
                                    {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                                </div>
                                <div className="text-xs font-medium text-slate-400 mt-0.5">
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
