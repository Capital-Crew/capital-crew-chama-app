'use client'

import React, { useEffect, useState } from 'react'
import { WalletIcon, CoinsIcon, AlertCircleIcon, XIcon, ArrowUpIcon, ArrowDownIcon, PlusCircleIcon } from 'lucide-react'
import { getContributionHistory, getWithdrawableBalanceHistory, addCashDeposit } from '@/app/wallet-history-actions'

interface WalletBalance {
    shareContributions?: number
    balance: number
    availableBalance?: number
    totalContributions?: number
}

type TransactionType = 'share' | 'balance'

export function WalletDashboard({ memberId }: { memberId: string }) {
    const [walletData, setWalletData] = useState<WalletBalance | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Modal state
    const [showModal, setShowModal] = useState(false)
    const [modalType, setModalType] = useState<TransactionType>('share')
    const [transactions, setTransactions] = useState<any[]>([])
    const [loadingTransactions, setLoadingTransactions] = useState(false)
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

    // Deposit modal state
    const [showDepositModal, setShowDepositModal] = useState(false)
    const [depositAmount, setDepositAmount] = useState('')
    const [depositDescription, setDepositDescription] = useState('')
    const [depositLoading, setDepositLoading] = useState(false)
    const [depositMessage, setDepositMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        fetchWallet()
    }, [memberId])

    const fetchWallet = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/wallet/${memberId}`)

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to fetch wallet')
            }

            const data = await response.json()
            setWalletData(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const openTransactionHistory = async (type: TransactionType) => {
        setModalType(type)
        setShowModal(true)
        await loadTransactions(type, sortOrder)
    }

    const loadTransactions = async (type: TransactionType, order: 'asc' | 'desc') => {
        setLoadingTransactions(true)
        try {
            const data = type === 'share'
                ? await getContributionHistory(memberId, order)
                : await getWithdrawableBalanceHistory(memberId, order)
            setTransactions(data)
        } catch (error: any) {
        } finally {
            setLoadingTransactions(false)
        }
    }

    const toggleSortOrder = async () => {
        const newOrder = sortOrder === 'desc' ? 'asc' : 'desc'
        setSortOrder(newOrder)
        await loadTransactions(modalType, newOrder)
    }

    const handleDeposit = async (e: React.FormEvent) => {
        e.preventDefault()
        setDepositLoading(true)
        setDepositMessage(null)

        try {
            await addCashDeposit({
                memberId,
                amount: parseFloat(depositAmount),
                description: depositDescription
            })

            setDepositMessage({ type: 'success', text: 'Deposit successful!' })
            setDepositAmount('')
            setDepositDescription('')
            fetchWallet() // Refresh balance

            setTimeout(() => {
                setShowDepositModal(false)
                setDepositMessage(null)
            }, 2000)
        } catch (error: any) {
            setDepositMessage({ type: 'error', text: error.message })
        } finally {
            setDepositLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                {[1, 2].map(i => (
                    <div key={i} className="bg-slate-200 rounded-3xl h-32"></div>
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-6 flex items-center gap-3">
                <AlertCircleIcon className="w-6 h-6 text-red-600" />
                <div>
                    <h3 className="font-black text-red-900">Error Loading Wallet</h3>
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            </div>
        )
    }

    if (!walletData) return null

    const formatCurrency = (amount: number) => {
        return `KES ${amount.toLocaleString()}`
    }

    const shareCapital = walletData.shareContributions ?? walletData.totalContributions ?? 0
    const availBalance = walletData.availableBalance ?? walletData.balance

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {}
                <button
                    onClick={() => openTransactionHistory('share')}
                    className="group relative overflow-hidden rounded-3xl p-6 text-left transition-all hover:scale-[1.02] shadow-xl hover:shadow-2xl hover:shadow-cyan-500/20"
                >
                    {}
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-600 to-blue-700"></div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:bg-white/20 transition-all"></div>

                    {}
                    <div className="relative text-white">
                        <div className="flex items-center justify-between mb-8">
                            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                                <CoinsIcon className="w-6 h-6 text-cyan-50" />
                            </div>
                            <span className="px-3 py-1 bg-black/20 rounded-full text-[10px] font-black uppercase tracking-wider text-cyan-100 border border-white/5">
                                Equity
                            </span>
                        </div>

                        <div>
                            <p className="text-cyan-100/80 text-xs font-bold uppercase tracking-wider mb-1">Total Contributions</p>
                            <h3 className="text-3xl font-black tracking-tight text-white mb-1">
                                {formatCurrency(shareCapital)}
                            </h3>
                            <p className="text-cyan-200/60 text-xs font-medium flex items-center gap-1 group-hover:text-white transition-colors">
                                View history <ArrowUpIcon className="w-3 h-3 rotate-45" />
                            </p>
                        </div>
                    </div>
                </button>

                {}
                <div className="group relative overflow-hidden rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 transition-all bg-white border border-slate-100">
                    {}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl opacity-50 -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-50 rounded-full blur-xl opacity-50 -ml-10 -mb-10 pointer-events-none"></div>

                    {}
                    <div className="relative h-full flex flex-col justify-between">
                        <div className="flex items-start justify-between mb-6">
                            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                                <WalletIcon className="w-6 h-6 text-emerald-600" />
                            </div>
                            <button
                                onClick={() => setShowDepositModal(true)}
                                className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-black uppercase tracking-wide flex items-center gap-2 shadow-lg hover:shadow-emerald-600/30 transition-all active:scale-95"
                            >
                                <PlusCircleIcon className="w-4 h-4" />
                                Top Up
                            </button>
                        </div>

                        <button
                            onClick={() => openTransactionHistory('balance')}
                            className="text-left w-full group-hover:translate-x-1 transition-transform"
                        >
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Available Balance</p>
                            <h3 className="text-4xl font-black tracking-tight text-slate-900 mb-1">
                                {formatCurrency(availBalance)}
                            </h3>
                            <p className="text-emerald-600 text-xs font-bold flex items-center gap-1 hover:text-emerald-700 transition-colors">
                                View transactions <ArrowUpIcon className="w-3 h-3 rotate-45" />
                            </p>
                        </button>
                    </div>
                </div>
            </div>

            {}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                        {}
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <h2 className="text-2xl font-black text-slate-900">
                                {modalType === 'share' ? 'Contributions History' : 'Balance History'}
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={toggleSortOrder}
                                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold uppercase flex items-center gap-1"
                                >
                                    {sortOrder === 'desc' ? <ArrowDownIcon className="w-3 h-3" /> : <ArrowUpIcon className="w-3 h-3" />}
                                    {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                                </button>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <XIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {}
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            {loadingTransactions ? (
                                <div className="text-center py-8 text-slate-500">Loading transactions...</div>
                            ) : transactions.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">No transactions found</div>
                            ) : (
                                <div className="space-y-3">
                                    {transactions.map((tx) => (
                                        <div key={tx.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <div className="font-bold text-slate-900">{tx.description}</div>
                                                    <div className="text-xs text-slate-500 mt-1">
                                                        {new Date(tx.date).toLocaleString()}
                                                        {modalType === 'balance' && tx.entryNumber && (
                                                            <span className="ml-2">• Entry #{tx.entryNumber}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    {modalType === 'share' ? (
                                                        <div className={`text-lg font-black ${tx.type === 'CONTRIBUTION' ? 'text-green-600' : 'text-red-600'}`}>
                                                            {tx.type === 'CONTRIBUTION' ? '+' : '-'} {formatCurrency(tx.amount)}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {tx.debitAmount > 0 && (
                                                                <div className="text-lg font-black text-red-600">
                                                                    - {formatCurrency(tx.debitAmount)}
                                                                </div>
                                                            )}
                                                            {tx.creditAmount > 0 && (
                                                                <div className="text-lg font-black text-green-600">
                                                                    + {formatCurrency(tx.creditAmount)}
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            {modalType === 'share' && tx.creatorName && (
                                                <div className="text-xs text-slate-500">By: {tx.creatorName}</div>
                                            )}
                                            {modalType === 'balance' && tx.referenceType && (
                                                <div className="text-xs text-slate-500">Type: {tx.referenceType}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {}
            {showDepositModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <h2 className="text-2xl font-black text-slate-900">Add Cash Deposit</h2>
                            <button
                                onClick={() => setShowDepositModal(false)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleDeposit} className="p-6 space-y-4">
                            {depositMessage && (
                                <div className={`p-3 rounded-lg text-sm font-bold ${depositMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                                    }`}>
                                    {depositMessage.text}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Amount (KES)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="0.00"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                                <textarea
                                    value={depositDescription}
                                    onChange={(e) => setDepositDescription(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="Purpose of deposit..."
                                    rows={3}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={depositLoading}
                                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-black uppercase text-sm transition-colors disabled:opacity-50"
                            >
                                {depositLoading ? 'Processing...' : 'Add Deposit'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
