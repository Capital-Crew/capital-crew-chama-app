import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { WalletPageClient } from '@/components/wallet/WalletPageClient'
import prisma from '@/lib/prisma'

export default async function WalletPage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id as string },
        include: {
            member: true
        }
    })

    if (!user?.member) {
        return (
            <div className="p-8">
                <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-6">
                    <h2 className="font-black text-yellow-900 text-lg">No Member Profile</h2>
                    <p className="text-yellow-700 mt-2">Your account is not linked to a member profile. Please contact an administrator.</p>
                </div>
            </div>
        )
    }

    const memberId = user.member.id
    const userRole = user.role

    return <WalletPageClient memberId={memberId} userRole={userRole} />
}
