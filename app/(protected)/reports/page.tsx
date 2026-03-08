import { ReportsDashboard } from "@/components/reports/ReportsDashboard"
import { Metadata } from "next"

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { protectPage } from "@/lib/with-module-protection"

export const metadata: Metadata = {
    title: "Reports Hub | Capital Crew",
    description: "Lending, risk and financial reports",
}

export default async function ReportsPage() {
    const session = await auth()
    if (!session?.user) redirect('/login')
    if (!await protectPage('REPORTS_HUB')) return redirect('/dashboard')

    return (
        <main className="flex-1 overflow-y-auto">
            <ReportsDashboard />
        </main>
    )
}
