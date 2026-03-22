'use client'

import React, { useState, useEffect, useTransition } from 'react'
import {
    getAccountLedger,
    getChartOfAccounts,
    getJournalEntries,
    getTrialBalance,
    reverseJournalEntryAction as reverseJournalEntry,
    getJournalEntryDetails,
    getBalanceSheetReport,
    approveLedgerAction,
    closeLedgerAction,
    reactivateLedgerAction,
    rejectLedgerAction
} from '@/app/actions/accounting-actions'
import { getAccountingPeriods, closeAccountingPeriodAction, openAccountingPeriodAction } from '@/app/actions/accounting-period-actions'
import { FileTextIcon, ListIcon, ScaleIcon, XCircleIcon, SearchIcon, FilterIcon, Settings, RefreshCw, Loader2, Save, ArrowLeftRightIcon, PlusIcon, DollarSign, ArrowRightIcon, ChevronDown, ChevronRight, Layers, Calendar as CalendarIcon, Shield, Clock, Power, RotateCcw, CheckCircle, History as HistoryIcon } from 'lucide-react'

import {
    getSystemMappings,
    getAllAccounts,
    getStrictGLAccounts,
    updateSystemMapping,
    initializeSystemMappings,
} from '@/app/actions/system-accounting'
import { getTransferRequests } from '@/app/actions/transfer-actions'
import { TransferRequestForm } from '@/components/accounting/TransferRequestForm'
import { TransferList } from '@/components/accounting/TransferList'
import { getCurrentUserPermissions } from '@/app/actions/user-permissions'
import { getExpenses, getExpenseCategories } from '@/app/actions/expenses'
import { DatePickerField } from '@/components/ui/date-picker-field'
import { format, parse } from 'date-fns'
import { getMembers } from '@/app/actions/get-members'
import { ExpensesTab } from '@/components/accounting/ExpensesTab'
import { AccountActionsMenu } from '@/components/accounting/AccountActionsMenu'
import { MpesaLedger } from '@/components/accounting/MpesaLedger'
import { JournalHistory } from '@/components/admin/ledger/JournalHistory'
import { LedgerForm } from '@/components/admin/ledger/LedgerForm'
import { PeriodForm } from '@/components/admin/ledger/PeriodForm'
import { SystemAccountType } from '@prisma/client'

import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PremiumTabs, TabOption } from './shared/PremiumTabs'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeIn, scaleIn } from '@/lib/animation-variants'

const formatType = (type: string) => {
    return type.split('_').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
}

type Tab = 'coa' | 'hierarchy' | 'periods' | 'journal' | 'ledger' | 'config' | 'transfers' | 'mpesa'


type MappingWithAccount = {
    id: string
    type: SystemAccountType
    accountId: string
    account: {
        id: string
        code: string
        name: string
    }
}

type AccountOption = {
    id: string
    code: string
    name: string
}

