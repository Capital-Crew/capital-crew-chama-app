'use server'

import { getInterestRuns } from "@/app/actions/interest-actions"
import { EngineHealthClient } from "./engine-health-client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Activity, History, ShieldAlert } from "lucide-react"

export default async function EngineHealth() {
    const runs = await getInterestRuns()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Engine Health</h2>
                    <p className="text-muted-foreground">Monitor and manage automated interest accrual runs.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{runs.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                        <History className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {runs.length > 0 
                                ? Math.round((runs.filter((r: any) => r.status === 'SUCCESS').length / runs.length) * 100) 
                                : 100}%
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Guard</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-green-600 font-semibold italic">Reversal Capability Active</div>
                    </CardContent>
                </Card>
            </div>

            <EngineHealthClient initialRuns={runs} />
        </div>
    )
}
