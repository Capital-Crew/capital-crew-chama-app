'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { Prisma, LoanStatus, LoanEventType, NotificationType, AuditLogAction, SystemAccountType, LoanTransactionType } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { LoanBalanceService } from '@/services/loan-balance'
import { WalletService } from '@/lib/services/WalletService'
import { getSystemMappingsDict } from './system-accounting'
import { RepaymentCalculator } from '@/lib/utils/repayment-calculator'
import { AccountingEngine } from '@/lib/accounting/AccountingEngine'

const prisma = db

/**
 * Disburse a loan (Post Loan)
 * This action credits the member wallet and generates the repayment schedule.
 */
export async function disburseLoan(loanId: string) {
    const session = await auth()

    // Strict role check for disbursement (Admins only)
    if (!session?.user || !['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN'].includes(session.user.role)) {
        throw new Error("Unauthorized: Only administrators can disburse loans")
    }

    try {
        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // STEP A: VALIDATION
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

            // Verify member has a wallet
            if (!loan.member.wallet) {
                // Auto-create wallet if missing using Service
                await WalletService.createWallet(loan.memberId, tx)

                // Refresh loan with wallet
                const updatedLoan = await tx.loan.findUnique({
                    where: { id: loanId },
                    include: { member: { include: { wallet: true } } }
                })
                if (!updatedLoan?.member.wallet) throw new Error("Failed to initialize member wallet")
            }

            const principal = loan.amount
            const netDisbursement = loan.netDisbursementAmount

            if (netDisbursement.isNegative()) {
                throw new Error(`Net disbursement amount is negative (KES ${netDisbursement}). Please check loan deductions/offsets.`)
            }

            // STEP B: THE FINANCIAL TRANSFER

            // 1. Credit Member Wallet - DEPRECATED (Handled by Accounting Engine via GL)
            // Balance is on GL Account now.

            // 2. Record Wallet Transaction
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

            // 3. Record Loan Transaction (Strict Ledger)
            await tx.loanTransaction.create({
                data: {
                    loanId: loan.id,
                    type: 'DISBURSEMENT',
                    amount: new Prisma.Decimal(principal),
                    description: `Loan Disbursement Posted`,
                    postedAt: new Date()
                }
            })

            // 4. GL Journal Entry (Multi-Line Split)
            const mappings = await getSystemMappingsDict()
            const getAccountIdHelper = async (type: SystemAccountType) => {
                const mapping = mappings[type]
                if (!mapping) return null
                // Updated to use strict LedgerAccount
                const acc = await tx.ledgerAccount.findUnique({ where: { code: mapping } })
                return acc?.id
            }

            // Fetch Account IDs
            const loanPortfolioId = await getAccountIdHelper('EVENT_LOAN_DISBURSEMENT') // Debit Principal
            const memberWalletId = await getAccountIdHelper('MEMBER_WALLET') // Credit Net
            const processingIncomeId = await getAccountIdHelper('INCOME_LOAN_PROCESSING_FEE') // Credit
            const refinanceIncomeId = await getAccountIdHelper('INCOME_REFINANCE_FEE') // Credit
            const generalIncomeId = await getAccountIdHelper('INCOME_GENERAL_FEE') // Credit (Insurance)
            const shareCapitalId = await getAccountIdHelper('EVENT_SHARE_CONTRIBUTION') // Credit

            // Calculate TopUp / Refinance Fee
            const totalRefinanceFee = loan.topUps.reduce((sum, t) => sum.add(t.refinanceFee), new Prisma.Decimal(0))

            // Extract Components
            const processingFee = loan.processingFee || new Prisma.Decimal(0)
            const insuranceFee = loan.insuranceFee || new Prisma.Decimal(0)
            const shareCapitalDeduction = loan.shareCapitalDeduction || new Prisma.Decimal(0)
            const offsetAmount = loan.existingLoanOffset || new Prisma.Decimal(0)

            const journalLines = []

            // 1. DEBIT: Full Principal (Increase Loan Asset)
            if (loanPortfolioId) {
                journalLines.push({
                    accountId: loanPortfolioId,
                    debitAmount: Number(principal),
                    creditAmount: 0,
                    description: `Principal for ${loan.loanApplicationNumber}`
                })
            }

            // 2. CREDIT: Net Disbursement (Cash Out)
            if (memberWalletId) {
                journalLines.push({
                    accountId: memberWalletId,
                    debitAmount: 0,
                    creditAmount: Number(netDisbursement),
                    description: `Disbursement to Wallet`
                })
            }

            // 3. CREDIT: Processing Fee
            if (processingFee.gt(0) && processingIncomeId) {
                journalLines.push({
                    accountId: processingIncomeId,
                    debitAmount: 0,
                    creditAmount: Number(processingFee),
                    description: `Processing Fee`
                })
            }

            // 4. CREDIT: Insurance Fee
            if (insuranceFee.gt(0) && generalIncomeId) {
                journalLines.push({
                    accountId: generalIncomeId,
                    debitAmount: 0,
                    creditAmount: Number(insuranceFee),
                    description: `Insurance Fee`
                })
            }

            // 5. CREDIT: Top Up / Refinance Fee
            const topUpIncomeAccId = refinanceIncomeId || generalIncomeId
            if (totalRefinanceFee.gt(0) && topUpIncomeAccId) {
                journalLines.push({
                    accountId: topUpIncomeAccId,
                    debitAmount: 0,
                    creditAmount: Number(totalRefinanceFee),
                    description: `Top Up / Refinance Fee`
                })
            }

            // 6. CREDIT: Contributions Deduction
            if (shareCapitalDeduction.gt(0) && shareCapitalId) {
                journalLines.push({
                    accountId: shareCapitalId,
                    debitAmount: 0,
                    creditAmount: Number(shareCapitalDeduction),
                    description: `Share Capital Boost`
                })
            }

            // 7. CREDIT: Loop Offset (Reduce Loan Asset)
            if (offsetAmount.gt(0) && loanPortfolioId) {
                journalLines.push({
                    accountId: loanPortfolioId, // Offsetting the same portfolio
                    debitAmount: 0,
                    creditAmount: Number(offsetAmount),
                    description: `Offset / Refinance of Old Loans`
                })
            }

            // Post via Accounting Engine
            await AccountingEngine.postJournalEntry({
                transactionDate: new Date(),
                referenceType: 'LOAN_DISBURSEMENT',
                referenceId: loan.id,
                description: `Disbursement of Loan ${loan.loanApplicationNumber}`,
                lines: journalLines,
                createdBy: session.user.id!,
                createdByName: session.user.name || 'Admin'
            }, tx)


            // STEP C: SCHEDULE GENERATION
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
                    loanId: loan.id // Ensure loanId is present if not in scheduleData
                }))
            })

            // STEP D: STATUS UPDATE
            await tx.loan.update({
                where: { id: loanId },
                data: {
                    status: LoanStatus.ACTIVE,
                    disbursementDate: new Date(),
                    outstandingBalance: new Prisma.Decimal(principal)
                }
            })

            // Process Offsets using dedicated handler
            if (loan.topUps.length > 0) {
                await processLoanOffset(loan.topUps, loan.loanApplicationNumber, tx)
            }

            // Create Journey Event
            await tx.loanJourneyEvent.create({
                data: {
                    loanId,
                    eventType: LoanEventType.LOAN_DISBURSED,
                    description: `Loan disbursed. Net KES ${netDisbursement.toLocaleString()} sent to wallet.`,
                    actorId: session.user.id,
                    actorName: session.user.name
                }
            })

            // Audit Log
            await tx.auditLog.create({
                data: {
                    userId: session.user.id!,
                    action: AuditLogAction.LOAN_DISBURSED,
                    details: `Disbursed Loan ${loan.loanApplicationNumber} (Net: ${netDisbursement})`
                }
            })

            // 5. Trigger Interest Engine (Accrual for first partial month)
            const { InterestService } = await import('@/services/interest-engine')
            await InterestService.processDisbursementAccrual(loan.id, tx)

            return { success: true }
        }, {
            maxWait: 5000,
            timeout: 10000
        })

        revalidatePath(`/loans/${loanId}`)
        revalidatePath('/dashboard')
        revalidatePath('/accounts')
        revalidatePath('/wallet')
        return result


    } catch (error: any) {
        console.error('Disbursement Failed:', error)
        return { error: error.message || "Failed to disburse loan" }
    }
}

