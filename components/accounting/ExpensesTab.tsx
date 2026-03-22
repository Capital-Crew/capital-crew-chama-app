'use client'

import { useState, useTransition, useMemo, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Check, Loader2, CalendarIcon, FileText, Banknote, User, AlertCircle, RefreshCw, Upload, Download, Eye, X, Clock, CheckCircle, XCircle } from 'lucide-react'
import { PremiumTabs } from '../shared/PremiumTabs'
import { toast } from '@/lib/toast'
import { createExpenseRequest, approveExpense, submitExpenseSurrender, approveReimbursementClaim, sendExpenseForApproval, cancelExpenseApproval, voteOnExpenseApproval, getExpenseWorkflowStatus } from '@/app/actions/expenses'
import { processBulkPayout, BulkPayoutItem } from '@/app/actions/bulk-payouts'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { ExpenseType, ExpenseStatus } from '@prisma/client'

type ExpenseTabProps = {
    expenses: any[]
    accounts: any[] // Chart of Accounts
    categories: any[] // ExpenseCategoryGroup[] with nested subCategories
    members: any[] // Member list for selection
    currentUserId: string
    currentUserRole: string
    isOfficial: boolean
    onRefresh: () => void
}

export function ExpensesTab({ expenses, accounts, categories, members, currentUserId, currentUserRole, isOfficial, onRefresh }: ExpenseTabProps) {
    const [isPending, startTransition] = useTransition()
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isBulkOpen, setIsBulkOpen] = useState(false)
    const [surrenderOpen, setSurrenderOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<'draft' | 'pending' | 'active' | 'history'>('draft')
    const [viewingExpense, setViewingExpense] = useState<any | null>(null)
    const [selectedExpenseForSurrender, setSelectedExpenseForSurrender] = useState<any | null>(null)
    // Workflow status map: expenseId -> workflow data
    const [workflowStatuses, setWorkflowStatuses] = useState<Record<string, any>>({})
    const [loadingWorkflow, setLoadingWorkflow] = useState<Record<string, boolean>>({})
    const [expandedApproval, setExpandedApproval] = useState<Record<string, boolean>>({})

    const ADMIN_ROLES = ['SYSTEM_ADMIN', 'CHAIRPERSON', 'TREASURER', 'SECRETARY']
    const isAdmin = ADMIN_ROLES.includes(currentUserRole)

    // Form State for Create Expense
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        expenseAccountId: '',
        subCategoryId: '',
        date: new Date(),
        type: (isOfficial ? 'OPERATIONAL' : 'CLAIM') as ExpenseType,
        recipientId: isOfficial ? '' : currentUserId
    })

    // Form State for Surrender
    const [surrenderData, setSurrenderData] = useState({
        actualAmount: '',
        receiptUrl: ''
    })

    // Form State for Bulk Payout
    const [bulkData, setBulkData] = useState({
        title: '',
        type: 'DIVIDEND' as 'DIVIDEND' | 'INTEREST',
        sourceAccountId: '',
        amountPerMember: '',
        payoutList: [] as BulkPayoutItem[]
    })

    // Filter expenses by status
    const draftExpenses = expenses.filter(e => e.status === 'DRAFT')
    const pendingExpenses = expenses.filter(e => e.status === 'PENDING_APPROVAL')
    const activeExpenses = expenses.filter(e => e.status === 'DISBURSED')
    const historyExpenses = expenses.filter(e => ['CLOSED', 'REJECTED', 'SURRENDERED'].includes(e.status))

    const displayedExpenses = activeTab === 'draft' ? draftExpenses
        : activeTab === 'pending' ? pendingExpenses
            : activeTab === 'active' ? activeExpenses
                : historyExpenses

    // Load workflow status for expenses that need it
    const loadWorkflowStatus = useCallback(async (expenseId: string) => {
        setLoadingWorkflow(prev => ({ ...prev, [expenseId]: true }))
        try {
            const data = await getExpenseWorkflowStatus(expenseId)
            setWorkflowStatuses(prev => ({ ...prev, [expenseId]: data }))
        } catch { } finally {
            setLoadingWorkflow(prev => ({ ...prev, [expenseId]: false }))
        }
    }, [])

    // Reload approval data when tab changes or expenses change
    useEffect(() => {
        const toLoad = displayedExpenses.filter(e => e.status === 'PENDING_APPROVAL')
        toLoad.forEach(e => loadWorkflowStatus(e.id))
    }, [activeTab, expenses.length])

    // Handlers
    const handleCreate = () => {
        if (!formData.description || !formData.amount || !formData.expenseAccountId) {
            toast.error("Please fill all required fields")
            return
        }

        startTransition(async () => {
            const result = await createExpenseRequest({
                description: formData.description,
                amount: parseFloat(formData.amount),
                date: formData.date,
                expenseAccountId: formData.expenseAccountId,
                subCategoryId: formData.subCategoryId || undefined,
                type: formData.type,
                recipientId: formData.recipientId || undefined
            })

            if (result.success) {
                toast.success("Expense created as draft — send it for approval when ready")
                setIsCreateOpen(false)
                setFormData({
                    description: '', amount: '', expenseAccountId: '', subCategoryId: '', date: new Date(),
                    type: 'OPERATIONAL', recipientId: ''
                })
                onRefresh()
            } else {
                toast.error(result.error || "Failed to create request")
            }
        })
    }

    const handleSendForApproval = (expenseId: string) => {
        startTransition(async () => {
            try {
                await sendExpenseForApproval(expenseId)
                toast.success("Expense sent for approval")
                onRefresh()
                loadWorkflowStatus(expenseId)
            } catch (e: any) {
                toast.error(e.message || "Failed to send for approval")
            }
        })
    }

    const handleCancelApproval = (expenseId: string) => {
        if (!confirm("Cancel this approval request? The expense will return to DRAFT and can be edited again.")) return
        startTransition(async () => {
            try {
                await cancelExpenseApproval(expenseId)
                toast.success("Approval cancelled — expense is back in draft")
                onRefresh()
                setWorkflowStatuses(prev => { const n = { ...prev }; delete n[expenseId]; return n })
            } catch (e: any) {
                toast.error(e.message || "Failed to cancel approval")
            }
        })
    }

    const handleVote = (expenseId: string, action: 'APPROVED' | 'REJECTED') => {
        if (action === 'REJECTED' && !confirm('Are you sure you want to REJECT this expense? This is immediate and cannot be undone.')) return
        startTransition(async () => {
            try {
                await voteOnExpenseApproval(expenseId, action)
                toast.success(action === 'APPROVED' ? 'Approved ✓' : 'Rejected — expense request declined')
                onRefresh()
                loadWorkflowStatus(expenseId)
            } catch (e: any) {
                toast.error(e.message || "Vote failed")
            }
        })
    }

    const handleSurrender = () => {
        if (!selectedExpenseForSurrender || !surrenderData.actualAmount) return

        startTransition(async () => {
            const result = await submitExpenseSurrender(
                selectedExpenseForSurrender.id,
                parseFloat(surrenderData.actualAmount),
                surrenderData.receiptUrl
            )

            if (result.success) {
                toast.success("Imprest surrendered successfully")
                setSurrenderOpen(false)
                setSelectedExpenseForSurrender(null)
                setSurrenderData({ actualAmount: '', receiptUrl: '' })
                onRefresh()
            } else {
                toast.error((result as any).error || "Surrender failed")
            }
        })
    }

    const handleApprove = (expense: any) => {
        if (!confirm("Are you sure you want to approve this expense? This may trigger payouts.")) return

        startTransition(async () => {
            let result;
            if (expense.type === 'CLAIM') {
                result = await approveReimbursementClaim(expense.id)
            } else {
                result = await approveExpense(expense.id)
            }

            if (result.success) {
                toast.success("Expense Approved!")
                onRefresh()
            } else {
                toast.error((result as any).error || "Failed to approve")
            }
        })
    }

    const handleBulkPayout = () => {
        if (!bulkData.title || !bulkData.sourceAccountId) {
            toast.error("Title and Source Account are required")
            return
        }

        let items: BulkPayoutItem[] = []

        if (bulkData.amountPerMember && !bulkData.payoutList.length) {
            const amt = parseFloat(bulkData.amountPerMember)
            if (amt > 0) {
                items = members.map(m => ({ memberId: m.id, amount: amt }))
            }
        } else {
            items = bulkData.payoutList
        }

        if (!items.length) {
            toast.error("No valid payouts generated")
            return
        }

        startTransition(async () => {
            const result = await processBulkPayout(
                bulkData.title,
                bulkData.type,
                bulkData.sourceAccountId,
                items
            )

            if (result.success) {
                toast.success(`Batch processed! Success: ${result.data?.successCount}, Failed: ${result.data?.failCount}`)
                setIsBulkOpen(false)
                onRefresh()
            } else {
                toast.error(result.error || "Batch failed")
            }
        })
    }

    // Filter accounts to only show Expense types
    const expenseAccounts = accounts.filter(a => a.type === 'EXPENSE' || a.type === 'EQUITY' || a.type === 'LIABILITY')
    // Expanded to Equity for Dividends and Liability for certain payables

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <PremiumTabs 
                    tabs={[
                        { 
                            id: 'draft', 
                            label: 'Draft', 
                            count: draftExpenses.length > 0 ? draftExpenses.length : undefined 
                        },
                        { 
                            id: 'pending', 
                            label: 'Pending Approval', 
                            count: pendingExpenses.length > 0 ? pendingExpenses.length : undefined 
                        },
                        { id: 'active', label: 'Active (Imprest)' },
                        { id: 'history', label: 'History' }
                    ]}
                    activeTab={activeTab}
                    onChange={(id) => setActiveTab(id as any)}
                />

                <div className="flex gap-2">
                    {isOfficial && (
                        <Button 
                            variant="secondary" 
                            onClick={() => setIsBulkOpen(true)} 
                            className="gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border-none rounded-xl font-bold"
                        >
                            <Banknote className="w-4 h-4" />
                            Bulk Payout
                        </Button>
                    )}
                    <Button 
                        onClick={() => setIsCreateOpen(true)} 
                        className="gap-2 bg-brand hover:opacity-90 text-white rounded-xl shadow-md border-none font-bold"
                    >
                        <Plus className="w-4 h-4" />
                        New Request
                    </Button>
                    <button 
                        onClick={onRefresh}
                        className="p-2.5 text-slate-400 hover:text-cyan-500 hover:bg-cyan-50 rounded-xl transition-colors"
                        title="Refresh Data"
                    >
                        <RefreshCw className={cn("w-5 h-5", isPending && "animate-spin")} />
                    </button>
                </div>
            </div>

            {}
            <div className="grid grid-cols-1 gap-4">
                {displayedExpenses.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                        No expenses found in this view.
                    </div>
                ) : (
                    displayedExpenses.map((expense) => {
                        const wf = workflowStatuses[expense.id]
                        const isLoadingWf = loadingWorkflow[expense.id]
                        const isExpanded = expandedApproval[expense.id]
                        const actions = wf?.request?.actions || []
                        const currentStage = wf?.request?.currentStage

                        // Has the current user already voted?
                        const myVote = actions.find((a: any) => a.actor?.id === currentUserId)

                        return (
                            <Card
                                key={expense.id}
                                className="hover:shadow-md transition-shadow group border"
                            >
                                {}
                                <CardContent className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setViewingExpense(expense)}>
                                    <div className="flex items-start gap-4">
                                        <div className={cn("p-3 rounded-full",
                                            expense.type === 'IMPREST' ? "bg-purple-100 text-purple-600" :
                                                expense.type === 'CLAIM' ? "bg-orange-100 text-orange-600" :
                                                    "bg-blue-100 text-blue-600"
                                        )}>
                                            {expense.type === 'IMPREST' ? <User className="w-5 h-5" /> :
                                                expense.type === 'CLAIM' ? <FileText className="w-5 h-5" /> :
                                                    <Banknote className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{expense.description}</h3>
                                            <div className="text-sm text-slate-500 flex items-center gap-2">
                                                <span>{format(new Date(expense.date), 'MMM d, yyyy')}</span>
                                                <span>•</span>
                                                <span>{expense.recipient?.name || expense.requester?.name || 'N/A'}</span>
                                            </div>
                                            <div className="mt-1">
                                                <Badge variant="secondary" className="mr-2 text-[10px]">{expense.type}</Badge>
                                                <Badge className={cn("text-[10px]",
                                                    expense.status === 'DRAFT' ? "bg-slate-100 text-slate-600" :
                                                        expense.status === 'PENDING_APPROVAL' ? "bg-yellow-100 text-yellow-700" :
                                                            expense.status === 'DISBURSED' ? "bg-purple-100 text-purple-700" :
                                                                expense.status === 'CLOSED' ? "bg-green-100 text-green-700" :
                                                                    expense.status === 'REJECTED' ? "bg-red-100 text-red-700" :
                                                                        "bg-slate-100 text-slate-700"
                                                )}>
                                                    {expense.status.replace(/_/g, ' ')}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-lg font-mono">
                                            KES {parseFloat(expense.type === 'IMPREST' && expense.status === 'DISBURSED'
                                                ? (expense.approvedAmount || expense.requestedAmount)
                                                : (expense.actualAmount || expense.approvedAmount || expense.requestedAmount)
                                            ).toLocaleString()}
                                        </div>
                                        <div className="text-xs text-slate-400 uppercase font-bold">
                                            {expense.status === 'DISBURSED' ? 'Outstanding' : 'Amount'}
                                        </div>
                                        <div className="mt-2 flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                                            <Button size="sm" variant="ghost" className="text-slate-400 hover:text-blue-600 gap-1 text-xs" onClick={() => setViewingExpense(expense)}>
                                                <Eye className="w-3 h-3" /> Details
                                            </Button>
                                            {expense.status === 'DRAFT' && (
                                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleSendForApproval(expense.id)} disabled={isPending}>
                                                    {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Send for Approval'}
                                                </Button>
                                            )}
                                            {expense.status === 'DISBURSED' && expense.type === 'IMPREST' && (
                                                <Button size="sm" variant="outline" onClick={(e) => {
                                                    e.stopPropagation()
                                                    setSelectedExpenseForSurrender(expense)
                                                    setSurrenderOpen(true)
                                                }}>
                                                    Surrender
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>

                                {}
                                {expense.status === 'PENDING_APPROVAL' && (
                                    <div className="border-t border-slate-100">
                                        {}
                                        <button
                                            className="w-full flex items-center justify-between px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                                            onClick={() => {
                                                const wasExpanded = expandedApproval[expense.id]
                                                setExpandedApproval(prev => ({ ...prev, [expense.id]: !wasExpanded }))
                                                if (!wasExpanded && !workflowStatuses[expense.id]) {
                                                    loadWorkflowStatus(expense.id)
                                                }
                                            }}
                                        >
                                            <span className="flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 text-yellow-500" />
                                                APPROVAL REQUIRED
                                                {currentStage && <span className="text-yellow-600 font-black">— {currentStage.name}</span>}
                                            </span>
                                            <span>{isExpanded ? '▲' : '▼'}</span>
                                        </button>

                                        {isExpanded && (
                                            <div className="px-4 pb-4 space-y-3">
                                                {isLoadingWf ? (
                                                    <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                                                        <Loader2 className="w-3 h-3 animate-spin" /> Loading voters...
                                                    </div>
                                                ) : (
                                                    <>
                                                        {}
                                                        {actions.length === 0 ? (
                                                            <p className="text-xs text-slate-400 italic py-2">Waiting for first vote...</p>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                {actions.map((action: any) => (
                                                                    <div key={action.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-black text-slate-600">
                                                                                {action.actor?.name?.charAt(0) || '?'}
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-xs font-bold text-slate-800">{action.actor?.name}</p>
                                                                                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{action.actor?.role?.replace(/_/g, ' ')}</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[10px] text-slate-400">{action.createdAt ? format(new Date(action.createdAt), 'dd MMM, HH:mm') : ''}</span>
                                                                            <span className={cn(
                                                                                "text-[10px] font-black px-2 py-1 rounded-full uppercase",
                                                                                action.action === 'APPROVED' ? "bg-green-100 text-green-700" :
                                                                                    action.action === 'REJECTED' ? "bg-red-100 text-red-700" :
                                                                                        "bg-slate-100 text-slate-500"
                                                                            )}>
                                                                                {action.action === 'APPROVED' ? '✓ Approved' : action.action === 'REJECTED' ? '✗ Rejected' : 'Pending'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {}
                                                        {isAdmin && !myVote && (
                                                            <div className="flex gap-2 pt-1">
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-green-600 hover:bg-green-700 text-white gap-1 flex-1"
                                                                    onClick={(e) => { e.stopPropagation(); handleVote(expense.id, 'APPROVED') }}
                                                                    disabled={isPending}
                                                                >
                                                                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="border-red-300 text-red-600 hover:bg-red-50 gap-1 flex-1"
                                                                    onClick={(e) => { e.stopPropagation(); handleVote(expense.id, 'REJECTED') }}
                                                                    disabled={isPending}
                                                                >
                                                                    <XCircle className="w-3.5 h-3.5" /> Reject
                                                                </Button>
                                                            </div>
                                                        )}

                                                        {}
                                                        {isAdmin && myVote && (
                                                            <p className="text-xs text-slate-500 italic">
                                                                You voted <span className={myVote.action === 'APPROVED' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{myVote.action}</span> on this expense.
                                                            </p>
                                                        )}

                                                        {}
                                                        <div className="pt-1 border-t border-slate-100">
                                                            <button
                                                                className="text-xs text-red-500 hover:text-red-700 font-bold uppercase tracking-wide"
                                                                onClick={(e) => { e.stopPropagation(); handleCancelApproval(expense.id) }}
                                                                disabled={isPending}
                                                            >
                                                                ✕ Cancel Approval Request
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        )
                    })
                )}
            </div>

            {}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>New Expense / Payout Request</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Expense Type</Label>
                            <Select 
                                value={formData.type} 
                                onValueChange={(v: ExpenseType) => setFormData({ 
                                    ...formData, 
                                    type: v, 
                                    recipientId: (!isOfficial || v === 'CLAIM' || v === 'IMPREST') && !formData.recipientId ? currentUserId : formData.recipientId 
                                })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {isOfficial && <SelectItem value="OPERATIONAL">Operational (Vendor/Direct)</SelectItem>}
                                    <SelectItem value="IMPREST">Imprest (Advance)</SelectItem>
                                    <SelectItem value="CLAIM">Reimbursement Claim</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {(formData.type === 'IMPREST' || formData.type === 'CLAIM') && (
                            <div className="space-y-2">
                                <Label>Recipient / Requester</Label>
                                <Select 
                                    value={formData.recipientId} 
                                    onValueChange={(v) => setFormData({ ...formData, recipientId: v })}
                                    disabled={!isOfficial}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Member" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                        {members.map(m => (
                                            <SelectItem key={m.id} value={m.id}>{m.name} - {m.memberNumber}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {!isOfficial && <p className="text-[10px] text-slate-500 italic mt-1 px-1">🔒 Access restricted: Members can only submit claims for themselves.</p>}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                placeholder="e.g. Office Rent, Travel Advance"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Amount (KES)</Label>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {format(formData.date, 'PPP')}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={formData.date}
                                            onSelect={(d) => d && setFormData({ ...formData, date: d })}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Expense Account (Source)</Label>
                            <Select value={formData.expenseAccountId} onValueChange={(v) => setFormData({ ...formData, expenseAccountId: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Ledger Account" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {expenseAccounts.map(account => (
                                        <SelectItem key={account.id} value={account.id}>
                                            {account.code} - {account.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Sub-Category</Label>
                            <Select value={formData.subCategoryId} onValueChange={(v) => setFormData({ ...formData, subCategoryId: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Optional Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(group => (
                                        <div key={group.id}>
                                            <div className="px-2 py-1.5 text-xs font-bold text-slate-400 uppercase">{group.name}</div>
                                            {group.subCategories.length === 0 && <div className="px-2 py-1 text-xs text-slate-300 italic">No items</div>}
                                            {group.subCategories.map((sub: any) => (
                                                <SelectItem key={sub.id} value={sub.id} className="pl-4">
                                                    {sub.name}
                                                </SelectItem>
                                            ))}
                                        </div>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {isPending && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                            Create Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {}
            <Dialog open={surrenderOpen} onOpenChange={setSurrenderOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Imprest Surrender</DialogTitle>
                        <DialogDescription>
                            Report actual spending for {selectedExpenseForSurrender?.description}.
                            Original Advance: KES {selectedExpenseForSurrender?.approvedAmount}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Actual Amount Spent</Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={surrenderData.actualAmount}
                                onChange={e => setSurrenderData({ ...surrenderData, actualAmount: e.target.value })}
                            />
                            {surrenderData.actualAmount && selectedExpenseForSurrender && (
                                <p className="text-xs text-slate-500 font-bold">
                                    {(parseFloat(surrenderData.actualAmount) - parseFloat(selectedExpenseForSurrender.approvedAmount)).toFixed(2) > "0"
                                        ? `Users is owed KES ${(parseFloat(surrenderData.actualAmount) - parseFloat(selectedExpenseForSurrender.approvedAmount)).toFixed(2)} (Top Up)`
                                        : `User owes KES ${Math.abs(parseFloat(surrenderData.actualAmount) - parseFloat(selectedExpenseForSurrender.approvedAmount)).toFixed(2)} (Refund)`
                                    }
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Receipt URL / Ref</Label>
                            <Input
                                placeholder="http://..."
                                value={surrenderData.receiptUrl}
                                onChange={e => setSurrenderData({ ...surrenderData, receiptUrl: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setSurrenderOpen(false)}>Cancel</Button>
                        <Button onClick={handleSurrender} disabled={isPending} className="bg-purple-600 hover:bg-purple-700 text-white">
                            {isPending && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                            Submit Surrender
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {}
            <Dialog open={!!viewingExpense} onOpenChange={(open) => !open && setViewingExpense(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-900">
                            <span className={cn("p-2 rounded-full",
                                viewingExpense?.type === 'IMPREST' ? "bg-purple-100 text-purple-600" :
                                    viewingExpense?.type === 'CLAIM' ? "bg-orange-100 text-orange-600" :
                                        "bg-blue-100 text-blue-600"
                            )}>
                                {viewingExpense?.type === 'IMPREST' ? <User className="w-4 h-4" /> :
                                    viewingExpense?.type === 'CLAIM' ? <FileText className="w-4 h-4" /> :
                                        <Banknote className="w-4 h-4" />}
                            </span>
                            {viewingExpense?.description}
                        </DialogTitle>
                        <DialogDescription>
                            Expense reference details and disbursement info.
                        </DialogDescription>
                    </DialogHeader>

                    {viewingExpense && (
                        <div className="space-y-5 py-2">
                            {}
                            <div className={cn("flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold",
                                viewingExpense.status === 'PENDING_APPROVAL' ? "bg-yellow-50 text-yellow-700 border border-yellow-200" :
                                    viewingExpense.status === 'DISBURSED' ? "bg-purple-50 text-purple-700 border border-purple-200" :
                                        viewingExpense.status === 'CLOSED' ? "bg-green-50 text-green-700 border border-green-200" :
                                            "bg-slate-50 text-slate-600 border border-slate-200"
                            )}>
                                {viewingExpense.status === 'PENDING_APPROVAL' && <Clock className="w-4 h-4" />}
                                {viewingExpense.status === 'DISBURSED' && <AlertCircle className="w-4 h-4" />}
                                {viewingExpense.status === 'CLOSED' && <CheckCircle className="w-4 h-4" />}
                                {viewingExpense.status.replace(/_/g, ' ')}
                            </div>

                            {}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Type</p>
                                    <p className="font-bold text-slate-800">{viewingExpense.type}</p>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Date</p>
                                    <p className="font-bold text-slate-800">{format(new Date(viewingExpense.date), 'dd MMM yyyy')}</p>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Requested Amount</p>
                                    <p className="font-bold text-slate-800 font-mono">KES {parseFloat(viewingExpense.requestedAmount || 0).toLocaleString()}</p>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Approved Amount</p>
                                    <p className="font-bold text-slate-800 font-mono">
                                        {viewingExpense.approvedAmount
                                            ? `KES ${parseFloat(viewingExpense.approvedAmount).toLocaleString()}`
                                            : <span className="text-slate-400 font-normal">Pending</span>}
                                    </p>
                                </div>
                                {viewingExpense.actualAmount && (
                                    <div className="bg-emerald-50 rounded-xl p-4 col-span-2">
                                        <p className="text-[10px] uppercase font-black text-emerald-500 tracking-widest mb-1">Actual Amount Spent</p>
                                        <p className="font-bold text-emerald-700 font-mono text-lg">KES {parseFloat(viewingExpense.actualAmount).toLocaleString()}</p>
                                    </div>
                                )}
                            </div>

                            {}
                            <div className="space-y-2">
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">People</p>
                                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                                    {viewingExpense.requester && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-500">Requested By</span>
                                            <span className="text-sm font-bold text-slate-800">{viewingExpense.requester?.name}</span>
                                        </div>
                                    )}
                                    {viewingExpense.recipient && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-500">Recipient</span>
                                            <span className="text-sm font-bold text-slate-800">{viewingExpense.recipient?.name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {}
                            {viewingExpense.expenseAccount && (
                                <div className="space-y-2">
                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Amount Source (GL Account)</p>
                                    <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3">
                                        <span className="font-mono text-xs font-bold text-cyan-700 bg-cyan-50 border border-cyan-100 px-2 py-1 rounded">{viewingExpense.expenseAccount?.code}</span>
                                        <span className="font-bold text-slate-800">{viewingExpense.expenseAccount?.name}</span>
                                    </div>
                                </div>
                            )}

                            {}
                            {viewingExpense.subCategory && (
                                <div className="space-y-2">
                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Category</p>
                                    <div className="bg-slate-50 rounded-xl px-4 py-3">
                                        <span className="font-bold text-slate-700">{viewingExpense.subCategory?.name}</span>
                                    </div>
                                </div>
                            )}

                            {}
                            {viewingExpense.type === 'IMPREST' && viewingExpense.status === 'CLOSED' && viewingExpense.balanceAction && (
                                <div className={cn("p-4 rounded-xl border text-sm font-bold",
                                    viewingExpense.balanceAction === 'REFUNDED_TO_SACCO' ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-orange-50 border-orange-200 text-orange-700"
                                )}>
                                    {viewingExpense.balanceAction === 'REFUNDED_TO_SACCO'
                                        ? `✅ Surplus refunded to SACCO (Difference: KES ${Math.abs(parseFloat(viewingExpense.approvedAmount) - parseFloat(viewingExpense.actualAmount)).toLocaleString()})`
                                        : `💳 SACCO reimbursed member for overspend (Top-up: KES ${Math.abs(parseFloat(viewingExpense.approvedAmount) - parseFloat(viewingExpense.actualAmount)).toLocaleString()})`
                                    }
                                </div>
                            )}

                            {}
                            {viewingExpense.receiptUrl && (
                                <div className="space-y-2">
                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Receipt</p>
                                    <a
                                        href={viewingExpense.receiptUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-blue-600 hover:underline text-sm font-bold px-4 py-3 bg-blue-50 rounded-xl"
                                    >
                                        <FileText className="w-4 h-4" />
                                        View Receipt Document
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        {viewingExpense?.status === 'DISBURSED' && viewingExpense?.type === 'IMPREST' && (
                            <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50" onClick={() => {
                                setSelectedExpenseForSurrender(viewingExpense)
                                setSurrenderOpen(true)
                                setViewingExpense(null)
                            }}>
                                Surrender Imprest
                            </Button>
                        )}
                        {viewingExpense?.status === 'PENDING_APPROVAL' && isOfficial && (
                            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => { handleApprove(viewingExpense); setViewingExpense(null); }} disabled={isPending}>
                                {isPending ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : null}
                                Approve
                            </Button>
                        )}
                        <Button variant="ghost" onClick={() => setViewingExpense(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {}
            <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Bulk Payout Processing</DialogTitle>
                        <DialogDescription>
                            Process Dividends or Interest payments for all members.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input
                                    placeholder="e.g. Dec 2025 Dividends"
                                    value={bulkData.title}
                                    onChange={e => setBulkData({ ...bulkData, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={bulkData.type} onValueChange={(v: any) => setBulkData({ ...bulkData, type: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DIVIDEND">Dividend Distribution</SelectItem>
                                        <SelectItem value="INTEREST">Interest Payment</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Source Account (e.g. Retained Earnings / Dividends Payable)</Label>
                            <Select value={bulkData.sourceAccountId} onValueChange={(v) => setBulkData({ ...bulkData, sourceAccountId: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Equity/Liability Account" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {accounts.filter(a => a.type === 'EQUITY' || a.type === 'LIABILITY' || a.type === 'EXPENSE').map(account => (
                                        <SelectItem key={account.id} value={account.id}>
                                            {account.code} - {account.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between mb-4">
                                <Label className="text-slate-700">Payout Amounts</Label>
                                <Badge variant="outline">{members.length} Members Eligible</Badge>
                            </div>

                            <div className="space-y-2">
                                <Label>Flat Amount Per Member (Optional)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        placeholder="Enter amount to apply to all..."
                                        value={bulkData.amountPerMember}
                                        onChange={e => setBulkData({ ...bulkData, amountPerMember: e.target.value })}
                                    />
                                </div>
                                <p className="text-xs text-slate-500">
                                    Leave blank to upload custom CSV (Coming Soon). For now, this sets a flat rate for everyone.
                                </p>
                            </div>

                            {bulkData.amountPerMember && (
                                <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between font-bold">
                                    <span>Estimated Total:</span>
                                    <span>KES {(parseFloat(bulkData.amountPerMember) * members.length).toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsBulkOpen(false)}>Cancel</Button>
                        <Button onClick={handleBulkPayout} disabled={isPending || !bulkData.amountPerMember} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {isPending && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                            Process Payout
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
