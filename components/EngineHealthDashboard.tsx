'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { AlertCircle, CheckCircle, Clock, Play, RefreshCw, RotateCcw, History, ShieldAlert, Activity, Loader2 } from 'lucide-react'
import { getEngineHealthStatus, triggerPenaltyEngine, initializeInterestDatesForExistingLoans, forceInterestRunForAllLoans } from '@/app/engine-health-actions'
import { getInterestRuns, getRunDetails, reverseInterestRun, triggerInterestBatch } from '@/app/actions/interest-actions'
import { formatDistanceToNow } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

export function EngineHealthDashboard() {
    const [health, setHealth] = useState<any>(null)
    const [interestRuns, setInterestRuns] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [triggering, setTriggering] = useState<string | null>(null)
    const [migrating, setMigrating] = useState(false)
    
    // Modal states
    const [selectedRun, setSelectedRun] = useState<any>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [isLoadingDetails, setIsLoadingDetails] = useState(false)
    const [isActionPending, setIsActionPending] = useState(false)

    const loadData = async () => {
        try {
            const [healthData, runsData] = await Promise.all([
                getEngineHealthStatus(),
                getInterestRuns()
            ])
            setHealth(healthData)
            setInterestRuns(runsData)
        } catch (error) {
            console.error("Failed to load engine health", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
        const interval = setInterval(loadData, 30000)
        return () => clearInterval(interval)
    }, [])

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
            loadData()
            setIsDetailsOpen(false)
        } else {
            toast.error("Reversal failed: " + result.error)
        }
        setIsActionPending(false)
    }

    const handleTriggerMonthly = async () => {
        setTriggering('interest')
        try {
            const result = await triggerInterestBatch()
            if (result.success) {
                toast.success(`Interest Engine executed successfully!\nProcessed ${result.results.success} loans.`)
                loadData()
            } else {
                toast.error(`Engine execution failed: ${result.error}`)
            }
        } catch (error: any) {
            toast.error(`Error: ${error.message}`)
        } finally {
            setTriggering(null)
        }
    }

    const handleTriggerPenalty = async () => {
        setTriggering('penalty')
        try {
            const result = await triggerPenaltyEngine()
            if (result.success) {
                toast.success("Penalty Engine executed successfully")
                loadData()
            } else {
                toast.error(`Engine execution failed: ${result.error}`)
            }
        } catch (error: any) {
            toast.error(`Error: ${error.message}`)
        } finally {
            setTriggering(null)
        }
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <RefreshCw className="h-10 w-10 animate-spin text-indigo-400" />
                <p className="text-slate-400 font-medium">Syncing engine metrics...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-center md:text-left">
                    <h2 className="text-2xl font-bold">Engine Health Dashboard</h2>
                    <p className="text-sm text-muted-foreground">Monitor and manage automated interest accrual and penalty runs.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={loadData} variant="outline" size="sm" className="bg-white border-slate-200">
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                            Interest Engine
                            {health?.interestEngine?.status === 'operational' ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                                <AlertCircle className="h-4 w-4 text-yellow-500" />
                            )}
                        </CardTitle>
                        <CardDescription className="text-[10px]">Monthly execution logic</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{interestRuns.length} Runs</div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                            Last: {health?.interestEngine?.lastRun ? formatDistanceToNow(new Date(health.interestEngine.lastRun), { addSuffix: true }) : 'Never'}
                        </p>
                        <Button 
                            onClick={handleTriggerMonthly}
                            disabled={triggering !== null}
                            className="w-full mt-4 bg-indigo-600 text-white hover:bg-indigo-700 font-bold"
                        >
                            {triggering === 'interest' ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Running...</> : <><Play className="h-4 w-4 mr-2" /> Run Interest</>}
                        </Button>
                    </CardContent>
                </Card>

                {}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                            Penalty Engine
                            {health?.penaltyEngine?.status === 'operational' ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                                <AlertCircle className="h-4 w-4 text-yellow-500" />
                            )}
                        </CardTitle>
                        <CardDescription className="text-[10px]">Daily overdue logic</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Operational</div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                            Last: {health?.penaltyEngine?.lastRun ? formatDistanceToNow(new Date(health.penaltyEngine.lastRun), { addSuffix: true }) : 'Never'}
                        </p>
                        <Button 
                            onClick={handleTriggerPenalty}
                            disabled={triggering !== null}
                            className="w-full mt-4"
                        >
                            {triggering === 'penalty' ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Running...</> : <><Play className="h-4 w-4 mr-2" /> Run Penalty</>}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-slate-50/50 border-dashed border-indigo-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-700 font-black">Safety Guard</CardTitle>
                        <CardDescription className="text-[10px]">Ledger Integrity Control</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                            <ShieldAlert className="h-4 w-4 text-green-600" />
                            Atomic Reversal Ready
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                            <History className="h-4 w-4 text-indigo-600" />
                            Full Batch Tracking Active
                        </div>
                        <button 
                            onClick={initializeInterestDatesForExistingLoans}
                            className="text-[10px] text-slate-400 hover:text-indigo-600 underline mt-2"
                        >
                            Repurpose Loan Dates
                        </button>
                    </CardContent>
                </Card>
            </div>

            {}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <History className="h-5 w-5 text-indigo-500" /> 
                        Interest Run History
                    </CardTitle>
                    <CardDescription>Click any run to view affected loans and reversal options.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="border-t">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead>Initialized At</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Loans</TableHead>
                                    <TableHead className="text-right">Total Interest</TableHead>
                                    <TableHead className="text-right pr-6">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {interestRuns.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">No historical runs recorded.</TableCell>
                                    </TableRow>
                                ) : (
                                    interestRuns.map((run) => (
                                        <TableRow 
                                            key={run.id} 
                                            className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                                            onClick={() => handleViewDetails(run)}
                                        >
                                            <TableCell className="font-medium">{new Date(run.startedAt).toLocaleString()}</TableCell>
                                            <TableCell>{getStatusBadge(run.status)}</TableCell>
                                            <TableCell className="text-right">{run.affectedLoanCount}</TableCell>
                                            <TableCell className="text-right font-bold text-indigo-600">{formatCurrency(run.totalInterest)}</TableCell>
                                            <TableCell className="text-right pr-6">
                                                <button className="text-xs text-slate-400 group-hover:text-indigo-600 underline">View</button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            Run Details: {selectedRun && new Date(selectedRun.startedAt).toLocaleDateString()}
                            {selectedRun && getStatusBadge(selectedRun.status)}
                        </DialogTitle>
                    </DialogHeader>

                    {isLoadingDetails ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <Loader2 className="h-10 w-10 animate-spin text-indigo-200" />
                            <p className="text-slate-400 text-sm italic">Retrieving loan breakdowns...</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto pr-2">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Started At</p>
                                        <p className="text-sm font-medium">{selectedRun?.startedAt ? new Date(selectedRun.startedAt).toLocaleString() : 'N/A'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Accrual</p>
                                        <p className="text-sm font-bold text-indigo-600">{formatCurrency(selectedRun?.totalInterest || 0)}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                        <Activity className="h-3 w-3" /> Affected Assets
                                    </h4>
                                    <div className="border rounded-lg overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-slate-50 text-[10px]">
                                                <TableRow>
                                                    <TableHead className="h-8 uppercase">Loan #</TableHead>
                                                    <TableHead className="h-8 uppercase">Member</TableHead>
                                                    <TableHead className="h-8 text-right uppercase">Amount</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedRun?.postings?.map((p: any) => (
                                                    <TableRow key={p.id} className="text-xs">
                                                        <TableCell className="font-mono font-medium">{p.loan?.loanApplicationNumber}</TableCell>
                                                        <TableCell className="font-medium text-slate-600">{p.loan?.member?.name}</TableCell>
                                                        <TableCell className="text-right font-black text-slate-900">{formatCurrency(p.amount)}</TableCell>
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
                                    className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-md hover:bg-red-100 transition-all font-black text-xs uppercase tracking-widest"
                                >
                                    {isActionPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                                    Reverse Entire Run
                                </button>
                            )}
                            <button onClick={() => setIsDetailsOpen(false)} className="text-slate-400 text-xs font-bold hover:text-slate-600">CLOSE</button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
