import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NoteDetailView } from '@/components/cln/NoteDetailView';
import { redirect, notFound } from 'next/navigation';

export default async function LoanNoteDetailPage(props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params;
    
    if (!id) return notFound();

    const session = await auth();
    if (!session?.user) redirect('/login');

    const note = await db.loanNote.findUnique({
        where: { id },
        include: {
            floater: true,
            subscriptions: {
                include: { user: true }
            },
            paymentSchedule: {
                orderBy: { eventNumber: 'asc' }
            },
            auditLogs: {
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!note) notFound();

    // Fetch user Context for Governance & Subscription
    const userWithMember = await db.user.findUnique({
        where: { id: session.user.id },
        include: { 
            member: { 
                include: { 
                    wallet: { 
                        include: { glAccount: true } 
                    } 
                } 
            } 
        }
    });

    return (
        <div className="container mx-auto py-10 px-6">
            <NoteDetailView 
                note={note as any} 
                userId={session.user.id!}
                userRole={session.user.role}
                userPermissions={userWithMember?.permissions}
                walletBalance={Number(userWithMember?.member?.wallet?.glAccount?.balance || 0)}
            />
        </div>
    );
}
