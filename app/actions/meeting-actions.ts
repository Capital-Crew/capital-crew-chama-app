'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { AccountingEngine } from '@/lib/accounting/AccountingEngine'
import { getSaccoSettings } from '../sacco-settings-actions'
import { Prisma } from '@prisma/client'
import { getSystemMappingsDict } from './system-accounting'

export async function submitApology(input: {
    meetingId: string;
    reason: string;
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

        const meeting = await db.meeting.findUnique({ where: { id: input.meetingId } });
        if (!meeting) return { success: false, error: 'Meeting not found' };

        // Rule: Before 3 days to the meeting date
        const meetingDate = new Date(meeting.date);
        const deadline = new Date(meetingDate);
        deadline.setDate(deadline.getDate() - 3);

        if (new Date() > deadline) {
            return { success: false, error: 'Apologies must be submitted at least 3 days before the meeting date.' };
        }

        await db.apology.upsert({
            where: {
                meetingId_userId: {
                    meetingId: input.meetingId,
                    userId: session.user.id
                }
            },
            create: {
                meetingId: input.meetingId,
                userId: session.user.id,
                reason: input.reason,
                status: 'PENDING'
            },
            update: {
                reason: input.reason,
                status: 'PENDING'
            }
        });

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to submit apology' };
    }
}

export async function resolveApology(input: {
    apologyId: string;
    status: 'APPROVED' | 'REJECTED';
}) {
    try {
        const session = await auth();
        if (!session?.user?.id || (session.user.role !== 'SYSTEM_ADMIN' && session.user.role !== 'SECRETARY' && session.user.role !== 'CHAIRPERSON')) {
            return { success: false, error: 'Unauthorized' };
        }

        await db.apology.update({
            where: { id: input.apologyId },
            data: { status: input.status }
        });

        revalidatePath('/admin/meetings');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to resolve apology' };
    }
}

export async function processMeetingAttendance(input: {
    meetingId: string;
    attendance: {
        userId: string;
        status: 'PRESENT' | 'ABSENT' | 'LATE';
        minutesLate?: number;
    }[];
}) {
    try {
        const session = await auth();
        const allowedRoles = ['SYSTEM_ADMIN', 'SECRETARY', 'CHAIRPERSON', 'TREASURER'];
        if (!session?.user?.id || !allowedRoles.includes(session.user.role as string)) {
            return { success: false, error: 'Unauthorized' };
        }

        // 1. Get Settings & Meeting
        const settings = await getSaccoSettings();
        const meeting = await db.meeting.findUnique({
            where: { id: input.meetingId },
            include: { apologies: true }
        });

        if (!meeting) throw new Error('Meeting not found');
        if (meeting.status !== 'COMPLETED') throw new Error('Meeting must be status COMPLETED to process attendance');
        if (new Date(meeting.date) > new Date()) throw new Error('Cannot process attendance for future meetings');
        if (meeting.isPenaltiesProcessed) throw new Error('Attendance already processed for this meeting');

        // Check for PENDING apologies
        const pendingApologies = meeting.apologies.filter(a => a.status === 'PENDING');
        if (pendingApologies.length > 0) {
            throw new Error(`There are ${pendingApologies.length} pending apologies. Please approve or reject them before processing attendance.`);
        }

        // 2. Atomic Transaction
        return await db.$transaction(async (tx) => {
            for (const attendee of input.attendance) {
                // A. Check Apology
                const apology = meeting.apologies.find(a => a.userId === attendee.userId);
                let finalStatus: any = attendee.status;

                if (attendee.status === 'ABSENT' && apology) {
                    finalStatus = apology.status === 'APPROVED' ? 'APOLOGY_APPROVED' : 'ABSENT';
                }

                // B. Create Attendance Record (MeetingAttendee)
                // Resolve Member ID
                const user = await tx.user.findUnique({ where: { id: attendee.userId }, include: { member: true } });
                if (!user?.member) throw new Error(`User ${attendee.userId} has no member profile`);

                await tx.meetingAttendee.create({
                    data: {
                        meetingId: meeting.id,
                        memberId: user.member.id,
                        status: finalStatus,
                        minutesLate: attendee.minutesLate || 0,
                        isFinalized: true
                    }
                });

                // C. Calculate Penalty
                let penaltyAmount = 0;
                let penaltyReason = `${finalStatus} PENALTY: ${meeting.title}`;

                if (finalStatus === 'ABSENT') {
                    penaltyAmount = settings.penaltyAbsentAmount;
                    if (apology?.status === 'REJECTED') {
                        penaltyReason = `ABSENT (REJECTED APOLOGY): ${meeting.title}`;
                    }
                } else if (finalStatus === 'LATE') {
                    penaltyAmount = settings.penaltyLateAmount;
                }

                if (penaltyAmount > 0) {
                    // D. Create AttendanceFine (Idempotent via unique constraint)
                    const fine = await tx.attendanceFine.create({
                        data: {
                            userId: attendee.userId,
                            meetingId: meeting.id,
                            amount: new Prisma.Decimal(penaltyAmount),
                            reason: `${finalStatus} PENALTY: ${meeting.title}`,
                            status: 'PENDING',
                        }
                    });

                    // E. Post Ledger Entry (Accrual)
                    if (settings.meetingReceivableGlId && settings.meetingFeesGlId) {
                        await AccountingEngine.postJournalEntry({
                            transactionDate: new Date(),
                            referenceType: 'PENALTY',
                            referenceId: fine.id,
                            description: `Accrued Meeting Penalty - ${fine.reason}`,
                            createdBy: session.user.id!,
                            createdByName: session.user.name || 'Admin',
                            lines: [
                                {
                                    accountId: settings.meetingReceivableGlId,
                                    debitAmount: penaltyAmount,
                                    creditAmount: 0,
                                    description: `Penalty Receivable Recognition`
                                },
                                {
                                    accountId: settings.meetingFeesGlId,
                                    debitAmount: 0,
                                    creditAmount: penaltyAmount,
                                    description: `Penalty Income Recognition`
                                }
                            ]
                        }, tx);
                    }
                }
            }

            // F. Mark Meeting as Processed
            await tx.meeting.update({
                where: { id: meeting.id },
                data: { isPenaltiesProcessed: true, processedAt: new Date() }
            });

            // G. Audit Log
            await tx.auditLog.create({
                data: {
                    userId: session.user.id!,
                    action: 'MEETING_ATTENDANCE_PROCESSED',
                    details: `Processed attendance for ${meeting.title}`
                }
            });

            return { success: true };
        });

    } catch (error: any) {
        console.error('Attendance Processing Error:', error);
        return { success: false, error: error.message || 'Failed to process attendance' };
    } finally {
        revalidatePath('/dashboard');
        revalidatePath('/admin/meetings');
    }
}

