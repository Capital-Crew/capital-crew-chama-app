import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import AuditPageClient from '@/components/audit/AuditPageClient'
import { AlertCircle } from 'lucide-react'

export default async function AuditPage() {
    const session = await auth()

    // Strict Access Control - Server Side Gatekeeper
    if (!session?.user || !['SYSTEM_ADMIN', 'CHAIRPERSON'].includes(session.user.role)) {
        return (
            <div className="flex h-[80vh] w-full items-center justify-center p-8">
                <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                    <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-red-900 mb-2">Access Restricted</h2>
                    <p className="text-red-700">
                        The Audit Trail is restricted to System Administrators only.
                    </p>
                </div>
            </div>
        )
    }

    return <AuditPageClient />
}
