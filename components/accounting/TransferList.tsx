'use client'

import React, { useTransition } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckIcon, XIcon, ClockIcon, UserIcon, ArrowRightIcon, CheckCircle, Ban, Loader2 } from 'lucide-react'
import { useFormAction } from '@/hooks/useFormAction'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { approveTransfer, rejectTransfer } from '@/app/actions/transfer-actions'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { format } from 'date-fns'

interface TransferRequest {
    id: string
    requesterId?: string
    requester: { name: string | null }
    debitAccount: { code: string; name: string }
    creditAccount: { code: string; name: string }
    amount: number
    description: string
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED'
    createdAt: Date
    approvals: any[]
}

interface TransferListProps {
    requests: TransferRequest[]
    currentUserId: string
    type: 'PENDING' | 'HISTORY'
}

export function TransferList({ requests, currentUserId, type }: TransferListProps) {
    const { execute, isPending } = useFormAction()

    const handleApprove = async (id: string) => {
        await execute(async (idempotencyKey) => {
            try {
                const res = await approveTransfer(id, undefined, idempotencyKey)
                if (res && 'error' in res && res.error) {
                    return { success: false, error: res.error as string }
                }
                toast.success('Approval Recorded')
                return { success: true }
            } catch (e: any) {
                return { success: false, error: e.message || 'Approval failed' }
            }
        }, { useIdempotency: true })
    }

    const handleReject = async (id: string) => {
        if (!confirm("Are you sure you want to reject this transfer?")) return

        await execute(async (idempotencyKey) => {
            try {
                await rejectTransfer(id, 'Rejected by admin', idempotencyKey)
                toast.success("Transfer Rejected")
                return { success: true }
            } catch (e: any) {
                return { success: false, error: e.message || 'Failed to reject' }
            }
        }, { useIdempotency: true })
    }

    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                <div className="p-4 bg-slate-100 rounded-full mb-4">
                    <ClockIcon className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">No Transfers Found</h3>
                <p className="text-slate-400 font-medium mt-1">
                    {type === 'PENDING'
                        ? "You're all caught up! No pending approvals."
                        : "No historical transfer records available."}
                </p>
            </div>
        )
    }

    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50/50">
                        <TableHead className="w-[120px]">Date</TableHead>
                        <TableHead className="w-[200px]">Requester</TableHead>
                        <TableHead className="w-[250px]">Debit Account</TableHead>
                        <TableHead className="w-[250px]">Credit Account</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-center w-[150px]">Status</TableHead>
                        {type === 'PENDING' && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={type === 'PENDING' ? 7 : 6} className="h-24 text-center text-slate-500">
                                No transfers found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        requests.map(req => {
                            const isRequester = req.requesterId === currentUserId
                            const hasApproved = req.approvals.some((a: any) => a.approverId === currentUserId)
                            const canApprove = type === 'PENDING' && !isRequester && !hasApproved

                            return (
                                <React.Fragment key={req.id}>
                                    {}
                                    <TableRow className="hidden md:table-row">
                                        <TableCell className="font-medium text-slate-600">
                                            {format(new Date(req.createdAt), 'MMM dd, yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                                    {req.requester.name?.charAt(0)}
                                                </div>
                                                <span className="text-sm font-medium text-slate-700">{req.requester.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-red-600">{req.debitAccount.code}</span>
                                                <span className="text-sm text-slate-600">{req.debitAccount.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-emerald-600">{req.creditAccount.code}</span>
                                                <span className="text-sm text-slate-600">{req.creditAccount.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-slate-900">
                                            {formatCurrency(req.amount)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {type === 'PENDING' ? (
                                                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200">
                                                    {req.approvals.filter((a: any) => a.status === 'APPROVED').length}/2 Approvals
                                                </Badge>
                                            ) : type === 'HISTORY' && req.status === 'EXECUTED' ? (
                                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                                    Executed
                                                </Badge>
                                            ) : (
                                                <Badge variant="destructive">Rejected</Badge>
                                            )}
                                        </TableCell>
                                        {type === 'PENDING' && (
                                            <TableCell className="text-right">
                                                {canApprove ? (
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                                                            onClick={() => handleReject(req.id)}
                                                            disabled={isPending}
                                                        >
                                                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] px-4 rounded-lg disabled:opacity-50"
                                                            onClick={() => handleApprove(req.id)}
                                                            disabled={isPending}
                                                        >
                                                            {isPending ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                                                    Approve
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                ) : isRequester ? (
                                                    <span className="text-xs text-slate-400 italic">Your Request</span>
                                                ) : hasApproved ? (
                                                    <span className="text-xs text-emerald-600 font-medium">Approved</span>
                                                ) : null}
                                            </TableCell>
                                        )}
                                    </TableRow>

                                    {}
                                    {}
                                    <TableRow className="md:hidden" key={`${req.id}-mobile`}>
                                        <TableCell colSpan={7} className="p-0 border-b border-slate-100">
                                            <div
                                                className="bg-white hover:bg-slate-50 transition-colors p-4 active:bg-slate-100"
                                                onClick={() => {
                                                    if (type === 'HISTORY') {
                                                        setSelectedRequest(req)
                                                    } else {
                                                        setExpandedId(expandedId === req.id ? null : req.id)
                                                    }
                                                }}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="w-8 h-8 bg-slate-100 text-xs font-bold text-slate-500">
                                                            <AvatarFallback>{req.requester.name?.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="text-sm font-bold text-slate-900">{req.requester.name}</div>
                                                            <div className="text-xs text-slate-500">{format(new Date(req.createdAt), 'MMM dd, yyyy')}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-mono font-black text-slate-900">{formatCurrency(req.amount)}</div>
                                                        <div className="mt-1">
                                                            {type === 'PENDING' ? (
                                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-1.5 h-5">
                                                                    {req.approvals.filter((a: any) => a.status === 'APPROVED').length}/2 Apps
                                                                </Badge>
                                                            ) : type === 'HISTORY' && req.status === 'EXECUTED' ? (
                                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-1.5 h-5">
                                                                    Executed
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="destructive" className="text-[10px] px-1.5 h-5">Rejected</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {}
                                            {type === 'PENDING' && (
                                                <AnimatePresence>
                                                    {expandedId === req.id && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden bg-slate-50/50"
                                                        >
                                                            <div className="p-4">
                                                                <div className="bg-white border border-slate-200 rounded-lg p-3 grid grid-cols-[1fr_auto_1fr] gap-2 items-center mb-3">
                                                                    <div className="overflow-hidden">
                                                                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">FROM</div>
                                                                        <div className="text-xs font-bold text-slate-700 truncate">{req.debitAccount.name}</div>
                                                                        <div className="text-[10px] font-mono text-slate-500">{req.debitAccount.code}</div>
                                                                    </div>
                                                                    <div className="flex justify-center">
                                                                        <ArrowRightIcon className="w-4 h-4 text-slate-300" />
                                                                    </div>
                                                                    <div className="overflow-hidden text-right">
                                                                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">TO</div>
                                                                        <div className="text-xs font-bold text-slate-700 truncate">{req.creditAccount.name}</div>
                                                                        <div className="text-[10px] font-mono text-slate-500">{req.creditAccount.code}</div>
                                                                    </div>
                                                                </div>

                                                                <div className="mb-3">
                                                                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Reason</div>
                                                                    <div className="text-sm text-slate-700 bg-white p-2 rounded-md border border-slate-200">
                                                                        {req.description}
                                                                    </div>
                                                                </div>

                                                                <div className="flex justify-end pt-2 border-t border-slate-200/50">
                                                                    {canApprove ? (
                                                                        <div className="flex gap-3 w-full" onClick={(e) => e.stopPropagation()}>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                className="flex-1 border-slate-200 text-slate-600 h-10 font-black uppercase tracking-widest text-[10px] rounded-xl"
                                                                                onClick={() => handleReject(req.id)}
                                                                                disabled={isPending}
                                                                            >
                                                                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reject'}
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-10 font-black uppercase tracking-widest text-[10px] rounded-xl"
                                                                                onClick={() => handleApprove(req.id)}
                                                                                disabled={isPending}
                                                                            >
                                                                                {isPending ? (
                                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                                ) : (
                                                                                    <>
                                                                                        <CheckCircle className="w-4 h-4 mr-1.5" />
                                                                                        Approve
                                                                                    </>
                                                                                )}
                                                                            </Button>
                                                                        </div>
                                                                    ) : isRequester ? (
                                                                        <div className="text-center w-full py-2 bg-slate-100 rounded-lg">
                                                                            <span className="text-xs text-slate-400 italic">Your Request</span>
                                                                        </div>
                                                                    ) : hasApproved ? (
                                                                        <div className="text-center w-full py-2 bg-emerald-50 rounded-lg">
                                                                            <span className="text-xs text-emerald-600 font-medium">Approved by You</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-center w-full py-2 bg-slate-100 rounded-lg">
                                                                            <span className="text-xs text-slate-400">Waiting for others</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                </React.Fragment>
                            )
                        })
                    )}
                </TableBody>
            </Table>

            <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Transfer Details</DialogTitle>
                        <DialogDescription>
                            Detailed view of the selected transfer request.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">FROM</div>
                                    <div className="text-sm font-bold text-slate-700">{selectedRequest.debitAccount.name}</div>
                                    <div className="text-xs font-mono text-slate-500">{selectedRequest.debitAccount.code}</div>
                                </div>
                                <ArrowRightIcon className="w-4 h-4 text-slate-300" />
                                <div className="text-right">
                                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">TO</div>
                                    <div className="text-sm font-bold text-slate-700">{selectedRequest.creditAccount.name}</div>
                                    <div className="text-xs font-mono text-slate-500">{selectedRequest.creditAccount.code}</div>
                                </div>
                            </div>

                            <div>
                                <div className="text-xs font-bold text-slate-500 mb-1">Amount</div>
                                <div className="text-2xl font-mono font-black text-slate-900">
                                    {formatCurrency(selectedRequest.amount)}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs font-bold text-slate-500 mb-1">Reason</div>
                                <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-md border border-slate-100">
                                    {selectedRequest.description}
                                </div>
                            </div>

                            <div className="pt-2 flex justify-between items-center text-xs text-slate-500 border-t border-slate-100">
                                <span>Requested by <strong>{selectedRequest.requester.name}</strong></span>
                                <span>{format(new Date(selectedRequest.createdAt), 'PP p')}</span>
                            </div>

                            {selectedRequest.status === 'PENDING' && (
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        className="flex-1"
                                        variant="outline"
                                        onClick={() => handleReject(selectedRequest.id)}
                                        disabled={processingId === selectedRequest.id || isPending}
                                    >
                                        Reject
                                    </Button>
                                    <Button
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                        onClick={() => handleApprove(selectedRequest.id)}
                                        disabled={processingId === selectedRequest.id || isPending}
                                    >
                                        Approve
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
