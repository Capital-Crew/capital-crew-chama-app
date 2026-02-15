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
import { format } from "date-fns"
import { AuditLogAction } from "@prisma/client"
import { useState } from "react"
import { ChevronDown, ChevronRight, Clock, Activity } from "lucide-react"
import { cn } from "@/lib/utils"


type Log = {
    id: string
    timestamp: Date
    action: AuditLogAction
    details: string
    summary?: string | null
    steps?: any
    metadata?: any
    durationMs?: number | null
    user: {
        name: string | null
        email: string
        role: string
    }
}

export function AuditLogTable({ logs }: { logs: Log[] }) {
    const getActionColor = (action: string) => {
        if (action.includes('REVERSED') || action.includes('DELETED') || action.includes('REJECTED')) return 'bg-red-100 text-red-700 hover:bg-red-100'
        if (action.includes('DISBURSED') || action.includes('APPROVED') || action.includes('CREATED')) return 'bg-green-100 text-green-700 hover:bg-green-100'
        if (action.includes('UPDATED') || action.includes('MODIFIED')) return 'bg-blue-100 text-blue-700 hover:bg-blue-100'
        return 'bg-slate-100 text-slate-700 hover:bg-slate-100'
    }

    const formatAction = (action: string) => action.replace(/_/g, ' ')

    return (
        <div className="rounded-md border bg-white overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead className="w-[180px]">Timestamp</TableHead>
                        <TableHead className="w-[200px]">Actor</TableHead>
                        <TableHead className="w-[200px]">Action</TableHead>
                        <TableHead>Summary / Details</TableHead>
                        <TableHead className="w-[100px] text-right">Duration</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                No audit logs found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        logs.map((log) => (
                            <LogParamsRow key={log.id} log={log} getActionColor={getActionColor} formatAction={formatAction} />
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}

function LogParamsRow({ log, getActionColor, formatAction }: { log: Log, getActionColor: (a: string) => string, formatAction: (a: string) => string }) {
    const [isOpen, setIsOpen] = useState(false)
    const hasSteps = log.steps && Array.isArray(log.steps) && log.steps.length > 0;

    return (
        <>
            <TableRow
                className={cn("cursor-pointer hover:bg-slate-50 transition-colors", isOpen && "bg-slate-50")}
                onClick={() => setIsOpen(!isOpen)}
            >
                <TableCell>
                    {hasSteps || log.metadata ? (
                        isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ) : null}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                    {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                </TableCell>
                <TableCell>
                    <div className="flex flex-col">
                        <span className="font-medium text-sm">{log.user.name || 'Unknown'}</span>
                        <span className="text-xs text-muted-foreground hidden md:inline-block">{log.user.role}</span>
                    </div>
                </TableCell>
                <TableCell>
                    <Badge variant="secondary" className={getActionColor(log.action)}>
                        {formatAction(log.action)}
                    </Badge>
                </TableCell>
                <TableCell className="text-sm text-slate-700 max-w-md truncate" title={log.summary || log.details}>
                    {log.summary || log.details}
                </TableCell>
                <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {log.durationMs ? `${log.durationMs}ms` : '-'}
                </TableCell>
            </TableRow>
            {isOpen && (
                <TableRow className="bg-slate-50 hover:bg-slate-50 border-t-0">
                    <TableCell colSpan={6} className="p-0">
                        <div className="p-4 pl-12 space-y-4">
                            {/* Steps Visualization */}
                            {hasSteps && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
                                        <Activity className="h-3 w-3" /> Execution Steps
                                    </h4>
                                    <div className="space-y-2 relative border-l-2 border-slate-200 ml-1.5 pl-4 py-1">
                                        {(log.steps as any[]).map((step, idx) => (
                                            <div key={idx} className="flex flex-col gap-1 text-sm relative">
                                                <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-slate-300 border-2 border-white ring-1 ring-slate-100" />
                                                <div className="font-medium text-slate-800">{step.action}</div>
                                                {step.metadata && Object.keys(step.metadata).length > 0 && (
                                                    <pre className="text-xs text-slate-500 bg-white border rounded p-1.5 overflow-x-auto w-fit max-w-full">
                                                        {JSON.stringify(step.metadata, null, 2)}
                                                    </pre>
                                                )}
                                                <span className="text-[10px] text-muted-foreground">{format(new Date(step.timestamp), 'HH:mm:ss.SSS')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Metadata & Legacy Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {log.metadata && (
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-semibold uppercase text-muted-foreground">Context Metadata</h4>
                                        <pre className="text-xs bg-slate-100 p-2 rounded overflow-auto border">
                                            {JSON.stringify(log.metadata, null, 2)}
                                        </pre>
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <h4 className="text-xs font-semibold uppercase text-muted-foreground">Raw Details</h4>
                                    <p className="text-xs text-slate-600 font-mono break-all">{log.details}</p>
                                </div>
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    )
}
