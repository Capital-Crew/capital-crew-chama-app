'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChevronDown, ChevronUp, FileText, Calendar, CreditCard } from 'lucide-react'
import { clsx } from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'

type Requisition = any // Define type

interface WelfareHistoryProps {
    requisitions: Requisition[]
}

export function WelfareHistory({ requisitions }: WelfareHistoryProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'default' // or success/green if available
            case 'DISBURSED': return 'default' // green
            case 'REJECTED': return 'destructive'
            case 'PENDING': return 'secondary' // or yellow
            case 'CANCELLED': return 'outline'
            default: return 'secondary'
        }
    }

    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
                <CardTitle className="text-xl font-bold text-slate-900">My Requisition History</CardTitle>
                <CardDescription>View status of your welfare applications</CardDescription>
            </CardHeader>
            <CardContent className="p-0 md:p-6">
                {/* Desktop View */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Ref No.</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requisitions.map((req: any) => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium">{req.requisitionNumber}</TableCell>
                                    <TableCell>{req.welfareType.name}</TableCell>
                                    <TableCell>{format(new Date(req.createdAt), 'dd MMM yyyy')}</TableCell>
                                    <TableCell>KES {Number(req.amount).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusColor(req.status)}>
                                            {req.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {requisitions.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                        No history found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden">
                    {requisitions.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            No history found.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {requisitions.map((req: any) => {
                                const isExpanded = expandedId === req.id
                                return (
                                    <div key={req.id} className={clsx("transition-colors", isExpanded ? "bg-slate-50" : "bg-white")}>
                                        <div
                                            onClick={() => toggleExpand(req.id)}
                                            className="p-4 flex items-center justify-between cursor-pointer active:bg-slate-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={clsx(
                                                    "p-2.5 rounded-full transition-colors",
                                                    isExpanded ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
                                                )}>
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 text-sm">{req.welfareType.name}</h4>
                                                    <p className="text-xs text-slate-500 mt-0.5">KES {Number(req.amount).toLocaleString()}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <Badge variant={getStatusColor(req.status)} className="text-[10px] px-2 h-5">
                                                    {req.status}
                                                </Badge>
                                                {isExpanded ? (
                                                    <ChevronUp className="w-4 h-4 text-slate-400" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                                )}
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-4 pb-4 pt-0 text-sm text-slate-600 space-y-3 pl-[4.5rem]">
                                                        <div className="grid grid-cols-1 gap-2">
                                                            <div className="flex items-center gap-2 text-xs">
                                                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                                                <span className="font-medium text-slate-500">Ref:</span>
                                                                <span className="font-mono text-slate-700">{req.requisitionNumber}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs">
                                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                                <span className="font-medium text-slate-500">Date:</span>
                                                                <span className="text-slate-700">{format(new Date(req.createdAt), 'dd MMM yyyy, HH:mm')}</span>
                                                            </div>
                                                            {/* Add more details here if available in req object */}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
