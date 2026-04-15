'use server'

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { withIdempotency } from '@/lib/idempotency';
import { CLNRepaymentService } from '@/lib/services/CLN/CLNRepaymentService';
import { CLNAccountingService } from '@/lib/services/CLN/CLNAccountingService';
import { RepaymentMode } from '@prisma/client';
import { LoanNotePaymentSchedule, Wallet } from '@/lib/types';
import { Decimal } from 'decimal.js';
import { revalidatePath } from 'next/cache';
import { handleWorkflowTransition } from './approval-workflow';
import { CLNPostReturnsService } from '@/lib/services/CLN/CLNPostReturnsService';
import { CLNSettlementService } from '@/lib/services/CLN/CLNSettlementService';

/**
 * Issue a new Loan Note
 */
export async function issueLoanNote(data: {
    title: string;
    requesterName: string;
    requesterRelationship?: string;
    purpose: string;
    totalAmount: number;
    minSubscription: number;
    maxSubscription?: number;
    interestRate: number;
    tenorValue: number;
    tenorUnit: string;
    repaymentMode: string;
    paymentIntervalMonths: number;
    subscriptionDeadline: Date;
    collateral?: string;
    repaymentSource?: string;
    additionalNotes?: string;
    supportDocUrl?: string;
    idempotencyKey: string;
}) {
    const session = await auth();
    if (!session?.user) return { success: false, message: 'Unauthorized' };

    return await withIdempotency({
        key: data.idempotencyKey,
        path: 'issueLoanNote',
        businessLogic: async () => {
            const referenceNo = `CLN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            const note = await db.loanNote.create({
                data: {
                    referenceNo,
                    title: data.title,
                    floaterId: session.user.id!,
                    requesterName: data.requesterName,
                    requesterRelationship: data.requesterRelationship,
                    purpose: data.purpose,
                    totalAmount: new Decimal(data.totalAmount),
                    minSubscription: new Decimal(data.minSubscription),
                    maxSubscription: data.maxSubscription ? new Decimal(data.maxSubscription) : null,
                    interestRate: new Decimal(data.interestRate),
                    tenorValue: data.tenorValue,
                    tenorUnit: data.tenorUnit,
                    repaymentMode: data.repaymentMode as any,
                    paymentIntervalMonths: data.paymentIntervalMonths,
                    subscriptionDeadline: data.subscriptionDeadline,
                    collateral: data.collateral,
                    repaymentSource: data.repaymentSource || "Repayment sourced from project revenue/income.",
                    additionalNotes: data.additionalNotes,
                    supportDocUrl: data.supportDocUrl,
                    status: 'DRAFT',
                    submissionVersion: 0,
                    cancellationCount: 0
                }
            });

            // AUTOMATIC SUBMISSION: Trigger the 'SEND' workflow action immediately
            const submission = await handleWorkflowTransition('LOAN_NOTE' as any, note.id, 'SEND');
            
            if (!submission.success) {
                console.warn(`Note ${note.id} created but automatic workflow submission failed:`, submission.error);
                // We keep the note as DRAFT if submission fails
            }

            revalidatePath('/loan-notes');
            return { success: true, data: note };
        }
    });
}

/**
 * Subscribe to a Loan Note
 * This action debits the user's wallet and credits the Escrow account in the ledger.
 */
export async function subscribeToLoanNote(params: {
    loanNoteId: string;
    amount: number;
    idempotencyKey: string;
}) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: 'Unauthorized' };

    return await withIdempotency({
        key: params.idempotencyKey,
        path: 'subscribeToLoanNote',
        businessLogic: async () => {
            const { loanNoteId, amount } = params;
            const userId = session.user.id!;

            // 1. Validate Note
            const note = await db.loanNote.findUnique({
                where: { id: loanNoteId },
                include: { subscriptions: true }
            });

            if (!note || note.status !== 'OPEN') {
                return { success: false, message: 'Note is not open for subscription' };
            }

            // 2. Business Logic Validation
            if (amount < Number(note.minSubscription)) {
                return { success: false, message: `Minimum subscription is ${note.minSubscription}` };
            }
            if (note.maxSubscription && amount > Number(note.maxSubscription)) {
                return { success: false, message: `Maximum subscription is ${note.maxSubscription}` };
            }

            const remainingNeeded = Number(note.totalAmount) - Number(note.subscribedAmount);
            if (amount > remainingNeeded) {
                return { success: false, message: `Only ${remainingNeeded} remaining available for subscription` };
            }

            // 2b. Sufficient Balance Check
            const wallet = await db.wallet.findFirst({
                where: { member: { user: { id: userId } } },
                include: { glAccount: true }
            });

            if (!wallet || !wallet.glAccount) {
                return { success: false, message: 'Your wallet/accounting mapping not found' };
            }

            const currentBalance = Number(wallet.glAccount.balance);
            if (currentBalance < amount) {
                return { success: false, message: `Insufficient funds. Your balance is ${currentBalance}` };
            }

            // 3. Atomic Transaction
            try {
                const result = await db.$transaction(async (tx) => {
                    // a. Create Subscription Record
                    const subscription = await tx.loanNoteSubscription.create({
                        data: {
                            loanNoteId,
                            subscriberId: userId,
                            subscriberType: 'USER',
                            amount: new Decimal(amount),
                            status: 'ACTIVE',
                            businessDate: new Date() // Treat today as business date
                        }
                    });

                    // b. Update Note Subscribed Amount
                    await tx.loanNote.update({
                        where: { id: loanNoteId },
                        data: {
                            subscribedAmount: { increment: new Decimal(amount) }
                        }
                    });

                    // c. Post to Ledger (Wallet -> Escrow)
                    await CLNAccountingService.postSubscription({
                        userId,
                        loanNoteId,
                        amount,
                        idempotencyKey: params.idempotencyKey,
                        tx
                    });

                    return subscription;
                });

                revalidatePath(`/loan-notes/${loanNoteId}`);
                return { success: true, data: result };
            } catch (error: any) {
                console.error('Subscription error:', error);
                return { success: false, message: error.message || 'Failed to process subscription' };
            }
        }
    });
}

/**
 * Admin action to approve a Loan Note for the market
 */
export async function approveLoanNote(noteId: string, comment?: string) {
    const session = await auth();
    if (session?.user?.role !== 'SYSTEM_ADMIN') return { success: false, message: 'Forbidden' };

    try {
        const note = await db.$transaction(async (tx) => {
            const updated = await tx.loanNote.update({
                where: { id: noteId },
                data: {
                    status: 'OPEN',
                    adminReviewComment: comment
                }
            });

            await tx.loanNoteAuditLog.create({
                data: {
                    loanNoteId: noteId,
                    action: 'APPROVED',
                    performedBy: session.user.name || 'System Admin',
                    notes: comment || 'Note approved for market listing',
                    businessDate: new Date()
                }
            });

            return updated;
        });

        revalidatePath('/loan-notes');
        revalidatePath(`/loan-notes/${noteId}`);
        return { success: true, data: note };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

/**
 * Admin action to reject a Loan Note
 */
export async function rejectLoanNote(noteId: string, comment: string) {
    const session = await auth();
    if (session?.user?.role !== 'SYSTEM_ADMIN') return { success: false, message: 'Forbidden' };

    const note = await db.loanNote.update({
        where: { id: noteId },
        data: {
            status: 'REJECTED',
            adminReviewComment: comment
        }
    });

    revalidatePath('/admin/loan-notes');
    return { success: true, data: note };
}

/**
 * Release escrow funds to the Floater
 */
export async function releaseEscrow(noteId: string, comment?: string) {
    const session = await auth();
    if (session?.user?.role !== 'SYSTEM_ADMIN') return { success: false, message: 'Forbidden' };

    const note = await db.loanNote.findUnique({
        where: { id: noteId },
        include: { subscriptions: true }
    });

    if (!note || note.status !== 'OPEN' || note.escrowReleased) {
        return { success: false, message: 'Invalid note state for escrow release' };
    }

    try {
        await db.$transaction(async (tx) => {
            // 1. Post to Ledger (Escrow -> Floater Wallet)
            await CLNAccountingService.postEscrowRelease({
                loanNoteId: noteId,
                floaterId: note.floaterId,
                amount: Number(note.subscribedAmount),
                idempotencyKey: `RELEASE-${noteId}-${Date.now()}`,
                tx
            });

            // 2. Update Note Status
            await tx.loanNote.update({
                where: { id: noteId },
                data: {
                    escrowReleased: true,
                    escrowReleasedAt: new Date(),
                    escrowReleasedBy: session.user.id,
                    escrowReleaseComment: comment,
                    status: 'ACTIVE' // Transitions to ACTIVE once funds are released
                }
            });

            // 3. Generate Official Payment Schedule
            const scheduleInput = {
                principal: Number(note.subscribedAmount),
                annualInterestRate: Number(note.interestRate),
                tenorMonths: note.tenorValue,
                paymentIntervalMonths: note.paymentIntervalMonths || 1,
                repaymentMode: note.repaymentMode as any,
                closureDate: new Date() // Start counting from today
            };

            const events = CLNRepaymentService.generateSchedule(scheduleInput);

            // 4. Batch Create Payment Schedule (Optimized)
            await tx.loanNotePaymentSchedule.createMany({
                data: events.map(event => ({
                    loanNoteId: noteId,
                    eventNumber: event.eventNumber,
                    paymentType: event.paymentType as any,
                    dueDate: event.dueDate,
                    periodLabel: event.periodLabel,
                    groupAmount: new Decimal(event.groupAmount),
                    principalComponent: new Decimal(event.principalComponent),
                    interestComponent: new Decimal(event.interestComponent),
                    openingBalance: new Decimal(event.openingBalance),
                    closingBalance: new Decimal(event.closingBalance),
                    isStubPeriod: event.isStubPeriod,
                    stubPeriodMonths: event.stubPeriodMonths,
                    status: 'UPCOMING'
                }))
            });

            // 5. Update Subscriptions as Fully Funded
            await tx.loanNoteSubscription.updateMany({
                where: { loanNoteId: noteId },
                data: { floaterCredited: true }
            });
        }, {
            maxWait: 5000,
            timeout: 20000
        });

        revalidatePath(`/loan-notes/${noteId}`);
        return { success: true, message: 'Escrow released and note activated' };
    } catch (error: any) {
        console.error('Escrow release error:', error);
        return { success: false, message: error.message || 'Failed to release escrow' };
    }
}

/**
 * Execute a scheduled payment event
 */
export async function executeScheduledPaymentBatch(scheduleId: string) {
    const session = await auth();
    if (session?.user?.role !== 'SYSTEM_ADMIN') return { success: false, message: 'Forbidden' };

    const schedule = await db.loanNotePaymentSchedule.findUnique({
        where: { id: scheduleId },
        include: {
            loanNote: {
                include: {
                    subscriptions: {
                        include: {
                            user: { include: { wallet: true } },
                            group: { include: { wallet: true } }
                        }
                    }
                }
            }
        }
    }) as (LoanNotePaymentSchedule & { loanNote: any }) | null;

    const allowedStatuses = ['UPCOMING', 'AWAITING_CONFIRMATION', 'SHORTFALL'];
    if (!schedule || !allowedStatuses.includes(schedule.status)) {
        return { success: false, message: `Invalid schedule event status: ${schedule.status}` };
    }

    const note = schedule.loanNote;
    const floaterWallet = (await db.wallet.findFirst({ 
        where: { userId: note.floaterId },
        include: { glAccount: true }
    })) as (Wallet & { glAccount: any });
    if (!floaterWallet) return { success: false, message: 'Floater wallet not found' };

    if (!floaterWallet.glAccount || (floaterWallet.glAccount.balance as any).lessThan(schedule.groupAmount)) {
        return { success: false, message: 'Insufficient funds in floater wallet' };
    }

    // 1. Prepare Payout Data
    const subscribers = note.subscriptions.map((s: any) => ({
        id: s.id,
        sharePct: Number(s.amount) / Number(note.totalAmount) * 100,
        amount: Number(s.amount),
        subscribedAt: s.subscribedAt,
        glAccountId: s.subscriberType === 'USER' ? s.user?.wallet?.glAccountId : s.group?.wallet?.glAccountId
    }));

    const allocations = CLNRepaymentService.allocateResiduals(Number(schedule.groupAmount), subscribers);

    try {
        await db.$transaction(async (tx) => {
            // 2. Ledger Posting
            await CLNAccountingService.postPayout({
                paymentScheduleId: scheduleId,
                floaterId: note.floaterId,
                totalAmount: Number(schedule.groupAmount),
                disbursements: allocations.map(a => ({
                    subscriberId: a.subscriberId, // This is actually subscriptionId in our mapping
                    amount: a.amount,
                    glAccountId: subscribers.find(s => s.id === a.subscriberId)!.glAccountId!
                })),
                idempotencyKey: `PAYOUT-${scheduleId}`,
                tx
            });

            // 3. Create Disbursement Records
            for (const alloc of allocations) {
                const sub = note.subscriptions.find((s: any) => s.id === alloc.subscriberId)!;
                await tx.loanNotePaymentDisbursement.create({
                    data: {
                        paymentScheduleId: scheduleId,
                        loanNoteId: note.id,
                        subscriptionId: sub.id,
                        subscriberType: sub.subscriberType,
                        subscriberId: sub.subscriberId,
                        groupId: sub.groupId,
                        paymentType: schedule.paymentType,
                        exactAmount: new Decimal(alloc.amount), 
                        amount: new Decimal(alloc.amount),
                        isResidualRecipient: alloc.isResidualRecipient,
                        residualAmount: new Decimal(alloc.residualAmount),
                        walletCredited: true,
                        creditedAt: new Date(),
                        businessDate: new Date(),
                        status: 'PAID'
                    }
                });
            }

            // 4. Update Schedule Status
            await tx.loanNotePaymentSchedule.update({
                where: { id: scheduleId },
                data: {
                    status: 'PAID',
                    executedAt: new Date()
                }
            });

            // 5. Check if Note is now Fully Settled
            const remainingUnpaid = await tx.loanNotePaymentSchedule.count({
                where: { 
                    loanNoteId: note.id,
                    status: { not: 'PAID' },
                    id: { not: scheduleId } // Exclude current one as it's being paid
                }
            });

            if (remainingUnpaid === 0) {
                await tx.loanNote.update({
                    where: { id: note.id },
                    data: { status: 'MATURED_AND_SETTLED' }
                });
            }
        });

        revalidatePath(`/loan-notes/${note.id}`);
        return { success: true, message: 'Payment executed successfully' };
    } catch (error: any) {
        console.error('Payout error:', error);
        return { success: false, message: error.message || 'Failed to execute payout' };
    }
}

/**
 * Get a preview of the disbursement for a payment event
 */
export async function getDisbursementPreview(scheduleId: string) {
    const session = await auth();
    if (!session?.user) return { success: false, message: 'Unauthorized' };

    try {
        const preview = await CLNPostReturnsService.getPreview(scheduleId);
        return { success: true, data: preview };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

/**
 * Submit a payment event for admin approval
 */
export async function submitReturnsForApproval(data: {
    scheduleId: string;
    idempotencyKey: string;
}) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: 'Unauthorized' };

    return await withIdempotency({
        key: data.idempotencyKey,
        path: 'submitReturnsForApproval',
        businessLogic: async () => {
            const { scheduleId } = data;
            const floaterId = session.user.id!;

            // 1. Fetch Schedule and Validate Ownership
            const schedule = await db.loanNotePaymentSchedule.findUnique({
                where: { id: scheduleId },
                include: { loanNote: true }
            });

            if (!schedule) return { success: false, message: 'Payment event not found' };
            if (schedule.loanNote.floaterId !== floaterId) {
                return { success: false, message: 'Only the Note Issuer can post returns' };
            }

            // 2. Validate State Transition
            if (schedule.status !== 'UPCOMING') {
                const message = schedule.status === 'PAID' 
                    ? 'This payment has already been settled.' 
                    : 'This payment is already pending admin approval.';
                return { success: false, message };
            }

            // 3. Final Sufficiency Check
            const preview = await CLNPostReturnsService.getPreview(scheduleId);
            
            try {
                const result = await db.$transaction(async (tx) => {
                    if (!preview.isSufficient) {
                        // Mark as SHORTFALL
                        await tx.loanNotePaymentSchedule.update({
                            where: { id: scheduleId },
                            data: { status: 'SHORTFALL' }
                        });
                        throw new Error(`Insufficient funds. Required: ${preview.totalAmount}, Available: ${preview.floaterBalance}`);
                    }

                    // Success Transition: UPCOMING -> AWAITING_COMMITTEE_APPROVAL
                    const updated = await tx.loanNotePaymentSchedule.update({
                        where: { id: scheduleId },
                        data: { 
                            status: 'AWAITING_COMMITTEE_APPROVAL' as any,
                        }
                    });

                    // INITIATE UNIVERSAL WORKFLOW
                    const { initiateWorkflow } = await import('@/app/actions/workflow-engine');
                    await initiateWorkflow('LOAN_NOTE_PAYMENT' as any, scheduleId, session.user.id!);

                    await tx.loanNoteAuditLog.create({
                        data: {
                            loanNoteId: schedule.loanNoteId,
                            action: 'PAYMENT_SUBMITTED',
                            performedBy: session.user.name || 'Floater',
                            notes: `Payment Event #${schedule.eventNumber} submitted for approval. Amount: ${schedule.groupAmount}`,
                            businessDate: new Date()
                        }
                    });

                    return updated;
                });

                revalidatePath(`/loan-notes/${schedule.loanNoteId}`);
                return { success: true, data: result };
            } catch (error: any) {
                console.error('Submit returns error:', error);
                return { success: false, message: error.message };
            }
        }
    });
}

