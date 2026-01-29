'use client'

import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { CheckCircle2, XCircle, Users, Clock, AlertCircle } from 'lucide-react'

interface Approval {
    id: string
    approver: {
        name: string
        memberNumber: number
        user?: {
            role: string
        }
    }
    decision: string
    notes?: string
    timestamp: Date | string
}

interface VotingRecordsModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    approvals: Approval[]
    requiredApprovals: number
}

export function VotingRecordsModal({ isOpen, onOpenChange, approvals, requiredApprovals }: VotingRecordsModalProps) {
    // Calculate Stats
    const totalVotes = approvals.length
    const approvedCount = approvals.filter(a => a.decision === 'APPROVED').length
    const rejectedCount = approvals.filter(a => a.decision === 'REJECTED').length
    const pendingCount = Math.max(0, requiredApprovals - approvedCount)

    const stats = [
        {
            label: 'Total Voters',
            value: totalVotes,
            icon: Users,
            color: 'bg-blue-50 text-blue-700',
            borderColor: 'border-blue-200'
        },
        {
            label: 'Approved',
            value: approvedCount,
            icon: CheckCircle2,
            color: 'bg-green-50 text-green-700',
            borderColor: 'border-green-200'
        },
        {
            label: 'Rejected',
            value: rejectedCount,
            icon: XCircle,
            color: 'bg-red-50 text-red-700',
            borderColor: 'border-red-200'
        },
        {
            label: 'Required',
            value: `${approvedCount}/${requiredApprovals}`,
            icon: AlertCircle, // Or Gauge/Target
            color: 'bg-slate-50 text-slate-700',
            borderColor: 'border-slate-200'
        }
    ]

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-4 border-b border-slate-100">
                    <DialogTitle className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Users className="w-5 h-5 text-slate-500" />
                        Voting Records
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50">
                    {/* 1. Stat Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {stats.map((stat, i) => {
                            const Icon = stat.icon
                            return (
                                <div key={i} className={`flex flex-col p-4 rounded-xl border ${stat.borderColor} ${stat.color} shadow-sm`}>
                                    <div className="flex items-center justify-between mb-2 opacity-80">
                                        <span className="text-[10px] font-black uppercase tracking-wider">{stat.label}</span>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="text-2xl font-black">{stat.value}</div>
                                </div>
                            )
                        })}
                    </div>

                    {/* 2. Voting Table */}
                    <Card className="border-slate-200 shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="w-[50px] font-bold text-center">Status</TableHead>
                                    <TableHead className="font-bold">Approver Name</TableHead>
                                    <TableHead className="font-bold">Role</TableHead>
                                    <TableHead className="font-bold">Vote</TableHead>
                                    <TableHead className="font-bold text-right">Timestamp</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {approvals.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-slate-400 italic">
                                            No votes recorded yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    approvals.map((approval) => (
                                        <TableRow key={approval.id} className="hover:bg-slate-50/50">
                                            <TableCell className="text-center">
                                                {approval.decision === 'APPROVED' ? (
                                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mx-auto text-green-600">
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-600">
                                                        <XCircle className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-900">{approval.approver.name}</span>
                                                    <span className="text-xs text-slate-400">Member #{approval.approver.memberNumber}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[10px] font-bold text-slate-500 bg-slate-50 border-slate-200">
                                                    {approval.approver.user?.role?.replace('_', ' ') || 'MEMBER'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`uppercase font-bold ${approval.decision === 'APPROVED'
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200 shadow-none'
                                                        : 'bg-red-100 text-red-700 hover:bg-red-200 shadow-none'
                                                    }`}>
                                                    {approval.decision}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-slate-500 text-xs font-medium tabular-nums">
                                                {new Date(approval.timestamp).toLocaleString(undefined, {
                                                    dateStyle: 'medium',
                                                    timeStyle: 'short'
                                                })}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    )
}
