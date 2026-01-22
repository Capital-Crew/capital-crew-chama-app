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

    // Separate stats state to allow independent loading
    const [stats, setStats] = useState<any>(null);

    // Initial Stats Load (Fire and forget, doesn't block UI)
    useEffect(() => {
        getAuditStats().then(setStats);
    }, []);

    const fetchData = () => {
        startTransition(async () => {
            try {
                const result = await getAuditLogs(page, 20, {
                    searchTerm: search || undefined,
                    action: actionFilter !== 'ALL' ? (actionFilter as AuditLogAction) : undefined
                })
                // Merge separate stats into result if they exist, or keep existing stats
                setData(prev => ({ ...result, stats: stats || prev?.stats || result.stats }))
            } catch (error) {
                // If unauthorized error, show toast
                toast.error("Failed to load audit logs. You may not have permission.")
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
            setPage(1)
            fetchData()
        }, 500)
        return () => clearTimeout(timer)
    }, [search, actionFilter])

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
                        action: actionFilter !== 'ALL' ? (actionFilter as AuditLogAction) : undefined
                    })

                    // Simple CSV generation
                    const headers = ['Timestamp', 'Actor', 'Email', 'Role', 'Action', 'Details']
                    const csvContent = [
                        headers.join(','),
                        ...logs.map((log: any) => [
                            `"${new Date(log.timestamp).toISOString()}"`,
                            `"${log.user.name || ''}"`,
                            `"${log.user.email}"`,
                            `"${log.user.role}"`,
                            `"${log.action}"`,
                            `"${log.details.replace(/"/g, '""')}"`
                        ].join(','))
                    ].join('\n')

                    const blob = new Blob([csvContent], { type: 'text/csv' })
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`
                    a.click()

                    return 'Export complete'
                })(),
                {
                    loading: 'Preparing export...',
                    success: 'Audit log exported successfully',
                    error: 'Failed to export logs'
                }
            )
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">System Audit Trail</h1>
                    <p className="text-slate-600 mt-2">
                        Monitor system activity, security events, and critical data changes.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleExport}
                        className="bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100 font-semibold"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {data?.stats && <AuditStats stats={data.stats} />}

            <div className="flex flex-col gap-6">
                {/* Filters Bar */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex flex-1 gap-4 items-center">
                        <div className="relative max-w-sm w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search details, names..."
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Select value={actionFilter} onValueChange={setActionFilter}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="All Actions" />
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
                        {(search || actionFilter !== 'ALL') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setSearch(''); setActionFilter('ALL'); }}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                                <FilterX className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline ml-1">Clear Filters</span>
                            </Button>
                        )}
                    </div>
                    {isPending && <Loader2 className="h-5 w-5 animate-spin text-cyan-600" />}
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <AuditLogTable logs={data?.logs || []} />

                    {/* Pagination */}
                    {data && (
                        <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
                            <div className="text-sm text-slate-500">
                                Showing page {data.page} of {data.totalPages} ({data.total} records)
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={data.page === 1 || isPending}
                                    className="bg-white text-slate-700 border-slate-300 hover:bg-slate-50 font-medium"
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                                    disabled={data.page >= data.totalPages || isPending}
                                    className="bg-slate-900 text-white border-slate-900 hover:bg-slate-800 font-medium"
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
