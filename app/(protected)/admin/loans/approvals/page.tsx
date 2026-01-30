'use server'

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getPendingLoans } from '@/app/actions/loan-actions'
import { LoanApprovalsClient } from './page.client'

export default async function LoanApprovalsPage() {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const pendingLoans = await getPendingLoans()
    const currentUser = {
        id: session.user.id || '',
        name: session.user.name || '',
        // @ts-ignore
        role: session.user.role || 'Member'
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Approval Queue</h1>
                    <p className="text-sm text-slate-500 font-medium">
                        {pendingLoans.length} application{pendingLoans.length !== 1 ? 's' : ''} waiting for your review
                    </p>
                </div>
            </div>

            <LoanApprovalsClient initialLoans={pendingLoans} currentUser={currentUser} />
        </div>
    )
}
