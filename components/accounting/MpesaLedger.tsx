'use client'

import React, { useState, useEffect } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Search, UserPlus, Check, Edit2, FileText } from "lucide-react"
import { toast } from "sonner"
import { assignTransactionToMember } from '@/app/actions/reconcile-mpesa'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { checkStatusAction, resolveManuallyAction, syncLedgerAction } from '@/app/actions/reconcile-action'
import { getTransactionLedger } from '@/app/actions/ledger-actions'

interface Transaction {
    id: string
    date: string
    memberId?: string
    phoneNumber: string
    memberName: string
    amount: number
    status: 'COMPLETED' | 'FAILED' | 'PENDING'
    receipt: string
    failureReason: string
}

interface Member {
    id: string;
    name: string;
    memberNumber: number;
}

interface MpesaLedgerProps {
    members?: Member[];
}

export function MpesaLedger({ members = [] }: MpesaLedgerProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('completed')
    const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null)

    // Retry State
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
    const [retryPhone, setRetryPhone] = useState('')
    const [retryAmount, setRetryAmount] = useState('')
    const [retrying, setRetrying] = useState(false)
    const [isRetryOpen, setIsRetryOpen] = useState(false)

    // Reconcile State
    const [isReconcileOpen, setIsReconcileOpen] = useState(false);
    const [selectedMemberId, setSelectedMemberId] = useState<string>("");
    const [reconciling, setReconciling] = useState(false);

    // Check Status State
    const [checkingStatusId, setCheckingStatusId] = useState<string | null>(null);
    const [checkingAll, setCheckingAll] = useState(false);

    // Manual Resolve State
    const [isManualOpen, setIsManualOpen] = useState(false);
    const [manualReceipt, setManualReceipt] = useState('');
    const [resolving, setResolving] = useState(false);

    // Ledger View State
    const [isLedgerViewOpen, setIsLedgerViewOpen] = useState(false);
    const [viewingLedger, setViewingLedger] = useState(false);
    const [currentLedger, setCurrentLedger] = useState<any>(null);
    const [syncingLedger, setSyncingLedger] = useState(false);

    useEffect(() => {
        fetchTransactions()
    }, [])

    const fetchTransactions = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/transactions')
            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to fetch transactions')
            }

            if (Array.isArray(data)) {
                setTransactions(data)
            } else {
                console.error("Unexpected API response:", data)
                setTransactions([])
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to load transactions")
            setTransactions([])
        } finally {
            setLoading(false)
        }
    }

    // --- Retry Logic ---
    const handleOpenRetry = (tx: Transaction) => {
        setSelectedTx(tx)
        setRetryPhone(tx.phoneNumber)
        setRetryAmount(tx.amount.toString())
        setIsRetryOpen(true)
    }

    const handleRetry = async () => {
        if (!selectedTx) return
        setRetrying(true)
        try {
            const res = await fetch('/api/deposit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phoneNumber: retryPhone,
                    amount: parseFloat(retryAmount),
                    memberId: selectedTx.memberId
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            toast.success("New Payment Request Sent")
            setIsRetryOpen(false)
            fetchTransactions()
        } catch (error: any) {
            toast.error(error.message || "Retry Failed")
        } finally {
            setRetrying(false)
        }
    }

    // --- Check Status Logic ---
    const handleCheckStatus = async (tx: Transaction) => {
        setCheckingStatusId(tx.id);
        toast.info("Checking transaction status with M-Pesa...");

        try {
            const result = await checkStatusAction(tx.id);

            if (result.success) {
                toast.success(result.message);
                fetchTransactions(); // Refresh list
            } else {
                if (result.status === 'PENDING') {
                    toast.warning(result.message);
                } else {
                    toast.error(result.message);
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to check status");
        } finally {
            setCheckingStatusId(null);
        }
    };

    const handleCheckAllStatus = async () => {
        if (pendingTx.length === 0) return;
        setCheckingAll(true);
        toast.info(`Checking status for ${pendingTx.length} transactions...`);

        let updatedCount = 0;

        try {
            // Process sequentially to avoid rate limits and database locks
            for (const tx of pendingTx) {
                const result = await checkStatusAction(tx.id);
                if (result.success) {
                    updatedCount++;
                }
            }

            if (updatedCount > 0) {
                toast.success(`Successfully reconciled ${updatedCount} transactions.`);
            } else {
                toast.info("No transaction status updates found.");
            }
            fetchTransactions();
        } catch (error) {
            console.error(error);
            toast.error("Incomplete bulk check.");
        } finally {
            setCheckingAll(false);
        }
    };


    // --- Manual Resolve Logic ---
    const handleOpenManualResolve = (tx: Transaction) => {
        setSelectedTx(tx);
        setManualReceipt(""); // Reset input
        setIsManualOpen(true);
    }

    const handleManualResolve = async () => {
        if (!selectedTx || !manualReceipt) return;
        setResolving(true);
        try {
            const result = await resolveManuallyAction(selectedTx.id, manualReceipt);
            if (result.success) {
                toast.success(result.message);
                setIsManualOpen(false);
                fetchTransactions();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to resolve manually");
        } finally {
            setResolving(false);
        }
    }


    // --- Ledger View Logic ---
    const handleViewLedger = async (tx: Transaction) => {
        setSelectedTx(tx);
        setViewingLedger(true);
        setCurrentLedger(null); // Clear previous
        setIsLedgerViewOpen(true);

        try {
            const ledger = await getTransactionLedger(tx.id);
            setCurrentLedger(ledger);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load ledger details");
        } finally {
            setViewingLedger(false);
        }
    };

    const handleSyncLedger = async () => {
        if (!selectedTx) return;
        setSyncingLedger(true);
        try {
            const result = await syncLedgerAction(selectedTx.id);
            if (result.success) {
                toast.success(result.message);
                // Refresh ledger view
                const ledger = await getTransactionLedger(selectedTx.id);
                setCurrentLedger(ledger);
            } else {
                toast.info(result.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to sync ledger");
        } finally {
            setSyncingLedger(false);
        }
    };

    // --- Reconcile Logic ---
    const handleOpenReconcile = (tx: Transaction) => {
        setSelectedTx(tx);
        setSelectedMemberId("");
        setIsReconcileOpen(true);
    };

    const handleReconcile = async () => {
        if (!selectedTx || !selectedMemberId) return;
        setReconciling(true);
        try {
            const result = await assignTransactionToMember(selectedTx.id, selectedMemberId);
            if (result.success) {
                toast.success(result.message);
                setIsReconcileOpen(false);
                fetchTransactions();
            } else {
                toast.error(result.error || "Reconciliation failed");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred during reconciliation");
        } finally {
            setReconciling(false);
        }
    };


    // Filter Logic
    const completedTx = transactions.filter(t => t.status === 'COMPLETED')
    const failedTx = transactions.filter(t => t.status === 'FAILED')
    const pendingTx = transactions.filter(t => t.status === 'PENDING')

    // Find orphans (Completed but no memberId)
    const orphanedTx = completedTx.filter(t => !t.memberId);

    const totalCollected = completedTx.reduce((sum, t) => sum + t.amount, 0)

    if (loading) return <div className="p-8 text-center">Loading Ledger...</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">M-Pesa Reconciliation</h2>
                    <p className="text-muted-foreground">Monitor and reconcile mobile money deposits.</p>
                </div>
                <div className="flex gap-2">
                    {orphanedTx.length > 0 && (
                        <Badge variant="destructive" className="animate-pulse">
                            {orphanedTx.length} Unallocated
                        </Badge>
                    )}
                    <Button variant="outline" className="border-cyan-200 text-cyan-700 hover:bg-cyan-50" onClick={fetchTransactions}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Total Collected</h3>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold">KES {totalCollected.toLocaleString()}</div>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Pending Actions</h3>
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="text-2xl font-bold">{pendingTx.length}</div>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Unallocated</h3>
                        <UserPlus className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="text-2xl font-bold text-orange-600">{orphanedTx.length}</div>
                </div>
            </div>

            <Tabs defaultValue="pending" className="space-y-4" onValueChange={setActiveTab}>
                <TabsList className="flex flex-col md:grid md:grid-cols-3 w-full h-auto p-1 bg-slate-100 rounded-xl gap-1 md:gap-0">
                    <TabsTrigger
                        value="pending"
                        className="w-full h-12 rounded-lg font-bold data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all text-slate-500 hover:text-orange-600 justify-start px-4 md:justify-center"
                    >
                        Pending Actions ({pendingTx.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="completed"
                        className="w-full h-12 rounded-lg font-bold data-[state=active]:bg-green-500 data-[state=active]:text-white transition-all text-slate-500 hover:text-green-600 justify-start px-4 md:justify-center"
                    >
                        Successful ({completedTx.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="failed"
                        className="w-full h-12 rounded-lg font-bold data-[state=active]:bg-red-500 data-[state=active]:text-white transition-all text-slate-500 hover:text-red-600 justify-start px-4 md:justify-center"
                    >
                        Failed / Cancelled
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                    {pendingTx.length > 0 && (
                        <div className="flex justify-end mb-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCheckAllStatus}
                                disabled={checkingAll}
                                className="border-orange-200 text-orange-700 hover:bg-orange-50"
                            >
                                {checkingAll ? <RefreshCw className="mr-2 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-2 h-3 w-3" />}
                                Check Status for All
                            </Button>
                        </div>
                    )}
                    <div className="rounded-md border hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingTx.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">No pending transactions.</TableCell>
                                    </TableRow>
                                ) : (
                                    pendingTx.map((tx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell>{new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString()}</TableCell>
                                            <TableCell>{tx.memberName}</TableCell>
                                            <TableCell>{tx.phoneNumber}</TableCell>
                                            <TableCell><Badge variant="outline" className="text-orange-600 border-orange-200">Pending</Badge></TableCell>
                                            <TableCell className="text-right font-bold">KES {tx.amount.toLocaleString()}</TableCell>
                                            <TableCell className="flex gap-2">
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                                    onClick={() => handleCheckStatus(tx)}
                                                    disabled={checkingStatusId === tx.id || checkingAll}
                                                >
                                                    {checkingStatusId === tx.id ? (
                                                        <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <RefreshCw className="mr-2 h-3 w-3" />
                                                    )}
                                                    Check
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-slate-500 hover:text-slate-900"
                                                    onClick={() => handleOpenManualResolve(tx)}
                                                    title="Manually Enter M-Pesa Code"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile List View - Pending */}
                    <div className="space-y-3 md:hidden">
                        {pendingTx.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">No pending transactions.</div>
                        ) : (
                            pendingTx.map((tx) => (
                                <div key={tx.id} onClick={() => setViewingTransaction(tx)} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm active:scale-[0.98] transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-bold text-slate-900">{tx.memberName}</div>
                                            <div className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString()}</div>
                                        </div>
                                        <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Pending</Badge>
                                    </div>
                                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                                        <div className="font-mono text-xs text-slate-500">{tx.phoneNumber}</div>
                                        <div className="font-black text-slate-900">KES {tx.amount.toLocaleString()}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="completed" className="space-y-4">
                    <div className="rounded-md border hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Receipt</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {completedTx.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">No successful transactions found.</TableCell>
                                    </TableRow>
                                ) : (
                                    completedTx.map((tx) => (
                                        <TableRow key={tx.id} className={!tx.memberId ? "bg-orange-50/50" : ""}>
                                            <TableCell>{new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString()}</TableCell>
                                            <TableCell>
                                                {tx.memberName !== 'Unknown' ? tx.memberName : <span className="text-orange-600 font-bold italic">Unassigned</span>}
                                            </TableCell>
                                            <TableCell>{tx.phoneNumber}</TableCell>
                                            <TableCell className="font-mono text-xs">{tx.receipt}</TableCell>
                                            <TableCell className="text-right font-bold">KES {tx.amount.toLocaleString()}</TableCell>
                                            <TableCell><Badge className="bg-green-500">Success</Badge></TableCell>
                                            <TableCell className="flex gap-2">
                                                {!tx.memberId && (
                                                    <Button size="sm" variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50" onClick={() => handleOpenReconcile(tx)}>
                                                        <UserPlus className="w-4 h-4 mr-1" /> Assign Use
                                                    </Button>
                                                )}
                                                <Button size="sm" variant="ghost" onClick={() => handleViewLedger(tx)} title="View Ledger Entries">
                                                    <FileText className="w-4 h-4 text-slate-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile List View - Completed */}
                    <div className="space-y-3 md:hidden">
                        {completedTx.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">No successful transactions found.</div>
                        ) : (
                            completedTx.map((tx) => (
                                <div key={tx.id} onClick={() => setViewingTransaction(tx)} className={`bg-white border border-slate-200 rounded-xl p-4 shadow-sm active:scale-[0.98] transition-all ${!tx.memberId ? 'border-l-4 border-l-orange-400' : ''}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-bold text-slate-900">{tx.memberName !== 'Unknown' ? tx.memberName : 'Unassigned Member'}</div>
                                            <div className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString()}</div>
                                        </div>
                                        <Badge className="bg-green-500 h-5 text-[10px]">Success</Badge>
                                    </div>
                                    <div className="flex justify-between items-end mt-2">
                                        <div>
                                            <div className="text-[10px] text-slate-400 uppercase font-bold">Receipt</div>
                                            <div className="font-mono text-xs text-slate-600 font-bold">{tx.receipt}</div>
                                        </div>
                                        <div className="font-black text-slate-900 text-lg">KES {tx.amount.toLocaleString()}</div>
                                    </div>
                                    {!tx.memberId && (
                                        <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
                                            <span className="text-xs text-orange-600 font-bold flex items-center"><UserPlus className="w-3 h-3 mr-1" /> Tap to Assign</span>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="failed" className="space-y-4">
                    <div className="rounded-md border hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Failure Reason</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {failedTx.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">No failed transactions found.</TableCell>
                                    </TableRow>
                                ) : (
                                    failedTx.map((tx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell>{new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString()}</TableCell>
                                            <TableCell>{tx.memberName}</TableCell>
                                            <TableCell>{tx.phoneNumber}</TableCell>
                                            <TableCell className="text-red-500 font-medium">{tx.failureReason}</TableCell>
                                            <TableCell className="text-right font-bold">KES {tx.amount.toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Button variant="outline" size="sm" onClick={() => handleOpenRetry(tx)}>Retry</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile List View - Failed */}
                    <div className="space-y-3 md:hidden">
                        {failedTx.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">No failed transactions found.</div>
                        ) : (
                            failedTx.map((tx) => (
                                <div key={tx.id} onClick={() => setViewingTransaction(tx)} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm active:scale-[0.98] transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-bold text-slate-900">{tx.memberName}</div>
                                            <div className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString()}</div>
                                        </div>
                                        <Badge variant="destructive" className="h-5 text-[10px]">Failed</Badge>
                                    </div>
                                    <div className="bg-red-50 p-2 rounded text-xs text-red-600 font-medium mb-3 mt-1">
                                        {tx.failureReason}
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                        <div className="font-mono text-xs text-slate-500">{tx.phoneNumber}</div>
                                        <div className="font-black text-slate-900">KES {tx.amount.toLocaleString()}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Retry Dialog */}
            <Dialog open={isRetryOpen} onOpenChange={setIsRetryOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Retry Payment</DialogTitle>
                        <DialogDescription>
                            Edit details if necessary and resend the STK Push request.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">Phone</Label>
                            <Input id="phone" value={retryPhone} onChange={e => setRetryPhone(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">Amount</Label>
                            <Input id="amount" type="number" value={retryAmount} onChange={e => setRetryAmount(e.target.value)} className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRetryOpen(false)}>Cancel</Button>
                        <Button onClick={handleRetry} disabled={retrying}>
                            {retrying ? "Sending..." : "Resend Request"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reconcile Dialog */}
            <Dialog open={isReconcileOpen} onOpenChange={setIsReconcileOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Transaction</DialogTitle>
                        <DialogDescription>
                            Link this unallocated transaction to a member. This will also fix the wallet balance.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedTx && (
                        <div className="bg-slate-50 p-4 rounded-lg mb-4 text-sm space-y-1">
                            <p><span className="font-semibold">Transaction:</span> {selectedTx.receipt || selectedTx.id}</p>
                            <p><span className="font-semibold">Amount:</span> KES {selectedTx.amount}</p>
                            <p><span className="font-semibold">Phone:</span> {selectedTx.phoneNumber}</p>
                        </div>
                    )}
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Select Member</Label>
                            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Search member..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {members.map(member => (
                                        <SelectItem key={member.id} value={member.id}>
                                            {member.memberNumber} - {member.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsReconcileOpen(false)}>Cancel</Button>
                        <Button onClick={handleReconcile} disabled={reconciling || !selectedMemberId}>
                            {reconciling ? "Assigning..." : "Confirm Assignment"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Manual Resolve Dialog */}
            <Dialog open={isManualOpen} onOpenChange={setIsManualOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Manual Reconciliation</DialogTitle>
                        <DialogDescription>
                            Enter the M-Pesa Receipt Number correctly to force-complete this transaction.
                            This will update the ledger and wallet immediately.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedTx && (
                        <div className="bg-slate-50 p-4 rounded-lg mb-4 text-sm space-y-1">
                            <p><span className="font-semibold">Amount:</span> KES {selectedTx.amount}</p>
                            <p><span className="font-semibold">Phone:</span> {selectedTx.phoneNumber}</p>
                        </div>
                    )}
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>M-Pesa Receipt Number</Label>
                            <Input
                                value={manualReceipt}
                                onChange={e => setManualReceipt(e.target.value.toUpperCase())}
                                placeholder="e.g. QBH..."
                            />
                            <p className="text-xs text-muted-foreground">Ensure this code is unique and matches the SMS.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsManualOpen(false)}>Cancel</Button>
                        <Button onClick={handleManualResolve} disabled={resolving || !manualReceipt}>
                            {resolving ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Processsing...
                                </>
                            ) : (
                                <>
                                    <Check className="mr-2 h-4 w-4" />
                                    Complete Transaction
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isLedgerViewOpen} onOpenChange={setIsLedgerViewOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Ledger Entries</DialogTitle>
                        <DialogDescription>
                            View the accounting journal entries for this transaction.
                        </DialogDescription>
                    </DialogHeader>

                    {viewingLedger ? (
                        <div className="flex justify-center py-8">
                            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : currentLedger ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg text-sm">
                                <div>
                                    <span className="font-semibold block text-xs text-slate-500 uppercase">Description</span>
                                    <span>{currentLedger.description}</span>
                                </div>
                                <div>
                                    <span className="font-semibold block text-xs text-slate-500 uppercase">Date</span>
                                    <span>{new Date(currentLedger.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div>
                                    <span className="font-semibold block text-xs text-slate-500 uppercase">Transaction Ref</span>
                                    <span className="font-mono">{currentLedger.transactionReference}</span>
                                </div>
                                {/* Only show external ref if it's different and exists */}
                                {currentLedger.externalReference && currentLedger.externalReference !== currentLedger.transactionReference && (
                                    <div>
                                        <span className="font-semibold block text-xs text-slate-500 uppercase">Ext Ref</span>
                                        <span className="font-mono">{currentLedger.externalReference}</span>
                                    </div>
                                )}
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Account</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right">Debit</TableHead>
                                        <TableHead className="text-right">Credit</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentLedger.ledgerEntries.map((entry: any) => (
                                        <TableRow key={entry.id}>
                                            <TableCell>
                                                <div className="font-medium">{entry.ledgerAccount?.name || 'Unknown Account'}</div>
                                                <div className="text-xs text-slate-500">{entry.ledgerAccount?.accountNumber || '--'}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={entry.entryType === 'DEBIT' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'}>
                                                    {entry.entryType}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {entry.debitAmount > 0 ? entry.debitAmount.toLocaleString() : '-'}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {entry.creditAmount > 0 ? entry.creditAmount.toLocaleString() : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                            <AlertTriangle className="h-12 w-12 text-amber-500" />
                            <div>
                                <h3 className="text-lg font-semibold">No Ledger Entry Found</h3>
                                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                                    This transaction is marked as completed but has no corresponding journal entry in the ledger.
                                </p>
                            </div>
                            <Button onClick={handleSyncLedger} disabled={syncingLedger} className="mt-4">
                                {syncingLedger ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        Syncing...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Fix: Create Ledger Entry
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsLedgerViewOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Transaction Details Modal (Mobile) */}
            <Dialog open={!!viewingTransaction} onOpenChange={(open) => !open && setViewingTransaction(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Transaction Details</DialogTitle>
                    </DialogHeader>
                    {viewingTransaction && (
                        <div className="space-y-4">
                            <div className="text-center py-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="text-sm text-slate-500 mb-1">Amount</div>
                                <div className="text-3xl font-black text-slate-900">KES {viewingTransaction.amount.toLocaleString()}</div>
                                <div className="mt-2">
                                    {viewingTransaction.status === 'COMPLETED' ? (
                                        <Badge className="bg-green-500">Success</Badge>
                                    ) : viewingTransaction.status === 'PENDING' ? (
                                        <Badge variant="outline" className="text-orange-600 border-orange-200">Pending</Badge>
                                    ) : (
                                        <Badge variant="destructive">Failed</Badge>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-4 text-sm">
                                <div className="flex justify-between py-2 border-b border-slate-100">
                                    <span className="text-slate-500">Date</span>
                                    <span className="font-medium text-slate-900">{new Date(viewingTransaction.date).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-100">
                                    <span className="text-slate-500">Member</span>
                                    <span className="font-medium text-slate-900">{viewingTransaction.memberName}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-100">
                                    <span className="text-slate-500">Phone</span>
                                    <span className="font-medium text-slate-900">{viewingTransaction.phoneNumber}</span>
                                </div>
                                {viewingTransaction.receipt && (
                                    <div className="flex justify-between py-2 border-b border-slate-100">
                                        <span className="text-slate-500">Receipt</span>
                                        <span className="font-mono font-bold text-slate-900">{viewingTransaction.receipt}</span>
                                    </div>
                                )}
                                {viewingTransaction.failureReason && (
                                    <div className="py-2">
                                        <span className="text-slate-500 block mb-1">Failure Reason</span>
                                        <span className="font-medium text-red-600 bg-red-50 p-2 rounded block text-xs">
                                            {viewingTransaction.failureReason}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 pt-2">
                                {viewingTransaction.status === 'PENDING' && (
                                    <>
                                        <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { setViewingTransaction(null); handleCheckStatus(viewingTransaction); }}>
                                            Check Status
                                        </Button>
                                        <Button variant="outline" className="flex-1" onClick={() => { setViewingTransaction(null); handleOpenManualResolve(viewingTransaction); }}>
                                            Resolve
                                        </Button>
                                    </>
                                )}
                                {viewingTransaction.status === 'COMPLETED' && !viewingTransaction.memberId && (
                                    <Button className="flex-1 border-orange-200 text-orange-700 hover:bg-orange-50" variant="outline" onClick={() => { setViewingTransaction(null); handleOpenReconcile(viewingTransaction); }}>
                                        Assign User
                                    </Button>
                                )}
                                {viewingTransaction.status === 'FAILED' && (
                                    <Button className="flex-1" variant="outline" onClick={() => { setViewingTransaction(null); handleOpenRetry(viewingTransaction); }}>
                                        Retry Payment
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setViewingTransaction(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
