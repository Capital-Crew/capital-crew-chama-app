'use client'

import { useState } from 'react'
import { Check, X, DollarSign, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { submitWelfareApproval, disburseWelfare } from '@/app/welfare-requisition-actions'

type Requisition = any

interface AdminRequisitionListProps {
    requisitions: Requisition[]
}

export function AdminRequisitionList({ requisitions }: AdminRequisitionListProps) {
    const [selectedReq, setSelectedReq] = useState<Requisition | null>(null)
    const [action, setAction] = useState<'APPROVE' | 'REJECT' | 'DISBURSE' | null>(null)
    const [note, setNote] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)

    const handleAction = (req: Requisition, act: 'APPROVE' | 'REJECT' | 'DISBURSE') => {
        setSelectedReq(req)
        setAction(act)
        setNote('')
    }

    const confirmAction = async () => {
        if (!selectedReq || !action) return

        setIsProcessing(true)
        try {
            let res;
            if (action === 'DISBURSE') {
                res = await disburseWelfare(selectedReq.id)
            } else if (action === 'APPROVE') {
                res = await submitWelfareApproval(selectedReq.id, 'APPROVED', note)
            } else if (action === 'REJECT') {
                res = await submitWelfareApproval(selectedReq.id, 'REJECTED', note)
            }

            if (res && res.success) {
                toast.success('Action successful')
                // Ideally refresh data or assume page revalidates
                // e.g., by calling a prop function or re-fetching data
            } else {
                toast.error(res?.error || 'Action failed')
            }
        } catch (error) {
            console.error("Error during welfare action:", error)
            toast.error('An error occurred')
        } finally {
            setIsProcessing(false)
            setSelectedReq(null)
            setAction(null)
        }
        setAction(null)
    }


    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'default'
            case 'DISBURSED': return 'secondary' // Greenish?
            case 'REJECTED': return 'destructive'
            case 'PENDING': return 'outline'
            default: return 'outline'
        }
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ref</TableHead>
                            <TableHead>Member</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requisitions.map((req) => (
                            <TableRow key={req.id}>
                                <TableCell className="font-medium">{req.requisitionNumber}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>{req.member?.name}</span>
                                        <span className="text-xs text-muted-foreground">{req.member?.memberNumber}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{req.welfareType.name}</TableCell>
                                <TableCell>KES {Number(req.amount).toLocaleString()}</TableCell>
                                <TableCell>{format(new Date(req.createdAt), 'dd MMM')}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusVariant(req.status)}>{req.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {req.status === 'PENDING' && (
                                            <>
                                                <Button size="sm" variant="ghost" onClick={() => handleAction(req, 'APPROVE')} title="Approve">
                                                    <Check className="w-4 h-4 text-green-600" />
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => handleAction(req, 'REJECT')} title="Reject">
                                                    <X className="w-4 h-4 text-red-600" />
                                                </Button>
                                            </>
                                        )}
                                        {req.status === 'APPROVED' && (
                                            <Button size="sm" variant="outline" className="bg-green-50 text-green-700 border-green-200" onClick={() => handleAction(req, 'DISBURSE')}>
                                                <DollarSign className="w-3 h-3 mr-1" />
                                                Pay
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!selectedReq} onOpenChange={(open) => !open && setSelectedReq(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm {action === 'DISBURSE' ? 'Disbursement' : action}</DialogTitle>
                        <DialogDescription>
                            {action === 'DISBURSE'
                                ? `Disburse KES ${Number(selectedReq?.amount).toLocaleString()} to ${selectedReq?.member?.name}? This will debit the Welfare Fund.`
                                : `Are you sure you want to ${action?.toLowerCase()} this requisition?`
                            }
                        </DialogDescription>
                    </DialogHeader>

                    {action !== 'DISBURSE' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Comments / Notes</label>
                            <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Reason for decision..." />
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setSelectedReq(null)}>Cancel</Button>
                        <Button
                            variant={action === 'REJECT' ? 'destructive' : 'default'}
                            onClick={confirmAction}
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Processing...' : 'Confirm'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
