import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, AlertTriangle, Calendar, Database } from "lucide-react"

type StatsProps = {
    stats: {
        totalToday: number
        totalThisMonth: number
        criticalAlerts: number
    }
}

export function AuditStats({ stats }: StatsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Events Today</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalToday}</div>
                    <p className="text-xs text-muted-foreground">
                        Actions performed in the last 24h
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Activity</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalThisMonth}</div>
                    <p className="text-xs text-muted-foreground">
                        Total events this month
                    </p>
                </CardContent>
            </Card>

            <Card className={stats.criticalAlerts > 0 ? "border-amber-500 bg-amber-50" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
                    <AlertTriangle className={`h-4 w-4 ${stats.criticalAlerts > 0 ? "text-amber-600" : "text-muted-foreground"}`} />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${stats.criticalAlerts > 0 ? "text-amber-700" : ""}`}>
                        {stats.criticalAlerts}
                    </div>
                    <p className={`text-xs ${stats.criticalAlerts > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                        Reversals or critical system changes
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
