/**
 * Event Handler Registry
 * 
 * Centralized registration of all event handlers.
 * Auto-wires handlers to the event bus on app startup.
 */

import { EventBus } from '@/lib/events/event-bus'
import { LoanProjectionHandler } from '@/lib/events/handlers/loan-projection-handler'
import { MemberBalanceProjectionHandler } from '@/lib/events/handlers/member-balance-projection-handler'
import { LegacyEventHandler } from '@/lib/events/handlers/legacy-event-handler'

/**
 * Register all event handlers
 * 
 * Call this once on app startup (e.g., in middleware or _app.tsx)
 */
export function registerEventHandlers() {
    // Loan Events
    EventBus.on('LOAN_DISBURSED', async (event) => {
        await Promise.all([
            LoanProjectionHandler.handleLoanDisbursed(event),
            MemberBalanceProjectionHandler.handleLoanDisbursed(event),
            LegacyEventHandler.handleLoanEvent(event),
            LegacyEventHandler.handleAuditLog(event)
        ])
    })

    EventBus.on('REPAYMENT_MADE', async (event) => {
        await Promise.all([
            LoanProjectionHandler.handleRepaymentMade(event),
            MemberBalanceProjectionHandler.handleRepaymentMade(event),
            LegacyEventHandler.handleLoanEvent(event),
            LegacyEventHandler.handleAuditLog(event)
        ])
    })

    EventBus.on('LOAN_CLEARED', async (event) => {
        await Promise.all([
            LoanProjectionHandler.handleLoanCleared(event),
            MemberBalanceProjectionHandler.handleLoanCleared(event),
            LegacyEventHandler.handleLoanEvent(event),
            LegacyEventHandler.handleAuditLog(event)
        ])
    })

    // Wallet Events
    EventBus.on('WALLET_DEPOSIT_MADE', async (event) => {
        await Promise.all([
            MemberBalanceProjectionHandler.handleWalletDeposit(event),
            LegacyEventHandler.handleAuditLog(event)
        ])
    })

    EventBus.on('WALLET_WITHDRAWAL_MADE', async (event) => {
        await Promise.all([
            MemberBalanceProjectionHandler.handleWalletWithdrawal(event),
            LegacyEventHandler.handleAuditLog(event)
        ])
    })

    // Contribution Events
    EventBus.on('CONTRIBUTION_MADE' as any, async (event) => {
        await Promise.all([
            MemberBalanceProjectionHandler.handleMemberContribution(event),
            LegacyEventHandler.handleAuditLog(event)
        ])
    })

    // Member Events
    EventBus.on('MEMBER_REGISTERED', async (event) => {
        await LegacyEventHandler.handleAuditLog(event)
    })

}

/**
 * Check if handlers are registered
 */
let handlersRegistered = false

export function ensureHandlersRegistered() {
    if (!handlersRegistered) {
        registerEventHandlers()
        handlersRegistered = true
    }
}
