/**
 * Loan Projection Handler
 * 
 * Maintains the LoanSummaryProjection read model.
 * Updates in response to loan domain events.
 * 
 * This projection provides fast queries for loan status without
 * replaying all events.
 */

import { db } from '@/lib/db'
import type { DomainEvent } from '@/services/event-store-service'

export class LoanProjectionHandler {
    /**
     * Handle LOAN_DISBURSED event
     */
    static async handleLoanDisbursed(event: DomainEvent & { id: string; timestamp: Date }) {
        const { amount, netAmount } = event.metadata

        // Create or update projection
        await db.loanSummaryProjection.upsert({
            where: { loanId: event.aggregateId },
            create: {
                loanId: event.aggregateId,
                totalDisbursed: amount || netAmount,
                totalRepaid: 0,
                outstandingBalance: amount || netAmount,
                disbursementDate: event.timestamp,
                status: 'DISBURSED',
                lastEventId: event.id,
                lastUpdated: event.timestamp
            },
            update: {
                totalDisbursed: amount || netAmount,
                outstandingBalance: amount || netAmount,
                disbursementDate: event.timestamp,
                status: 'DISBURSED',
                lastEventId: event.id,
                lastUpdated: event.timestamp
            }
        })
    }

    /**
     * Handle REPAYMENT_MADE event
     */
    static async handleRepaymentMade(event: DomainEvent & { id: string; timestamp: Date }) {
        const { amount, newOutstanding, isFullyPaid } = event.metadata

        const projection = await db.loanSummaryProjection.findUnique({
            where: { loanId: event.aggregateId }
        })

        if (!projection) {
            // Create if missing (shouldn't happen but defensive)
            await db.loanSummaryProjection.create({
                data: {
                    loanId: event.aggregateId,
                    totalDisbursed: 0,
                    totalRepaid: amount,
                    outstandingBalance: newOutstanding,
                    lastPaymentDate: event.timestamp,
                    status: isFullyPaid ? 'CLEARED' : 'ACTIVE',
                    lastEventId: event.id,
                    lastUpdated: event.timestamp
                }
            })
        } else {
            // Update projection
            await db.loanSummaryProjection.update({
                where: { loanId: event.aggregateId },
                data: {
                    totalRepaid: projection.totalRepaid + amount,
                    outstandingBalance: newOutstanding,
                    lastPaymentDate: event.timestamp,
                    status: isFullyPaid ? 'CLEARED' : 'ACTIVE',
                    lastEventId: event.id,
                    lastUpdated: event.timestamp
                }
            })
        }
    }

    /**
     * Handle LOAN_CLEARED event
     */
    static async handleLoanCleared(event: DomainEvent & { id: string; timestamp: Date }) {
        await db.loanSummaryProjection.update({
            where: { loanId: event.aggregateId },
            data: {
                outstandingBalance: 0,
                status: 'CLEARED',
                lastEventId: event.id,
                lastUpdated: event.timestamp
            }
        })
    }

    /**
     * Rebuild projection from events
     * 
     * Useful for:
     * - Initial migration
     * - Fixing corrupted projections
     * - Adding new projection fields
     */
    static async rebuildProjection(loanId: string) {
        const { EventStoreService } = await import('@/services/event-store-service')

        // Get all events for this loan
        const events = await EventStoreService.getAggregateEvents('LOAN', loanId)

        // Delete existing projection
        await db.loanSummaryProjection.deleteMany({
            where: { loanId }
        })

        // Replay events
        for (const event of events) {
            switch (event.eventType) {
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

    /**
     * Rebuild all loan projections
     */
    static async rebuildAllProjections() {
        const { EventStoreService } = await import('@/services/event-store-service')

        // Clear all projections
        await db.loanSummaryProjection.deleteMany()

        // Get all loan events
        const events = await EventStoreService.queryEvents({
            aggregateType: 'LOAN'
        })

        // Replay events
        for (const event of events) {
            switch (event.eventType) {
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