/**
 * Process Loan Offsets (Refinancing)
 * 
 * Executes the Sub-Ledger transactions to clear old loans.
 * CRITICAL: Separates the Balance Clearance from the Refinance Fee.
 * 
 * - Old Loan: Credited with Clearance Amount ONLY (Principal + Interest + Penalties).
 * - Refinance Fee: Handled in GL (Income), NOT placed on the Old Loan ledger.
 */
async function processLoanOffset(topUps: any[], newLoanNumber: string, tx: Prisma.TransactionClient) {
    for (const topUp of topUps) {
        // Calculate the actual Clearance Amount (Total Offset - Fee)
        // This ensures the Old Loan balance goes up to exactly 0, not negative

        // Handle Decimal conversion safely
        const totalOffset = new Prisma.Decimal(topUp.totalOffset)
        const refinanceFee = new Prisma.Decimal(topUp.refinanceFee || 0)

        // Clearance Amount = The Debt we are wiping out
        const clearanceAmount = totalOffset.sub(refinanceFee)

        if (clearanceAmount.gt(0)) {
            // Record repayment on old loan (Sub-Ledger)
            await tx.loanTransaction.create({
                data: {
                    loanId: topUp.oldLoanId,
                    type: 'REPAYMENT', // Reduces Balance
                    amount: clearanceAmount, // ONLY the debt amount
                    description: `Refinance Clearance via ${newLoanNumber}`,
                    postedAt: new Date()
                }
            })

            // Force Update old loan balance
            const verifiedBalance = await LoanBalanceService.updateLoanBalance(topUp.oldLoanId, tx)

            // Close the loan if fully paid (tolerant to tiny precision errors)
            if (verifiedBalance.lte(0.01)) {
                await tx.loan.update({
                    where: { id: topUp.oldLoanId },
                    data: {
                        status: 'CLEARED',
                        outstandingBalance: new Prisma.Decimal(0)
                    }
                })

                // Optional: Log closure event
                await tx.loanJourneyEvent.create({
                    data: {
                        loanId: topUp.oldLoanId,
                        eventType: 'LOAN_CLEARED',
                        description: `Loan cleared via refinance (Offset by ${newLoanNumber})`,
                        actorId: 'SYSTEM',
                        actorName: 'System'
                    }
                })
            }
        }
    }
}
