'use client'

import React, { useState, useEffect } from 'react'
import {
    addContribution,
    addPenaltyPayment,
    addLoanRepayment,
    getActiveLoansByMember
} from '@/app/wallet-add-funds-actions'
import { useSearchParams } from 'next/navigation'
import {
    withdrawFunds,
    getWithdrawableBalance
} from '@/app/wallet-withdraw-actions'
import {
    CoinsIcon,
    AlertCircleIcon,
    TrendingUpIcon,
    CheckCircleIcon,
    WalletIcon,
    ArrowDownIcon,
    ArrowUpIcon,
    SmartphoneIcon
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'



// Types
type MainTab = 'deposits' | 'repayments' | 'withdrawals'

interface ActiveLoan {
    id: string
    loanApplicationNumber: string
    productName: string
    disbursedAmount: number
    outstandingBalance: number
    penaltyBalance: number
    feesBalance: number
    interestBalance: number
    principalBalance: number
    status: string
}

export function WalletOperations({ memberId, userRole, onTransactionComplete }: { memberId: string; userRole?: string; onTransactionComplete?: () => void }) {
    const searchParams = useSearchParams()
    const initialTab = (searchParams.get('tab') as MainTab) || 'deposits'
    const initialSubTab = searchParams.get('subtab') || 'mpesa'

    const [activeMainTab, setActiveMainTab] = useState<MainTab>(initialTab)
    const [activeSubTab, setActiveSubTab] = useState(initialSubTab)

    // Sync state if search params change
    useEffect(() => {
        const tab = searchParams.get('tab') as MainTab
        const subtab = searchParams.get('subtab')
        if (tab) setActiveMainTab(tab)
        if (subtab) setActiveSubTab(subtab)
    }, [searchParams])

    // Shared State
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Deposit Forms State
    const [mpesaPhone, setMpesaPhone] = useState('')
    const [mpesaAmount, setMpesaAmount] = useState('')
    const [shareAmount, setShareAmount] = useState('')
    const [shareDescription, setShareDescription] = useState('')

    const [penaltyAmount, setPenaltyAmount] = useState('')
    const [penaltyDescription, setPenaltyDescription] = useState('')

    const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([])
    const [selectedLoanId, setSelectedLoanId] = useState('')
    const [selectedLoan, setSelectedLoan] = useState<ActiveLoan | null>(null)
    const [repaymentAmount, setRepaymentAmount] = useState('')
    const [repaymentDescription, setRepaymentDescription] = useState('')
    const [repaymentAllocation, setRepaymentAllocation] = useState({ penalty: 0, fees: 0, interest: 0, principal: 0 })

    // Withdrawal Form State
    const [withdrawableBalance, setWithdrawableBalance] = useState(0)
    const [withdrawAmount, setWithdrawAmount] = useState('')
    const [withdrawDescription, setWithdrawDescription] = useState('')
    const [fetchingBalance, setFetchingBalance] = useState(false)

    // Effects
    useEffect(() => {
        // Load loans when entering Repayments tab
        if (activeMainTab === 'repayments') {
            loadActiveLoans()
        }
    }, [activeMainTab, memberId])

    useEffect(() => {
        if (activeMainTab === 'withdrawals') {
            fetchWithdrawableBalance()
        }
    }, [activeMainTab, memberId])

    // Loan Selection Logic - With REAL-TIME Refresh
    useEffect(() => {
        const loan = activeLoans.find(l => l.id === selectedLoanId)
        if (!loan) {
            setSelectedLoan(null)
            setRepaymentAmount('')
            return
        }

        // 1. Instant optimistic update from list
        setSelectedLoan(loan)
        setRepaymentAmount('')
        calculateAllocation(loan, 0)

        // 2. Fetch fresh balance in background (Real-time requirement)
        const fetchFresh = async () => {
            try {
                const { getLoanFreshBalance } = await import('@/app/wallet-add-funds-actions')
                const fresh = await getLoanFreshBalance(loan.id)

                // If balance changed, update selectedLoan
                if (fresh.outstandingBalance !== loan.outstandingBalance) {
                    setSelectedLoan(prev => prev ? {
                        ...prev,
                        outstandingBalance: fresh.outstandingBalance,
                        penaltyBalance: fresh.penaltyBalance,
                        interestBalance: fresh.interestBalance,
                        principalBalance: fresh.principalBalance,
                        feesBalance: fresh.feesBalance
                    } : null)

                    // Re-calculate allocation if amount was entered (rare race condition, but safe)
                    // We don't have access to current 'repaymentAmount' in this closure easily without dep change
                    // But typically user hasn't typed much in <100ms. 
                    // However, if we want to be safe, we can just let the next render handle manual updates
                }
            } catch (err) {
            }
        }
        fetchFresh()

    }, [selectedLoanId, activeLoans])

    useEffect(() => {
        if (selectedLoan && repaymentAmount) {
            calculateAllocation(selectedLoan, parseFloat(repaymentAmount) || 0)
        }
    }, [repaymentAmount, selectedLoan])

    // Helpers
    const loadActiveLoans = async () => {
        try {
            const loans = await getActiveLoansByMember(memberId)
            setActiveLoans(loans)
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message })
        }
    }

    const fetchWithdrawableBalance = async () => {
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

    const calculateAllocation = (loan: ActiveLoan, amount: number) => {
        if (amount <= 0) {
            setRepaymentAllocation({ penalty: 0, fees: 0, interest: 0, principal: 0 })
            return
        }

        let remaining = amount
        const allocation = { penalty: 0, fees: 0, interest: 0, principal: 0 }

        // Waterfall: Penalty -> Fees -> Interest -> Principal
        if (remaining > 0 && loan.penaltyBalance > 0) {
            allocation.penalty = Math.min(remaining, loan.penaltyBalance)
            remaining -= allocation.penalty
        }
        if (remaining > 0 && loan.feesBalance > 0) {
            allocation.fees = Math.min(remaining, loan.feesBalance)
            remaining -= allocation.fees
        }
        if (remaining > 0 && loan.interestBalance > 0) {
            allocation.interest = Math.min(remaining, loan.interestBalance)
            remaining -= allocation.interest
        }
        if (remaining > 0 && loan.principalBalance > 0) {
            allocation.principal = Math.min(remaining, loan.principalBalance)
            remaining -= allocation.principal
        }
        setRepaymentAllocation(allocation)
    }

    // Handlers
    const handleMpesaDeposit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true); setMessage(null)
        try {
            const res = await fetch('/api/deposit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phoneNumber: mpesaPhone,
                    amount: parseFloat(mpesaAmount),
                    memberId: memberId
                })
            })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Deposit failed')

            setMessage({ type: 'success', text: 'STK Push sent! Please check your phone.' })
            setMpesaAmount('')
            // Phone number kept for convenience
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message })
        } finally {
            setLoading(false)
        }
    }

    const handleShareContribution = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true); setMessage(null)
        try {
            await addContribution({ memberId, amount: parseFloat(shareAmount), description: shareDescription })
            setMessage({ type: 'success', text: 'Share contribution successful!' })
            setShareAmount(''); setShareDescription('')
            onTransactionComplete?.() // Refresh wallet balance
        } catch (err: any) { setMessage({ type: 'error', text: err.message }) }
        finally { setLoading(false) }
    }

    const handlePenaltyPayment = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true); setMessage(null)
        try {
            await addPenaltyPayment({ memberId, amount: parseFloat(penaltyAmount), description: penaltyDescription })
            setMessage({ type: 'success', text: 'Penalty payment successful!' })
            setPenaltyAmount(''); setPenaltyDescription('')
            onTransactionComplete?.() // Refresh wallet balance
        } catch (err: any) { setMessage({ type: 'error', text: err.message }) }
        finally { setLoading(false) }
    }

    const handleLoanRepayment = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true); setMessage(null)
        try {
            const result = await addLoanRepayment({ memberId, loanId: selectedLoanId, amount: parseFloat(repaymentAmount), description: repaymentDescription })
            setMessage({ type: 'success', text: `Repayment successful! Remaining: KES ${result.newOutstanding.toLocaleString()}` })
            setRepaymentAmount(''); setRepaymentDescription(''); setSelectedLoanId(''); loadActiveLoans()
            onTransactionComplete?.() // Refresh wallet balance
        } catch (err: any) { setMessage({ type: 'error', text: err.message }) }
        finally { setLoading(false) }
    }

    const handleWithdrawal = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true); setMessage(null)
        try {
            await withdrawFunds({ memberId, amount: parseFloat(withdrawAmount), description: withdrawDescription })
            setMessage({ type: 'success', text: 'Withdrawal successful!' })
            setWithdrawAmount(''); setWithdrawDescription(''); fetchWithdrawableBalance()
            onTransactionComplete?.() // Refresh wallet balance
        } catch (err: any) { setMessage({ type: 'error', text: err.message }) }
        finally { setLoading(false) }
    }

    // Render Helpers
    const isRepaymentValid = selectedLoan && parseFloat(repaymentAmount) > 0 && parseFloat(repaymentAmount) <= selectedLoan.outstandingBalance

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Main Tabs with Better Visual Separation */}
            <div className="flex border-b-2 border-slate-300">
                <button
                    onClick={() => { setActiveMainTab('deposits'); setMessage(null) }}
                    className={`flex-1 py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all relative
                        ${activeMainTab === 'deposits'
                            ? 'bg-gradient-to-br from-green-500 to-green-600 text-white border-b-4 border-green-700 shadow-lg'
                            : 'bg-green-50 text-green-700 hover:bg-green-100 border-b-2 border-green-200'}`}
                >
                    <ArrowDownIcon className={`w-4 h-4 ${activeMainTab === 'deposits' ? 'animate-bounce' : ''}`} />
                    Deposits
                </button>
                <div className="w-px bg-slate-300" /> {/* Vertical separator */}
                <button
                    onClick={() => { setActiveMainTab('repayments'); setMessage(null) }}
                    className={`flex-1 py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all relative
                        ${activeMainTab === 'repayments'
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-b-4 border-blue-700 shadow-lg'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-b-2 border-blue-200'}`}
                >
                    <TrendingUpIcon className={`w-4 h-4 ${activeMainTab === 'repayments' ? 'animate-bounce' : ''}`} />
                    Repay Loan
                </button>
                <div className="w-px bg-slate-300" /> {/* Vertical separator */}
                <button
                    onClick={() => { setActiveMainTab('withdrawals'); setMessage(null) }}
                    className={`flex-1 py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all relative
                        ${activeMainTab === 'withdrawals'
                            ? 'bg-gradient-to-br from-red-500 to-red-600 text-white border-b-4 border-red-700 shadow-lg'
                            : 'bg-red-50 text-red-700 hover:bg-red-100 border-b-2 border-red-200'}`}
                >
                    <ArrowUpIcon className={`w-4 h-4 ${activeMainTab === 'withdrawals' ? 'animate-bounce' : ''}`} />
                    Withdraw
                </button>
            </div>

            <div className="p-4">
                {/* Global Message */}
                {message && (
                    <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
                        }`}>
                        {message.type === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : <AlertCircleIcon className="w-5 h-5" />}
                        <p className="font-bold text-sm">{message.text}</p>
                    </div>
                )}

                {/* CONTENT: Deposits */}
                {activeMainTab === 'deposits' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
                            <TabsList className="w-full flex overflow-x-auto md:grid md:grid-cols-3 mb-6 gap-2 md:gap-0 p-1 md:p-1 bg-slate-100/50 md:bg-slate-100 rounded-xl md:rounded-lg scrollbar-none">
                                <TabsTrigger value="mpesa" className="flex-1 min-w-[120px] md:min-w-0 data-[state=active]:bg-green-100 data-[state=active]:text-green-800 data-[state=active]:shadow-sm">
                                    <SmartphoneIcon className="w-4 h-4 mr-2" /> M-Pesa
                                </TabsTrigger>
                                <TabsTrigger value="share" className="flex-1 min-w-[140px] md:min-w-0 data-[state=active]:bg-cyan-100 data-[state=active]:text-cyan-800 data-[state=active]:shadow-sm">
                                    <CoinsIcon className="w-4 h-4 mr-2" /> Contributions
                                </TabsTrigger>
                                <TabsTrigger value="penalty" className="flex-1 min-w-[110px] md:min-w-0 data-[state=active]:bg-red-100 data-[state=active]:text-red-800 data-[state=active]:shadow-sm">
                                    <AlertCircleIcon className="w-4 h-4 mr-2" /> Penalties
                                </TabsTrigger>
                            </TabsList>

                            {/* M-Pesa Form */}
                            <TabsContent value="mpesa">
                                <form onSubmit={handleMpesaDeposit} className="space-y-4">
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-green-100 p-2 rounded-full">
                                                <SmartphoneIcon className="w-5 h-5 text-green-600" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-green-900">M-Pesa Deposit</h4>
                                                <p className="text-xs text-green-700">Instant deposit to your wallet via STK Push.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Phone Number</label>
                                        <input type="tel" required value={mpesaPhone} onChange={e => setMpesaPhone(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-transparent font-bold text-slate-900"
                                            placeholder="2547..." />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Amount (KES)</label>
                                        <input type="number" step="1" min="1" required value={mpesaAmount} onChange={e => setMpesaAmount(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-transparent font-bold text-slate-900"
                                            placeholder="0" />
                                    </div>

                                    <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-black uppercase tracking-wide transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                        {loading ? 'Processing...' : (
                                            <>
                                                <span>Initiate STK Push</span>
                                                <SmartphoneIcon className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </TabsContent>

                            {/* Share Form */}
                            <TabsContent value="share">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 p-4 bg-cyan-50 border border-cyan-200 rounded-xl">
                                        <div className="bg-cyan-100 p-2 rounded-full">
                                            <CoinsIcon className="w-5 h-5 text-cyan-600" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-cyan-900">Member Contributions</h4>
                                            <p className="text-xs text-cyan-700">Add to your non-withdrawable share capital.</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleShareContribution} className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Amount (KES)</label>
                                            <input type="number" step="0.01" min="0.01" required value={shareAmount} onChange={e => setShareAmount(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-bold text-slate-900" placeholder="0.00" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Description</label>
                                            <textarea required value={shareDescription} onChange={e => setShareDescription(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-cyan-500 focus:border-transparent" placeholder="Details..." rows={2} />
                                        </div>
                                        <button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-4 rounded-xl font-black uppercase tracking-wide transition-all disabled:opacity-50">
                                            {loading ? 'Processing...' : 'Submit Contribution'}
                                        </button>
                                    </form>
                                </div>
                            </TabsContent>

                            {/* Penalty Form */}
                            <TabsContent value="penalty">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                                        <div className="bg-red-100 p-2 rounded-full">
                                            <AlertCircleIcon className="w-5 h-5 text-red-600" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-red-900">Fines & Penalties</h4>
                                            <p className="text-xs text-red-700">Clear outstanding fines and penalties.</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handlePenaltyPayment} className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Amount (KES)</label>
                                            <input type="number" step="0.01" min="0.01" required value={penaltyAmount} onChange={e => setPenaltyAmount(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:border-transparent font-bold text-slate-900" placeholder="0.00" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Description</label>
                                            <textarea required value={penaltyDescription} onChange={e => setPenaltyDescription(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:border-transparent" placeholder="Reason..." rows={2} />
                                        </div>
                                        <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-black uppercase tracking-wide transition-all disabled:opacity-50">
                                            {loading ? 'Processing...' : 'Pay Penalty'}
                                        </button>
                                    </form>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                )}

                {/* CONTENT: Repayments */}
                {activeMainTab === 'repayments' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                <div className="bg-blue-100 p-2 rounded-full">
                                    <TrendingUpIcon className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-blue-900">Loan Repayment</h4>
                                    <p className="text-xs text-blue-700">Make repayments towards your active loans.</p>
                                </div>
                            </div>

                            <form onSubmit={handleLoanRepayment} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Select Loan</label>
                                    <select
                                        required
                                        value={selectedLoanId}
                                        onChange={e => setSelectedLoanId(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-slate-900"
                                    >
                                        <option value="">-- Select Active Loan --</option>
                                        {activeLoans.map(l => (
                                            <option key={l.id} value={l.id}>
                                                {l.loanApplicationNumber} - {l.productName} (Bal: {l.outstandingBalance.toLocaleString()})
                                            </option>
                                        ))}
                                    </select>
                                    {activeLoans.length === 0 && (
                                        <p className="text-xs text-red-500 mt-1 font-bold">No active loans found.</p>
                                    )}
                                </div>

                                {selectedLoan && (
                                    <>
                                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-xs text-slate-500 uppercase font-bold">Outstanding</div>
                                                <div className="font-black text-slate-900">KES {selectedLoan.outstandingBalance.toLocaleString()}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-500 uppercase font-bold">Allocated To</div>
                                                <div className="text-xs font-medium text-slate-700">
                                                    Pen: {repaymentAllocation.penalty} | Fees: {repaymentAllocation.fees} | Int: {repaymentAllocation.interest} | Prin: {repaymentAllocation.principal}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">
                                                Repayment Amount (Max: {selectedLoan.outstandingBalance.toLocaleString()})
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0.01"
                                                    max={selectedLoan.outstandingBalance}
                                                    required
                                                    value={repaymentAmount}
                                                    onChange={e => setRepaymentAmount(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-slate-900"
                                                    placeholder="0.00"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setRepaymentAmount(selectedLoan.outstandingBalance.toString())}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors uppercase tracking-wider"
                                                >
                                                    Max
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Notes / Reference</label>
                                            <textarea
                                                required
                                                value={repaymentDescription}
                                                onChange={e => setRepaymentDescription(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="e.g. M-Pesa Ref..."
                                                rows={2}
                                            />
                                        </div>
                                    </>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || !selectedLoanId || !isRepaymentValid}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-black uppercase tracking-wide transition-all disabled:opacity-50 shadow-lg shadow-blue-200 mt-2"
                                >
                                    {loading ? 'Processing...' : 'Submit Repayment'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* CONTENT: Withdrawals */}
                {activeMainTab === 'withdrawals' && (
                    <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-teal-50 border border-teal-100 rounded-2xl p-6 mb-6 flex items-center justify-between">
                            <div>
                                <h4 className="text-teal-900 font-bold uppercase text-xs tracking-wider mb-1">Withdrawable Balance</h4>

                                {fetchingBalance ? (
                                    <div className="h-8 w-24 bg-teal-200 animate-pulse rounded"></div>
                                ) : (
                                    <div className="text-3xl font-black text-teal-700">KES {withdrawableBalance.toLocaleString()}</div>
                                )}
                            </div>
                            <WalletIcon className="w-10 h-10 text-teal-200" />
                        </div>

                        <form onSubmit={handleWithdrawal} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Withdrawal Amount (KES)</label>
                                <div className="relative">
                                    <input type="number" step="0.01" min="0.01" max={withdrawableBalance} required value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                                        disabled={withdrawableBalance <= 0}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent font-bold text-slate-900" placeholder="0.00" />
                                    <button type="button" onClick={() => setWithdrawAmount(withdrawableBalance.toString())} disabled={withdrawableBalance <= 0}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded hover:bg-teal-100 disabled:opacity-50">MAX</button>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Description</label>
                                <textarea required value={withdrawDescription} onChange={e => setWithdrawDescription(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Withdrawal reason..." rows={2} />
                            </div>
                            <button type="submit" disabled={loading || (parseFloat(withdrawAmount) > withdrawableBalance)} className="w-full bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-xl font-black uppercase tracking-wide transition-all disabled:opacity-50">
                                {loading ? 'Processing...' : 'Withdraw Funds'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}
