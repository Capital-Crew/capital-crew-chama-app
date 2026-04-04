'use client'

import React, { useState, useEffect } from 'react'
import {
    addContribution,
    addPenaltyPayment
} from '@/app/wallet-add-funds-actions'
import { LoanRepaymentForm } from './LoanRepaymentForm'
import { initiatePayment } from '@/app/actions/payment-actions'
import { getOutstandingNonLoanFines, paySelectedNonLoanFines, type FineItem } from '@/app/actions/fine-actions'
import { getWalletBalance } from '@/app/wallet-actions'
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
import { useFormAction } from '@/hooks/useFormAction'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { FormError } from '@/components/ui/FormError'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { formatCurrency } from '@/lib/currency'
import { formatDate } from '@/lib/utils'

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

    const { isPending: loading, error, execute, setError } = useFormAction()
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
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Deposit Forms State
    const [mpesaPhone, setMpesaPhone] = useState('')
    const [mpesaAmount, setMpesaAmount] = useState('')
    const [shareAmount, setShareAmount] = useState('')
    const [shareDescription, setShareDescription] = useState('')

    const [penaltyAmount, setPenaltyAmount] = useState('')
    const [penaltyDescription, setPenaltyDescription] = useState('')

    // Withdrawal Form State
    const [withdrawableBalance, setWithdrawableBalance] = useState(0)
    const [withdrawAmount, setWithdrawAmount] = useState('')
    const [withdrawDescription, setWithdrawDescription] = useState('')
    const [fetchingBalance, setFetchingBalance] = useState(false)
    const [profilePhone, setProfilePhone] = useState('')
    
    // Fines State
    const [availableFines, setAvailableFines] = useState<FineItem[]>([])
    const [selectedFineIds, setSelectedFineIds] = useState<Set<string>>(new Set())
    const [fetchingFines, setFetchingFines] = useState(false)

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
        if (activeMainTab === 'deposits') {
            fetchProfilePhone()
            if (activeSubTab === 'penalty') {
                loadAvailableFines()
            }
        }
    }, [activeMainTab, activeSubTab, memberId])

    const fetchProfilePhone = async () => {
        try {
            const walletInfo = await getWalletBalance(memberId)
            if (walletInfo.phoneNumber) {
                setProfilePhone(walletInfo.phoneNumber)
                if (!mpesaPhone) setMpesaPhone(walletInfo.phoneNumber)
            }
        } catch (err) {}
    }

    const loadAvailableFines = async () => {
        setFetchingFines(true)
        try {
            const data = await getOutstandingNonLoanFines(memberId)
            setAvailableFines(data)
        } catch (error) {
            console.error("Failed to load fines", error)
        } finally {
            setFetchingFines(false)
        }
    }

    const handleFineSelect = (id: string) => {
        const newSet = new Set(selectedFineIds)
        if (newSet.has(id)) newSet.delete(id)
        else newSet.add(id)
        setSelectedIds(newSet)
    }

    const setSelectedIds = (newSet: Set<string>) => {
        setSelectedFineIds(newSet)
        const selected = availableFines.filter(f => newSet.has(f.id))
        const total = selected.reduce((sum, f) => sum + f.amount, 0)
        const desc = selected.map(f => f.reason).join(', ')
        
        setPenaltyAmount(total > 0 ? total.toString() : '')
        setPenaltyDescription(desc)
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

    const calculateAllocation = (loan: any, amount: number) => {
        // ... kept generic or removed if not used elsewhere
    }

    // Switch logic
    const handleSwitchMainTab = (tab: MainTab) => {
        setActiveMainTab(tab)
        setError(null)
        setMessage(null)
    }

    const handleSwitchSubTab = (subtab: string) => {
        setActiveSubTab(subtab)
        setError(null)
        setMessage(null)
    }

    // Handlers
    const handleMpesaDeposit = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage(null)
        await execute(async () => {
            const result = await initiatePayment({
                amount: parseFloat(mpesaAmount),
                payingPhone: mpesaPhone || profilePhone
            })

            if (result.success) {
                setMessage({ type: 'success', text: result.message })
                setMpesaAmount('')
                return { success: true }
            } else {
                return { success: false, error: result.message || 'Payment initiation failed' }
            }
        })
    }

    const handleShareContribution = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage(null)
        await execute(async () => {
            await addContribution({ memberId, amount: parseFloat(shareAmount), description: shareDescription })
            setMessage({ type: 'success', text: 'Share contribution successful!' })
            setShareAmount(''); setShareDescription('')
            onTransactionComplete?.() // Refresh wallet balance
            return { success: true }
        })
    }

    const handlePenaltyPayment = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage(null)
        await execute(async () => {
            const amountNum = parseFloat(penaltyAmount)
            if (isNaN(amountNum) || amountNum <= 0) throw new Error('Invalid amount')

            if (selectedFineIds.size > 0) {
                const selected = availableFines.filter(f => selectedFineIds.has(f.id))
                const result = await paySelectedNonLoanFines({
                    memberId,
                    selections: selected.map(f => ({
                        id: f.id,
                        type: f.type,
                        amount: f.amount,
                        originalId: f.originalId,
                        reason: f.reason
                    })),
                    paymentMethod: 'WALLET'
                })
                
                if (result.success) {
                    setMessage({ type: 'success', text: result.message || 'Fines settled successfully!' })
                    setPenaltyAmount('')
                    setPenaltyDescription('')
                    setSelectedFineIds(new Set())
                    loadAvailableFines()
                    onTransactionComplete?.()
                    return { success: true }
                } else {
                    return { success: false, error: result.message || 'Payment failed' }
                }
            } else {
                await addPenaltyPayment({ memberId, amount: amountNum, description: penaltyDescription })
                setMessage({ type: 'success', text: 'Penalty payment successful!' })
                setPenaltyAmount(''); setPenaltyDescription('')
                onTransactionComplete?.()
                return { success: true }
            }
        })
    }


    const handleWithdrawal = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage(null)
        await execute(async () => {
            await withdrawFunds({ memberId, amount: parseFloat(withdrawAmount), description: withdrawDescription })
            setMessage({ type: 'success', text: 'Withdrawal successful!' })
            setWithdrawAmount(''); setWithdrawDescription(''); fetchWithdrawableBalance()
            onTransactionComplete?.() // Refresh wallet balance
            return { success: true }
        })
    }

    // Render Helpers

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {}
            <div className="flex border-b-2 border-slate-300">
                <button
                    onClick={() => handleSwitchMainTab('deposits')}
                    className={`flex-1 py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all relative
                        ${activeMainTab === 'deposits'
                            ? 'bg-gradient-to-br from-green-500 to-green-600 text-white border-b-4 border-green-700 shadow-lg'
                            : 'bg-green-50 text-green-700 hover:bg-green-100 border-b-2 border-green-200'}`}
                >
                    <ArrowDownIcon className={`w-4 h-4 ${activeMainTab === 'deposits' ? 'animate-bounce' : ''}`} />
                    Deposits
                </button>
                <div className="w-px bg-slate-300" /> {}
                <button
                    onClick={() => handleSwitchMainTab('repayments')}
                    className={`flex-1 py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all relative
                        ${activeMainTab === 'repayments'
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-b-4 border-blue-700 shadow-lg'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-b-2 border-blue-200'}`}
                >
                    <TrendingUpIcon className={`w-4 h-4 ${activeMainTab === 'repayments' ? 'animate-bounce' : ''}`} />
                    Repay Loan
                </button>
                <div className="w-px bg-slate-300" /> {}
                <button
                    onClick={() => handleSwitchMainTab('withdrawals')}
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
                {}
                {message && (
                    <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
                        }`}>
                    {message.type === 'success' ? <CheckCircleIcon className="w-5 h-5 text-green-600" /> : <AlertCircleIcon className="w-5 h-5 text-red-600" />}
                        <p className="font-bold text-sm">{message.text}</p>
                    </div>
                )}

                <FormError message={error} className="mb-6" />

                {}
                {activeMainTab === 'deposits' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <Tabs value={activeSubTab} onValueChange={handleSwitchSubTab} className="w-full">
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

                            {}
                            <TabsContent value="mpesa">
                                <div className="step-container">
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
                                                className={`w-full px-4 py-3 rounded-xl border transition-all font-bold text-slate-900 outline-none focus:ring-2 ${
                                                    mpesaPhone !== profilePhone && mpesaPhone !== ''
                                                    ? 'border-orange-400 bg-orange-50/30 focus:ring-orange-500' 
                                                    : 'border-slate-300 focus:ring-green-500'
                                                }`}
                                                placeholder="2547..." />
                                            {mpesaPhone !== profilePhone && mpesaPhone !== '' ? (
                                                <p className="mt-1.5 text-[10px] font-bold text-orange-600 flex items-center gap-1">
                                                    <AlertCircleIcon className="w-3 h-3" />
                                                    Paying from a different number.
                                                </p>
                                            ) : (
                                                <p className="mt-1 text-[10px] text-slate-400">Pre-filled from your profile.</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Amount (KES)</label>
                                            <input type="number" step="1" min="1" required value={mpesaAmount} onChange={e => setMpesaAmount(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-green-500 focus:border-transparent font-bold text-slate-900"
                                                placeholder="0" />
                                        </div>

                                        <SubmitButton
                                            isPending={loading}
                                            label="Initiate STK Push"
                                            pendingLabel="Processing..."
                                            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-black uppercase tracking-wide transition-all shadow-lg shadow-green-100"
                                            icon={<SmartphoneIcon className="w-4 h-4" />}
                                        />
                                    </form>
                                </div>
                            </TabsContent>

                            {}
                            <TabsContent value="share">
                                <div className="space-y-6 step-container">
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
                                        <SubmitButton
                                            isPending={loading}
                                            label="Submit Contribution"
                                            pendingLabel="Processing..."
                                            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-4 rounded-xl font-black uppercase tracking-wide transition-all shadow-lg shadow-cyan-100"
                                        />
                                    </form>
                                </div>
                            </TabsContent>

                            {}
                            <TabsContent value="penalty">
                                <div className="space-y-6 step-container">
                                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                                        <div className="bg-red-100 p-2 rounded-full">
                                            <AlertCircleIcon className="w-5 h-5 text-red-600" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-red-900">Fines & Penalties</h4>
                                            <p className="text-xs text-red-700">Clear outstanding fines and penalties.</p>
                                        </div>
                                    </div>
                                    
                                    {fetchingFines ? (
                                        <div className="flex flex-col items-center justify-center py-10 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl animate-pulse">
                                            <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mb-3"></div>
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Fetching Outstanding Fines...</span>
                                        </div>
                                    ) : availableFines.length > 0 ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between px-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Select Outstanding Fines</label>
                                                <button 
                                                    type="button"
                                                    onClick={() => {
                                                        if (selectedFineIds.size === availableFines.length) setSelectedIds(new Set())
                                                        else setSelectedIds(new Set(availableFines.map(f => f.id)))
                                                    }}
                                                    className="text-[10px] font-bold text-blue-600 uppercase hover:underline disabled:opacity-50"
                                                    disabled={loading}
                                                >
                                                    {selectedFineIds.size === availableFines.length ? 'Deselect All' : 'Select All'}
                                                </button>
                                            </div>
                                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                                {availableFines.map(fine => (
                                                    <div 
                                                        key={fine.id}
                                                        onClick={() => {
                                                            if (loading) return;
                                                            handleFineSelect(fine.id);
                                                        }}
                                                        className={`group flex items-center justify-between p-3 rounded-xl border-2 transition-all
                                                            ${selectedFineIds.has(fine.id) 
                                                                ? 'border-red-500 bg-red-50/10 shadow-sm shadow-red-50' 
                                                                : 'border-slate-100 bg-white hover:border-slate-200'}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="pointer-events-none">
                                                                <Checkbox 
                                                                    checked={selectedFineIds.has(fine.id)}
                                                                    disabled={loading}
                                                                    className="border-slate-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                                                />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-slate-900 leading-tight">{fine.reason}</span>
                                                                <span className="text-[10px] text-slate-400 font-medium">{formatDate(fine.date)}</span>
                                                            </div>
                                                        </div>
                                                        <span className="text-sm font-black text-red-600 tabular-nums bg-red-50 px-2 py-0.5 rounded-lg">
                                                            {formatCurrency(fine.amount)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-8 px-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                                            <div className="bg-green-100 p-2.5 rounded-full mb-3 shadow-inner shadow-green-200">
                                                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                                            </div>
                                            <h5 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">Clear as a Whistle!</h5>
                                            <p className="text-[10px] text-slate-500 font-medium">You have no pending fines or penalties to clear.</p>
                                        </div>
                                    )}

                                    <form onSubmit={handlePenaltyPayment} className="space-y-4">
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="text-xs font-bold uppercase text-slate-500 block">Amount (KES)</label>
                                                {selectedFineIds.size > 0 && (
                                                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full animate-pulse border border-red-100">
                                                        Locked to Selection
                                                    </span>
                                                )}
                                            </div>
                                            <input 
                                                type="number" 
                                                step="0.01" 
                                                min="0.01" 
                                                required 
                                                value={penaltyAmount} 
                                                onChange={e => setPenaltyAmount(e.target.value)}
                                                readOnly={selectedFineIds.size > 0}
                                                className={`w-full px-4 py-3 rounded-xl border transition-all font-bold outline-none focus:ring-2 ${
                                                    selectedFineIds.size > 0 
                                                    ? 'bg-slate-50 border-red-200 text-slate-500 cursor-not-allowed' 
                                                    : 'border-slate-300 focus:ring-red-500 text-slate-900'
                                                }`} 
                                                placeholder="0.00" 
                                            />
                                            {selectedFineIds.size > 0 && (
                                                <p className="mt-1 text-[10px] text-slate-400 italic">Total of {selectedFineIds.size} selected item(s).</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Description</label>
                                            <textarea 
                                                required 
                                                value={penaltyDescription} 
                                                onChange={e => setPenaltyDescription(e.target.value)}
                                                readOnly={selectedFineIds.size > 0}
                                                className={`w-full px-4 py-3 rounded-xl border transition-all outline-none focus:ring-2 ${
                                                    selectedFineIds.size > 0 
                                                    ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' 
                                                    : 'border-slate-300 focus:ring-red-500 text-slate-900'
                                                }`} 
                                                placeholder="Reason..." 
                                                rows={2} 
                                            />
                                        </div>
                                        <SubmitButton
                                            isPending={loading}
                                            label="Pay Penalty"
                                            pendingLabel="Processing..."
                                            className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-black uppercase tracking-wide transition-all shadow-lg shadow-red-100"
                                        />
                                    </form>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                )}



                {}
                {activeMainTab === 'repayments' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 step-container">
                        <div className="space-y-6">
                        <LoanRepaymentForm 
                            memberId={memberId}
                            onSuccess={() => {
                                onTransactionComplete?.()
                            }}
                        />
                        </div>
                    </div>
                )}

                {}
                {activeMainTab === 'withdrawals' && (
                    <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300 step-container">
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
                            <SubmitButton
                                isPending={loading}
                                disabled={parseFloat(withdrawAmount) > withdrawableBalance}
                                label="Withdraw Funds"
                                pendingLabel="Processing..."
                                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-xl font-black uppercase tracking-wide transition-all shadow-lg shadow-teal-100"
                            />
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}
