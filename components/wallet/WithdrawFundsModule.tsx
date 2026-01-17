'use client'

import React, { useState, useEffect } from 'react'
import { withdrawFunds, getWithdrawableBalance } from '@/app/wallet-withdraw-actions'
import { WalletIcon, AlertCircleIcon, CheckCircleIcon, LoaderIcon } from 'lucide-react'

export function WithdrawFundsModule({ memberId }: { memberId: string }) {
    const [loading, setLoading] = useState(false)
    const [fetchingBalance, setFetchingBalance] = useState(true)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const [withdrawableBalance, setWithdrawableBalance] = useState(0)
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')

    // Fetch withdrawable balance on component mount
    useEffect(() => {
        fetchBalance()
    }, [memberId])

    const fetchBalance = async () => {
        setFetchingBalance(true)
        try {
            const balance = await getWithdrawableBalance(memberId)
            setWithdrawableBalance(balance)
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message })
        } finally {
            setFetchingBalance(false)
        }
    }

    const handleWithdrawal = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        try {
            const result = await withdrawFunds({
                memberId,
                amount: parseFloat(amount),
                description
            })

            setMessage({
                type: 'success',
                text: `Withdrawal successful! New balance: KES ${result.newWithdrawableBalance.toLocaleString()}`
            })
            setAmount('')
            setDescription('')
            fetchBalance() // Refresh balance
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message })
        } finally {
            setLoading(false)
        }
    }

    const setMaxAmount = () => {
        setAmount(withdrawableBalance.toString())
    }

    const amountValue = parseFloat(amount) || 0
    const isOverdraft = amountValue > withdrawableBalance
    const isValid = amountValue > 0 && amountValue <= withdrawableBalance

    return (
        <div className="bg-white border border-slate-200 rounded-3xl p-8">
            <h2 className="text-2xl font-black text-slate-900 mb-6 uppercase">Withdraw Funds</h2>

            {/* Withdrawable Balance Display */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white mb-6">
                <div className="flex items-center justify-between mb-2">
                    <WalletIcon className="w-8 h-8 opacity-80" />
                    <span className="text-xs font-black uppercase tracking-wider opacity-70">Withdrawable Balance</span>
                </div>
                {fetchingBalance ? (
                    <div className="text-2xl font-black flex items-center gap-2">
                        <LoaderIcon className="w-6 h-6 animate-spin" />
                        Loading...
                    </div>
                ) : (
                    <>
                        <div className="text-4xl font-black mb-1">KES {withdrawableBalance.toLocaleString()}</div>
                        <div className="text-sm opacity-80">Available for withdrawal</div>
                    </>
                )}
            </div>

            {/* Message */}
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

            {/* Withdrawal Form */}
            <form onSubmit={handleWithdrawal} className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Withdrawal Amount (KES) - Available: {withdrawableBalance.toLocaleString()}
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={withdrawableBalance}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${isOverdraft ? 'border-red-300 bg-red-50' : 'border-slate-300'
                                }`}
                            placeholder="0.00"
                            required
                            disabled={withdrawableBalance === 0}
                        />
                        <button
                            type="button"
                            onClick={setMaxAmount}
                            disabled={withdrawableBalance === 0}
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-cyan-100 text-cyan-700 rounded-lg text-xs font-bold uppercase hover:bg-cyan-200 disabled:opacity-50"
                        >
                            Max
                        </button>
                    </div>
                    {isOverdraft && (
                        <p className="text-red-600 text-xs mt-1 font-bold flex items-center gap-1">
                            <AlertCircleIcon className="w-3 h-3" />
                            Insufficient balance - withdrawal amount exceeds available funds
                        </p>
                    )}
                    {withdrawableBalance === 0 && (
                        <p className="text-amber-600 text-xs mt-1 font-bold flex items-center gap-1">
                            <AlertCircleIcon className="w-3 h-3" />
                            No withdrawable balance available
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Purpose / Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        placeholder="Reason for withdrawal..."
                        rows={3}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || !isValid || fetchingBalance}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-3 rounded-xl font-black uppercase text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading && <LoaderIcon className="w-4 h-4 animate-spin" />}
                    {loading ? 'Processing...' : 'Withdraw Funds'}
                </button>
            </form>
        </div>
    )
}
