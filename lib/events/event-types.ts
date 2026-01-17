/**
 * Domain Events Type Definitions
 * 
 * Centralized definitions for all domain events.
 * TypeScript interfaces for event metadata.
 */

import type { AggregateType, DomainEventType } from '@prisma/client'

// ========================================
// EVENT METADATA TYPES
// ========================================

// Loan Events
export interface LoanAppliedMetadata {
    loanId: string
    memberId: string
    amount: number
    productId: string
}

export interface LoanDisbursedMetadata {
    loanId: string
    amount: number
    netAmount: number
    processingFee?: number
    insuranceFee?: number
    journalEntryId: string
}

export interface RepaymentMadeMetadata {
    loanId: string
    amount: number
    allocation: {
        penalty: number
        interest: number
        principal: number
    }
    newOutstanding: number
    isFullyPaid: boolean
    journalEntryId: string
}

export interface LoanClearedMetadata {
    loanId: string
    totalDisbursed: number
    totalRepaid: number
    clearanceDate: Date
}

// Wallet Events
export interface WalletDepositMetadata {
    walletId: string
    memberId: string
    amount: number
    type: string
    journalEntryId?: string
}

export interface WalletWithdrawalMetadata {
    walletId: string
    memberId: string
    amount: number
    journalEntryId?: string
}

// Share Events
export interface ShareContributionMetadata {
    memberId: string
    amount: number
    journalEntryId: string
}

// Member Events
export interface MemberRegisteredMetadata {
    memberId: string
    memberNumber: number
    name: string
}

// ========================================
// HELPER TYPES
// ========================================

export type EventMetadata<T extends DomainEventType> =
    T extends 'LOAN_APPLIED' ? LoanAppliedMetadata :
    T extends 'LOAN_DISBURSED' ? LoanDisbursedMetadata :
    T extends 'REPAYMENT_MADE' ? RepaymentMadeMetadata :
    T extends 'LOAN_CLEARED' ? LoanClearedMetadata :
    T extends 'WALLET_DEPOSIT_MADE' ? WalletDepositMetadata :
    T extends 'WALLET_WITHDRAWAL_MADE' ? WalletWithdrawalMetadata :
    T extends 'SHARE_CONTRIBUTION_MADE' ? ShareContributionMetadata :
    T extends 'MEMBER_REGISTERED' ? MemberRegisteredMetadata :
    Record<string, any>

// ========================================
// EVENT FACTORY HELPERS
// ========================================

export class Events {
    /**
     * Create a domain event with proper typing
     */
    static create<T extends DomainEventType>(
        eventType: T,
        aggregateType: AggregateType,
        aggregateId: string,
        metadata: EventMetadata<T>,
        actor: { id: string; name: string },
        correlation?: { causationId?: string; correlationId?: string }
    ) {
        return {
            aggregateType,
            aggregateId,
            eventType,
            actorId: actor.id,
            actorName: actor.name,
            metadata: metadata as Record<string, any>,
            causationId: correlation?.causationId,
            correlationId: correlation?.correlationId
        }
    }

    /**
     * Loan event helpers
     */
    static loanDisbursed(
        loanId: string,
        metadata: LoanDisbursedMetadata,
        actor: { id: string; name: string },
        correlation?: { causationId?: string; correlationId?: string }
    ) {
        return this.create(
            'LOAN_DISBURSED',
            'LOAN',
            loanId,
            metadata,
            actor,
            correlation
        )
    }

    static repaymentMade(
        loanId: string,
        metadata: RepaymentMadeMetadata,
        actor: { id: string; name: string },
        correlation?: { causationId?: string; correlationId?: string }
    ) {
        return this.create(
            'REPAYMENT_MADE',
            'LOAN',
            loanId,
            metadata,
            actor,
            correlation
        )
    }

    static loanCleared(
        loanId: string,
        metadata: LoanClearedMetadata,
        actor: { id: string; name: string },
        correlation?: { causationId?: string; correlationId?: string }
    ) {
        return this.create(
            'LOAN_CLEARED',
            'LOAN',
            loanId,
            metadata,
            actor,
            correlation
        )
    }

    /**
     * Wallet event helpers
     */
    static walletDeposit(
        walletId: string,
        metadata: WalletDepositMetadata,
        actor: { id: string; name: string }
    ) {
        return this.create(
            'WALLET_DEPOSIT_MADE',
            'WALLET',
            walletId,
            metadata,
            actor
        )
    }

    /**
     * Share event helpers
     */
    static shareContribution(
        memberId: string,
        metadata: ShareContributionMetadata,
        actor: { id: string; name: string }
    ) {
        return this.create(
            'SHARE_CONTRIBUTION_MADE',
            'SHARE',
            memberId,
            metadata,
            actor
        )
    }
}
