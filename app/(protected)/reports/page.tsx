import { ReportsDashboard } from "@/components/reports/ReportsDashboard"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Reports Hub | Capital Crew",
    description: "Lending, risk and financial reports",
}

export default function ReportsPage() {
    return (
        <main className="flex-1 overflow-y-auto">
            <ReportsDashboard />
        </main>
    )
}