/**
 * Get accurate preview for full early termination
 */
export async function getEarlySettlementPreview(noteId: string) {
    const session = await auth();
    if (!session?.user) return { success: false, message: 'Unauthorized' };

    try {
        const preview = await CLNSettlementService.getEarlySettlementPreview(noteId);
        return { success: true, data: preview };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

/**
 * Submit full early settlement for admin approval
 * This will create a 'FINAL' schedule and cancel the rest
 */
export async function submitEarlySettlementRequest(data: {
    noteId: string;
    idempotencyKey: string;
}) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: 'Unauthorized' };

    return await withIdempotency({
        key: data.idempotencyKey,
        path: 'submitEarlySettlementRequest',
        businessLogic: async () => {
            const { noteId } = data;
            const floaterId = session.user.id!;

            const note = await db.loanNote.findUnique({
                where: { id: noteId },
                include: { paymentSchedule: { where: { status: { in: ['UPCOMING', 'SHORTFALL'] } } } }
            });

            if (!note || note.floaterId !== floaterId) {
                return { success: false, message: 'Unauthorized note management' };
            }

            // 1. Calculate final total
            const preview = await CLNSettlementService.getEarlySettlementPreview(noteId);
            if (!preview.isSufficient) {
                return { success: false, message: `Insufficient funds. Required: ${preview.totalAmount}` };
            }

            try {
                await db.$transaction(async (tx) => {
                    // a. Mark ALL unpaid events as 'CANCELLED_FOR_SETTLEMENT' 
                    // (We don't have this enum yet, so we'll just delete or update to specialized status if available)
                    // Let's use PAID/EXEMPT or just stick to the first event
                    
                    const finalEvent = note.paymentSchedule.sort((a,b) => a.eventNumber - b.eventNumber)[0];

                    // b. Update the FIRST unpaid event to become the LUMP SUM event
                    await tx.loanNotePaymentSchedule.update({
                        where: { id: finalEvent.id },
                        data: {
                            groupAmount: new Decimal(preview.totalAmount),
                            principalComponent: new Decimal(preview.remainingPrincipal),
                            interestComponent: new Decimal(preview.interestToDate),
                            periodLabel: 'FINAL SETTLEMENT (LUMP SUM)',
                            status: 'AWAITING_COMMITTEE_APPROVAL' as any
                        }
                    });

                    // INITIATE UNIVERSAL WORKFLOW
                    const { initiateWorkflow } = await import('@/app/actions/workflow-engine');
                    await initiateWorkflow('LOAN_NOTE_SETTLEMENT' as any, finalEvent.id, session.user.id!);

                    // c. Cancel the rest of the schedule
                    const otherEventIds = note.paymentSchedule.filter(e => e.id !== finalEvent.id).map(e => e.id);
                    if (otherEventIds.length > 0) {
                        await tx.loanNotePaymentSchedule.deleteMany({
                            where: { id: { in: otherEventIds } }
                        });
                    }

                    // d. Audit the action
                    await tx.loanNoteAuditLog.create({
                        data: {
                            loanNoteId: noteId,
                            action: 'EARLY_SETTLEMENT_REQUESTED',
                            performedBy: session.user.name || 'Floater',
                            notes: `Early settlement initiated for ${preview.totalAmount}. Remaining ${otherEventIds.length} cycles collapsed.`,
                            businessDate: new Date()
                        }
                    });
                });

                revalidatePath(`/loan-notes/${noteId}`);
                return { success: true, message: 'Early settlement request submitted' };
            } catch (error: any) {
                console.error('Early settlement error:', error);
                return { success: false, message: error.message };
            }
        }
    });
}
