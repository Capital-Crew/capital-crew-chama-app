'use client'

import { useState } from 'react'
import { Check, X, DollarSign, AlertCircle, Loader2, Info } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
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
import { useFormAction } from '@/hooks/useFormAction'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { FormError } from '@/components/ui/FormError'
import { cn } from '@/lib/utils'

type Requisition = any

interface AdminRequisitionListProps {
    requisitions: Requisition[]
}

export function AdminRequisitionList({ requisitions }: AdminRequisitionListProps) {
    const [selectedReq, setSelectedReq] = useState<Requisition | null>(null)
    const [action, setAction] = useState<'APPROVE' | 'REJECT' | 'DISBURSE' | null>(null)
    const [note, setNote] = useState('')
    
    const { execute, isPending: isProcessing, error } = useFormAction()

    const handleAction = (req: Requisition, act: 'APPROVE' | 'REJECT' | 'DISBURSE') => {
        setSelectedReq(req)
        setAction(act)
        setNote('')
    }

    const confirmAction = async () => {
        if (!selectedReq || !action) return

        await execute(async () => {
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
                    toast.success(`${action} action successful`)
                    setSelectedReq(null)
                    setAction(null)
                    // Note: We rely on server action revalidation or router.refresh() 
                    // usually handled within the actions themselves or the page.
                    return { success: true }
                } else {
                    return { success: false, error: res?.error || 'Action failed' }
                }
            } catch (error) {
                return { success: false, error: 'An unexpected error occurred' }
            }
        });
    }

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'default'
            case 'DISBURSED': return 'secondary'
            case 'REJECTED': return 'destructive'
            case 'PENDING': return 'outline'
            default: return 'outline'
        }
    }

    return (
        <div className="space-y-6 font-sans">
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-slate-100">
                            <TableHead className="text-[10px] font-black uppercase tracking-widest py-6 px-8">Reference</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest py-6">Beneficiary</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest py-6">Category</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest py-6">Volume</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest py-6">Timeline</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest py-6">Status</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest py-6 text-right px-8">Decision</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requisitions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-2 opacity-20">
                                        <AlertCircle className="w-12 h-12" />
                                        <p className="font-black uppercase text-xs tracking-widest">No Active Requisitions</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            requisitions.map((req) => (
                                <TableRow key={req.id} className="hover:bg-slate-50/50 transition-colors border-slate-100 group">
                                    <TableCell className="py-6 px-8 font-black text-slate-900">{req.requisitionNumber}</TableCell>
                                    <TableCell className="py-6">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-800">{req.member?.name}</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">#{req.member?.memberNumber}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-6">
                                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-tight">
                                            {req.welfareType.name}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-6 font-black text-slate-900">
                                        <span className="text-[10px] text-slate-400 mr-1">KES</span>
                                        {Number(req.amount).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="py-6 text-xs font-bold text-slate-500">
                                        {format(new Date(req.createdAt), 'dd MMM, yy')}
                                    </TableCell>
                                    <TableCell className="py-6">
                                        <div className={cn(
                                            "inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                            req.status === 'APPROVED' && "bg-cyan-50 text-cyan-600 border-cyan-100",
                                            req.status === 'DISBURSED' && "bg-emerald-50 text-emerald-600 border-emerald-100",
                                            req.status === 'REJECTED' && "bg-red-50 text-red-600 border-red-100",
                                            req.status === 'PENDING' && "bg-slate-50 text-slate-400 border-slate-100"
                                        )}>
                                            {req.status}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-6 text-right px-8">
                                        <div className="flex justify-end gap-2">
                                            {req.status === 'PENDING' && (
                                                <>
                                                    <button 
                                                        onClick={() => handleAction(req, 'APPROVE')} 
                                                        className="p-2.5 rounded-xl bg-white border border-slate-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm"
                                                        title="Approve"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleAction(req, 'REJECT')} 
                                                        className="p-2.5 rounded-xl bg-white border border-slate-200 text-red-600 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
                                                        title="Reject"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                            {req.status === 'APPROVED' && (
                                                <button 
                                                    onClick={() => handleAction(req, 'DISBURSE')}
                                                    className="px-4 py-2 bg-[#0A192F] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#00c2e0] transition-all shadow-lg shadow-slate-200"
                                                >
                                                    <DollarSign className="w-3.5 h-3.5" />
                                                    Execute Pay
                                                </button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!selectedReq} onOpenChange={(open) => { if (!isProcessing) setSelectedReq(open ? selectedReq : null); }}>
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-white border-none rounded-[2rem] shadow-2xl font-sans">
                    <DialogHeader className="p-8 pb-4 bg-slate-50">
                        <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
                            Confirm {action === 'DISBURSE' ? 'Disbursement' : action}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-bold text-sm mt-2">
                            {action === 'DISBURSE'
                                ? `You are authorizing a payment of KES ${Number(selectedReq?.amount).toLocaleString()} to ${selectedReq?.member?.name}. This will create a debit entry in the Welfare Fund.`
                                : `Please confirm your decision to ${action?.toLowerCase()} this requisition for ${selectedReq?.member?.name}.`
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-8 space-y-6">
                        <FormError message={error} />
                        
                        {action !== 'DISBURSE' && (
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Decision Rationale</label>
                                <Textarea 
                                    value={note} 
                                    onChange={e => setNote(e.target.value)} 
                                    placeholder="Enter internal notes regarding this decision..." 
                                    className="bg-slate-50 border-none rounded-2xl p-5 text-sm font-bold min-h-[120px] focus:ring-4 focus:ring-cyan-500/10 transition-all outline-none resize-none"
                                />
                            </div>
                        )}

                        {action === 'DISBURSE' && (
                            <div className="p-6 bg-cyan-50 rounded-2xl border border-cyan-100 flex items-start gap-4">
                                <Info className="w-6 h-6 text-cyan-600 shrink-0" />
                                <div className="space-y-1">
                                    <p className="font-black text-cyan-900 text-xs">Security Protocol</p>
                                    <p className="text-[11px] font-bold text-cyan-700 leading-relaxed">This action is immutable. Ensure you have verified the beneficiary's details before execution.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-8 pt-0 flex gap-3 sm:justify-end">
                        <button 
                            onClick={() => setSelectedReq(null)}
                            disabled={isProcessing}
                            className="px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            Back
                        </button>
                        <SubmitButton
                            isPending={isProcessing}
                            label={`Confirm ${action}`}
                            pendingLabel="Authorizing..."
                            onClick={confirmAction}
                            className={cn(
                                "flex-1 sm:flex-none px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl",
                                action === 'REJECT' ? "bg-red-600 hover:bg-red-700 shadow-red-200" : "bg-[#0A192F] hover:bg-[#00c2e0] shadow-slate-200"
                            )}
                        />
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