// Temporary alias for backward compatibility during build/cache recovery
export const submitMeetingReport = processMeetingAttendance;

export async function payPenalty(penaltyId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const settings = await getSaccoSettings();

        return await db.$transaction(async (tx) => {
            // 1. Fetch Penalty Fine
            const penalty = await tx.attendanceFine.findUnique({
                where: { id: penaltyId },
                include: {
                    meeting: true,
                    user: { include: { member: true } }
                }
            });

            if (!penalty) throw new Error('Penalty record not found');
            if (penalty.status === 'PAID') throw new Error('Penalty already paid');

            const member = penalty.user.member;
            if (!member) throw new Error('Member profile not found for this user');

            // 2. Fetch Member Wallet
            const wallet = await tx.wallet.findUnique({
                where: { memberId: member.id },
                include: { glAccount: true }
            });

            if (!wallet || !wallet.glAccount) {
                throw new Error('Member wallet not found');
            }

            const penaltyAmount = Number(penalty.amount);
            if (wallet.glAccount.balance.lt(penaltyAmount)) {
                throw new Error(`Insufficient wallet balance (Current: KES ${wallet.glAccount.balance.toLocaleString()})`);
            }

            // 3. Post Journal Entry (Settlement)
            const mappings = await getSystemMappingsDict();
            const meetingFinesCode = mappings.EVENT_MEETING_FINES;

            const creditAccountId = settings.meetingReceivableGlId;
            const creditAccountCode = creditAccountId ? undefined : meetingFinesCode;

            if (!creditAccountId && !creditAccountCode) {
                throw new Error("No credit account configured for meeting penalties. Please set 'Receivable Ledger for Fees' in SACCO Settings.");
            }

            await AccountingEngine.postJournalEntry({
                transactionDate: new Date(),
                referenceType: 'PENALTY',
                referenceId: penalty.id,
                description: `Penalty Payment Settlement - ${penalty.reason}`,
                createdBy: session.user.id!,
                createdByName: session.user.name || 'Member',
                lines: [
                    {
                        accountId: wallet.glAccountId,
                        debitAmount: penaltyAmount,
                        creditAmount: 0,
                        description: `Penalty Payment Deduction from Wallet`
                    },
                    {
                        accountId: creditAccountId || undefined,
                        accountCode: creditAccountCode,
                        debitAmount: 0,
                        creditAmount: penaltyAmount,
                        description: `Clearing Penalty Receivable`
                    }
                ]
            }, tx);

            // 4. Record Wallet Transaction
            const balanceAfter = wallet.glAccount.balance.minus(penaltyAmount);
            await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'PENALTY',
                    amount: penalty.amount,
                    description: `Penalty payment for ${penalty.meeting?.title || 'Meeting'}`,
                    balanceAfter: balanceAfter,
                    immutable: true
                }
            });

            // 5. Update Fine Status
            await tx.attendanceFine.update({
                where: { id: penaltyId },
                data: { status: 'PAID' }
            });

            return { success: true };
        });
    } catch (error: any) {
        console.error('Pay Penalty Error:', error);
        return { success: false, error: error.message || 'Failed to pay penalty' };
    } finally {
        revalidatePath('/dashboard');
        revalidatePath('/wallet');
    }
}
