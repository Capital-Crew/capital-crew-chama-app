import { db } from '@/lib/db';
import { Decimal } from 'decimal.js';
import { CLNRepaymentService } from './CLNRepaymentService';
import { toNumber } from '@/lib/financialMath';

export interface DisbursementPreview {
    scheduleId: string;
    noteId: string;
    totalAmount: number;
    floaterBalance: number;
    isSufficient: boolean;
    shortfall: number;
    allocations: {
        subscriberId: string;
        subscriberName: string;
        sharePct: number;
        principal: number;
        interest: number;
        total: number;
        isResidualRecipient: boolean;
    }[];
}

export class CLNPostReturnsService {
    /**
     * Generate a preview of the disbursement for a specific payment event
     */
    static async getPreview(scheduleId: string): Promise<DisbursementPreview> {
        const schedule = await db.loanNotePaymentSchedule.findUnique({
            where: { id: scheduleId },
            include: {
                loanNote: {
                    include: {
                        subscriptions: {
                            where: { status: 'ACTIVE' },
                            include: {
                                user: {
                                    include: { 
                                        member: { 
                                            include: { 
                                                wallet: { 
                                                    include: { glAccount: true } 
                                                } 
                                            } 
                                        } 
                                    } 
                                }
                            }
                        },
                        floater: {
                            include: {
                                member: {
                                    include: {
                                        wallet: {
                                            include: { glAccount: true }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!schedule) throw new Error('Payment schedule event not found');
        const note = schedule.loanNote;

        // 1. Calculate Floater Balance
        const floaterWallet = note.floater.member?.wallet;
        const floaterBalance = Number(floaterWallet?.glAccount?.balance || 0);
        const groupAmount = Number(schedule.groupAmount);
        const isSufficient = floaterBalance >= groupAmount;
        const shortfall = isSufficient ? 0 : groupAmount - floaterBalance;

        // 2. Prepare Subscriber Data for Allocation
        const subscribers = note.subscriptions.map(s => ({
            id: s.id,
            sharePct: (Number(s.amount) / Number(note.totalAmount)) * 100,
            amount: Number(s.amount),
            subscribedAt: s.subscribedAt
        }));

        // 3. Run Largest Remainder Allocation
        const rawAllocations = CLNRepaymentService.allocateResiduals(groupAmount, subscribers);

        // 4. Map to Preview Format
        const allocations = rawAllocations.map(alloc => {
            const sub = note.subscriptions.find(s => s.id === alloc.subscriberId)!;
            
            // Calculate components based on the note-level breakdown (e.g. Principal vs Dividend)
            // Portion of principal in this payout
            const principalRatio = Number(schedule.principalComponent) / groupAmount;
            const interestRatio = Number(schedule.interestComponent) / groupAmount;

            return {
                subscriberId: sub.subscriberId, // The Actual User ID
                subscriberName: sub.user?.name || 'Unknown',
                sharePct: (Number(sub.amount) / Number(note.totalAmount)) * 100,
                principal: Number(new Decimal(alloc.amount).times(principalRatio).toFixed(2)),
                interest: Number(new Decimal(alloc.amount).times(interestRatio).toFixed(2)),
                total: alloc.amount,
                isResidualRecipient: alloc.isResidualRecipient
            };
        });

        return {
            scheduleId,
            noteId: note.id,
            totalAmount: groupAmount,
            floaterBalance,
            isSufficient,
            shortfall,
            allocations
        };
    }
}
