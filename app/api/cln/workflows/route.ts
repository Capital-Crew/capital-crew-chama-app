import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { EntityType } from '@prisma/client';

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const noteId = searchParams.get('noteId');
        const scope = searchParams.get('scope') || 'listing'; // listing | all

        if (!noteId) {
            return NextResponse.json({ success: false, error: 'Note ID required' }, { status: 400 });
        }

        let whereClause: any = {};

        if (scope === 'listing') {
            // ONLY fetch the note's own creation/listing approval
            whereClause = { entityType: 'LOAN_NOTE' as any, entityId: noteId };
        } else {
            // Fetch everything (listing + payouts + settlements)
            const scheduleIds = (await db.loanNotePaymentSchedule.findMany({
                where: { loanNoteId: noteId },
                select: { id: true }
            })).map(s => s.id);

            whereClause = {
                OR: [
                    { entityType: 'LOAN_NOTE' as any, entityId: noteId },
                    { entityType: { in: ['LOAN_NOTE_PAYMENT' as any, 'LOAN_NOTE_SETTLEMENT' as any] }, entityId: { in: scheduleIds } }
                ]
            };
        }

        const workflows = await db.workflowRequest.findMany({
            where: whereClause,
            include: {
                currentStage: true,
                actions: {
                    include: {
                        actor: { 
                            select: { 
                                name: true,
                                role: true,
                                member: {
                                    select: { memberNumber: true }
                                }
                            } 
                        }
                    },
                    orderBy: { timestamp: 'desc' }
                }
            },
            orderBy: { createdAt: 'desc' },
            // If scope is all, we might want to limit to prevent huge payloads
            ...(scope === 'all' && { take: 50 }) 
        });

        const settings = await db.saccoSettings.findFirst({
            select: { clnFloaterSelfApproval: true }
        });

        return NextResponse.json({ 
            success: true, 
            workflows, 
            scope,
            settings: { 
                clnFloaterSelfApproval: settings?.clnFloaterSelfApproval ?? true 
            } 
        });
    } catch (error: any) {
        console.error('Workflows API error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
