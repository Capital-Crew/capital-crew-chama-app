import { auth } from '@/auth';
import { db } from '@/lib/db';
import { GroupInvestmentPortal } from '@/components/cln/GroupInvestmentPortal';
import { redirect, notFound } from 'next/navigation';

export default async function GroupInvestmentsPage({ params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user) redirect('/login');

    const group = await db.group.findUnique({
        where: { id: params.id },
        include: {
            wallet: true,
            riskConfig: true,
            committeeMembers: {
                where: { active: true }
            },
            investmentProposals: {
                include: {
                    loanNote: true,
                    votes: true
                },
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!group) notFound();

    return (
        <div className="container mx-auto py-10 px-6">
            <GroupInvestmentPortal 
                group={group as any} 
                userId={session.user.id!}
            />
        </div>
    );
}
