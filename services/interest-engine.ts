import { InterestPostingType } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { AccountingService } from '@/lib/accounting/AccountingEngine'
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
            include: { member: true }
        })

        if (!loan) throw new Error(`Loan ${loanId} not found`)

        const now = new Date()
        const daysInCurrentMonth = getDaysInMonth(now)
        // Days remaining including today? User said: "if Jan 20th, calculate for 11 days". 31 - 20 = 11.
        // This implies exclude current day or simple subtraction.
        // Let's use simple subtraction logic as per prompt example.
        const remainingDays = daysInCurrentMonth - now.getDate()

        // If disbursed on last day, remaining is 0. No interest? 
        // Or should it be at least 1? Usually standard practice varies. 
        // User example: Jan 20 to Jan 31. 31-20 = 11. 
        // If Jan 31, 31-31 = 0.
        // Let's strictly follow the example: daysInMonth - currentDay.

        if (remainingDays <= 0) {
            // No interest for this month, set next run to next month
            await tx.loan.update({
                where: { id: loanId },
                data: {
                    nextInterestRunDate: startOfMonth(addMonths(now, 1)),
                    lastInterestRunDate: now
                }
            })
            return
        }

        const principal = new Prisma.Decimal(loan.amount)
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
                postedAt: now
            }
        })

        // 4. Post to General Ledger (optional - don't fail if mappings missing)
        try {
            await AccountingService.postLoanEvent(loanId, 'INTEREST_ACCRUAL', interestAmount.toNumber(), tx)
        } catch (glError: any) {
            console.warn(`[InterestEngine] GL posting failed for loan ${loanId}:`, glError.message)
            // Continue anyway - LoanTransaction was created
        }
    }

    /**
     * Trigger B: Monthly Batch Run
     * Called by Cron Job.
     * Strict Idempotency: Uses nextInterestRunDate.
     */
    static async processMonthlyBatch() {
        const now = new Date()

        // Fetch all candidate loans
        const loans = await prisma.loan.findMany({
            where: {
                status: 'ACTIVE',
                nextInterestRunDate: { lte: now }
            },
            take: 100 // Process in chunks to avoid timeout?? User asked for "Error isolation".
            // Loop and process individually.
        })

        console.log(`[InterestEngine] Current time: ${now.toISOString()}`)
        console.log(`[InterestEngine] Found ${loans.length} loans to process due before ${now.toISOString()}`)

        if (loans.length > 0) {
            console.log(`[InterestEngine] Loan details:`, loans.map(l => ({
                id: l.loanApplicationNumber,
                nextRun: l.nextInterestRunDate?.toISOString(),
                balance: l.current_balance,
                rate: l.interestRatePerMonth
            })))
        }

        const results = { success: 0, failed: 0, errors: [] as any[] }

        for (const loan of loans) {
            try {
                // Isolate each loan in its own transaction
                await prisma.$transaction(async (tx) => {
                    // Re-check lock (Double check for safety)
                    const currentLoan = await tx.loan.findUnique({ where: { id: loan.id } })
                    if (!currentLoan || currentLoan.status !== 'ACTIVE' || (currentLoan.nextInterestRunDate && currentLoan.nextInterestRunDate > now)) {
                        return // Skip if changed
                    }

                    // Calculate Monthly Interest
                    // Interest = Outstanding Balance * Monthly Rate
                    const balance = new Prisma.Decimal(currentLoan.current_balance)
                    const rate = new Prisma.Decimal(currentLoan.interestRatePerMonth || 0).div(100)
                    const interestAmount = balance.mul(rate)

                    if (interestAmount.gt(0)) {
                        // 1. Create Posting
                        await tx.interestPosting.create({
                            data: {
                                loanId: loan.id,
                                amount: interestAmount,
                                periodMonth: now.getMonth() + 1,
                                periodYear: now.getFullYear(),
                                type: InterestPostingType.MONTHLY_ACCRUAL
                            }
                        })

                        // 2. Update Loan
                        await tx.loan.update({
                            where: { id: loan.id },
                            data: {
                                current_balance: { increment: interestAmount.toNumber() },
                                accruedInterestTotal: { increment: interestAmount },
                                lastInterestRunDate: now,
                                nextInterestRunDate: startOfMonth(addMonths(now, 1)) // Push to next month
                            }
                        })

                        // 3. Create LoanTransaction (so it appears in statement)
                        await tx.loanTransaction.create({
                            data: {
                                loanId: loan.id,
                                type: 'INTEREST',
                                amount: interestAmount.toNumber(),
                                description: `Monthly Interest Accrual - ${now.toLocaleDateString()}`,
                                postedAt: now
                            }
                        })

                        // 4. Post to Ledger (optional - don't fail if mappings missing)
                        try {
                            await AccountingService.postLoanEvent(loan.id, 'INTEREST_ACCRUAL', interestAmount.toNumber(), tx)
                        } catch (glError: any) {
                            console.warn(`[InterestEngine] GL posting failed for loan ${loan.id}:`, glError.message)
                            // Continue anyway - LoanTransaction was created
                        }
                    } else {
                        // Just bump the date if 0 balance or 0 rate
                        await tx.loan.update({
                            where: { id: loan.id },
                            data: {
                                nextInterestRunDate: startOfMonth(addMonths(now, 1))
                            }
                        })
                    }
                })
                results.success++
            } catch (error: any) {
                console.error(`[InterestEngine] Failed to process loan ${loan.id}:`, error)
                results.failed++
                results.errors.push({ loanId: loan.id, error: error.message })
            }
        }

        return results
    }
}
