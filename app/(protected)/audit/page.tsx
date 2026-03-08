import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { protectPage } from '@/lib/with-module-protection'
import AuditPageClient from '@/components/audit/AuditPageClient'
import { AlertCircle } from 'lucide-react'

export default async function AuditPage() {
    const session = await auth()

    // Strict Access Control - Server Side Gatekeeper
    if (!session?.user || !['SYSTEM_ADMIN', 'SYSTEM_ADMINISTRATOR', 'CHAIRPERSON'].includes(session.user.role)) {
        redirect('/dashboard')
    }

    if (!await protectPage('AUDIT')) return redirect('/dashboard')

    return <AuditPageClient />
}
