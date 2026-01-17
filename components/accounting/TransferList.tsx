'use client'

import React, { useTransition } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckIcon, XIcon, ClockIcon, UserIcon, ArrowRightIcon, CheckCircle, Ban } from 'lucide-react'
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
import { format } from 'date-fns'

interface TransferRequest {
    id: string
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
    const [isPending, startTransition] = useTransition()
    const [processingId, setProcessingId] = React.useState<string | null>(null)

    const handleApprove = (id: string) => {
        setProcessingId(id)
        toast.promise(
            new Promise((resolve, reject) => {
                startTransition(async () => {
                    try {
                        const res = await approveTransfer(id)
                        if ('error' in res && res.error) throw new Error(res.error as string)
                        resolve('Approved')
                    } catch (e) {
                        reject(e)
                    } finally {
                        setProcessingId(null)
                    }
                })
            }),
            {
                loading: 'Verifying Compliance...',
                success: 'Approval Recorded',
                error: (err) => `Error: ${err.message}`
            }
        )
    }

    const handleReject = (id: string) => {
        if (!confirm("Are you sure you want to reject this transfer?")) return

        setProcessingId(id)
        startTransition(async () => {
            try {
                await rejectTransfer(id, 'Rejected by admin')
                toast.success("Transfer Rejected")
            } catch (e) {
                toast.error("Failed to reject")
            } finally {
                setProcessingId(null)
            }
        })
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
                                <TableRow key={req.id}>
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
                                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleReject(req.id)}
                                                        disabled={processingId === req.id || isPending}
                                                    >
                                                        <Ban className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                                                        onClick={() => handleApprove(req.id)}
                                                        disabled={processingId === req.id || isPending}
                                                    >
                                                        {processingId === req.id ? (
                                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="w-4 h-4 mr-1.5" />
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
                            )
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
