'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface SystemHealth {
    loansWithInstallments: number
    loansWithoutInstallments: number
    totalActiveLoans: number
    coveragePercentage: number
    lastChecked: Date
}

interface PerformanceMetrics {
    avgBalanceQueryTime: number
    avgDueQueryTime: number
    avgRepaymentTime: number
    errorRate: number
}

export function LoanSystemMonitoring() {
    const [health, setHealth] = useState<SystemHealth | null>(null)
    const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadSystemHealth()
        const interval = setInterval(loadSystemHealth, 60000) // Refresh every minute
        return () => clearInterval(interval)
    }, [])

    async function loadSystemHealth() {
        try {
            const response = await fetch('/api/admin/system-health')
            const result = await response.json()

            if (result.success) {
                setHealth({
                    ...result.data.health,
                    lastChecked: new Date(result.data.health.lastChecked) // Convert string to Date object
                })
                setMetrics(result.data.metrics)
            } else {
                console.error('Failed to load system health:', result.error)
            }

            setLoading(false)
        } catch (error) {
            console.error('Error loading system health:', error)
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="p-4">Loading system health...</div>
    }

    const coverageStatus = health && health.coveragePercentage >= 100 ? 'success' : 'warning'
    const performanceStatus = metrics && metrics.avgBalanceQueryTime < 500 ? 'success' : 'warning'

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Loan System Monitoring</h2>
                <Badge variant={coverageStatus === 'success' ? 'default' : 'destructive'}>
                    {coverageStatus === 'success' ? '✅ Healthy' : '⚠️ Needs Attention'}
                </Badge>
            </div>

            {/* System Health */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Active Loans</CardDescription>
                        <CardTitle className="text-3xl">{health?.totalActiveLoans || 0}</CardTitle>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>With Installments</CardDescription>
                        <CardTitle className="text-3xl text-green-600">
                            {health?.loansWithInstallments || 0}
                        </CardTitle>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Without Installments</CardDescription>
                        <CardTitle className="text-3xl text-orange-600">
                            {health?.loansWithoutInstallments || 0}
                        </CardTitle>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Coverage</CardDescription>
                        <CardTitle className="text-3xl">
                            {health?.coveragePercentage || 0}%
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Performance Metrics */}
            <Card>
                <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription>Average API response times (ms)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Balance Query</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm">{metrics?.avgBalanceQueryTime}ms</span>
                                <Badge variant={metrics && metrics.avgBalanceQueryTime < 200 ? 'default' : 'secondary'}>
                                    {metrics && metrics.avgBalanceQueryTime < 200 ? 'Fast' : 'OK'}
                                </Badge>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Due Query</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm">{metrics?.avgDueQueryTime}ms</span>
                                <Badge variant={metrics && metrics.avgDueQueryTime < 200 ? 'default' : 'secondary'}>
                                    {metrics && metrics.avgDueQueryTime < 200 ? 'Fast' : 'OK'}
                                </Badge>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Repayment Processing</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm">{metrics?.avgRepaymentTime}ms</span>
                                <Badge variant={metrics && metrics.avgRepaymentTime < 500 ? 'default' : 'secondary'}>
                                    {metrics && metrics.avgRepaymentTime < 500 ? 'Fast' : 'OK'}
                                </Badge>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Error Rate</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm">{metrics?.errorRate}%</span>
                                <Badge variant={metrics && metrics.errorRate < 1 ? 'default' : 'destructive'}>
                                    {metrics && metrics.errorRate < 1 ? 'Good' : 'High'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Alerts */}
            {health && health.loansWithoutInstallments > 0 && (
                <Alert variant="destructive">
                    <AlertDescription>
                        ⚠️ {health.loansWithoutInstallments} loan(s) are missing installments.
                        Run the migration script: <code className="ml-2 px-2 py-1 bg-black/10 rounded">npx tsx scripts/migrate-loan-installments.ts</code>
                    </AlertDescription>
                </Alert>
            )}

            {metrics && metrics.errorRate > 5 && (
                <Alert variant="destructive">
                    <AlertDescription>
                        ⚠️ High error rate detected ({metrics.errorRate}%). Check server logs for details.
                    </AlertDescription>
                </Alert>
            )}

            {/* Last Updated */}
            <p className="text-sm text-muted-foreground text-center">
                Last updated: {health?.lastChecked.toLocaleTimeString()}
            </p>
        </div>
    )
}
