import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { protectPage } from '@/lib/with-module-protection'
import { AccountsModule } from '@/components/AccountsModule'

import { db as prisma } from "@/lib/db"

export default async function AccountsPage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    if (!await protectPage('ACCOUNTS')) return redirect('/dashboard')

    const members = await prisma.member.findMany({
        select: {
            id: true,
            name: true,
            memberNumber: true
        },
        orderBy: { memberNumber: 'asc' }
    })

    return (
        <div className="min-h-screen bg-slate-50">
            <AccountsModule members={members} />
        </div>
    )
}
