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

        if (!noteId) {
            return NextResponse.json({ success: false, error: 'Note ID required' }, { status: 400 });
        }

        // 1. Fetch note's own workflow (Listing)
        // 2. Fetch workflows for any schedules related to this note
        const scheduleIds = (await db.loanNotePaymentSchedule.findMany({
            where: { loanNoteId: noteId },
            select: { id: true }
        })).map(s => s.id);

        const workflows = await db.workflowRequest.findMany({
            where: {
                OR: [
                    { entityType: 'LOAN_NOTE' as any, entityId: noteId },
                    { entityType: { in: ['LOAN_NOTE_PAYMENT' as any, 'LOAN_NOTE_SETTLEMENT' as any] }, entityId: { in: scheduleIds } }
                ]
            },
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
            orderBy: { createdAt: 'desc' }
        });

        const settings = await db.saccoSettings.findFirst({
            select: { clnFloaterSelfApproval: true }
        });

        return NextResponse.json({ 
            success: true, 
            workflows, 
            settings: { 
                clnFloaterSelfApproval: settings?.clnFloaterSelfApproval ?? true 
            } 
        });
    } catch (error: any) {
        console.error('Workflows API error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
