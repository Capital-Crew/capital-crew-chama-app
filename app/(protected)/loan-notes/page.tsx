import { auth } from '@/auth';
import { db } from '@/lib/db';
import { LoanNoteMarket } from '@/components/cln/LoanNoteMarket';
import { redirect } from 'next/navigation';

export default async function LoanNotesPage() {
    const session = await auth();
    if (!session?.user) redirect('/login');

    const notes = await db.loanNote.findMany({
        orderBy: { createdAt: 'desc' }
    });

    const userSubscriptions = await db.loanNoteSubscription.findMany({
        where: { subscriberId: session.user.id }
    });

    return (
        <div className="container mx-auto py-10 px-6">
            <LoanNoteMarket 
                notes={notes as any} 
                userSubscriptions={userSubscriptions as any}
                userId={session.user.id!}
            />
        </div>
    );
}
