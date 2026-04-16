'use client'

import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
import { CheckCircle2, XCircle, Users, AlertCircle } from 'lucide-react'

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
    version?: number
}

interface VotingRecordsModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    approvals: Approval[]
    requiredApprovals: number
    currentVersion?: number
    // New Props for active voting
    canVote?: boolean
    isSubmitting?: boolean
    onVote?: (action: 'APPROVED' | 'REJECTED', notes: string) => void
    hasVoted?: boolean
}

export function VotingRecordsModal({ 
    isOpen, onOpenChange, approvals, requiredApprovals, currentVersion,
    canVote, isSubmitting, onVote, hasVoted 
}: VotingRecordsModalProps) {
    const [notes, setNotes] = React.useState('')
    // Calculate Stats - For current version only
    const currentApprovals = approvals.filter(a => !currentVersion || a.version === currentVersion)
    const totalVotes = currentApprovals.length
    const approvedCount = currentApprovals.filter(a => a.decision === 'APPROVED').length
    const rejectedCount = currentApprovals.filter(a => a.decision === 'REJECTED').length

    const stats = [
        {
            label: 'Active Voters',
            value: totalVotes,
            icon: Users,
            color: 'bg-blue-50 text-blue-700',
            borderColor: 'border-blue-200'
        },
        {
            label: 'Approved (v)',
            value: approvedCount,
            icon: CheckCircle2,
            color: 'bg-green-50 text-green-700',
            borderColor: 'border-green-200'
        },
        {
            label: 'Rejected (v)',
            value: rejectedCount,
            icon: XCircle,
            color: 'bg-red-50 text-red-700',
            borderColor: 'border-red-200'
        },
        {
            label: 'Required',
            value: `${approvedCount}/${requiredApprovals}`,
            icon: AlertCircle,
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
                        Voting Records {currentVersion && <span className="text-sm font-normal text-slate-400 font-mono">(Version {currentVersion})</span>}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50">
                    {}
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

                    {}
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
                                    // Sort by version (desc) then timestamp (desc)
                                    [...approvals].sort((a, b) => {
                                        const vA = a.version || 1
                                        const vB = b.version || 1
                                        if (vA !== vB) return vB - vA
                                        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                                    }).map((approval) => {
                                        const isOldVersion = currentVersion && approval.version !== currentVersion;
                                        return (
                                            <TableRow key={approval.id} className={`hover:bg-slate-50/50 ${isOldVersion ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                                <TableCell className="text-center">
                                                    {approval.decision === 'APPROVED' ? (
                                                        <div className={`w-8 h-8 rounded-full ${isOldVersion ? 'bg-slate-100 text-slate-400' : 'bg-green-100 text-green-600'} flex items-center justify-center mx-auto`}>
                                                            <CheckCircle2 className="w-5 h-5" />
                                                        </div>
                                                    ) : (
                                                        <div className={`w-8 h-8 rounded-full ${isOldVersion ? 'bg-slate-100 text-slate-400' : 'bg-red-100 text-red-600'} flex items-center justify-center mx-auto`}>
                                                            <XCircle className="w-5 h-5" />
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-slate-900">{approval.approver.name}</span>
                                                            {isOldVersion && (
                                                                <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-amber-50 text-amber-700 border-amber-200 uppercase font-black">
                                                                    Old Version (v{approval.version || 1})
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-slate-400">Member #{approval.approver.memberNumber}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] font-bold text-slate-500 bg-slate-50 border-slate-200">
                                                        {approval.approver.user?.role?.replace('_', ' ') || 'MEMBER'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`uppercase font-bold shadow-none ${isOldVersion
                                                        ? 'bg-slate-100 text-slate-500'
                                                        : approval.decision === 'APPROVED'
                                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                            : 'bg-red-100 text-red-700 hover:bg-red-200'
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
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </div>

                {/* Active Voting Section */}
                {canVote && !hasVoted && onVote && (
                    <div className="p-6 bg-white border-t border-slate-200 space-y-4 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-indigo-600" />
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cast Your Decision</h4>
                        </div>
                        <textarea 
                            placeholder="Add your review notes here (Mandatory for rejection)..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all outline-none min-h-[80px]"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => {
                                    onVote('APPROVED', notes);
                                    setNotes('');
                                }}
                                disabled={isSubmitting}
                                className="h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-900/10 transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? 'Processing...' : 'Approve & Promote'}
                            </button>
                            <button 
                                onClick={() => {
                                    if (!notes.trim()) {
                                        alert("Please provide a reason for rejection");
                                        return;
                                    }
                                    onVote('REJECTED', notes);
                                    setNotes('');
                                }}
                                disabled={isSubmitting}
                                className="h-12 rounded-2xl border-2 border-rose-100 text-rose-600 hover:bg-rose-50 font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                            >
                                Reject & Terminate
                            </button>
                        </div>
                    </div>
                )}

                {hasVoted && (
                    <div className="p-4 bg-emerald-50 border-t border-emerald-100 text-center">
                        <div className="flex items-center justify-center gap-2 text-emerald-700 font-black text-[10px] uppercase tracking-widest">
                            <CheckCircle2 className="w-4 h-4" />
                            Your Decision has been Recorded
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
