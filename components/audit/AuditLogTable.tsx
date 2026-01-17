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

type Log = {
    id: string
    timestamp: Date
    action: AuditLogAction
    details: string
    user: {
        name: string | null
        email: string
        role: string
    }
}

export function AuditLogTable({ logs }: { logs: Log[] }) {
    const getActionColor = (action: string) => {
        if (action.includes('REVERSED') || action.includes('DELETED')) return 'bg-red-100 text-red-700 hover:bg-red-100'
        if (action.includes('DISBURSED') || action.includes('CREATED')) return 'bg-green-100 text-green-700 hover:bg-green-100'
        if (action.includes('UPDATED')) return 'bg-blue-100 text-blue-700 hover:bg-blue-100'
        return 'bg-slate-100 text-slate-700 hover:bg-slate-100'
    }

    const formatAction = (action: string) => action.replace(/_/g, ' ')

    return (
        <div className="rounded-md border bg-white">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[180px]">Timestamp</TableHead>
                        <TableHead className="w-[200px]">Actor</TableHead>
                        <TableHead className="w-[200px]">Action</TableHead>
                        <TableHead>Details</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                No audit logs found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        logs.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                    {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">{log.user.name || 'Unknown'}</span>
                                        <span className="text-xs text-muted-foreground">{log.user.role}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className={getActionColor(log.action)}>
                                        {formatAction(log.action)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-slate-600 max-w-md truncate" title={log.details}>
                                    {log.details}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