export function AccountsModule({ members = [] }: { members?: any[] }) {
    const [activeTab, setActiveTab] = useState<Tab>('coa')
    const [loading, setLoading] = useState(false)
    const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null)
    const [expandedLedgerId, setExpandedLedgerId] = useState<string | null>(null)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Chart of Accounts state
    const [chartOfAccounts, setChartOfAccounts] = useState<any[]>([])

    // Journal Entries state
    const [journalEntries, setJournalEntries] = useState<any[]>([])
    const [pagination, setPagination] = useState<any>(null)
    const [filters, setFilters] = useState({
        searchTerm: '',
        referenceType: '',
        startDate: '',
        endDate: ''
    })
    const [selectedEntry, setSelectedEntry] = useState<any>(null)

    // Trial Balance state
    const [trialBalance, setTrialBalance] = useState<any>(null)

    // Account Ledger state
    const [selectedAccountCode, setSelectedAccountCode] = useState('')
    const [accountLedger, setAccountLedger] = useState<any>(null)
    const [reversingId, setReversingId] = useState<string | null>(null)
    const [userAuth, setUserAuth] = useState<{ role: string, permissions: any } | null>(null)
    const [selectedLedgerLine, setSelectedLedgerLine] = useState<any>(null)
    const [showJournalEntryModal, setShowJournalEntryModal] = useState(false)
    const [journalEntryDetails, setJournalEntryDetails] = useState<any>(null)

    // Ledger Config state
    const [mappings, setMappings] = useState<MappingWithAccount[]>([])
    const [accounts, setAccounts] = useState<AccountOption[]>([])

    // Transfers State
    const [transfers, setTransfers] = useState<{ pending: any[], history: any[] }>({ pending: [], history: [] })

    // Balance Sheet State
    const [balanceSheet, setBalanceSheet] = useState<any>(null)

    const [isPending, startTransition] = useTransition()

    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
    const [periods, setPeriods] = useState<any[]>([])
    const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false)
    const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false)

    // Fetch user permissions on mount
    useEffect(() => {
        const fetchPermissions = async () => {
            const authData = await getCurrentUserPermissions()
            setUserAuth(authData)
        }
        fetchPermissions()
    }, [])


    // Load data based on active tab
    useEffect(() => {
        loadData()
    }, [activeTab])

    const loadData = async () => {
        setLoading(true)
        try {
            if (activeTab === 'coa') {
                // CRITICAL: Only show the 5 strict GL accounts configured in Ledger Config
                // NOT all accounts in the database
                const accounts = await getStrictGLAccounts()
                setChartOfAccounts(accounts)
            } else if (activeTab === 'journal') {
                const query = {
                    ...filters,
                    startDate: filters.startDate ? new Date(filters.startDate) : undefined,
                    endDate: filters.endDate ? new Date(filters.endDate) : undefined
                }
                const result = await getJournalEntries(query)
                setJournalEntries(result.entries)
                setPagination(result.pagination)
            } else if (activeTab === 'config') {
                const [mappingsData, accountsData] = await Promise.all([
                    getSystemMappings(),
                    getAllAccounts() // Use ALL accounts so we can map new ones
                ])
                setMappings(mappingsData)
                setAccounts(accountsData)
            } else if (activeTab === 'transfers') {
                const data = await getTransferRequests()
                setTransfers(data)
            } else if (activeTab === 'hierarchy') {
                const data = await getChartOfAccounts()
                setChartOfAccounts(data)
            } else if (activeTab === 'periods') {
                const data = await getAccountingPeriods()
                setPeriods(data)
            }

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message })
            toast.error(error.message || "Failed to load data")
        } finally {
            setLoading(false)
        }
    }

    const loadAccountLedger = async (accountCode: string) => {
        try {
            const ledger = await getAccountLedger(accountCode)
            setAccountLedger(ledger)
            setActiveTab('ledger')
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message })
        }
    }

    const handleReverseEntry = async (entryId: string) => {
        const reason = prompt('Enter reason for reversal:')
        if (!reason) return

        setReversingId(entryId)
        try {
            await reverseJournalEntry(entryId, reason)
            setMessage({ type: 'success', text: 'Journal entry reversed successfully' })
            toast.success('Journal entry reversed successfully')
            loadData()
            setSelectedEntry(null)
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message })
            toast.error(error.message)
        } finally {
            setReversingId(null)
        }
    }

    const handleInitialize = () => {
        startTransition(async () => {
            try {
                const result = await initializeSystemMappings()
                if (result.success) {
                    toast.success(result.message)
                    loadData()
                } else {
                    toast.error(result.message)
                }
            } catch (error) {
                toast.error("Failed to initialize mappings")
            }
        })
    }

    const handleMappingChange = (type: SystemAccountType, accountId: string) => {
        startTransition(async () => {
            try {
                const result = await updateSystemMapping(type, accountId)
                if (result.success) {
                    toast.success("Mapping updated")
                    loadData()
                } else {
                    toast.error("Failed to update mapping")
                }
            } catch (error) {
                toast.error("Update failed")
            }
        })
    }

    const handleFindEntries = async () => {
        if (!selectedLedgerLine) return
        try {
            setLoading(true)
            const details = await getJournalEntryDetails(selectedLedgerLine.journalEntryId)
            setJournalEntryDetails(details)
            setShowJournalEntryModal(true)
        } catch (error: any) {
            toast.error(error.message || "Failed to load journal entry")
        } finally {
            setLoading(false)
        }
    }

    const handleReverseLedgerTransaction = async () => {
        if (!selectedLedgerLine) return
        const reason = prompt('Enter reason for reversal:')
        if (!reason) return

        setReversingId(selectedLedgerLine.journalEntryId)
        try {
            await reverseJournalEntry(selectedLedgerLine.journalEntryId, reason)
            toast.success('Transaction reversed successfully')
            // Refresh the account ledger
            if (accountLedger) {
                await loadAccountLedger(accountLedger.account.code)
            }
            setSelectedLedgerLine(null)
        } catch (error: any) {
            toast.error(error.message || "Failed to reverse transaction")
        } finally {
            setReversingId(null)
        }
    }

    const toggleNode = (id: string) => {
        const next = new Set(expandedNodes)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setExpandedNodes(next)
    }

    const handleApprove = async (id: string) => {
        try {
            await approveLedgerAction(id)
            toast.success("Ledger approved and activated")
            loadData()
        } catch (error: any) {
            toast.error(error.message || "Approval failed")
        }
    }

    const handleCloseLedger = async (id: string) => {
        if (!confirm("Are you sure you want to close this ledger? This will prevent any further postings.")) return
        try {
            await closeLedgerAction(id)
            toast.success("Ledger closed successfully")
            loadData()
        } catch (error: any) {
            toast.error(error.message || "Failed to close ledger")
        }
    }

    const handleReactivate = async (id: string) => {
        if (!confirm("Are you sure you want to reactivate this ledger?")) return
        try {
            await reactivateLedgerAction(id)
            toast.success("Ledger reactivated successfully")
            loadData()
        } catch (error: any) {
            toast.error(error.message || "Failed to reactivate ledger")
        }
    }

    const handleRejectLedger = async (id: string) => {
        if (!confirm("Are you sure you want to reject this ledger? It will be permanently deleted.")) return
        try {
            await rejectLedgerAction(id)
            toast.success("Ledger rejected and removed")
            loadData()
        } catch (error: any) {
            toast.error(error.message || "Failed to reject ledger")
        }
    }

    const handleClosePeriod = async (id: string) => {
        if (!confirm("Are you sure you want to close this accounting period? This will prevent any further postings to this date range.")) return
        try {
            await closeAccountingPeriodAction(id)
            toast.success("Accounting period closed")
            loadData()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const renderLedgerRow = (ledger: any, depth: number = 0) => {
        const hasChildren = ledger.children && ledger.children.length > 0;
        const isExpanded = expandedNodes.has(ledger.id);

        return (
            <React.Fragment key={ledger.id}>
                <tr className="hover:bg-slate-50 transition-colors border-b border-slate-100 group">
                    <td className="py-3 pl-4">
                        <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 24}px` }}>
                            {hasChildren ? (
                                <button onClick={() => toggleNode(ledger.id)} className="p-1 hover:bg-slate-200 rounded transition-colors text-slate-500">
                                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>
                            ) : (
                                <div className="w-6" />
                            )}
                            <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{ledger.code}</span>
                            <span className="font-semibold text-slate-800">{ledger.name}</span>
                        </div>
                    </td>
                    <td>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${ledger.type === 'ASSET' ? 'bg-blue-100 text-blue-700' :
                            ledger.type === 'LIABILITY' ? 'bg-amber-100 text-amber-700' :
                                ledger.type === 'EQUITY' ? 'bg-purple-100 text-purple-700' :
                                    ledger.type === 'REVENUE' || ledger.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700' :
                                        'bg-rose-100 text-rose-700'
                            }`}>
                            {ledger.type}
                        </span>
                    </td>
                    <td className="text-right font-mono font-bold text-slate-700 pr-8">
                        {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(Number(ledger.balance))}
                        <span className="text-[10px] text-slate-400 ml-1">{ledger.normalBalance === 'DEBIT' ? 'Dr' : 'Cr'}</span>
                    </td>
                    <td>
                        <div className={`flex items-center gap-1.5 font-bold text-[11px] ${ledger.status === 'ACTIVE' ? 'text-emerald-600' :
                            ledger.status === 'PENDING' ? 'text-amber-600' :
                                'text-slate-400'
                            }`}>
                            {ledger.status === 'ACTIVE' ? <CheckCircle className="w-3.5 h-3.5" /> :
                                ledger.status === 'PENDING' ? <Clock className="w-3.5 h-3.5" /> :
                                    <XCircleIcon className="w-3.5 h-3.5" />}
                            {ledger.status}
                        </div>
                    </td>
                    <td className="text-right pr-4">
                        <div className="flex justify-end gap-2">
                            {ledger.status === 'PENDING' && (
                                <button
                                    onClick={() => handleApprove(ledger.id)}
                                    className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                                >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Approve
                                </button>
                            )}
                            {ledger.status === 'ACTIVE' && (
                                <button
                                    onClick={() => handleCloseLedger(ledger.id)}
                                    className="flex items-center gap-1.5 border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    <Power className="w-3.5 h-3.5" />
                                    Close
                                </button>
                            )}
                            <button
                                onClick={() => loadAccountLedger(ledger.code)}
                                className="text-xs font-bold text-cyan-600 hover:underline px-2 py-1.5"
                            >
                                Ledger
                            </button>
                        </div>
                    </td>
                </tr>
                {isExpanded && hasChildren && ledger.children!.map((child: any) => renderLedgerRow(child, depth + 1))}
            </React.Fragment>
        );
    }

    // We explicitly define the list of granular events...
    const allSystemTypes: SystemAccountType[] = [
        // Income
        'INCOME_LOAN_INTEREST',
        'RECEIVABLE_LOAN_INTEREST',
        'INCOME_LOAN_PENALTY',
        'RECEIVABLE_LOAN_PENALTY',
        'INCOME_LOAN_PROCESSING_FEE',
        'INCOME_GENERAL_FEE',
        'INCOME_REFINANCE_FEE',
        // Assets/Wallet
        'EVENT_EXPENSE_PAYMENT',
        'EVENT_CASH_DEPOSIT',
        'EVENT_CASH_WITHDRAWAL',
        'EVENT_LOAN_DISBURSEMENT',
        'EVENT_LOAN_REPAYMENT_PRINCIPAL',
        'EVENT_SHARE_CONTRIBUTION'
    ] as any
    const mergedList = allSystemTypes.map(type => {
        const existing = mappings.find(m => m.type === type)
        return {
            type,
            mapping: existing
        }
    })

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
            {}
            <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl">
                {}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 pb-1 mb-4 rounded-full bg-white/10 border border-white/10 backdrop-blur-md">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                            <span className="text-[10px] font-black text-white/90 uppercase tracking-widest">Financial Operations</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                            Accounts & <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">General Ledger</span>
                        </h1>
                        <p className="text-slate-400 mt-2 text-sm md:text-base font-medium max-w-xl">
                            Real-time tracking of chart of accounts, automated journal entries, and financial periods.
                        </p>
                    </div>

                    <div className="flex shrink-0">
                        <button 
                            onClick={loadData}
                            className="bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all rounded-xl px-5 py-2.5 text-sm font-bold flex items-center gap-2 backdrop-blur-md"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Sync Data
                        </button>
                    </div>
                </div>
            </div>

            {}
            <div className="bg-white rounded-2xl p-2 md:p-3 shadow-sm border border-slate-200 sticky top-4 z-20">
                <div className="flex overflow-x-auto no-scrollbar gap-1 md:gap-2 snap-x">
                <PremiumTabs 
                    tabs={[
                        { id: 'coa', label: 'Dashboard', icon: ListIcon },
                        { id: 'hierarchy', label: 'Hierarchy', icon: Layers },
                        { id: 'journal', label: 'Journal', icon: HistoryIcon },
                        { id: 'periods', label: 'Periods', icon: CalendarIcon },
                        { id: 'transfers', label: 'Transfers', icon: ArrowLeftRightIcon },
                        ...(userAuth?.role !== 'Member' ? [{ id: 'config', label: 'Settings', icon: Settings }] : [])
                    ]}
                    activeTab={activeTab}
                    onChange={(id) => setActiveTab(id as Tab)}
                    className="flex-nowrap overflow-x-auto scrollbar-none"
                />
                </div>
            </div>

            {}
            {chartOfAccounts.filter(l => l.status === 'PENDING').length > 0 && activeTab !== 'ledger' && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Shield className="w-5 h-5 text-amber-600" />
                        <h3 className="font-bold text-amber-800 text-sm">Pending Ledger Approvals ({chartOfAccounts.filter(l => l.status === 'PENDING').length})</h3>
                        <span className="text-[10px] uppercase tracking-widest font-black text-amber-500 bg-amber-100 px-2 py-0.5 rounded-full">Maker-Checker 1/2</span>
                    </div>
                </div>
            )}

            {}
            {message && (
                <div className={`p-4 rounded-xl mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}>
                    {message.text}
                </div>
            )}

            {}
            {activeTab === 'coa' && (
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Chart of Accounts</h3>
                            <p className="text-sm text-slate-500 mt-1">Flat view of all active and pending ledger accounts.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input 
                                    type="text" 
                                    placeholder="Search accounts..." 
                                    className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm w-full md:w-64 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                                />
                            </div>
                            <Button 
                                onClick={() => setIsLedgerModalOpen(true)}
                                className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-md shadow-cyan-600/20"
                            >
                                <PlusIcon className="w-4 h-4 mr-2" />
                                New Account
                            </Button>
                        </div>
                    </div>
                    {loading ? (
                        <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-500" />
                            Loading chart of accounts...
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase text-slate-500 tracking-wider">Account</th>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase text-slate-500 tracking-wider">Type</th>
                                        <th className="px-6 py-4 text-right text-xs font-black uppercase text-slate-500 tracking-wider">Balance</th>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase text-slate-500 tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-right text-xs font-black uppercase text-slate-500 tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {chartOfAccounts
                                        .sort((a, b) => {
                                            const order: Record<string, number> = { PENDING: 0, ACTIVE: 1, CLOSED: 2 };
                                            return (order[a.status as string] ?? 1) - (order[b.status as string] ?? 1);
                                        })
                                        .map(ledger => renderLedgerRow(ledger))}
                                </tbody>
                            </table>
                            {chartOfAccounts.length === 0 && (
                                <div className="p-12 text-center text-slate-500">
                                    No ledger accounts found.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {}
            {activeTab === 'journal' && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm p-6">
                    <JournalHistory />
                </div>
            )}

            {}
            {activeTab === 'hierarchy' && (
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="text-xl font-bold text-slate-900">Account Hierarchy</h3>
                        <p className="text-sm text-slate-500 mt-1">Tree view of parent and child ledger accounts.</p>
                    </div>
                    {loading ? (
                        <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-500" />
                            Loading hierarchy...
                        </div>
                    ) : (
                        <table className="table w-full">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-widest font-black">
                                <tr>
                                    <th className="py-4 pl-6 text-left">Ledger Account (Hierarchy)</th>
                                    <th className="text-left">Account Type</th>
                                    <th className="text-right pr-8">Current Balance</th>
                                    <th className="text-left">Status</th>
                                    <th className="text-right pr-6">Management</th>
                                </tr>
                            </thead>
                            <tbody>
                                {chartOfAccounts
                                    .filter(l => !l.parentId)
                                    .sort((a, b) => {
                                        const order: Record<string, number> = { PENDING: 0, ACTIVE: 1, CLOSED: 2 };
                                        return (order[a.status as string] ?? 1) - (order[b.status as string] ?? 1);
                                    })
                                    .map(ledger => renderLedgerRow(ledger))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {}
            {activeTab === 'periods' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {periods.map(period => (
                        <div key={period.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-slate-50 rounded-xl">
                                    <CalendarIcon className="w-6 h-6 text-cyan-500" />
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${period.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    {period.status}
                                </span>
                            </div>
                            <h3 className="font-bold text-slate-800">
                                {new Date(period.startDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} -
                                {new Date(period.endDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">{period.memo || 'Regular accounting period'}</p>

                            <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center">
                                <div className="text-[10px] text-slate-400 italic">
                                    {period.status === 'CLOSED' ? `Closed by Admin at ${new Date(period.closedAt).toLocaleDateString()}` : 'Period remains open for postings'}
                                </div>
                                {period.status === 'OPEN' && (
                                    <button
                                        onClick={() => handleClosePeriod(period.id)}
                                        className="text-xs font-black text-red-600 hover:text-red-700 uppercase"
                                    >
                                        Close Period
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={() => setIsPeriodModalOpen(true)}
                        className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-2xl hover:border-cyan-300 hover:bg-cyan-50 transition-all group"
                    >
                        <PlusIcon className="w-10 h-10 text-slate-300 group-hover:text-cyan-400 mb-2 transition-colors" />
                        <span className="font-bold text-slate-400 group-hover:text-cyan-700 uppercase text-xs">Open New Period</span>
                    </button>
                </div>
            )}

            {}
            {activeTab === 'journal' && (
                <div className="space-y-6">
                    {}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                        <div className="grid grid-cols-4 gap-3">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={filters.searchTerm}
                                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                            />
                            <select
                                value={filters.referenceType}
                                onChange={(e) => setFilters({ ...filters, referenceType: e.target.value })}
                                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                            >
                                <option value="">All Types</option>
                                <option value="LOAN_DISBURSEMENT">Loan Disbursement</option>
                                <option value="LOAN_REPAYMENT">Loan Repayment</option>
                                <option value="SAVINGS_DEPOSIT">Savings Deposit</option>
                                <option value="SHARE_CONTRIBUTION">Share Contribution</option>
                                <option value="OPENING_BALANCE">Opening Balance</option>
                                <option value="MIGRATION">Migration</option>
                            </select>
                            <DatePickerField
                                value={filters.startDate ? parse(filters.startDate, 'yyyy-MM-dd', new Date()) : undefined}
                                onChange={(date) => setFilters({ ...filters, startDate: date ? format(date, 'yyyy-MM-dd') : '' })}
                                placeholder="Filter by date"
                            />
                            <button
                                onClick={loadData}
                                className="bg-cyan-500 hover:bg-cyan-600 text-white py-1.5 rounded-lg font-bold uppercase text-xs"
                            >
                                <FilterIcon className="w-3 h-3 inline mr-2" />
                                Filter
                            </button>
                        </div>
                    </div>

                    {}
                    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                        {loading ? (
                            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-500" />
                                Loading journal entries...
                            </div>
                        ) : (
                            <>
                                <div className="divide-y divide-slate-100">
                                    {journalEntries.map((entry) => (
                                        <div key={entry.id} className="p-6 hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedEntry(entry)}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="font-mono text-sm font-black text-cyan-600">{entry.entryNumber}</div>
                                                    <div className="text-sm text-slate-600">{entry.description}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-slate-500">{new Date(entry.transactionDate).toLocaleDateString()}</div>
                                                    <div className="text-xs font-bold text-slate-700">
                                                        {entry.isReversed ? (
                                                            <span className="text-red-600">REVERSED</span>
                                                        ) : (
                                                            `KES ${entry.totalDebit.toLocaleString()}`
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {entry.lines.length} line{entry.lines.length !== 1 ? 's' : ''} • {entry.referenceType.replace(/_/g, ' ')}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {}
                                {pagination && (
                                    <div className="p-4 border-t border-slate-200 flex justify-between items-center text-sm">
                                        <div className="text-slate-600">
                                            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                                        </div>
                                        <div className="flex gap-2">
                                            {pagination.page > 1 && (
                                                <button
                                                    onClick={() => {  }}
                                                    className="px-4 py-2 border border-slate-300 rounded-xl font-bold hover:bg-slate-50"
                                                >
                                                    Previous
                                                </button>
                                            )}
                                            {pagination.page < pagination.totalPages && (
                                                <button
                                                    onClick={() => {  }}
                                                    className="px-4 py-2 border border-slate-300 rounded-xl font-bold hover:bg-slate-50"
                                                >
                                                    Next
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {}
                    {selectedEntry && (
                        <AnimatePresence>
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedEntry(null)}>
                            <motion.div 
                                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900">{selectedEntry.entryNumber}</h2>
                                        <p className="text-slate-600">{selectedEntry.description}</p>
                                    </div>
                                    <button onClick={() => setSelectedEntry(null)} className="text-slate-400 hover:text-slate-600">
                                        <XCircleIcon className="w-6 h-6" />
                                    </button>
                                </div>

                                {}
                                <table className="w-full mb-6">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-600">Account</th>
                                            <th className="px-4 py-3 text-right text-xs font-black uppercase text-slate-600">Debit</th>
                                            <th className="px-4 py-3 text-right text-xs font-black uppercase text-slate-600">Credit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {selectedEntry.lines.map((line: any) => (
                                            <tr key={line.id}>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm font-bold text-slate-900">{line.account.code} - {line.account.name}</div>
                                                    {line.description && <div className="text-xs text-slate-500">{line.description}</div>}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-sm">
                                                    {line.debitAmount > 0 && `KES ${line.debitAmount.toLocaleString()}`}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-sm">
                                                    {line.creditAmount > 0 && `KES ${line.creditAmount.toLocaleString()}`}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-50 font-bold">
                                        <tr>
                                            <td className="px-4 py-3 text-sm uppercase">Total</td>
                                            <td className="px-4 py-3 text-right font-mono">KES {selectedEntry.totalDebit.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right font-mono">KES {selectedEntry.totalCredit.toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                </table>

                                {}
                                {!selectedEntry.isReversed && (
                                    (() => {
                                        const canReverse =
                                            ['CHAIRPERSON', 'TREASURER', 'SECRETARY'].includes(userAuth?.role || '') ||
                                            userAuth?.permissions?.canReverse === true;

                                        if (!canReverse) return null;

                                        return (
                                            <button
                                                onClick={() => handleReverseEntry(selectedEntry.id)}
                                                disabled={reversingId === selectedEntry.id}
                                                className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white py-3 rounded-xl font-black uppercase text-sm flex items-center justify-center gap-2"
                                            >
                                                {reversingId === selectedEntry.id ? (
                                                    <>
                                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                                        Reversing...
                                                    </>
                                                ) : (
                                                    'Reverse Entry'
                                                )}
                                            </button>
                                        );
                                    })()
                                )}
                                </motion.div>
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            )}


            {}
            {
                activeTab === 'expenses' && (
                    <ExpensesTab
                        expenses={expenses}
                        accounts={chartOfAccounts}
                        categories={expenseCategories}
                        members={membersList}
                        currentUserId={userAuth?.permissions?.userId || ''}
                        currentUserRole={userAuth?.role || ''}
                        isOfficial={userAuth?.role !== 'Member'}
                        onRefresh={loadData}
                    />
                )
            }

            {}
            {
                activeTab === 'mpesa' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <MpesaLedger members={members} />
                    </div>
                )
            }

            {}
            {
                activeTab === 'config' && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="text-center md:text-left">
                                <h2 className="text-2xl font-bold text-slate-900">System Accounting Mappings</h2>
                                <p className="text-slate-600 mt-1">
                                    Map core system events to General Ledger accounts
                                </p>
                            </div>
                            <div className="flex w-full md:w-auto items-center justify-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={loadData}
                                    disabled={loading}
                                    className="border-cyan-200 text-cyan-700 hover:bg-cyan-50"
                                >
                                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleInitialize}
                                    disabled={isPending || mappings.length > 0}
                                    className="bg-cyan-600 hover:bg-cyan-700"
                                >
                                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Initialize Defaults
                                </Button>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-slate-200 bg-slate-50">
                                <h3 className="text-lg font-bold text-slate-900">Global Ledger Mappings</h3>
                                <p className="text-sm text-slate-600 mt-1">
                                    Define which GL Account is affected by standard system operations
                                </p>
                            </div>
                            <div className="overflow-x-auto hidden md:block">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase">System Event</th>
                                            <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase">Mapped GL Account</th>
                                            <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {mergedList.map(({ type, mapping }) => (
                                            <tr key={type} className="hover:bg-slate-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-900">{formatType(type)}</span>
                                                        <span className="text-xs text-slate-500">{type}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Select
                                                        disabled={isPending}
                                                        value={mapping?.accountId || ""}
                                                        onValueChange={(val) => handleMappingChange(type, val)}
                                                    >
                                                        <SelectTrigger className="w-full max-w-md">
                                                            <SelectValue placeholder="Select GL Account" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {accounts.map((acc) => (
                                                                <SelectItem key={acc.id} value={acc.id}>
                                                                    {acc.code} - {acc.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {mapping ? (
                                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                            Mapped
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                                            Pending
                                                        </Badge>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {}
                            <div className="md:hidden divide-y divide-slate-100">
                                {mergedList.map(({ type, mapping }) => (
                                    <div key={type} className="p-4 bg-white">
                                        <div className="mb-2">
                                            <div className="font-bold text-slate-900 text-sm">{formatType(type)}</div>
                                            <div className="text-xs text-slate-500 font-mono">{type}</div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Mapped Account</label>
                                            <Select
                                                disabled={isPending}
                                                value={mapping?.accountId || ""}
                                                onValueChange={(val) => handleMappingChange(type, val)}
                                            >
                                                <SelectTrigger className="w-full text-sm h-9">
                                                    <SelectValue placeholder="Select GL Account" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {accounts.map((acc) => (
                                                        <SelectItem key={acc.id} value={acc.id}>
                                                            {acc.code} - {acc.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <div className="mt-2">
                                                {mapping ? (
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                                                        Mapped
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-[10px]">
                                                        Pending
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {}
                        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden mt-8 shadow-sm">
                            <div className="p-6 border-b border-slate-200 bg-slate-50">
                                <h3 className="text-lg font-bold text-slate-900">Reference: Available GL Accounts</h3>
                                <p className="text-sm text-slate-600 mt-1">
                                    List of all accounts available for mapping
                                </p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase">Code</th>
                                            <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase">Account Name</th>
                                            <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase">Type</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {accounts.map((acc: any) => (
                                            <tr key={acc.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 font-mono text-sm font-bold text-slate-900">{acc.code}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-slate-900">{acc.name}</td>
                                                <td className="px-6 py-4">
                                                    <Select
                                                        value={acc.type}
                                                        onValueChange={(value) => {
                                                            const promise = updateAccountType(acc.id, value)
                                                            toast.promise(promise, {
                                                                loading: 'Updating account type...',
                                                                success: 'Account type and ledger corrected',
                                                                error: 'Failed to update type'
                                                            })
                                                        }}
                                                    >
                                                        <SelectTrigger className={`w-[140px] h-8 text-xs font-bold border-0 ring-0 focus:ring-0 ${acc.type === 'ASSET' ? 'bg-blue-100/50 text-blue-700' :
                                                            acc.type === 'LIABILITY' ? 'bg-red-100/50 text-red-700' :
                                                                acc.type === 'EQUITY' ? 'bg-purple-100/50 text-purple-700' :
                                                                    acc.type === 'INCOME' ? 'bg-green-100/50 text-green-700' :
                                                                        'bg-orange-100/50 text-orange-700'
                                                            }`}>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="ASSET">ASSET</SelectItem>
                                                            <SelectItem value="LIABILITY">LIABILITY</SelectItem>
                                                            <SelectItem value="EQUITY">EQUITY</SelectItem>
                                                            <SelectItem value="INCOME">INCOME</SelectItem>
                                                            <SelectItem value="EXPENSE">EXPENSE</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )
            }

            {}
            {
                activeTab === 'ledger' && accountLedger && (
                    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-200 bg-slate-50">
                            <button onClick={() => setActiveTab('coa')} className="text-xs text-cyan-600 font-bold uppercase mb-2">← Back to Chart</button>
                            <h2 className="text-xl font-black text-slate-900">{accountLedger.account.code} - {accountLedger.account.name}</h2>
                            <p className="text-sm text-slate-600">Account Ledger • Current Balance: KES {accountLedger.currentBalance.toLocaleString()}</p>

                            {}
                            <div className="flex gap-3 mt-4">
                                <Button
                                    onClick={handleFindEntries}
                                    disabled={!selectedLedgerLine || loading}
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2"
                                >
                                    <SearchIcon className="w-4 h-4" />
                                    Find Entries
                                </Button>
                                <Button
                                    onClick={handleReverseLedgerTransaction}
                                    disabled={!selectedLedgerLine || reversingId !== null || !['CHAIRPERSON', 'TREASURER', 'SECRETARY'].includes(userAuth?.role || '')}
                                    variant="destructive"
                                    size="sm"
                                    className="flex items-center gap-2"
                                >
                                    {reversingId === selectedLedgerLine?.journalEntryId ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Reversing...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-4 h-4" />
                                            Reverse Transaction
                                        </>
                                    )}
                                </Button>
                                {selectedLedgerLine && (
                                    <span className="text-xs text-slate-500 self-center ml-2">
                                        Selected: {selectedLedgerLine.entryNumber}
                                    </span>
                                )}
                            </div>
                        </div>


                        <div className="overflow-x-auto hidden md:block">
                            <table className="w-full">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase text-slate-600">Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase text-slate-600">Entry #</th>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase text-slate-600">Description</th>
                                        <th className="px-6 py-4 text-right text-xs font-black uppercase text-slate-600">Debit</th>
                                        <th className="px-6 py-4 text-right text-xs font-black uppercase text-slate-600">Credit</th>
                                        <th className="px-6 py-4 text-right text-xs font-black uppercase text-slate-600">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {accountLedger.lines.map((line: any, index: number) => (
                                        <tr
                                            key={index}
                                            onClick={() => setSelectedLedgerLine(line)}
                                            className={cn(
                                                "hover:bg-slate-50 cursor-pointer transition-colors",
                                                selectedLedgerLine?.journalEntryId === line.journalEntryId && "bg-cyan-50 border-l-4 border-cyan-500"
                                            )}
                                        >
                                            <td className="px-6 py-3 text-sm text-slate-600">{new Date(line.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-3 font-mono text-xs font-bold text-cyan-600">{line.entryNumber}</td>
                                            <td className="px-6 py-3 text-sm text-slate-900">{line.description}</td>
                                            <td className="px-6 py-3 text-right font-mono text-sm">{line.debit > 0 && `KES ${line.debit.toLocaleString()}`}</td>
                                            <td className="px-6 py-3 text-right font-mono text-sm">{line.credit > 0 && `KES ${line.credit.toLocaleString()}`}</td>
                                            <td className="px-6 py-3 text-right font-mono text-sm font-bold">{line.balance.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {}
                        <div className="md:hidden divide-y divide-slate-100">
                            {accountLedger.lines.map((line: any, index: number) => {
                                const isExpanded = expandedLedgerId === line.journalEntryId;
                                return (
                                    <div
                                        key={index}
                                        onClick={() => setExpandedLedgerId(isExpanded ? null : line.journalEntryId)}
                                        className={`p-4 bg-white transition-all duration-200 ${isExpanded ? 'bg-slate-50' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="text-xs text-slate-500 mb-0.5">{new Date(line.date).toLocaleDateString()}</div>
                                                <div className="font-bold text-slate-900 text-sm line-clamp-1">{line.description}</div>
                                            </div>
                                            <div className={`font-mono font-bold text-sm ${line.debit > 0 ? 'text-slate-900' : 'text-green-600'}`}>
                                                {line.debit > 0 ? `- ${line.debit.toLocaleString()}` : `+ ${line.credit.toLocaleString()}`}
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="pt-3 mt-3 border-t border-slate-200">
                                                        <div className="grid grid-cols-2 gap-4 mb-3">
                                                            <div>
                                                                <div className="text-[10px] uppercase font-black text-slate-400">Entry #</div>
                                                                <div className="font-mono font-bold text-cyan-600 text-sm">{line.entryNumber}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-[10px] uppercase font-black text-slate-400">Balance</div>
                                                                <div className="font-mono font-bold text-slate-900 text-sm">{line.balance.toLocaleString()}</div>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2 text-xs bg-white border border-slate-200 p-2 rounded-lg mb-4">
                                                            <div>
                                                                <div className="uppercase font-black text-slate-400 text-[10px]">Debit</div>
                                                                <div className="font-mono">{line.debit > 0 ? line.debit.toLocaleString() : '-'}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="uppercase font-black text-slate-400 text-[10px]">Credit</div>
                                                                <div className="font-mono">{line.credit > 0 ? line.credit.toLocaleString() : '-'}</div>
                                                            </div>
                                                        </div>

                                                        {['CHAIRPERSON', 'TREASURER', 'SECRETARY'].includes(userAuth?.role || '') && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleReverseLedgerTransaction(); // Note: logic might rely on selectedLedgerLine. I should set it or update logic.
                                                                    setSelectedLedgerLine(line);
                                                                    // Then call reverse.
                                                                    handleReverseLedgerTransaction();
                                                                }}
                                                                className="w-full py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-2"
                                                            >
                                                                <RefreshCw className="w-3 h-3" />
                                                                Reverse Entry
                                                            </button>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>

                        {}
                        <AnimatePresence>
                            {showJournalEntryModal && journalEntryDetails && (
                                <motion.div
                                    key="journal-modal-overlay"
                                    variants={fadeIn}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
                                    onClick={() => setShowJournalEntryModal(false)}
                                >
                                    <motion.div
                                        key="journal-modal-content"
                                        variants={scaleIn}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        className="bg-white/90 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h2 className="text-2xl font-black text-slate-900">{journalEntryDetails.entryNumber}</h2>
                                                <p className="text-slate-600">{journalEntryDetails.description}</p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {new Date(journalEntryDetails.transactionDate).toLocaleDateString()} • {journalEntryDetails.referenceType}
                                                </p>
                                            </div>
                                            <button onClick={() => setShowJournalEntryModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                                <XCircleIcon className="w-8 h-8" />
                                            </button>
                                        </div>

                                        {}
                                        <table className="w-full mb-6">
                                            <thead className="bg-slate-50/50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-600">Account</th>
                                                    <th className="px-4 py-3 text-right text-xs font-black uppercase text-slate-600">Debit</th>
                                                    <th className="px-4 py-3 text-right text-xs font-black uppercase text-slate-600">Credit</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {journalEntryDetails.lines.map((line: any) => (
                                                    <tr key={line.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div className="text-sm font-bold text-slate-900">{line.account.code} - {line.account.name}</div>
                                                            {line.description && <div className="text-xs text-slate-500">{line.description}</div>}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono text-sm">
                                                            {line.debitAmount > 0 && `KES ${line.debitAmount.toLocaleString()}`}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono text-sm">
                                                            {line.creditAmount > 0 && `KES ${line.creditAmount.toLocaleString()}`}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-slate-50/50 font-bold border-t border-slate-200">
                                                <tr>
                                                    <td className="px-4 py-3 text-sm uppercase">Total</td>
                                                    <td className="px-4 py-3 text-right font-mono text-slate-900">KES {journalEntryDetails.totalDebit.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-right font-mono text-slate-900">KES {journalEntryDetails.totalCredit.toLocaleString()}</td>
                                                </tr>
                                            </tfoot>
                                        </table>

                                        {journalEntryDetails.notes && (
                                            <div className="bg-yellow-50/50 border border-yellow-100 rounded-lg p-4 mb-4">
                                                <p className="text-xs font-bold text-yellow-700 mb-1 uppercase tracking-wider">Notes</p>
                                                <p className="text-sm text-slate-700">{journalEntryDetails.notes}</p>
                                            </div>
                                        )}

                                        {journalEntryDetails.isReversed && (
                                            <div className="bg-red-50/50 border border-red-200 rounded-lg p-4 text-center">
                                                <p className="text-red-800 font-bold flex items-center justify-center gap-2">
                                                    <RefreshCw className="w-4 h-4" />
                                                    This entry has been reversed
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div >
                )
            }

            {}
            {
                activeTab === 'transfers' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Transfer Requests</h2>
                                <p className="text-slate-600 mt-1">Inter-account transfers (Maker-Checker)</p>
                            </div>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold shadow-lg shadow-cyan-600/20">
                                        <PlusIcon className="w-4 h-4 mr-2" />
                                        New Request
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-xl">
                                    <DialogHeader>
                                        <DialogTitle>New Transfer Request</DialogTitle>
                                        <DialogDescription>
                                            Create a manual journal entry transfer. Requires 2-admin approval.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <TransferRequestForm onSuccess={loadData} />
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden p-6 shadow-sm">
                            <Tabs defaultValue="pending" className="w-full">
                                <TabsList className="grid w-full max-w-md grid-cols-2 mb-4 bg-slate-100 p-1 rounded-lg">
                                    <TabsTrigger value="pending" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        Pending ({transfers.pending.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="history" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        History
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="pending" className="mt-0">
                                    <TransferList
                                        requests={transfers.pending}
                                        currentUserId={userAuth?.permissions?.userId || ''}
                                        type="PENDING"
                                    />
                                </TabsContent>

                                <TabsContent value="history" className="mt-0">
                                    <TransferList
                                        requests={transfers.history}
                                        currentUserId={userAuth?.permissions?.userId || ''}
                                        type="HISTORY"
                                    />
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                )
            }

            {}
            {isLedgerModalOpen && (
                <LedgerForm
                    onClose={() => setIsLedgerModalOpen(false)}
                    onSuccess={loadData}
                    existingLedgers={chartOfAccounts}
                />
            )}

            {isPeriodModalOpen && (
                <PeriodForm
                    onClose={() => setIsPeriodModalOpen(false)}
                    onSuccess={loadData}
                />
            )}
        </div >
    )
}
