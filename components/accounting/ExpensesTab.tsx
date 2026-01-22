'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Check, Loader2, CalendarIcon } from 'lucide-react'
import { toast } from '@/lib/toast'
import { createExpenseRequest, approveExpense } from '@/app/actions/expenses'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

type ExpenseTabProps = {
    expenses: any[]
    accounts: any[] // Chart of Accounts
    currentUserId: string
    isOfficial: boolean
    onRefresh: () => void
}

export function ExpensesTab({ expenses, accounts, currentUserId, isOfficial, onRefresh }: ExpenseTabProps) {
    const [isPending, startTransition] = useTransition()
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending')
    const [viewingExpense, setViewingExpense] = useState<any | null>(null)

    // Form State
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        expenseAccountId: '',
        date: new Date()
    })

    // Filter expenses by status
    const pendingExpenses = expenses.filter(e => e.status === 'PENDING')
    const approvedExpenses = expenses.filter(e => e.status === 'APPROVED')
    const displayedExpenses = activeTab === 'pending' ? pendingExpenses : approvedExpenses

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
                expenseAccountId: formData.expenseAccountId
            })

            if (result.success) {
                toast.success("Expense requested successfully")
                setIsCreateOpen(false)
                setFormData({ description: '', amount: '', expenseAccountId: '', date: new Date() })
                onRefresh()
            } else {
                toast.error(result.error || "Failed to create request")
            }
        })
    }

    const handleApprove = (id: string) => {
        if (!confirm("Are you sure you want to approve this expense? This counts as one of the two required approvals.")) return

        startTransition(async () => {
            const result = await approveExpense(id)
            if (result.success) {
                const final = (result as any).isFinalized
                toast.success(final ? "Expense Approved and Paid!" : "Approval recorded. Waiting for final approval.")
                onRefresh()
            } else {
                toast.error((result as any).error || "Failed to approve")
            }
        })
    }

    // Filter accounts to only show Expense types
    const expenseAccounts = accounts.filter(a => a.type === 'EXPENSE')

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Expense Management</h2>
                <p className="text-slate-600">Track and approve operational expenses</p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" className="border-cyan-200 text-cyan-700 hover:bg-cyan-50" onClick={onRefresh}>
                    <Loader2 className={cn("w-4 h-4 mr-2", isPending ? "animate-spin" : "hidden")} />
                    {!isPending && <div className="mr-2">↻</div>}
                    Refresh
                </Button>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-cyan-600 hover:bg-cyan-700">
                            <Plus className="w-4 h-4 mr-2" />
                            New Expense Request
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Request New Expense</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input
                                    placeholder="e.g. Office Stationery"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Date</Label>
                                    <div className="relative">
                                        <Input
                                            type="date"
                                            value={formData.date ? format(formData.date, 'yyyy-MM-dd') : ''}
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    setFormData({ ...formData, date: new Date(e.target.value) })
                                                }
                                            }}
                                            className="w-full h-10 px-3 border-slate-300 focus:border-cyan-400 focus:ring-cyan-400"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Amount (KES)</Label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Expense Account (GL)</Label>
                                <Select
                                    value={formData.expenseAccountId}
                                    onValueChange={val => setFormData({ ...formData, expenseAccountId: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select GL Account" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {expenseAccounts.map(acc => (
                                            <SelectItem key={acc.id} value={acc.id}>
                                                {acc.code} - {acc.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button className="w-full mt-4" onClick={handleCreate} disabled={isPending}>
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Request"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Desktop View */}
            <div className="hidden md:block">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Expense Requests</CardTitle>
                            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pending' | 'approved')}>
                                <TabsList>
                                    <TabsTrigger value="pending">
                                        Pending
                                        {pendingExpenses.length > 0 && (
                                            <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-yellow-100 text-yellow-700 rounded-full">
                                                {pendingExpenses.length}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="approved">
                                        Approved
                                        {approvedExpenses.length > 0 && (
                                            <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-green-100 text-green-700 rounded-full">
                                                {approvedExpenses.length}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Requester</TableHead>
                                    <TableHead>Account</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-center">Approvals</TableHead>
                                    {activeTab === 'pending' && <TableHead className="text-right">Actions</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {displayedExpenses.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={activeTab === 'pending' ? 7 : 6} className="text-center py-8 text-slate-500">
                                            No {activeTab} expense requests found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    displayedExpenses.map(expense => {
                                        const approvalCount = expense.approvals.length
                                        const requiredApprovals = 2
                                        const isFullyApproved = approvalCount >= requiredApprovals

                                        return (
                                            <TableRow key={expense.id}>
                                                <TableCell>{format(new Date(expense.date), 'MMM dd, yyyy')}</TableCell>
                                                <TableCell className="font-medium">{expense.description}</TableCell>
                                                <TableCell>{expense.requester.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-mono text-xs">
                                                        {expense.expenseAccount.code}
                                                    </Badge>
                                                    <span className="ml-2 text-xs">{expense.expenseAccount.name}</span>
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-bold">
                                                    KES {expense.amount.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Badge
                                                            className={cn(
                                                                "font-bold",
                                                                isFullyApproved
                                                                    ? "bg-green-100 text-green-700"
                                                                    : "bg-yellow-100 text-yellow-700"
                                                            )}
                                                        >
                                                            {approvalCount}/{requiredApprovals} Approvals
                                                        </Badge>
                                                        {expense.approvals.length > 0 && (
                                                            <div className="flex -space-x-2">
                                                                {expense.approvals.map((a: any) => (
                                                                    <div
                                                                        key={a.id}
                                                                        title={a.user.name}
                                                                        className="w-7 h-7 rounded-full bg-cyan-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-cyan-700"
                                                                    >
                                                                        {a.user.name.charAt(0)}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                {activeTab === 'pending' && (
                                                    <TableCell className="text-right">
                                                        {isOfficial && expense.requesterId !== currentUserId && !expense.approvals.find((a: any) => a.userId === currentUserId) ? (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                onClick={() => handleApprove(expense.id)}
                                                                disabled={isPending}
                                                            >
                                                                <Check className="w-4 h-4 mr-1" />
                                                                Approve
                                                            </Button>
                                                        ) : expense.requesterId === currentUserId ? (
                                                            <span className="text-xs text-slate-400">Your request</span>
                                                        ) : expense.approvals.find((a: any) => a.userId === currentUserId) ? (
                                                            <Badge variant="outline" className="text-cyan-600">
                                                                You approved
                                                            </Badge>
                                                        ) : null}
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Mobile View - Separated Stacked Sections */}
            <div className="md:hidden space-y-6">

                {/* Pending Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="font-bold text-slate-900 text-lg">Pending Expenses</h3>
                        <Badge className="bg-yellow-100 text-yellow-800">{pendingExpenses.length}</Badge>
                    </div>
                    {pendingExpenses.length === 0 ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-slate-500 text-sm">
                            No pending expenses.
                        </div>
                    ) : (
                        pendingExpenses.map(expense => (
                            <div
                                key={expense.id}
                                onClick={() => setViewingExpense(expense)}
                                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm active:scale-[0.98] transition-all"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-bold text-slate-900 line-clamp-1">{expense.description}</div>
                                        <div className="text-xs text-slate-500">{format(new Date(expense.date), 'MMM dd, yyyy')}</div>
                                    </div>
                                    <Badge className="bg-yellow-500 h-5 text-[10px]">Pending</Badge>
                                </div>
                                <div className="flex justify-between items-end mt-2 pt-2 border-t border-slate-100">
                                    <div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">Requester</div>
                                        <div className="text-xs font-semibold text-slate-700">{expense.requester.name}</div>
                                    </div>
                                    <div className="font-black text-slate-900 text-lg">KES {expense.amount.toLocaleString()}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Approved Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="font-bold text-slate-900 text-lg">Approved Expenses</h3>
                        <Badge className="bg-green-100 text-green-800">{approvedExpenses.length}</Badge>
                    </div>
                    {approvedExpenses.length === 0 ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-slate-500 text-sm">
                            No approved expenses.
                        </div>
                    ) : (
                        approvedExpenses.map(expense => (
                            <div
                                key={expense.id}
                                onClick={() => setViewingExpense(expense)}
                                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm active:scale-[0.98] transition-all"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-bold text-slate-900 line-clamp-1">{expense.description}</div>
                                        <div className="text-xs text-slate-500">{format(new Date(expense.date), 'MMM dd, yyyy')}</div>
                                    </div>
                                    <Badge className="bg-green-500 h-5 text-[10px]">Approved</Badge>
                                </div>
                                <div className="flex justify-between items-end mt-2 pt-2 border-t border-slate-100">
                                    <div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">Requester</div>
                                        <div className="text-xs font-semibold text-slate-700">{expense.requester.name}</div>
                                    </div>
                                    <div className="font-black text-slate-900 text-lg">KES {expense.amount.toLocaleString()}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* View Expense Modal */}
            <Dialog open={!!viewingExpense} onOpenChange={(open) => !open && setViewingExpense(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Expense Details</DialogTitle>
                    </DialogHeader>
                    {viewingExpense && (
                        <div className="space-y-4">
                            <div className="text-center py-4 bg-slate-50 rounded-xl border border-slate-100 h-full">
                                <div className="text-sm text-slate-500 mb-1">Amount</div>
                                <div className="text-3xl font-black text-slate-900">KES {viewingExpense.amount.toLocaleString()}</div>
                                <div className="mt-2 flex justify-center gap-2">
                                    {viewingExpense.approvals.length >= 2 ? (
                                        <Badge className="bg-green-500">Approved</Badge>
                                    ) : (
                                        <Badge className="bg-yellow-500">Pending Approval</Badge>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-4 text-sm">
                                <div className="flex justify-between py-2 border-b border-slate-100">
                                    <span className="text-slate-500">Date</span>
                                    <span className="font-medium text-slate-900">{format(new Date(viewingExpense.date), 'MMM dd, yyyy')}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-100">
                                    <span className="text-slate-500">Requester</span>
                                    <span className="font-medium text-slate-900">{viewingExpense.requester.name}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-100">
                                    <span className="text-slate-500">Account</span>
                                    <span className="font-medium text-slate-900">{viewingExpense.expenseAccount.name}</span>
                                </div>
                                <div className="py-2">
                                    <span className="text-slate-500 block mb-1">Description</span>
                                    <div className="p-3 bg-slate-50 rounded-lg text-slate-700 italic border border-slate-100">
                                        "{viewingExpense.description}"
                                    </div>
                                </div>

                                <div className="py-2">
                                    <span className="text-slate-500 block mb-1">Approvals ({viewingExpense.approvals.length}/2)</span>
                                    {viewingExpense.approvals.length === 0 ? (
                                        <span className="text-slate-400 italic text-xs">No approvals yet</span>
                                    ) : (
                                        <div className="flex gap-2">
                                            {viewingExpense.approvals.map((a: any) => (
                                                <Badge key={a.id} variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                                                    {a.user.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {activeTab === 'pending' && (
                                <div className="pt-2">
                                    {isOfficial && viewingExpense.requesterId !== currentUserId && !viewingExpense.approvals.find((a: any) => a.userId === currentUserId) ? (
                                        <Button
                                            className="w-full bg-green-600 hover:bg-green-700"
                                            onClick={() => {
                                                handleApprove(viewingExpense.id);
                                                setViewingExpense(null);
                                            }}
                                            disabled={isPending}
                                        >
                                            <Check className="w-4 h-4 mr-2" />
                                            Approve Expense
                                        </Button>
                                    ) : viewingExpense.requesterId === currentUserId ? (
                                        <p className="text-center text-xs text-slate-400">You cannot approve your own request</p>
                                    ) : (
                                        <p className="text-center text-xs text-green-600 font-bold">You have approved this request</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
