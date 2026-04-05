import EngineHealth from "@/components/admin/EngineHealth"
import { protectPage } from "@/lib/with-module-protection"
import { redirect } from "next/navigation"

export default async function EngineHealthPage() {
    if (!await protectPage('ADMIN')) return redirect('/dashboard')

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <EngineHealth />
        </div>
    )
}
