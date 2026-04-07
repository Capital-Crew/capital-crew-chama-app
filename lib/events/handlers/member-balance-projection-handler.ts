/**
 * Member Balance Projection Handler
 * 
 * Maintains the MemberBalanceProjection read model.
 * Provides fast queries for member financial summary.
 */

import { db } from '@/lib/db'
import type { DomainEvent } from '@/services/event-store-service'

export class MemberBalanceProjectionHandler {
    /**
     * Handle WALLET_DEPOSIT_MADE event
     */
    static async handleWalletDeposit(event: DomainEvent & { id: string; timestamp: Date }) {
        const { memberId, amount } = event.metadata

        const projection = await db.memberBalanceProjection.findUnique({
            where: { memberId }
        })

        if (!projection) {
            await db.memberBalanceProjection.create({
                data: {
                    memberId,
                    walletBalance: amount,
                    contributionBalance: 0,
                    totalLoansActive: 0,
                    totalLoansDisbursed: 0,
                    totalLoansOutstanding: 0,
                    lastEventId: event.id,
                    lastUpdated: event.timestamp
                }
            })
        } else {
            await db.memberBalanceProjection.update({
                where: { memberId },
                data: {
                    walletBalance: projection.walletBalance + amount,
                    lastEventId: event.id,
                    lastUpdated: event.timestamp
                }
            })
        }
    }

    /**
     * Handle WALLET_WITHDRAWAL_MADE event
     */
    static async handleWalletWithdrawal(event: DomainEvent & { id: string; timestamp: Date }) {
        const { memberId, amount } = event.metadata

        await db.memberBalanceProjection.update({
            where: { memberId },
            data: {
                walletBalance: { decrement: amount },
                lastEventId: event.id,
                lastUpdated: event.timestamp
            }
        })
    }

    /**
     * Handle CONTRIBUTION_MADE event
     */
    static async handleMemberContribution(event: DomainEvent & { id: string; timestamp: Date }) {
        const { memberId, amount } = event.metadata

        const projection = await db.memberBalanceProjection.findUnique({
            where: { memberId }
        })

        if (!projection) {
            await db.memberBalanceProjection.create({
                data: {
                    memberId,
                    walletBalance: 0,
                    contributionBalance: amount,
                    totalLoansActive: 0,
                    totalLoansDisbursed: 0,
                    totalLoansOutstanding: 0,
                    lastEventId: event.id,
                    lastUpdated: event.timestamp
                }
            })
        } else {
            await db.memberBalanceProjection.update({
                where: { memberId },
                data: {
                    contributionBalance: projection.contributionBalance + amount,
                    lastEventId: event.id,
                    lastUpdated: event.timestamp
                }
            })
        }
    }

    /**
     * Handle LOAN_DISBURSED event
     */
    static async handleLoanDisbursed(event: DomainEvent & { id: string; timestamp: Date }) {
        const { amount } = event.metadata

        // Get loan to find member
        const loan = await db.loan.findUnique({
            where: { id: event.aggregateId },
            select: { memberId: true }
        })

        if (!loan) return

        const projection = await db.memberBalanceProjection.findUnique({
            where: { memberId: loan.memberId }
        })

        if (!projection) {
            await db.memberBalanceProjection.create({
                data: {
                    memberId: loan.memberId,
                    walletBalance: 0,
                    contributionBalance: 0,
                    totalLoansActive: 1,
                    totalLoansDisbursed: amount,
                    totalLoansOutstanding: amount,
                    lastEventId: event.id,
                    lastUpdated: event.timestamp
                }
            })
        } else {
            await db.memberBalanceProjection.update({
                where: { memberId: loan.memberId },
                data: {
                    totalLoansActive: projection.totalLoansActive + 1,
                    totalLoansDisbursed: projection.totalLoansDisbursed + amount,
                    totalLoansOutstanding: projection.totalLoansOutstanding + amount,
                    lastEventId: event.id,
                    lastUpdated: event.timestamp
                }
            })
        }
    }

    /**
     * Handle REPAYMENT_MADE event
     */
    static async handleRepaymentMade(event: DomainEvent & { id: string; timestamp: Date }) {
        const { amount, newOutstanding } = event.metadata

        // Get loan to find member
        const loan = await db.loan.findUnique({
            where: { id: event.aggregateId },
            select: { memberId: true }
        })

        if (!loan) return

        await db.memberBalanceProjection.update({
            where: { memberId: loan.memberId },
            data: {
                totalLoansOutstanding: { decrement: amount },
                lastEventId: event.id,
                lastUpdated: event.timestamp
            }
        })
    }

    /**
     * Handle LOAN_CLEARED event
     */
    static async handleLoanCleared(event: DomainEvent & { id: string; timestamp: Date }) {
        // Get loan to find member
        const loan = await db.loan.findUnique({
            where: { id: event.aggregateId },
            select: { memberId: true }
        })

        if (!loan) return

        await db.memberBalanceProjection.update({
            where: { memberId: loan.memberId },
            data: {
                totalLoansActive: { decrement: 1 },
                lastEventId: event.id,
                lastUpdated: event.timestamp
            }
        })
    }

    /**
     * Rebuild all member projections
     */
    static async rebuildAllProjections() {
        const { EventStoreService } = await import('@/services/event-store-service')

        // Clear all projections
        await db.memberBalanceProjection.deleteMany()

        // Get all events
        const events = await EventStoreService.getEventStream()

        // Replay events
        for (const event of events) {
            switch (event.eventType) {
                case 'WALLET_DEPOSIT_MADE':
                    await this.handleWalletDeposit(event as any)
                    break
                case 'WALLET_WITHDRAWAL_MADE':
                    await this.handleWalletWithdrawal(event as any)
                    break
                case 'CONTRIBUTION_MADE':
                    await this.handleMemberContribution(event as any)
                    break
                case 'LOAN_DISBURSED':
                    await this.handleLoanDisbursed(event as any)
                    break
                case 'REPAYMENT_MADE':
                    await this.handleRepaymentMade(event as any)
                    break
                case 'LOAN_CLEARED':
                    await this.handleLoanCleared(event as any)
                    break
            }
        }
    }
}
