import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { AuditLogAction } from "@prisma/client"
import { useState } from "react"
import { ChevronRight, Clock, Activity, AlertCircle, Info, CheckCircle, MapPin, Database, History, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type Log = {
    id: string
    timestamp: Date
    user: {
        name: string | null
        email: string | null
        role: string
    }
    action: AuditLogAction
    actionType: string | null
    domain: string | null
    summary: string | null
    status: string | null
    severity: string | null
    context: string | null
    steps: any | null
    durationMs: number | null
    details: string | null
    stateBefore: any | null
    stateAfter: any | null
    diff: any | null
    geolocation: any | null
    ipAddress: string | null
    userAgent: string | null
    requestId: string | null
}

interface AuditLogTableProps {
    logs: Log[]
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
    const [selectedLog, setSelectedLog] = useState<Log | null>(null)

    return (
        <>
            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[180px]">Timestamp</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Domain</TableHead>
                            <TableHead>Summary</TableHead>
                            <TableHead className="w-[100px]">Status</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.map((log) => (
                            <TableRow
                                key={log.id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => setSelectedLog(log)}
                            >
                                <TableCell className="font-mono text-[10px] text-muted-foreground">
                                    {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss.SSS')}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm text-slate-900">{log.user.name || 'System / Ghost'}</span>
                                        <span className="text-[10px] text-muted-foreground lowercase">{log.user.role}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-[10px] font-bold uppercase py-0 tracking-tight bg-slate-50">
                                        {log.domain || 'Core'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-semibold text-sm text-slate-800 line-clamp-1">{log.summary || log.action}</span>
                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                                            {log.durationMs && <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{log.durationMs}ms</span>}
                                            {log.ipAddress && <span className="hidden md:inline">{log.ipAddress}</span>}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <AuditStatusBadge status={log.status as any} severity={log.severity as any} />
                                </TableCell>
                                <TableCell>
                                    <ChevronRight className="h-4 w-4 text-slate-300" />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <SheetContent className="w-[400px] sm:w-[680px] border-l-8 border-l-slate-900">
                    <SheetHeader className="pb-6 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <SheetTitle className="text-2xl font-black uppercase tracking-tighter text-slate-900">
                                Audit Intelligence
                            </SheetTitle>
                            {selectedLog && <AuditStatusBadge status={selectedLog.status as any} severity={selectedLog.severity as any} />}
                        </div>
                        <SheetDescription className="font-mono text-[10px] flex items-center gap-2">
                            TRACE ID: {selectedLog?.requestId || selectedLog?.id}
                        </SheetDescription>
                    </SheetHeader>

                    {selectedLog && (
                        <ScrollArea className="h-[calc(100vh-140px)] mt-6 pr-4">
                            <div className="space-y-10">
                                {/* Core Info Header */}
                                <div className="grid grid-cols-2 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden text-xs">
                                    <div className="bg-white p-4">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Actor Identity</label>
                                        <p className="font-bold text-slate-900">{selectedLog.user.name}</p>
                                        <p className="text-slate-500 break-all">{selectedLog.user.email}</p>
                                    </div>
                                    <div className="bg-white p-4">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">System Domain</label>
                                        <p className="font-bold text-slate-900 flex items-center gap-2">
                                            <Database className="h-3 w-3" /> {selectedLog.domain || 'CORE'}
                                        </p>
                                        <p className="text-slate-500">{selectedLog.actionType || selectedLog.action}</p>
                                    </div>
                                    <div className="bg-white p-4">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Request Origin</label>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-3 w-3 text-red-500" />
                                            <div>
                                                <p className="font-bold text-slate-900">{selectedLog.ipAddress}</p>
                                                {selectedLog.geolocation && (
                                                    <p className="text-[10px] text-slate-500">
                                                        {(selectedLog.geolocation as any).city}, {(selectedLog.geolocation as any).country}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Timing</label>
                                        <p className="font-bold text-slate-900">{format(new Date(selectedLog.timestamp), 'PPpp')}</p>
                                        <p className="text-cyan-600 font-mono text-[10px]">Lat: {selectedLog.durationMs}ms</p>
                                    </div>
                                </div>

                                {/* Execution Pipeline */}
                                <section>
                                    <div className="flex items-center gap-2 mb-6 border-b pb-2">
                                        <Activity className="h-5 w-5 text-slate-900" />
                                        <h3 className="font-black text-slate-900 uppercase tracking-tight">Execution Pipeline</h3>
                                    </div>

                                    <div className="relative border-l-2 border-slate-100 ml-3 space-y-8">
                                        {Array.isArray(selectedLog.steps) && (selectedLog.steps as any[]).map((step: any, idx: number) => (
                                            <div key={idx} className="ml-8 relative">
                                                <div className={cn(
                                                    "absolute -left-[41px] top-1 h-5 w-5 rounded-full border-4 border-white shadow-sm flex items-center justify-center",
                                                    step.status === 'ERROR' ? "bg-red-500" : "bg-slate-900"
                                                )}>
                                                    <div className="h-1.5 w-1.5 rounded-full bg-white transition-all transform scale-100" />
                                                </div>

                                                <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100/50 hover:bg-white hover:border-slate-200 transition-all">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className={cn("text-xs font-black uppercase tracking-wider", step.status === 'ERROR' ? "text-red-600" : "text-slate-900")}>
                                                            {step.action}
                                                        </h4>
                                                        <span className="text-[10px] font-mono text-slate-400">
                                                            +{step.durationMs}ms
                                                        </span>
                                                    </div>

                                                    {step.details && (
                                                        <pre className="text-[11px] font-mono text-slate-600 overflow-x-auto bg-white/50 p-2 rounded border border-slate-200/30">
                                                            {JSON.stringify(step.details, null, 2)}
                                                        </pre>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {(!selectedLog.steps || (selectedLog.steps as any[]).length === 0) && (
                                            <div className="ml-8 p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400 text-xs text-center flex flex-col items-center gap-2">
                                                <HelpCircle className="h-5 w-5 opacity-40" />
                                                <p>Standard action log - no pipeline capture detected.</p>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* State Intelligence */}
                                {(selectedLog.stateBefore || selectedLog.stateAfter) && (
                                    <section>
                                        <div className="flex items-center gap-2 mb-6 border-b pb-2">
                                            <History className="h-5 w-5 text-slate-900" />
                                            <h3 className="font-black text-slate-900 uppercase tracking-tight">State Snapshots</h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between px-2">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry State</span>
                                                    <Badge variant="outline" className="text-[9px] py-0">v1.initial</Badge>
                                                </div>
                                                <pre className="text-[10px] font-mono p-4 bg-slate-900 text-slate-300 rounded-xl overflow-x-auto h-48 border-l-4 border-l-amber-500">
                                                    {selectedLog.stateBefore ? JSON.stringify(selectedLog.stateBefore, null, 2) : '// No capture'}
                                                </pre>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between px-2">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Post-Operation</span>
                                                    <Badge variant="outline" className="text-[9px] py-0 bg-emerald-50 text-emerald-700 border-emerald-100">v2.final</Badge>
                                                </div>
                                                <pre className="text-[10px] font-mono p-4 bg-slate-900 text-emerald-400 rounded-xl overflow-x-auto h-48 border-l-4 border-l-emerald-500">
                                                    {selectedLog.stateAfter ? JSON.stringify(selectedLog.stateAfter, null, 2) : '// No capture'}
                                                </pre>
                                            </div>
                                        </div>

                                        {selectedLog.diff && (
                                            <div className="mt-6 space-y-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Differential Mutation</span>
                                                <pre className="text-[10px] font-mono p-4 bg-slate-50 border-2 border-slate-100 rounded-xl overflow-x-auto text-slate-700">
                                                    {JSON.stringify(selectedLog.diff, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </section>
                                )}

                                {/* Technical Environment */}
                                <section className="pt-6 border-t border-slate-100">
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-3">Enviroment Signature</h4>
                                        <p className="text-[10px] font-mono text-slate-500 line-clamp-2 italic">{selectedLog.userAgent}</p>
                                    </div>
                                </section>
                            </div>
                        </ScrollArea>
                    )}
                </SheetContent>
            </Sheet>
        </>
    )
}

function AuditStatusBadge({ status, severity }: { status: string | null, severity: string | null }) {
    if (status === 'FAILURE' || severity === 'CRITICAL' || severity === 'ERROR') {
        return (
            <Badge variant="destructive" className="gap-1 pr-2.5 font-bold uppercase text-[9px]">
                <AlertCircle className="h-2.5 w-2.5" /> FAILED
            </Badge>
        )
    }
    if (status === 'PARTIAL' || severity === 'WARNING') {
        return (
            <Badge variant="secondary" className="gap-1 pr-2.5 bg-amber-100 text-amber-700 hover:bg-amber-100/80 font-bold uppercase text-[9px]">
                <AlertCircle className="h-2.5 w-2.5" /> PARTIAL
            </Badge>
        )
    }
    return (
        <Badge variant="outline" className="gap-1 pr-2.5 text-emerald-600 border-emerald-200 bg-emerald-50 font-bold uppercase text-[9px]">
            <CheckCircle className="h-2.5 w-2.5" /> SUCCESS
        </Badge>
    )
}
