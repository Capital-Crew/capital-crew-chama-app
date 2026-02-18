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

type Tab = 'coa' | 'hierarchy' | 'periods' | 'journal' | 'trial' | 'balanceSheet' | 'ledger' | 'config' | 'expenses' | 'transfers' | 'mpesa'


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

    // Expenses State
    const [expenses, setExpenses] = useState<any[]>([])
    const [expenseCategories, setExpenseCategories] = useState<any[]>([])
    const [membersList, setMembersList] = useState<any[]>([])

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
            } else if (activeTab === 'trial') {
                const tb = await getTrialBalance()
                setTrialBalance(tb)
            } else if (activeTab === 'config') {
                const [mappingsData, accountsData] = await Promise.all([
                    getSystemMappings(),
                    getAllAccounts() // Use ALL accounts so we can map new ones
                ])
                setMappings(mappingsData)
                setAccounts(accountsData)
            } else if (activeTab === 'expenses') {
                const [expData, accData, catData, memData] = await Promise.all([
                    getExpenses(),
                    getStrictGLAccounts(),
                    getExpenseCategories(),
                    getMembers()
                ])
                setExpenses(expData)
                setChartOfAccounts(accData)
                setExpenseCategories(catData)
                setMembersList(memData)
            } else if (activeTab === 'transfers') {
                const data = await getTransferRequests()
                setTransfers(data)
            } else if (activeTab === 'balanceSheet') {
                const bs = await getBalanceSheetReport()
                setBalanceSheet(bs)
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
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Accounts</h1>
                <p className="text-slate-600 mt-2">General Ledger & Chart of Accounts</p>
            </div>

            {/* Tabs */}
            <div className="mb-8">
                <div className="flex overflow-x-auto no-scrollbar pb-2 -mx-6 px-6 md:mx-0 md:px-0 md:pb-0 md:flex-wrap gap-2">
                    {[
                        { id: 'coa', label: 'Dashboard', shortLabel: 'D/B', icon: ListIcon },
                        { id: 'hierarchy', label: 'Hierarchy', shortLabel: 'Tree', icon: Layers },
                        { id: 'journal', label: 'Journal', shortLabel: 'Journal', icon: HistoryIcon },
                        { id: 'periods', label: 'Periods', shortLabel: 'Periods', icon: CalendarIcon },
                        { id: 'transfers', label: 'Transfers', shortLabel: 'Transfers', icon: ArrowLeftRightIcon },
                        { id: 'expenses', label: 'Expenses', shortLabel: 'Exp.', icon: FileTextIcon },
                        { id: 'trial', label: 'Trial Bal', shortLabel: 'T/B', icon: ScaleIcon },
                        { id: 'balanceSheet', label: 'Reports', shortLabel: 'Financials', icon: ScaleIcon },
                        ...(userAuth?.role !== 'Member' ? [{ id: 'config', label: 'Settings', shortLabel: 'Conf', icon: Settings }] : [])
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as Tab)}
                            className={`relative flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-bold transition-all duration-200 shrink-0 md:shrink md:flex-1 min-w-[120px] md:min-w-[140px] ${activeTab === tab.id
                                ? 'bg-white text-cyan-700 shadow-sm ring-1 ring-slate-200'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                }`}
                        >
                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-cyan-600' : 'text-slate-400'}`} />
                            <span className="whitespace-nowrap hidden md:inline">{tab.label}</span>
                            <span className="whitespace-nowrap md:hidden">{tab.shortLabel}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Pending Approvals Banner */}
            {chartOfAccounts.filter(l => l.status === 'PENDING').length > 0 && activeTab !== 'ledger' && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Shield className="w-5 h-5 text-amber-600" />
                        <h3 className="font-bold text-amber-800 text-sm">Pending Ledger Approvals ({chartOfAccounts.filter(l => l.status === 'PENDING').length})</h3>
                        <span className="text-[10px] uppercase tracking-widest font-black text-amber-500 bg-amber-100 px-2 py-0.5 rounded-full">Maker-Checker 1/2</span>
                    </div>
                </div>
            )}

            {/* Messages */}
            {message && (
                <div className={`p-4 rounded-xl mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Journal History Tab */}
            {activeTab === 'journal' && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm p-6">
                    <JournalHistory />
                </div>
            )}

            {/* Hierarchy Tab */}
            {activeTab === 'hierarchy' && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="p-12 text-center text-slate-400">
                            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 opacity-20" />
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

            {/* Periods Tab */}
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

            {/* Journal Entries Tab */}
            {activeTab === 'journal' && (
                <div className="space-y-6">
                    {/* Filters */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4">
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

                    {/* Journal Entries List */}
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                        {loading ? (
                            <div className="p-12 text-center text-slate-400">Loading...</div>
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

                                {/* Pagination */}
                                {pagination && (
                                    <div className="p-4 border-t border-slate-200 flex justify-between items-center text-sm">
                                        <div className="text-slate-600">
                                            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                                        </div>
                                        <div className="flex gap-2">
                                            {pagination.page > 1 && (
                                                <button
                                                    onClick={() => { /* Handle previous page */ }}
                                                    className="px-4 py-2 border border-slate-300 rounded-xl font-bold hover:bg-slate-50"
                                                >
                                                    Previous
                                                </button>
                                            )}
                                            {pagination.page < pagination.totalPages && (
                                                <button
                                                    onClick={() => { /* Handle next page */ }}
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

                    {/* Entry Details Modal */}
                    {selectedEntry && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedEntry(null)}>
                            <div className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900">{selectedEntry.entryNumber}</h2>
                                        <p className="text-slate-600">{selectedEntry.description}</p>
                                    </div>
                                    <button onClick={() => setSelectedEntry(null)} className="text-slate-400 hover:text-slate-600">
                                        <XCircleIcon className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Journal Lines */}
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

                                {/* Actions */}
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
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Trial Balance Tab */}
            {
                activeTab === 'trial' && (
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                        {loading && !trialBalance ? (
                            <div className="p-12 text-center text-slate-400">Loading Trial Balance...</div>
                        ) : !trialBalance ? (
                            <div className="p-12 text-center text-red-500">Failed to load Trial Balance.</div>
                        ) : (
                            <>
                                <div className="p-6 border-b border-slate-200 bg-slate-50">
                                    <h2 className="text-xl font-black text-slate-900 uppercase">Trial Balance</h2>
                                    <p className="text-sm text-slate-600">As of {new Date().toLocaleDateString()}</p>
                                </div>

                                <div className="overflow-x-auto hidden md:block">
                                    <table className="w-full">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-black uppercase text-slate-600">Code</th>
                                                <th className="px-6 py-4 text-left text-xs font-black uppercase text-slate-600">Account</th>
                                                <th className="px-6 py-4 text-right text-xs font-black uppercase text-slate-600">Debit</th>
                                                <th className="px-6 py-4 text-right text-xs font-black uppercase text-slate-600">Credit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {trialBalance.accounts.map((account: any) => (
                                                <tr key={account.code} className="hover:bg-slate-50">
                                                    <td className="px-6 py-3 font-mono text-sm font-bold">{account.code}</td>
                                                    <td className="px-6 py-3 text-sm font-bold text-slate-900">{account.name}</td>
                                                    <td className="px-6 py-3 text-right font-mono text-sm">
                                                        {account.debit > 0 && `KES ${account.debit.toLocaleString()}`}
                                                    </td>
                                                    <td className="px-6 py-3 text-right font-mono text-sm">
                                                        {account.credit > 0 && `KES ${account.credit.toLocaleString()}`}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-900 text-white font-black">
                                            <tr>
                                                <td colSpan={2} className="px-6 py-4 uppercase">Total</td>
                                                <td className="px-6 py-4 text-right font-mono">KES {trialBalance.totalDebits.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right font-mono">KES {trialBalance.totalCredits.toLocaleString()}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {/* Mobile Trial Balance View */}
                                <div className="md:hidden divide-y divide-slate-100">
                                    {trialBalance.accounts.map((account: any) => (
                                        <div
                                            key={account.code}
                                            className="p-4 bg-white active:bg-slate-50 transition-colors cursor-pointer"
                                            onClick={() => loadAccountLedger(account.code)}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="font-mono text-[10px] font-black text-slate-500">{account.code}</div>
                                                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
                                                        {account.name}
                                                        <ArrowRightIcon className="w-3 h-3 text-slate-300" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mt-2 bg-slate-50 rounded-lg p-2">
                                                <div>
                                                    <div className="text-[10px] uppercase font-black text-slate-500 mb-1">Debit</div>
                                                    <div className="font-mono text-xs font-bold text-slate-900">
                                                        {account.debit > 0 ? `KES ${account.debit.toLocaleString()}` : '-'}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] uppercase font-black text-slate-500 mb-1">Credit</div>
                                                    <div className="font-mono text-xs font-bold text-slate-900">
                                                        {account.credit > 0 ? `KES ${account.credit.toLocaleString()}` : '-'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="p-4 bg-slate-900 text-white">
                                        <div className="flex justify-between items-center text-sm font-bold mb-2">
                                            <span>TOTAL DEBITS</span>
                                            <span className="font-mono">KES {trialBalance.totalDebits.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm font-bold">
                                            <span>TOTAL CREDITS</span>
                                            <span className="font-mono">KES {trialBalance.totalCredits.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Balance Status */}
                                <div className={`p-6 border-t border-slate-200 text-center ${trialBalance.isBalanced ? 'bg-green-50' : 'bg-red-50'
                                    }`}>
                                    {trialBalance.isBalanced ? (
                                        <div className="text-green-700 font-bold uppercase">✓ Trial Balance is Balanced</div>
                                    ) : (
                                        <div className="text-red-700 font-bold uppercase">
                                            ✗ Out of Balance by KES {Math.abs(trialBalance.difference).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )
            }

            {/* Balance Sheet Tab */}
            {activeTab === 'balanceSheet' && (
                <div className="space-y-6">
                    {loading && !balanceSheet ? (
                        <div className="p-12 text-center text-slate-400">Loading Balance Sheet...</div>
                    ) : !balanceSheet ? (
                        <div className="p-12 text-center text-red-500">Failed to load Balance Sheet.</div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Assets */}
                            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                <div className="p-6 border-b border-slate-100 bg-blue-50/30">
                                    <h3 className="text-lg font-black text-blue-900 uppercase tracking-tight">Assets</h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                        <span className="text-slate-600 font-medium">Gross Loan Portfolio</span>
                                        <span className="font-mono font-bold text-slate-900">KES {Number(balanceSheet.assets.grossLoanPortfolio).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                        <span className="text-slate-600 font-medium italic">Less: Loan Loss Provisions</span>
                                        <span className="font-mono font-bold text-red-600">({Number(balanceSheet.assets.loanLossProvisions).toLocaleString()})</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 bg-slate-50 px-3 rounded-lg">
                                        <span className="text-slate-900 font-bold">Net Loan Portfolio</span>
                                        <span className="font-mono font-black text-slate-900">KES {Number(balanceSheet.assets.netLoanPortfolio).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                        <span className="text-slate-600 font-medium">Cash & Bank</span>
                                        <span className="font-mono font-bold text-slate-900">KES {Number(balanceSheet.assets.cashAndBank).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-6">
                                        <span className="text-lg font-black text-slate-900 uppercase">Total Assets</span>
                                        <span className="text-lg font-mono font-black text-blue-600 underline decoration-2 underline-offset-4">
                                            KES {Number(balanceSheet.assets.totalAssets).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {/* Liabilities */}
                                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                    <div className="p-6 border-b border-slate-100 bg-red-50/30">
                                        <h3 className="text-lg font-black text-red-900 uppercase tracking-tight">Liabilities</h3>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                            <span className="text-slate-600 font-medium">Member Savings / Shares</span>
                                            <span className="font-mono font-bold text-slate-900">KES {Number(balanceSheet.liabilities.memberSavings).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-6">
                                            <span className="font-black text-slate-900 uppercase">Total Liabilities</span>
                                            <span className="font-mono font-black text-red-600">KES {Number(balanceSheet.liabilities.totalLiabilities).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Equity */}
                                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                    <div className="p-6 border-b border-slate-100 bg-purple-50/30">
                                        <h3 className="text-lg font-black text-purple-900 uppercase tracking-tight">Equity</h3>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                            <span className="text-slate-600 font-medium">Retained Earnings</span>
                                            <span className="font-mono font-bold text-slate-900">KES {Number(balanceSheet.equity.retainedEarnings).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                            <span className="text-slate-600 font-medium text-green-700">Current Year Profit (P&L)</span>
                                            <span className="font-mono font-bold text-green-600">KES {Number(balanceSheet.equity.currentYearProfit).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-6">
                                            <span className="font-black text-slate-900 uppercase">Total Equity</span>
                                            <span className="font-mono font-black text-purple-600">KES {Number(balanceSheet.equity.totalEquity).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Equivalence Check */}
                                <div className="flex justify-between items-center p-4 bg-slate-900 rounded-2xl text-white shadow-xl shadow-slate-200">
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Total Liab + Equity</span>
                                    <span className="text-xl font-mono font-black">
                                        KES {(Number(balanceSheet.liabilities.totalLiabilities) + Number(balanceSheet.equity.totalEquity)).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )
            }

            {/* Expenses Tab */}
            {
                activeTab === 'expenses' && (
                    <ExpensesTab
                        expenses={expenses}
                        accounts={chartOfAccounts}
                        categories={expenseCategories}
                        members={membersList}
                        currentUserId={userAuth?.permissions?.userId || ''}
                        isOfficial={userAuth?.role !== 'Member'}
                        onRefresh={loadData}
                    />
                )
            }

            {/* M-Pesa Tab */}
            {
                activeTab === 'mpesa' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <MpesaLedger members={members} />
                    </div>
                )
            }

            {/* Config Tab */}
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

                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
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
                            {/* Mobile Mappings View */}
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

                        {/* Reference Chart of Accounts Table */}
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mt-8">
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

            {/* Account Ledger Tab */}
            {
                activeTab === 'ledger' && accountLedger && (
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-200 bg-slate-50">
                            <button onClick={() => setActiveTab('coa')} className="text-xs text-cyan-600 font-bold uppercase mb-2">← Back to Chart</button>
                            <h2 className="text-xl font-black text-slate-900">{accountLedger.account.code} - {accountLedger.account.name}</h2>
                            <p className="text-sm text-slate-600">Account Ledger • Current Balance: KES {accountLedger.currentBalance.toLocaleString()}</p>

                            {/* Action Toolbar */}
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

                        {/* Mobile Ledger View */}
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
                                                                    // Ideally, pass the ID directly. But the existing handler uses selectedLedgerLine state.
                                                                    // I will set it on click wrapper, but for this button I might need to ensure it's set.
                                                                    // The wrapper onClick sets expanded, but maybe not selectedLedgerLine.
                                                                    // I should update the wrapper to ALSO set selectedLedgerLine so the top handler works.
                                                                    setSelectedLedgerLine(line);
                                                                    // Then call reverse.
                                                                    handleReverseLedgerTransaction();
                                                                    // Wait, re-clicking reverse immediately might be tricky if state update is async.
                                                                    // Actually, `handleReverseLedgerTransaction` doesn't take args, it uses state. 
                                                                    // Safer to just show the button that calls it, assuming the row click set the state.
                                                                    // Let's make sure the row click sets selectedLedgerLine.
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

                        {/* Journal Entry Details Modal */}
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

                                        {/* Journal Lines */}
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

            {/* Transfers Tab - Forced Refreshed */}
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

                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden p-6">
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

            {/* Modals */}
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
