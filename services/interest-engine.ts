import { InterestPostingType } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { AccountingEngine, AccountingService } from '@/lib/accounting/AccountingEngine'
import { db } from '@/lib/db'
import { startOfMonth, addMonths, getDaysInMonth } from 'date-fns'

const prisma = db

export class InterestService {

    /**
     * Trigger A: Post-Disbursement Accrual (Immediate)
     * Calculates pro-rata interest from disbursement date to end of month.
     * MUST be called inside the disbursement transaction.
     */
    static async processDisbursementAccrual(loanId: string, tx: any) {
        const loan = await tx.loan.findUnique({
            where: { id: loanId },
            include: { member: true, loanProduct: true }
        })

        if (!loan) throw new Error(`Loan ${loanId} not found`)

        const now = new Date()
        const daysInCurrentMonth = getDaysInMonth(now)
        const remainingDays = daysInCurrentMonth - now.getDate()

        if (remainingDays <= 0 || loan.loanProduct?.interestType === 'FLAT') {
            await tx.loan.update({
                where: { id: loanId },
                data: {
                    nextInterestRunDate: startOfMonth(addMonths(now, 1)),
                    lastInterestRunDate: now
                }
            })
            return
        }

        const principal = new Prisma.Decimal(loan.amount || 0)
        const rate = new Prisma.Decimal(loan.interestRatePerMonth || 0).div(100)

        // Interest = (Principal * Rate * RemainingDays) / TotalDays
        const interestAmount = principal
            .mul(rate)
            .mul(remainingDays)
            .div(daysInCurrentMonth)

        if (interestAmount.lte(0)) return

        // 1. Create Posting Record
        await tx.interestPosting.create({
            data: {
                loanId,
                amount: interestAmount,
                periodMonth: now.getMonth() + 1,
                periodYear: now.getFullYear(),
                type: InterestPostingType.DISBURSEMENT_ACCRUAL
            }
        })

        // 2. Update Loan Balance & Dates
        await tx.loan.update({
            where: { id: loanId },
            data: {
                current_balance: { increment: interestAmount.toNumber() },
                accruedInterestTotal: { increment: interestAmount },
                lastInterestRunDate: now,
                nextInterestRunDate: startOfMonth(addMonths(now, 1))
            }
        })

        // 3. Create LoanTransaction (so it appears in statement)
        await tx.loanTransaction.create({
            data: {
                loanId,
                type: 'INTEREST',
                amount: interestAmount.toNumber(),
                description: `Pro-rata Interest Accrual - Disbursement on ${now.toLocaleDateString()}`,
                postedAt: now,
                interestAmount: interestAmount
            }
        })

        // 4. Post to General Ledger
        try {
            await AccountingService.postLoanEvent(loanId, 'INTEREST_ACCRUAL', interestAmount.toNumber(), tx)
        } catch (glError: any) {
            console.warn(`[InterestEngine] GL posting failed for loan ${loanId}:`, glError.message)
        }
    }

