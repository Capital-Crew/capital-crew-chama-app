'use client'

import { useState } from "react"
import { reverseInterestRun, triggerInterestBatch, getRunDetails } from "@/app/actions/interest-actions"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Loader2, RotateCcw, Play, CheckCircle2, XCircle, AlertTriangle, History } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"

export function EngineHealthClient({ initialRuns }: { initialRuns: any[] }) {
    const [runs, setRuns] = useState(initialRuns)
    const [selectedRun, setSelectedRun] = useState<any>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [isLoadingDetails, setIsLoadingDetails] = useState(false)
    const [isActionPending, setIsActionPending] = useState(false)

    const handleViewDetails = async (run: any) => {
        setIsLoadingDetails(true)
        setSelectedRun(run)
        setIsDetailsOpen(true)
        const details = await getRunDetails(run.id)
        if (details) setSelectedRun(details)
        setIsLoadingDetails(false)
    }

    const handleReverse = async (runId: string) => {
        if (!confirm("Are you sure you want to reverse this entire batch run? This will undo all interest postings and ledger entries.")) return
        
        setIsActionPending(true)
        const result = await reverseInterestRun(runId)
        if (result.success) {
            toast.success("Run reversed successfully")
            // Refresh local state if needed (ideally revalidatePath does this)
            window.location.reload()
        } else {
            toast.error("Reversal failed: " + result.error)
        }
        setIsActionPending(false)
    }

    const handleTriggerBatch = async () => {
        setIsActionPending(true)
        const result = await triggerInterestBatch()
        if (result.success) {
            toast.success("Interest batch completed successfully")
            window.location.reload()
        } else {
            toast.error("Batch failed: " + result.error)
        }
        setIsActionPending(false)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'SUCCESS': return <Badge className="bg-green-100 text-green-700 border-green-200">Success</Badge>
            case 'REVERSED': return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Reversed</Badge>
            case 'FAILED': return <Badge className="bg-red-100 text-red-700 border-red-200">Failed</Badge>
            case 'PARTIAL_SUCCESS': return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Partial Success</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end pr-4">
                <button 
                    onClick={handleTriggerBatch}
                    disabled={isActionPending}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-all font-semibold"
                >
                    {isActionPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    Trigger Monthly Batch
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Loans Affected</TableHead>
                            <TableHead className="text-right">Total Interest</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {runs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">
                                    No interest engine runs found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            runs.map((run) => (
                                <TableRow key={run.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => handleViewDetails(run)}>
                                    <TableCell className="font-medium">
                                        {new Date(run.startedAt).toLocaleString()}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(run.status)}</TableCell>
                                    <TableCell className="text-right">{run.affectedLoanCount}</TableCell>
                                    <TableCell className="text-right font-semibold text-indigo-600">
                                        {formatCurrency(run.totalInterest)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleViewDetails(run); }}
                                            className="text-xs text-slate-500 hover:text-indigo-600 underline"
                                        >
                                            Details
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            Run Details: {selectedRun && new Date(selectedRun.startedAt).toLocaleDateString()}
                            {selectedRun && getStatusBadge(selectedRun.status)}
                        </DialogTitle>
                        <DialogDescription>
                            Started: {selectedRun && new Date(selectedRun.startedAt).toLocaleString()}
                        </DialogDescription>
                    </DialogHeader>

                    {isLoadingDetails ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <Loader2 className="h-10 w-10 animate-spin text-indigo-200" />
                            <p className="text-slate-400 text-sm italic">Loading affected loans...</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto pr-2">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Completed At</p>
                                        <p className="text-sm font-medium">{selectedRun?.completedAt ? new Date(selectedRun.completedAt).toLocaleString() : 'N/A'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Accrued</p>
                                        <p className="text-sm font-bold text-indigo-600">{formatCurrency(selectedRun?.totalInterest || 0)}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                        <History className="h-3 w-3" /> Affected Assets
                                    </h4>
                                    <div className="border rounded-lg overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-slate-50 text-[10px]">
                                                <TableRow>
                                                    <TableHead className="h-8 uppercase">Loan #</TableHead>
                                                    <TableHead className="h-8 uppercase">Member</TableHead>
                                                    <TableHead className="h-8 text-right uppercase">Accrual</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedRun?.postings?.map((p: any) => (
                                                    <TableRow key={p.id} className="text-xs">
                                                        <TableCell className="font-mono font-medium">{p.loan?.loanApplicationNumber}</TableCell>
                                                        <TableCell>{p.loan?.member?.name}</TableCell>
                                                        <TableCell className="text-right font-bold text-slate-700">{formatCurrency(p.amount)}</TableCell>
                                                    </TableRow>
                                                )) || (
                                                    <TableRow>
                                                        <TableCell colSpan={3} className="text-center py-4 text-slate-400 italic">No detailed records found.</TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="border-t pt-4 bg-slate-50 -mx-6 -mb-6 px-6 pb-6">
                        <div className="flex justify-between w-full items-center">
                            {selectedRun?.status !== 'REVERSED' && (
                                <button 
                                    onClick={() => handleReverse(selectedRun.id)}
                                    disabled={isActionPending}
                                    className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-md hover:bg-red-100 transition-all font-semibold text-sm"
                                >
                                    {isActionPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                                    Reverse Entire Run
                                </button>
                            )}
                            <Button variant="ghost" onClick={() => setIsDetailsOpen(false)} className="text-slate-500">Close</Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
