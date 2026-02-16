'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { AccountingEngine } from '@/lib/accounting/AccountingEngine'
import { getSaccoSettings } from './sacco-settings-actions'
import { Prisma } from '@prisma/client'

export async function submitMeetingReport(input: {
    title: string;
    date: string;
    minutesUrl: string;
    attendance: {
        memberId: string;
        status: 'PRESENT' | 'ABSENT' | 'LATE' | 'APOLOGY';
        minutesLate?: number;
    }[];
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        // 1. Get Settings for penalties and GL account
        const settings = await getSaccoSettings();
        if (!settings.meetingFeesGlId) {
            return { success: false, error: 'Meeting Fees GL Account not configured in Sacco Settings' };
        }

        // 2. Atomic Transaction
        return await db.$transaction(async (tx) => {
            // A. Create Meeting Record
            const meeting = await tx.meeting.create({
                data: {
                    title: input.title,
                    date: new Date(input.date),
                    minutesUrl: input.minutesUrl,
                    createdBy: session.user.id
                }
            });

            // B. Process Attendance & Penalties
            for (const attendee of input.attendance) {
                // Create Attendance record
                await tx.attendance.create({
                    data: {
                        meetingId: meeting.id,
                        memberId: attendee.memberId,
                        status: attendee.status,
                        minutesLate: attendee.minutesLate || 0
                    }
                });

                // Calculate Penalty
                let penaltyAmount = 0;
                let penaltyType: 'ABSENT' | 'LATE' | null = null;

                if (attendee.status === 'ABSENT') {
                    penaltyAmount = settings.penaltyAbsentAmount;
                    penaltyType = 'ABSENT';
                } else if (attendee.status === 'LATE') {
                    penaltyAmount = settings.penaltyLateAmount;
                    penaltyType = 'LATE';
                }

                if (penaltyAmount > 0) {
                    // Always create UNPAID Bill - as per user request (Manual Payment only)
                    await tx.penaltyBill.create({
                        data: {
                            memberId: attendee.memberId,
                            meetingId: meeting.id,
                            amount: new Prisma.Decimal(penaltyAmount),
                            type: penaltyType!,
                            status: 'UNPAID',
                            description: `Pending penalty for ${penaltyType!.toLowerCase()} at ${input.title}`
                        }
                    });
                }
            }

            // Create Audit Log
            await tx.auditLog.create({
                data: {
                    userId: session.user.id!,
                    action: 'MEETING_REPORT_SUBMITTED',
                    details: `Submitted report for ${input.title} on ${input.date}`
                }
            });

            return { success: true };
        });

    } catch (error: any) {
        console.error('Meeting Report Error:', error);
        return { success: false, error: error.message || 'Failed to submit report' };
    } finally {
        revalidatePath('/dashboard');
        revalidatePath('/wallet');
        revalidatePath('/admin/system');
    }
}

export async function payPenalty(penaltyId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        const settings = await getSaccoSettings();
        if (!settings.meetingFeesGlId) {
            return { success: false, error: 'Meeting Fees GL Account not configured' };
        }

        return await db.$transaction(async (tx) => {
            // 1. Fetch Penalty Bill
            const penalty = await tx.penaltyBill.findUnique({
                where: { id: penaltyId },
                include: { meeting: true }
            });

            if (!penalty) throw new Error('Penalty record not found');
            if (penalty.status === 'PAID') throw new Error('Penalty already paid');

            // 2. Fetch Member Wallet
            const wallet = await tx.wallet.findUnique({
                where: { memberId: penalty.memberId },
                include: { glAccount: true }
            });

            if (!wallet || !wallet.glAccount) {
                throw new Error('Member wallet not found');
            }

            const penaltyAmount = Number(penalty.amount);
            if (wallet.glAccount.balance.lt(penaltyAmount)) {
                throw new Error(`Insufficient wallet balance (Current: KES ${wallet.glAccount.balance.toLocaleString()})`);
            }

            // 3. Post Journal Entry
            await AccountingEngine.postJournalEntry({
                transactionDate: new Date(),
                referenceType: 'PENALTY',
                referenceId: penalty.meetingId,
                description: `Manual Penalty Payment (${penalty.type}) - ${penalty.meeting.title}`,
                createdBy: session.user.id!,
                createdByName: session.user.name || 'Member',
                lines: [
                    {
                        accountId: wallet.glAccountId,
                        debitAmount: penaltyAmount,
                        creditAmount: 0,
                        description: `Penalty Payment Deduction`
                    },
                    {
                        accountId: settings.meetingFeesGlId,
                        debitAmount: 0,
                        creditAmount: penaltyAmount,
                        description: `Penalty Payment Revenue`
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
                    description: `Penalty payment for ${penalty.meeting.title}`,
                    balanceAfter: balanceAfter,
                    immutable: true
                }
            });

            // 5. Update Penalty Bill Status
            await tx.penaltyBill.update({
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