    /**
     * Trigger B: Monthly Batch Run
     * Called by Cron Job.
     * Strict Idempotency: Uses nextInterestRunDate.
     */
    static async processMonthlyBatch() {
        const now = new Date()

        // 1. Create Run Record
        const run = await prisma.interestEngineRun.create({
            data: {
                status: 'RUNNING',
                startedAt: now
            }
        })

        // Fetch all candidate loans
        const loans = await prisma.loan.findMany({
            where: {
                status: 'ACTIVE',
                nextInterestRunDate: { lte: now }
            },
            include: {
                loanProduct: true,
                repaymentInstallments: {
                    select: {
                        principalPaid: true
                    }
                }
            }
        })

        console.log(`[InterestEngine][Run:${run.id}] Found ${loans.length} loans to process.`)

        const results = { success: 0, failed: 0, totalInterest: new Prisma.Decimal(0) }

        for (const loan of loans) {
            try {
                await prisma.$transaction(async (tx) => {
                    const currentLoan = await tx.loan.findUnique({ 
                        where: { id: loan.id },
                        include: { 
                            loanProduct: true,
                            repaymentInstallments: {
                                select: { 
                                    principalPaid: true,
                                    interestPaid: true,
                                    interestDue: true,
                                    dueDate: true
                                }
                            }
                        }
                    })
                    
                    if (!currentLoan || currentLoan.status !== 'ACTIVE' || (currentLoan.nextInterestRunDate && currentLoan.nextInterestRunDate > now)) {
                        return 
                    }

                    // --- SKIP LOGIC ---
                    
                    // 1. Skip Amortized Loans with Fixed Schedules or FLAT interest
                    // If amortization is EQUAL_INSTALLMENTS or interest is FLAT, interest is typically pre-calculated.
                    if (currentLoan.loanProduct?.amortizationType === 'EQUAL_INSTALLMENTS' || currentLoan.loanProduct?.interestType === 'FLAT') {
                        await tx.loan.update({
                            where: { id: loan.id },
                            data: { nextInterestRunDate: startOfMonth(addMonths(now, 1)) }
                        })
                        return
                    }

                    // 2. Skip if Interest for the current period was already paid via Waterfall
                    // We check if any installment for the "current month" (relative to last run) has interestPaid >= interestDue
                    const lastRun = currentLoan.lastInterestRunDate || currentLoan.disbursementDate || now
                    const hasPaidCurrentInterest = currentLoan.repaymentInstallments.some(inst => {
                        const isCurrentPeriod = inst.dueDate && 
                            inst.dueDate.getMonth() === lastRun.getMonth() && 
                            inst.dueDate.getFullYear() === lastRun.getFullYear()
                        
                        return isCurrentPeriod && 
                            new Prisma.Decimal(inst.interestPaid).gte(new Prisma.Decimal(inst.interestDue)) &&
                            new Prisma.Decimal(inst.interestDue).gt(0)
                    })

                    if (hasPaidCurrentInterest) {
                        console.log(`[InterestEngine] Skipping loan ${loan.id} - monthly interest already paid.`)
                        await tx.loan.update({
                            where: { id: loan.id },
                            data: { nextInterestRunDate: startOfMonth(addMonths(now, 1)) }
                        })
                        return
                    }

                    // --- CALCULATION LOGIC ---
                    let calculationBase = new Prisma.Decimal(0)
                    const interestType = currentLoan.loanProduct?.interestType || 'DECLINING_BALANCE'

                    if (interestType === 'FLAT') {
                        // FLAT: Use original amount
                        calculationBase = new Prisma.Decimal(currentLoan.amount || 0)
                    } else {
                        // DECLINING_BALANCE: Current Principal Balance only
                        const totalPrincipalPaid = currentLoan.repaymentInstallments.reduce(
                            (sum, inst) => sum.add(new Prisma.Decimal(inst.principalPaid || 0)), 
                            new Prisma.Decimal(0)
                        )
                        calculationBase = new Prisma.Decimal(currentLoan.amount || 0).sub(totalPrincipalPaid)
                        if (calculationBase.lt(0)) calculationBase = new Prisma.Decimal(0)
                    }

                    const rate = new Prisma.Decimal(currentLoan.interestRatePerMonth || 0).div(100)
                    const interestAmount = calculationBase.mul(rate)

                    if (interestAmount.gt(0)) {
                        // 1. Create Posting
                        await tx.interestPosting.create({
                            data: {
                                loanId: loan.id,
                                amount: interestAmount,
                                periodMonth: now.getMonth() + 1,
                                periodYear: now.getFullYear(),
                                type: InterestPostingType.MONTHLY_ACCRUAL,
                                runId: run.id
                            }
                        })

                        // 2. Update Loan
                        await tx.loan.update({
                            where: { id: loan.id },
                            data: {
                                current_balance: { increment: interestAmount.toNumber() },
                                accruedInterestTotal: { increment: interestAmount },
                                lastInterestRunDate: now,
                                nextInterestRunDate: startOfMonth(addMonths(now, 1))
                            }
                        })

                        // 3. Post to Ledger
                        let journalId: string | undefined
                        try {
                            const journal = await AccountingService.postLoanEvent(loan.id, 'INTEREST_ACCRUAL', interestAmount.toNumber(), tx)
                            journalId = journal?.id
                        } catch (glError: any) {
                            console.warn(`[InterestEngine] GL posting failed for loan ${loan.id}:`, glError.message)
                        }

                        // 4. Create LoanTransaction
                        await tx.loanTransaction.create({
                            data: {
                                loanId: loan.id,
                                type: 'INTEREST',
                                amount: interestAmount.toNumber(),
                                description: `Monthly Interest Accrual (${interestType}) - ${now.toLocaleDateString()}`,
                                postedAt: now,
                                transactionDate: now,
                                runId: run.id,
                                interestAmount: interestAmount,
                                referenceId: journalId
                            }
                        })

                        results.totalInterest = results.totalInterest.add(interestAmount)
                    } else {
                        await tx.loan.update({
                            where: { id: loan.id },
                            data: {
                                nextInterestRunDate: startOfMonth(addMonths(now, 1))
                            }
                        })
                    }
                }, { timeout: 30000 })
                results.success++
            } catch (error: any) {
                console.error(`[InterestEngine] Failed loan ${loan.id}:`, error)
                results.failed++
            }
        }

        // 3. Finalize Run Record
        await prisma.interestEngineRun.update({
            where: { id: run.id },
            data: {
                status: results.failed > 0 ? 'PARTIAL_SUCCESS' : 'SUCCESS',
                completedAt: new Date(),
                affectedLoanCount: results.success,
                totalInterest: results.totalInterest
            }
        })

        return {
            ...results,
            totalInterest: results.totalInterest.toString(),
            runId: run.id
        }
    }

