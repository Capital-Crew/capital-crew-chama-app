/**
 * Legacy Event Handler
 * 
 * Maintains compatibility with existing event tables during
 * Event Sourcing migration.
 * 
 * Creates legacy events (LoanJourneyEvent, AuditLog) from domain events.
 * Can be removed once migration is complete.
 */

import { db } from '@/lib/db'
import type { DomainEvent } from '@/services/event-store-service'

export class LegacyEventHandler {
    /**
     * Create LoanJourneyEvent from domain event
     */
    static async handleLoanEvent(event: DomainEvent & { id: string; timestamp: Date }) {
        // Map domain event type to loan event type
        const eventTypeMap: Record<string, string> = {
            'LOAN_APPLIED': 'APPLICATION_SUBMITTED',
            'LOAN_APPROVED': 'LOAN_APPROVED',
            'LOAN_REJECTED': 'LOAN_REJECTED',
            'LOAN_DISBURSED': 'LOAN_DISBURSED',
            'REPAYMENT_MADE': 'REPAYMENT_MADE',
            'LOAN_CLEARED': 'LOAN_CLEARED',
            'PENALTY_APPLIED': 'PENALTY_APPLIED'
        }

        const loanEventType = eventTypeMap[event.eventType]
        if (!loanEventType) return

        // Create legacy event
        await db.loanJourneyEvent.create({
            data: {
                loanId: event.aggregateId,
                eventType: loanEventType as any,
                description: this.generateDescription(event),
                actorId: event.actorId,
                actorName: event.actorName,
                metadata: event.metadata
            }
        })
    }

    /**
     * Create AuditLog from domain event
     */
    static async handleAuditLog(event: DomainEvent & { id: string; timestamp: Date }) {
        // Only create audit logs for significant events
        const auditableEvents = [
            'LOAN_DISBURSED',
            'REPAYMENT_MADE',
            'LOAN_CLEARED',
            'MEMBER_REGISTERED',
            'WALLET_WITHDRAWAL_MADE'
        ]

        if (!auditableEvents.includes(event.eventType)) return

        await db.auditLog.create({
            data: {
                userId: event.actorId,
                action: event.eventType,
                details: this.generateDescription(event)
            }
        })
    }

    /**
     * Generate human-readable description from event
     */
    private static generateDescription(event: DomainEvent): string {
        switch (event.eventType) {
            case 'LOAN_DISBURSED':
                return `Loan disbursed: KES ${event.metadata.amount?.toLocaleString()}`
            case 'REPAYMENT_MADE':
                return `Repayment of KES ${event.metadata.amount?.toLocaleString()}`
            case 'LOAN_CLEARED':
                return `Loan cleared. Total repaid: KES ${event.metadata.totalRepaid?.toLocaleString()}`
            case 'WALLET_DEPOSIT_MADE':
                return `Wallet deposit: KES ${event.metadata.amount?.toLocaleString()}`
            case 'SHARE_CONTRIBUTION_MADE':
                return `Share contribution: KES ${event.metadata.amount?.toLocaleString()}`
            default:
                return `Event: ${event.eventType}`
        }
    }
}
