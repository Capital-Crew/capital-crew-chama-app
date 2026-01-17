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
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Expense Management</h2>
                    <p className="text-slate-600">Track and approve operational expenses</p>
                </div>
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

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Expense Requests</CardTitle>
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pending' | 'approved')}>
                            <TabsList>
                                <TabsTrigger value="pending" className="relative">
                                    Pending
                                    {pendingExpenses.length > 0 && (
                                        <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-yellow-100 text-yellow-700 rounded-full">
                                            {pendingExpenses.length}
                                        </span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="approved" className="relative">
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
    )
}