    /**
     * Reverses an entire batch run.
     * Undoes all interest postings, loan transactions, and ledger entries.
     */
    static async reverseBatchRun(runId: string) {
        return await prisma.$transaction(async (tx) => {
            const run = await tx.interestEngineRun.findUnique({
                where: { id: runId },
                include: {
                    postings: true,
                    transactions: true
                }
            })

            if (!run) throw new Error("Run not found")
            if (run.status === 'REVERSED') throw new Error("Run already reversed")

            console.log(`[InterestEngine][Reverse:${runId}] Reversing ${run.postings.length} postings...`)

            for (const posting of run.postings) {
                // 1. Decrement Loan Balance
                await tx.loan.update({
                    where: { id: posting.loanId },
                    data: {
                        current_balance: { decrement: posting.amount.toNumber() },
                        accruedInterestTotal: { decrement: posting.amount },
                        // Reset next run date to the month this posting covered
                        nextInterestRunDate: new Date(posting.periodYear, posting.periodMonth - 1, 1)
                    }
                })

                // 2. Delete Posting
                await tx.interestPosting.delete({ where: { id: posting.id } })
            }

            for (const transaction of run.transactions) {
                // 3. Add Reversal Entry in Ledger (Contra-entry)
                if (transaction.referenceId) {
                    try {
                        await AccountingEngine.reverseJournalEntry(
                            transaction.referenceId,
                            `Interest Run Reversal (${runId})`,
                            'SYSTEM',
                            'System',
                            tx
                        )
                    } catch (glError: any) {
                        console.warn(`[InterestEngine] GL reversal failed for transaction ${transaction.id}:`, glError.message)
                    }
                }
                
                // 4. Delete Transaction record
                await tx.loanTransaction.delete({ where: { id: transaction.id } })
            }

            // 5. Update Run Status
            await tx.interestEngineRun.update({
                where: { id: runId },
                data: { status: 'REVERSED', completedAt: new Date() }
            })

            return { success: true }
        }, { timeout: 60000 })
    }
}
