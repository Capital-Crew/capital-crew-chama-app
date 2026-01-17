import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { MigrationModule } from '@/components/MigrationModule'

export default async function MigrationPage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    // Check if user has admin rights
    if (!['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN'].includes(session.user.role || '')) {
        redirect('/dashboard')
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <MigrationModule />
        </div>
    )
}
