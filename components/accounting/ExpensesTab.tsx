'use client'

import { useState, useTransition, useMemo } from 'react'
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
import { Plus, Check, Loader2, CalendarIcon, FileText, Banknote, User, AlertCircle, RefreshCw, Upload, Download } from 'lucide-react'
import { toast } from '@/lib/toast'
import { createExpenseRequest, approveExpense, submitExpenseSurrender, approveReimbursementClaim } from '@/app/actions/expenses'
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
    isOfficial: boolean
    onRefresh: () => void
}

export function ExpensesTab({ expenses, accounts, categories, members, currentUserId, isOfficial, onRefresh }: ExpenseTabProps) {
    const [isPending, startTransition] = useTransition()
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isBulkOpen, setIsBulkOpen] = useState(false)
    const [surrenderOpen, setSurrenderOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'history'>('pending')
    const [viewingExpense, setViewingExpense] = useState<any | null>(null)
    const [selectedExpenseForSurrender, setSelectedExpenseForSurrender] = useState<any | null>(null)

    // Form State for Create Expense
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        expenseAccountId: '',
        subCategoryId: '',
        date: new Date(),
        type: 'OPERATIONAL' as ExpenseType,
        recipientId: ''
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
    const pendingExpenses = expenses.filter(e => e.status === 'PENDING_APPROVAL' || e.status === 'DRAFT')
    const activeExpenses = expenses.filter(e => e.status === 'DISBURSED') // Imprest pending surrender
    const historyExpenses = expenses.filter(e => ['CLOSED', 'REJECTED', 'SURRENDERED'].includes(e.status))

    const displayedExpenses = activeTab === 'pending' ? pendingExpenses
        : activeTab === 'active' ? activeExpenses
            : historyExpenses

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
                toast.success("Expense requested successfully")
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

        // Construct payout list
        // For verify, let's just use all members with the fixed amount if specified
        // In a real app, this would be a CSV upload or dynamic table
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
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-[400px]">
                        <TabsList>
                            <TabsTrigger value="pending">Pending Approval</TabsTrigger>
                            <TabsTrigger value="active">Active (Imprest)</TabsTrigger>
                            <TabsTrigger value="history">History</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                <div className="flex gap-2">
                    {isOfficial && (
                        <Button variant="outline" onClick={() => setIsBulkOpen(true)} className="gap-2">
                            <Banknote className="w-4 h-4" />
                            Bulk Payout
                        </Button>
                    )}
                    <Button onClick={() => setIsCreateOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="w-4 h-4" />
                        New Request
                    </Button>
                </div>
            </div>

            {/* Expenses Cards / Table */}
            <div className="grid grid-cols-1 gap-4">
                {displayedExpenses.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                        No expenses found in this view.
                    </div>
                ) : (
                    displayedExpenses.map((expense) => (
                        <Card key={expense.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4 flex items-center justify-between">
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
                                        <h3 className="font-bold text-slate-900">{expense.description}</h3>
                                        <div className="text-sm text-slate-500 flex items-center gap-2">
                                            <span>{format(new Date(expense.date), 'MMM d, yyyy')}</span>
                                            <span>•</span>
                                            <span>{expense.recipient?.name || expense.requester?.name || 'Unknown Recipient'}</span>
                                        </div>
                                        <div className="mt-1">
                                            <Badge variant="secondary" className="mr-2 text-[10px]">{expense.type}</Badge>
                                            <Badge className={cn("text-[10px]",
                                                expense.status === 'PENDING_APPROVAL' ? "bg-yellow-100 text-yellow-700" :
                                                    expense.status === 'DISBURSED' ? "bg-purple-100 text-purple-700" :
                                                        expense.status === 'CLOSED' ? "bg-green-100 text-green-700" :
                                                            "bg-slate-100 text-slate-700"
                                            )}>
                                                {expense.status.replace('_', ' ')}
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

                                    <div className="mt-2 flex justify-end gap-2">
                                        {expense.status === 'DISBURSED' && expense.type === 'IMPREST' && (
                                            <Button size="sm" variant="outline" onClick={() => {
                                                setSelectedExpenseForSurrender(expense)
                                                setSurrenderOpen(true)
                                            }}>
                                                Surrender
                                            </Button>
                                        )}
                                        {expense.status === 'PENDING_APPROVAL' && isOfficial && (
                                            <Button size="sm" onClick={() => handleApprove(expense)} disabled={isPending} className="bg-green-600 hover:bg-green-700 text-white">
                                                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Approve"}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>New Expense / Payout Request</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Expense Type</Label>
                            <Select value={formData.type} onValueChange={(v: ExpenseType) => setFormData({ ...formData, type: v, recipientId: v === 'CLAIM' ? currentUserId : '' })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="OPERATIONAL">Operational (Vendor/Direct)</SelectItem>
                                    <SelectItem value="IMPREST">Imprest (Advance)</SelectItem>
                                    <SelectItem value="CLAIM">Reimbursement Claim</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {(formData.type === 'IMPREST' || formData.type === 'CLAIM') && (
                            <div className="space-y-2">
                                <Label>Recipient / Requester</Label>
                                <Select value={formData.recipientId} onValueChange={(v) => setFormData({ ...formData, recipientId: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Member" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                        {members.map(m => (
                                            <SelectItem key={m.id} value={m.id}>{m.name} - {m.memberNumber}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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

            {/* Surrender Dialog */}
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

            {/* Bulk Payment Dialog */}
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
