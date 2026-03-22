import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { protectPage } from '@/lib/with-module-protection'
import { ExpensesModule } from '@/components/expenses/ExpensesModule'

export default async function ExpensesPage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    // Protect using the new EXPENSES module key
    if (!await protectPage('EXPENSES')) {
        return redirect('/dashboard')
    }

    return (
        <div className="min-h-screen bg-base-200 uppercase-inputs">
            <ExpensesModule />
        </div>
    )
}
