'use client'

import { useState, useEffect, useTransition } from 'react'
import { AuditStats } from '@/components/audit/AuditStats'
import { AuditLogTable } from '@/components/audit/AuditLogTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AuditLogAction } from '@prisma/client'
import { getAuditLogs, getAuditStats, exportAuditLogs, type AuditLogResponse } from '@/app/actions/audit'
import { Download, Loader2, Search, FilterX } from 'lucide-react'
import { toast } from '@/lib/toast'

export default function AuditPageClient() {
    const [isPending, startTransition] = useTransition()
    const [data, setData] = useState<AuditLogResponse | null>(null)

    // Filters
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [actionFilter, setActionFilter] = useState<string>('ALL')
    const [domainFilter, setDomainFilter] = useState<string>('ALL')
    const [statusFilter, setStatusFilter] = useState<string>('ALL')

    // Separate stats state to allow independent loading
    const [stats, setStats] = useState<any>(null);

    // Initial Stats Load
    useEffect(() => {
        getAuditStats().then(setStats);
    }, []);

    const fetchData = () => {
        startTransition(async () => {
            try {
                const result = await getAuditLogs(page, 20, {
                    searchTerm: search || undefined,
                    action: actionFilter !== 'ALL' ? (actionFilter as AuditLogAction) : undefined,
                    domain: domainFilter !== 'ALL' ? domainFilter : undefined,
                    status: statusFilter !== 'ALL' ? statusFilter : undefined
                })
                setData(prev => ({ ...result, stats: stats || prev?.stats || result.stats }))
            } catch (error) {
                toast.error("Failed to load audit logs. Secure access only.")
            }
        })
    }

    // Update data when stats load
    useEffect(() => {
        if (stats && data) {
            setData({ ...data, stats })
        }
    }, [stats])

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (page === 1) fetchData();
            else setPage(1);
        }, 500)
        return () => clearTimeout(timer)
    }, [search, actionFilter, domainFilter, statusFilter])

    // Pagination change
    useEffect(() => {
        fetchData()
    }, [page])

    const handleExport = async () => {
        try {
            toast.promise(
                (async () => {
                    const logs = await exportAuditLogs({
                        searchTerm: search || undefined,
                        action: actionFilter !== 'ALL' ? (actionFilter as AuditLogAction) : undefined,
                        domain: domainFilter !== 'ALL' ? domainFilter : undefined,
                        status: statusFilter !== 'ALL' ? statusFilter : undefined
                    })

                    // Enhanced CSV generation
                    const headers = ['Timestamp', 'Domain', 'Action', 'Summary', 'Status', 'Actor', 'Email', 'IP', 'City', 'Country', 'DurationMs', 'TraceId']
                    const csvContent = [
                        headers.join(','),
                        ...logs.map((log: any) => {
                            const geo = (log.geolocation as any) || {};
                            return [
                                `"${new Date(log.timestamp).toISOString()}"`,
                                `"${log.domain || 'CORE'}"`,
                                `"${log.action}"`,
                                `"${(log.summary || '').replace(/"/g, '""')}"`,
                                `"${log.status || 'UNKNOWN'}"`,
                                `"${log.user.name || 'System'}"`,
                                `"${log.user.email}"`,
                                `"${log.ipAddress || ''}"`,
                                `"${geo.city || ''}"`,
                                `"${geo.country || ''}"`,
                                `"${log.durationMs || 0}"`,
                                `"${log.requestId || log.id}"`
                            ].join(',')
                        })
                    ].join('\n')

                    const blob = new Blob([csvContent], { type: 'text/csv' })
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `audit-intelligence-${new Date().toISOString().split('T')[0]}.csv`
                    a.click()

                    return 'Export complete'
                })(),
                {
                    loading: 'Preparing Intelligence Export...',
                    success: 'Audit Intelligence exported successfully',
                    error: 'Failed to export logs'
                }
            )
        } catch (error) {
            // TODO: replace with structured logger
            console.error(error);
        }
    }

    const clearFilters = () => {
        setSearch('');
        setActionFilter('ALL');
        setDomainFilter('ALL');
        setStatusFilter('ALL');
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">System Audit Intelligence</h1>
                    <p className="text-slate-600 mt-2">
                        Deep forensic monitoring of system activity, security events, and logical mutations.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleExport}
                        className="bg-slate-900 text-white border-slate-900 hover:bg-slate-800 font-black uppercase text-xs"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export Forensic CSV
                    </Button>
                </div>
            </div>

            {data?.stats && <AuditStats stats={data.stats} />}

            <div className="flex flex-col gap-6">
                {}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="relative flex-1 min-w-[300px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search forensics (summary, trace ID, details)..."
                                className="pl-9 h-11 border-slate-200 focus:border-slate-900 focus:ring-slate-900"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Select value={domainFilter} onValueChange={setDomainFilter}>
                                <SelectTrigger className="w-[140px] h-11">
                                    <SelectValue placeholder="Domain" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Domains</SelectItem>
                                    <SelectItem value="LOAN">Loan</SelectItem>
                                    <SelectItem value="CONTRIBUTION">Contribution</SelectItem>
                                    <SelectItem value="MEMBER">Member</SelectItem>
                                    <SelectItem value="FINANCE">Finance</SelectItem>
                                    <SelectItem value="SYSTEM">System</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[140px] h-11">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Status</SelectItem>
                                    <SelectItem value="SUCCESS">Success</SelectItem>
                                    <SelectItem value="FAILURE">Failure</SelectItem>
                                    <SelectItem value="PARTIAL">Partial</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={actionFilter} onValueChange={setActionFilter}>
                                <SelectTrigger className="w-[180px] h-11">
                                    <SelectValue placeholder="Action Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Actions</SelectItem>
                                    {Object.values(AuditLogAction).map((action) => (
                                        <SelectItem key={action} value={action}>
                                            {action.replace(/_/g, ' ')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {(search || actionFilter !== 'ALL' || domainFilter !== 'ALL' || statusFilter !== 'ALL') && (
                                <Button
                                    variant="ghost"
                                    onClick={clearFilters}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold uppercase text-xs"
                                >
                                    <FilterX className="mr-2 h-4 w-4" />
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>

                    {isPending && (
                        <div className="flex items-center gap-2 text-xs text-slate-400 animate-pulse">
                            <Loader2 className="h-3 w-3 animate-spin" /> Synchronizing intelligence feed...
                        </div>
                    )}
                </div>

                {}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden transition-all">
                    <AuditLogTable logs={data?.logs || []} />

                    {}
                    {data && (
                        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                Page {data.page} of {data.totalPages} <span className="mx-2">|</span> {data.total} Intelligence Records
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={data.page === 1 || isPending}
                                    className="h-8 text-xs font-bold"
                                >
                                    Prev
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                                    disabled={data.page >= data.totalPages || isPending}
                                    className="h-8 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
