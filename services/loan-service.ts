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
import { Prisma, LoanStatus, LoanEventType, AuditLogAction, SystemAccountType } from '@prisma/client'
import { WalletService } from '@/lib/services/WalletService'
import { LoanBalanceService } from '@/services/loan-balance'
import { RepaymentCalculator } from '@/lib/utils/repayment-calculator'

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
        fees: number
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
    fees: Decimal
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
        const { getLoanPenaltyBalance, getLoanInterestBalance, getLoanPrincipalBalance, getLoanFeeBalance } =
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
        let fees = new Decimal(0)

        try {
            const penaltyNum = await getLoanPenaltyBalance(loanId)
            const interestNum = await getLoanInterestBalance(loanId)
            const principalNum = await getLoanPrincipalBalance(loanId)
            const feeNum = await getLoanFeeBalance(loanId)

            penalty = new Decimal(penaltyNum)
            interest = new Decimal(interestNum)
            principal = new Decimal(principalNum)
            fees = new Decimal(feeNum)
        } catch (error) {
            // Ledger not initialized - use loan amount as fallback
            principal = new Decimal(loan.amount ?? 0)
        }


        // Fallback removed: Ledger is now authoritative.
        // If total is 0, it means the loan is fully paid.
        // if (total.lte(0) && ['ACTIVE', 'OVERDUE', 'DISBURSED'].includes(loan.status)) {
        //    principal = new Decimal(loan.amount)
        // }

        return {
            principal,
            interest,
            penalty,
            fees,
            total: penalty.plus(interest).plus(fees).plus(principal)
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

        if (!['ACTIVE', 'OVERDUE'].includes(loan.status)) {
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
            fees: new Decimal(0),
            interest: new Decimal(0),
            principal: new Decimal(0)
        }


        // Pay penalties first
        if (remaining.gt(0) && balances.penalty.gt(0)) {
            allocation.penalty = Decimal.min(remaining, balances.penalty)
            remaining = remaining.minus(allocation.penalty)
        }

        // Pay fees second
        if (remaining.gt(0) && balances.fees.gt(0)) {
            allocation.fees = Decimal.min(remaining, balances.fees)
            remaining = remaining.minus(allocation.fees)
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

        if (allocation.fees.gt(0)) {
            journalLines.push({
                accountCode: mappings.RECEIVABLE_LOAN_FEES,
                debitAmount: 0,
                creditAmount: allocation.fees.toNumber(),
                description: 'Fees paid'
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
            const isFullyPaid = newOutstandingDecimal.eq(0)

            // 9. Update loan status/balance (atomic with journal posting)
            let finalStatus = loan.status
            if (isFullyPaid) {
                await tx.loan.update({
                    where: { id: input.loanId },
                    data: {
                        status: 'CLEARED',
                        current_balance: 0,
                        outstandingBalance: new Prisma.Decimal(0)
                    }
                })
                finalStatus = 'CLEARED'
            } else {
                await tx.loan.update({
                    where: { id: input.loanId },
                    data: {
                        current_balance: newOutstanding,
                        outstandingBalance: newOutstanding
                    }
                })
            }

            // 10. Create loan journey event (atomic)
            await tx.loanJourneyEvent.create({
                data: {
                    loanId: input.loanId,
                    eventType: 'REPAYMENT_MADE',
                    description: `Repayment of KES ${input.amount.toLocaleString()} (Penalty: ${allocation.penalty.toNumber()}, Fees: ${allocation.fees.toNumber()}, Interest: ${allocation.interest.toNumber()}, Principal: ${allocation.principal.toNumber()})`,
                    actorId: input.userId,
                    actorName: input.userName || 'System',
                    metadata: {
                        amount: input.amount,
                        allocation: {
                            penalty: allocation.penalty.toNumber(),
                            fees: allocation.fees.toNumber(),
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
                        fees: allocation.fees.toNumber(),
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
                fees: allocation.fees.toNumber(),
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
                    feesBalance: balances.fees.toNumber(),
                    interestBalance: balances.interest.toNumber(),
                    principalBalance: balances.principal.toNumber(),
                    status: loan.status
                }
            })
        )

        return loansWithBalances
    }

    /**
     * Disburse Loan (Unified Banking Logic)
     * 
     * Consolidates logic from:
     * - app/actions/disburse-loan.ts
     * - app/loan-approval-actions.ts
     * 
     * This method is the single source of truth for loan disbursement.
     */
    static async disburseLoan(loanId: string, actorId: string, actorName: string) {
        return await db.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Fetch Loan with dependencies
            const loan = await tx.loan.findUnique({
                where: { id: loanId },
                include: {
                    member: {
                        include: { wallet: true }
                    },
                    loanProduct: true,
                    topUps: true
                }
            })

            if (!loan) throw new Error("Loan not found")
            if (loan.status !== LoanStatus.APPROVED) {
                throw new Error(`Loan must be APPROVED to disburse. Current status: ${loan.status}`)
            }

            // 2. Ensure Wallet exists
            if (!loan.member.wallet) {
                await WalletService.createWallet(loan.memberId, tx)
            }

            const principal = loan.amount
            const netDisbursement = loan.netDisbursementAmount

            if (netDisbursement.isNegative()) {
                throw new Error(`Net disbursement amount is negative (KES ${netDisbursement}).`)
            }

            // 3. Record Wallet Transaction
            const wallet = await tx.wallet.findUnique({
                where: { memberId: loan.memberId },
                include: { glAccount: true }
            })

            const currentBalance = wallet?.glAccount.balance || new Prisma.Decimal(0)
            const balanceAfter = currentBalance.plus(netDisbursement)

            await tx.walletTransaction.create({
                data: {
                    walletId: wallet!.id,
                    type: 'LOAN_DISBURSEMENT',
                    amount: netDisbursement,
                    description: `Disbursement for Loan ${loan.loanApplicationNumber}`,
                    balanceAfter: balanceAfter,
                    relatedLoanId: loan.id
                }
            })

            // 4. Record Loan Transaction (Initial Disbursement)
            await tx.loanTransaction.create({
                data: {
                    loanId: loan.id,
                    type: 'DISBURSEMENT',
                    amount: new Prisma.Decimal(principal),
                    description: `Loan Disbursement Posted`,
                    postedAt: new Date()
                }
            })

            // GL Journal Entry Construction (Balanced by Construction)
            const mappings = await getSystemMappingsDict()
            const getAccountId = async (code: string) => {
                const acc = await tx.ledgerAccount.findUnique({ where: { code } })
                return acc?.id
            }

            const journalLines = []
            let lineIndex = 0
            let totalDeductionsCredit = new Prisma.Decimal(0)

            // A. DEBIT: Principal (Source of Truth)
            const loanPortfolioId = await getAccountId(mappings.EVENT_LOAN_DISBURSEMENT!)
            if (loanPortfolioId) {
                journalLines.push({
                    accountId: loanPortfolioId,
                    debitAmount: principal,
                    creditAmount: 0,
                    description: `Principal - ${loan.loanApplicationNumber}`,
                    index: lineIndex++
                })
            }

            // B. CREDIT: Accumulate Deductions
            // ... (Fees will be added below and accumulated into totalDeductionsCredit) ...

            // CREDIT: Processing Fees
            const processingIncomeId = await getAccountId(mappings.INCOME_LOAN_PROCESSING_FEE!)
            if (loan.processingFee.gt(0) && processingIncomeId) {
                journalLines.push({
                    accountId: processingIncomeId,
                    debitAmount: 0,
                    creditAmount: loan.processingFee,
                    description: `Processing Fee`,
                    index: lineIndex++
                })
                totalDeductionsCredit = totalDeductionsCredit.plus(loan.processingFee)
            }

            // CREDIT: Insurance Fees
            const generalIncomeId = await getAccountId(mappings.INCOME_GENERAL_FEE!)
            if (loan.insuranceFee.gt(0) && generalIncomeId) {
                journalLines.push({
                    accountId: generalIncomeId,
                    debitAmount: 0,
                    creditAmount: loan.insuranceFee,
                    description: `Insurance Fee`,
                    index: lineIndex++
                })
                totalDeductionsCredit = totalDeductionsCredit.plus(loan.insuranceFee)
            }

            // CREDIT: Share Capital Deduction
            const shareCapitalId = await getAccountId(mappings.EVENT_SHARE_CONTRIBUTION!)
            if (loan.shareCapitalDeduction.gt(0) && shareCapitalId) {
                journalLines.push({
                    accountId: shareCapitalId,
                    debitAmount: 0,
                    creditAmount: loan.shareCapitalDeduction,
                    description: `Share Capital Deduction`,
                    index: lineIndex++
                })
            }

            // CREDIT: Loan Offsets & Refinance Fees
            const refinanceIncomeId = await getAccountId(mappings.INCOME_REFINANCE_FEE!)
            for (const topUp of loan.topUps) {
                const dTopUpTotal = new Prisma.Decimal(topUp.totalOffset)
                const dRefinanceFee = new Prisma.Decimal(topUp.refinanceFee || 0)
                const dClearance = dTopUpTotal.minus(dRefinanceFee)

                // Debt clearance (Asset reduction)
                if (dClearance.gt(0) && loanPortfolioId) {
                    journalLines.push({
                        accountId: loanPortfolioId,
                        debitAmount: 0,
                        creditAmount: dClearance,
                        description: `Offset Clearance - ${topUp.oldLoanId}`,
                        index: lineIndex++
                    })
                    totalDeductionsCredit = totalDeductionsCredit.plus(dClearance)
                }

                // Refinance Fee Income
                if (dRefinanceFee.gt(0) && (refinanceIncomeId || generalIncomeId)) {
                    journalLines.push({
                        accountId: refinanceIncomeId || generalIncomeId!,
                        debitAmount: 0,
                        creditAmount: dRefinanceFee,
                        description: `Refinance Fee - ${topUp.oldLoanId}`,
                        index: lineIndex++
                    })
                    totalDeductionsCredit = totalDeductionsCredit.plus(dRefinanceFee)
                }
            }

            // C. DERIVE Net Disbursement (Final Credit line to balance the entry)
            const dDerivedNetDisbursement = principal.minus(totalDeductionsCredit)
            const memberWalletId = await getAccountId(mappings.MEMBER_WALLET!)

            if (dDerivedNetDisbursement.gt(0) && memberWalletId) {
                journalLines.push({
                    accountId: memberWalletId,
                    debitAmount: 0,
                    creditAmount: dDerivedNetDisbursement,
                    description: `Net Disbursement to Wallet`,
                    index: lineIndex++
                })
            }

            // Post Journal Entry
            const je = await AccountingEngine.postJournalEntry({
                transactionDate: new Date(),
                referenceType: 'LOAN_DISBURSEMENT',
                referenceId: loan.id,
                description: `Loan Disbursement: ${loan.loanApplicationNumber}`,
                lines: journalLines,
                createdBy: actorId,
                createdByName: actorName
            }, tx)

            // 6. Generate Repayment Schedule
            const scheduleData = RepaymentCalculator.generateSchedule(
                loan.id,
                {
                    principal: Number(loan.amount),
                    interestRatePerMonth: Number(loan.interestRate),
                    installments: loan.installments,
                    amortizationType: (loan.loanProduct.amortizationType as any) || 'EQUAL_INSTALLMENTS'
                },
                new Date()
            )

            await tx.repaymentInstallment.createMany({
                data: scheduleData.map(item => ({
                    ...item,
                    loanId: loan.id
                }))
            })

            // 7. Update Status and Balances
            await tx.loan.update({
                where: { id: loanId },
                data: {
                    status: LoanStatus.ACTIVE,
                    disbursementDate: new Date(),
                    outstandingBalance: new Prisma.Decimal(principal)
                }
            })

            // 8. Process Offsets (Sub-ledger)
            for (const topUp of loan.topUps) {
                const clearanceAmount = new Prisma.Decimal(topUp.totalOffset).sub(new Prisma.Decimal(topUp.refinanceFee || 0))
                if (clearanceAmount.gt(0)) {
                    await tx.loanTransaction.create({
                        data: {
                            loanId: topUp.oldLoanId,
                            type: 'REPAYMENT',
                            amount: clearanceAmount,
                            description: `Offset by ${loan.loanApplicationNumber}`,
                            referenceId: je.id,
                            postedAt: new Date()
                        }
                    })

                    // Update old loan balance and close if paid
                    const verifiedBalance = await LoanBalanceService.updateLoanBalance(topUp.oldLoanId, tx)
                    if (verifiedBalance.lte(0.01)) {
                        await tx.loan.update({
                            where: { id: topUp.oldLoanId },
                            data: {
                                status: 'CLEARED',
                                outstandingBalance: new Prisma.Decimal(0)
                            }
                        })
                        await tx.loanJourneyEvent.create({
                            data: {
                                loanId: topUp.oldLoanId,
                                eventType: 'LOAN_CLEARED',
                                description: `Cleared via refinance offset ${loan.loanApplicationNumber}`,
                                actorId: 'SYSTEM',
                                actorName: 'System'
                            }
                        })
                    }
                }
            }

            // 9. Final Events & Audit
            await tx.loanJourneyEvent.create({
                data: {
                    loanId,
                    eventType: LoanEventType.LOAN_DISBURSED,
                    description: `Loan disbursed. Net KES ${netDisbursement.toLocaleString()} sent to wallet.`,
                    actorId,
                    actorName
                }
            })

            await tx.auditLog.create({
                data: {
                    userId: actorId,
                    action: AuditLogAction.LOAN_DISBURSED,
                    details: `Disbursed Loan ${loan.loanApplicationNumber} (Net: ${netDisbursement})`
                }
            })

            // 10. Initial Accrual
            const { InterestService } = await import('@/services/interest-engine')
            await InterestService.processDisbursementAccrual(loan.id, tx)

            return { success: true }
        }, {
            maxWait: 5000,
            timeout: 10000
        })
    }
}
