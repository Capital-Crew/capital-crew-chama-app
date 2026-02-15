'use client'

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
import { ChevronRight, Clock, Activity, AlertCircle, Info, CheckCircle } from "lucide-react"
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
    summary: string | null
    severity: string | null
    context: string | null
    steps: any | null // JSON
    durationMs: number | null
    details: string | null
    metadata: any | null
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
                            <TableHead>Context</TableHead>
                            <TableHead>Summary</TableHead>
                            <TableHead className="w-[100px]">Severity</TableHead>
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
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                    {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">{log.user.name || 'Unknown'}</span>
                                        <span className="text-xs text-muted-foreground hidden md:block">{log.user.role}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {log.context && (
                                        <Badge variant="outline" className="text-xs font-mono">
                                            {log.context}
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <span className="font-medium text-sm">{log.summary || log.action}</span>
                                        {log.durationMs && (
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> {log.durationMs}ms
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <StatusBadge severity={log.severity} />
                                </TableCell>
                                <TableCell>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ))}
                        {logs.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No audit logs found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <SheetContent className="w-[400px] sm:w-[540px]">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="flex items-center gap-2">
                            Audit Detail
                            {selectedLog && <StatusBadge severity={selectedLog.severity} />}
                        </SheetTitle>
                        <SheetDescription>
                            Transaction ID: <span className="font-mono text-xs">{selectedLog?.id}</span>
                        </SheetDescription>
                    </SheetHeader>

                    {selectedLog && (
                        <ScrollArea className="h-[calc(100vh-120px)] pr-4">
                            <div className="space-y-8">
                                {/* Header Info */}
                                <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
                                    <div className="space-y-1">
                                        <span className="text-muted-foreground text-xs uppercase tracking-wider">User</span>
                                        <p className="font-medium">{selectedLog.user.name}</p>
                                        <p className="text-xs text-muted-foreground">{selectedLog.user.email}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-muted-foreground text-xs uppercase tracking-wider">Role</span>
                                        <p className="font-medium">{selectedLog.user.role}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-muted-foreground text-xs uppercase tracking-wider">Time</span>
                                        <p className="font-medium">{format(new Date(selectedLog.timestamp), 'PPpp')}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-muted-foreground text-xs uppercase tracking-wider">Context</span>
                                        <p className="font-medium">{selectedLog.context || 'SYSTEM'}</p>
                                    </div>
                                </div>

                                {/* Execution Timeline */}
                                <div>
                                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2 text-primary">
                                        <Activity className="h-4 w-4" /> Execution Timeline
                                    </h4>

                                    <div className="relative border-l border-border ml-2 space-y-8 pb-2">
                                        {Array.isArray(selectedLog.steps) && selectedLog.steps.map((step: any, idx: number) => (
                                            <div key={idx} className="ml-6 relative group">
                                                {/* Dot */}
                                                <div className={cn(
                                                    "absolute -left-[29px] top-1.5 h-3 w-3 rounded-full border-2 border-background ring-1 ring-border shadow-sm transition-colors",
                                                    step.type === 'ERROR' ? "bg-red-500 ring-red-200" : "bg-blue-500 ring-blue-200"
                                                )} />

                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <p className={cn("text-sm font-medium leading-none", step.type === 'ERROR' && "text-red-600")}>
                                                            {step.action}
                                                        </p>
                                                        <span className="text-[10px] text-muted-foreground font-mono">
                                                            {format(new Date(step.timestamp), 'HH:mm:ss.SSS')}
                                                        </span>
                                                    </div>

                                                    {step.details && (
                                                        <div className="mt-2 text-xs bg-muted/50 p-2.5 rounded border overflow-x-auto font-mono text-muted-foreground group-hover:bg-muted transition-colors">
                                                            {JSON.stringify(step.details, null, 2)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {(!selectedLog.steps || selectedLog.steps.length === 0) && (
                                            <div className="ml-6 text-sm text-muted-foreground italic">No detailed steps recorded.</div>
                                        )}
                                    </div>
                                </div>

                                {/* Metadata / Result */}
                                {selectedLog.metadata && (
                                    <div className="pt-4 border-t">
                                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                            <Info className="h-4 w-4" /> Final Meta
                                        </h4>
                                        <pre className="text-xs bg-slate-950 text-slate-50 p-3 rounded-lg overflow-x-auto font-mono">
                                            {JSON.stringify(selectedLog.metadata, null, 2)}
                                        </pre>
                                    </div>
                                )}

                                {/* Legacy / Raw Data */}
                                {selectedLog.details && (
                                    <div className="pt-4 border-t">
                                        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Raw Details (Legacy)</h4>
                                        <p className="text-xs text-muted-foreground break-all bg-muted p-2 rounded">
                                            {selectedLog.details}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    )}
                </SheetContent>
            </Sheet>
        </>
    )
}

function StatusBadge({ severity }: { severity: string | null }) {
    if (severity === 'CRITICAL' || severity === 'ERROR') {
        return (
            <Badge variant="destructive" className="gap-1 pr-2.5">
                <AlertCircle className="h-3 w-3" /> Critical
            </Badge>
        )
    }
    if (severity === 'WARNING') {
        return (
            <Badge variant="secondary" className="gap-1 pr-2.5 bg-yellow-100 text-yellow-700 hover:bg-yellow-100/80">
                <AlertCircle className="h-3 w-3" /> Warning
            </Badge>
        )
    }
    return (
        <Badge variant="outline" className="gap-1 pr-2.5 text-blue-600 border-blue-200 bg-blue-50">
            <CheckCircle className="h-3 w-3" /> Info
        </Badge>
    )
}
