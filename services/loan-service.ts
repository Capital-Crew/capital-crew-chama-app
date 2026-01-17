/**
 * LoanService - Core Banking Logic (Pure Business Rules)
 * 
 * This file knows nothing about Next.js, HTTP, or UI.
 * It only knows about money, loans, and business rules.
 * 
 * Can be called from:
 * - Server Actions (web UI)
 * - API Routes (webhooks, M-Pesa callbacks)
 * - Background jobs (interest accrual)
 * - Admin scripts (migrations)
 */

import { db } from '@/lib/db'
import { AccountingEngine } from '@/lib/accounting/AccountingEngine'
import { Decimal } from '@prisma/client/runtime/library'
import { getSystemMappingsDict } from '@/app/actions/system-accounting'

// ========================================
// TYPES
// ========================================

export type RepaymentInput = {
    loanId: string
    amount: number  // Input from UI is still number, converted internally
    description: string
    userId: string
    userName?: string
}

export type RepaymentResult = {
    success: boolean
    journalEntryId: string
    allocation: {
        penalty: number
        interest: number
        principal: number
    }
    newOutstanding: number
    isFullyPaid: boolean
    loanStatus: string
}

export type LoanBalanceBreakdown = {
    principal: Decimal
    interest: Decimal
    penalty: Decimal
    total: Decimal
}

// ========================================
// CORE BUSINESS LOGIC
// ========================================

export class LoanService {
    /**
     * Calculate Outstanding Balance (Recalculated from Ledger)
     * 
     * This is the "True Balance" - ignores any potentially corrupt fields.
     * Sources data from JournalEntry (immutable accounting records).
     */
    static async calculateOutstandingBalance(loanId: string): Promise<LoanBalanceBreakdown> {
        // Import ledger helpers
        const { getLoanPenaltyBalance, getLoanInterestBalance, getLoanPrincipalBalance } =
            await import('@/lib/accounting/AccountingEngine')

        const loan = await db.loan.findUnique({
            where: { id: loanId },
            select: { id: true, amount: true, status: true }
        })

        if (!loan) {
            throw new Error('Loan not found')
        }

        // Use Decimal for all financial calculations
        let penalty = new Decimal(0)
        let interest = new Decimal(0)
        let principal = new Decimal(0)

        try {
            const penaltyNum = await getLoanPenaltyBalance(loanId)
            const interestNum = await getLoanInterestBalance(loanId)
            const principalNum = await getLoanPrincipalBalance(loanId)

            penalty = new Decimal(penaltyNum)
            interest = new Decimal(interestNum)
            principal = new Decimal(principalNum)
        } catch (error) {
            // Ledger not initialized - use loan amount as fallback
            principal = new Decimal(loan.amount)
        }

        // Fallback: If ledger returns 0 for active loan, use loan amount
        const total = penalty.plus(interest).plus(principal)
        if (total.lte(0) && ['ACTIVE', 'OVERDUE', 'DISBURSED'].includes(loan.status)) {
            principal = new Decimal(loan.amount)
        }

        return {
            principal,
            interest,
            penalty,
            total: penalty.plus(interest).plus(principal)
        }
    }

