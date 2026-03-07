'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Clock, Play, RefreshCw } from 'lucide-react'
import { getEngineHealthStatus, triggerInterestEngine, triggerPenaltyEngine, getEngineExecutionHistory, initializeInterestDatesForExistingLoans, forceInterestRunForAllLoans } from '@/app/engine-health-actions'
import { formatDistanceToNow } from 'date-fns'

export function EngineHealthDashboard() {
    const [health, setHealth] = useState<any>(null)
    const [history, setHistory] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [triggering, setTriggering] = useState<string | null>(null)
    const [migrating, setMigrating] = useState(false)

    const loadData = async () => {
        try {
            const [healthData, historyData] = await Promise.all([
                getEngineHealthStatus(),
                getEngineExecutionHistory(5)
            ])
            setHealth(healthData)
            setHistory(historyData)
        } catch (error) {
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
        // Auto-refresh every 30 seconds
        const interval = setInterval(loadData, 30000)
        return () => clearInterval(interval)
    }, [])

    const handleTrigger = async (engine: 'interest' | 'penalty') => {
        setTriggering(engine)
        try {
            const result = engine === 'interest'
                ? await triggerInterestEngine()
                : await triggerPenaltyEngine()

            if (result.success) {
                alert(`${engine === 'interest' ? 'Interest' : 'Penalty'} Engine executed successfully!\n\nResults: ${JSON.stringify(result.results, null, 2)}`)
            } else {
                alert(`Engine execution failed: ${result.error}`)
            }
            await loadData()
        } catch (error: any) {
            alert(`Error: ${error.message}`)
        } finally {
            setTriggering(null)
        }
    }

    const handleInitializeLoans = async () => {
        if (!confirm('This will initialize interest dates for all existing active loans. Continue?')) {
            return
        }

        setMigrating(true)
        try {
            const result = await initializeInterestDatesForExistingLoans()

            if (result.success) {
                alert(`✅ Success!\n\n${result.message}\n\nYou can now run the Interest Engine to process these loans.`)
            } else {
                alert(`❌ Failed: ${result.error}`)
            }
        } catch (error: any) {
            alert(`Error: ${error.message}`)
        } finally {
            setMigrating(false)
        }
    }

    const handleForceRun = async () => {
        if (!confirm('This will force ALL active loans to be processed by the Interest Engine immediately. Continue?')) {
            return
        }

        try {
            // First, set all loans to run now
            const forceResult = await forceInterestRunForAllLoans()

            if (!forceResult.success) {
                alert(`❌ Failed to prepare loans: ${forceResult.error}`)
                return
            }

            alert(`✅ ${forceResult.message}\n\nNow triggering Interest Engine...`)

            // Then trigger the interest engine
            setTriggering('interest')
            const result = await triggerInterestEngine()

            if (result.success) {
                alert(`✅ Interest Engine executed successfully!\n\nResults: ${JSON.stringify(result.results, null, 2)}`)
            } else {
                alert(`❌ Engine execution failed: ${result.error}`)
            }
            await loadData()
        } catch (error: any) {
            alert(`Error: ${error.message}`)
        } finally {
            setTriggering(null)
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center p-8"><RefreshCw className="animate-spin" /></div>
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-center md:text-left">
                    <h2 className="text-2xl font-bold">Engine Health Dashboard</h2>
                    <p className="text-sm text-muted-foreground">Monitor and control critical financial engines</p>
                </div>
                <div className="flex w-full md:w-auto items-center justify-center gap-2">
                    <Button
                        onClick={handleInitializeLoans}
                        variant="outline"
                        size="sm"
                        disabled={migrating}
                        className="bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100"
                    >
                        {migrating ? (
                            <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Initializing...</>
                        ) : (
                            <>Initialize Loans</>
                        )}
                    </Button>
                    <Button
                        onClick={loadData}
                        variant="outline"
                        size="sm"
                        className="bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Interest Engine */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Interest Engine</CardTitle>
                            {health?.interestEngine?.status === 'operational' ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-yellow-500" />
                            )}
                        </div>
                        <CardDescription>Monthly interest accrual processor</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Last Run:</span>
                                <span className="font-medium">
                                    {health?.interestEngine?.lastRun
                                        ? formatDistanceToNow(new Date(health.interestEngine.lastRun), { addSuffix: true })
                                        : 'Never'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Active Loans:</span>
                                <Badge variant="secondary">{health?.activeLoansCount || 0}</Badge>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleForceRun}
                                disabled={triggering !== null}
                                variant="destructive"
                                className="flex-1"
                            >
                                {triggering === 'interest' ? (
                                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Running...</>
                                ) : (
                                    <>Force Run All</>
                                )}
                            </Button>
                            <Button
                                onClick={() => handleTrigger('interest')}
                                disabled={triggering !== null}
                                className="flex-1"
                            >
                                {triggering === 'interest' ? (
                                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Running...</>
                                ) : (
                                    <><Play className="h-4 w-4 mr-2" /> Run Now</>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Penalty Engine */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Penalty Engine</CardTitle>
                            {health?.penaltyEngine?.status === 'operational' ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-yellow-500" />
                            )}
                        </div>
                        <CardDescription>Daily overdue penalty processor</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Last Run:</span>
                                <span className="font-medium">
                                    {health?.penaltyEngine?.lastRun
                                        ? formatDistanceToNow(new Date(health.penaltyEngine.lastRun), { addSuffix: true })
                                        : 'Never'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Active Loans:</span>
                                <Badge variant="secondary">{health?.activeLoansCount || 0}</Badge>
                            </div>
                        </div>
                        <Button
                            onClick={() => handleTrigger('penalty')}
                            disabled={triggering !== null}
                            className="w-full"
                        >
                            {triggering === 'penalty' ? (
                                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Running...</>
                            ) : (
                                <><Play className="h-4 w-4 mr-2" /> Run Now</>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Execution History */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Recent Executions</CardTitle>
                    <CardDescription>Last 5 engine runs</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {history.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No execution history yet</p>
                        ) : (
                            history.map((log) => (
                                <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-lg transition-colors hover:bg-slate-50">
                                    <div className="flex items-start sm:items-center gap-3">
                                        <Clock className="h-4 w-4 text-muted-foreground mt-1 sm:mt-0 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium">
                                                {log.action === 'INTEREST_ENGINE_RUN' ? 'Interest Engine' : 'Penalty Engine'}
                                            </p>
                                            <p className="text-xs text-muted-foreground break-all sm:break-normal">{log.details}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground pl-7 sm:pl-0">
                                        {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