    /**
     * Process Loan Repayment
     * 
     * Business Rules:
     * - Allocation hierarchy: Penalties → Interest → Principal
     * - Cannot exceed outstanding balance (strict validation)
     * - Updates loan status if fully paid
     * - Atomic transaction for consistency
     */
    static async processRepayment(input: RepaymentInput): Promise<RepaymentResult> {
        // 1. Validate amount
        if (input.amount <= 0) {
            throw new Error('Amount must be greater than zero')
        }

        // 2. Fetch loan
        const loan = await db.loan.findUnique({
            where: { id: input.loanId },
            include: { member: true }
        })

        if (!loan) {
            throw new Error('Loan not found')
        }

        if (!['ACTIVE', 'OVERDUE', 'DISBURSED'].includes(loan.status)) {
            throw new Error(`Cannot repay loan with status: ${loan.status}`)
        }

        // 3. Calculate outstanding balances
        const balances = await this.calculateOutstandingBalance(input.loanId)

        // 4. Strict validation: Prevent overpayment
        const amountDecimal = new Decimal(input.amount)
        if (amountDecimal.gt(balances.total)) {
            throw new Error(
                `Repayment amount (KES ${input.amount.toLocaleString()}) exceeds outstanding balance (KES ${balances.total.toNumber().toLocaleString()})`
            )
        }

        // 5. Calculate allocation using waterfall method (DECIMAL ARITHMETIC)
        let remaining = amountDecimal
        const allocation = {
            penalty: new Decimal(0),
            interest: new Decimal(0),
            principal: new Decimal(0)
        }

        // Pay penalties first
        if (remaining.gt(0) && balances.penalty.gt(0)) {
            allocation.penalty = Decimal.min(remaining, balances.penalty)
            remaining = remaining.minus(allocation.penalty)
        }

        // Pay interest second
        if (remaining.gt(0) && balances.interest.gt(0)) {
            allocation.interest = Decimal.min(remaining, balances.interest)
            remaining = remaining.minus(allocation.interest)
        }

        // Pay principal last
        if (remaining.gt(0) && balances.principal.gt(0)) {
            allocation.principal = Decimal.min(remaining, balances.principal)
            remaining = remaining.minus(allocation.principal)
        }

        // 5a. Get system mappings
        const mappings = await getSystemMappingsDict()

        // 6. Build journal lines (convert to number for DB)
        const journalLines: Array<{
            accountCode: string
            debitAmount: number
            creditAmount: number
            description: string
        }> = []

        if (allocation.penalty.gt(0)) {
            journalLines.push({
                accountCode: mappings.RECEIVABLE_LOAN_PENALTY,
                debitAmount: 0,
                creditAmount: allocation.penalty.toNumber(),
                description: 'Penalty paid'
            })
        }

        if (allocation.interest.gt(0)) {
            journalLines.push({
                accountCode: mappings.RECEIVABLE_LOAN_INTEREST,
                debitAmount: 0,
                creditAmount: allocation.interest.toNumber(),
                description: 'Interest paid'
            })
        }

        if (allocation.principal.gt(0)) {
            journalLines.push({
                accountCode: mappings.EVENT_LOAN_REPAYMENT_PRINCIPAL,
                debitAmount: 0,
                creditAmount: allocation.principal.toNumber(),
                description: 'Principal paid'
            })
        }

        // Cash received (DR)
        journalLines.push({
            accountCode: mappings.CASH_ON_HAND || mappings.EVENT_CASH_DEPOSIT,
            debitAmount: input.amount,
            creditAmount: 0,
            description: 'Loan repayment received'
        })


        // ========================================
        // CRITICAL: ALL DATABASE OPERATIONS IN ATOMIC TRANSACTION
        // ========================================
        const result = await db.$transaction(async (tx) => {
            // 7. Post to ledger
            const journalEntry = await AccountingEngine.postJournalEntry({
                transactionDate: new Date(),
                referenceType: 'LOAN_REPAYMENT',
                referenceId: input.loanId,
                description: `Loan repayment - ${loan.loanApplicationNumber}`,
                notes: input.description,
                lines: journalLines,
                createdBy: input.userId,
                createdByName: input.userName || 'System'
            }, tx) // <--- CRITICAL: Share the transaction!

            // 8. Calculate new outstanding (DECIMAL)
            const newOutstandingDecimal = balances.total.minus(amountDecimal)
            const newOutstanding = newOutstandingDecimal.toNumber()
            const isFullyPaid = newOutstandingDecimal.abs().lt(0.01)

            // 9. Update loan status/balance (atomic with journal posting)
            let finalStatus = loan.status
            if (isFullyPaid) {
                await tx.loan.update({
                    where: { id: input.loanId },
                    data: {
                        status: 'CLEARED',
                        current_balance: 0
                    }
                })
                finalStatus = 'CLEARED'
            } else {
                await tx.loan.update({
                    where: { id: input.loanId },
                    data: { current_balance: newOutstanding }
                })
            }

            // 10. Create loan journey event (atomic)
            await tx.loanJourneyEvent.create({
                data: {
                    loanId: input.loanId,
                    eventType: 'REPAYMENT_MADE',
                    description: `Repayment of KES ${input.amount.toLocaleString()} (Penalty: ${allocation.penalty.toNumber()}, Interest: ${allocation.interest.toNumber()}, Principal: ${allocation.principal.toNumber()})`,
                    actorId: input.userId,
                    actorName: input.userName || 'System',
                    metadata: {
                        amount: input.amount,
                        allocation: {
                            penalty: allocation.penalty.toNumber(),
                            interest: allocation.interest.toNumber(),
                            principal: allocation.principal.toNumber()
                        },
                        journalEntryId: journalEntry.id
                    }
                }
            })

            return {
                journalEntryId: journalEntry.id,
                newOutstanding,
                isFullyPaid,
                finalStatus
            }
        })

        // ========================================
        // EVENT SOURCING: Emit Domain Event
        // ========================================
        const { EventBus } = await import('@/lib/events/event-bus')
        const { Events } = await import('@/lib/events/event-types')
        const { ensureHandlersRegistered } = await import('@/lib/events/register-handlers')

        // Ensure handlers are registered
        ensureHandlersRegistered()

        // Emit event (will trigger projections, audit logs, etc.)
        await EventBus.emit(
            Events.repaymentMade(
                input.loanId,
                {
                    loanId: input.loanId,
                    amount: input.amount,
                    allocation: {
                        penalty: allocation.penalty.toNumber(),
                        interest: allocation.interest.toNumber(),
                        principal: allocation.principal.toNumber()
                    },
                    newOutstanding: result.newOutstanding,
                    isFullyPaid: result.isFullyPaid,
                    journalEntryId: result.journalEntryId
                },
                {
                    id: input.userId,
                    name: input.userName || 'System'
                }
            )
        )

        // Return result
        return {
            success: true,
            journalEntryId: result.journalEntryId,
            allocation: {
                penalty: allocation.penalty.toNumber(),
                interest: allocation.interest.toNumber(),
                principal: allocation.principal.toNumber()
            },
            newOutstanding: result.newOutstanding,
            isFullyPaid: result.isFullyPaid,
            loanStatus: result.finalStatus
        }
    }

    /**
     * Get Active Loans for a Member
     * 
     * Returns loans eligible for repayment with calculated balances.
     */
    static async getActiveLoansByMember(memberId: string) {
        const loans = await db.loan.findMany({
            where: {
                memberId,
                status: { in: ['ACTIVE', 'OVERDUE', 'DISBURSED'] }
            },
            include: {
                loanProduct: {
                    select: { name: true }
                }
            },
            orderBy: { applicationDate: 'desc' }
        })

        const loansWithBalances = await Promise.all(
            loans.map(async (loan: any) => {
                const balances = await this.calculateOutstandingBalance(loan.id)

                return {
                    id: loan.id,
                    loanApplicationNumber: loan.loanApplicationNumber,
                    productName: loan.loanProduct?.name,
                    disbursedAmount: loan.amount,
                    outstandingBalance: balances.total.toNumber(),
                    penaltyBalance: balances.penalty.toNumber(),
                    interestBalance: balances.interest.toNumber(),
                    principalBalance: balances.principal.toNumber(),
                    status: loan.status
                }
            })
        )

        return loansWithBalances
    }
}
