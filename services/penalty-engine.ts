
import { db } from '@/lib/db'
import { AccountingService } from '@/lib/accounting/AccountingEngine'

import { Prisma, RepaymentInstallment } from '@prisma/client'
import { differenceInDays, startOfDay } from 'date-fns'

const prisma = db

export class PenaltyService {

    /**
     * Daily Job to check and apply penalties
     */
    static async runDailyCheck() {
        console.log('🔄 Starting Daily Penalty Check...')
        const today = startOfDay(new Date())
        const results = { processed: 0, penaltiesApplied: 0, errors: [] as any[] }

        // 1. Find overdue installments that haven't been penalized
        // We look for ACTIVE loans with overdue schedules
        // Query logic:
        // - Loan is ACTIVE
        // - Schedule Item is NOT Fully Paid
        // - Schedule Item Due Date < Today (Past Due)
        // - Penalty Status is NONE
        const overdueItems = await prisma.repaymentInstallment.findMany({
            where: {
                loan: { status: 'ACTIVE' },
                isFullyPaid: false,
                dueDate: { lt: today }, // Strictly past due
                penaltyDue: { equals: 0 } // Not yet penalized
            },
            include: {
                loan: {
                    include: { member: true }
                }
            }
        })

        console.log(`Found ${overdueItems.length} candidate overdue installments.`)

        for (const item of overdueItems) {
            try {
                // No Grace Period: Penalties apply immediately via the daily check
                await this.applyPenalty(item)
                results.penaltiesApplied++
            } catch (error: any) {
                console.error(`Failed to apply penalty for Loan ${item.loan.loanApplicationNumber}:`, error)
                results.errors.push({ loanId: item.loanId, error: error.message })
            }
            results.processed++
        }

        return results
    }

    private static async applyPenalty(item: RepaymentInstallment & { loan: any }) {
        // 3. Calculate Penalty Amount
        const principalDue = new Prisma.Decimal(item.principalDue)
        const interestDue = new Prisma.Decimal(item.interestDue)
        const principalPaid = new Prisma.Decimal(item.principalPaid)
        const interestPaid = new Prisma.Decimal(item.interestPaid)

        // Base Amount = (Due - Paid) -> Outstanding for this installment
        const outstandingPrincipal = principalDue.sub(principalPaid)
        const outstandingInterest = interestDue.sub(interestPaid)
        const baseAmount = outstandingPrincipal.add(outstandingInterest)

        if (baseAmount.lte(0)) {
            // Should be marked paid? Skip for now.
            return
        }

        const penaltyRate = new Prisma.Decimal(item.loan.penaltyRate || 5.0)
        const penaltyAmount = baseAmount.mul(penaltyRate).div(100)

        if (penaltyAmount.lte(0)) return

        console.log(`Applying Penalty: Loan ${item.loan.loanApplicationNumber}, Inst #${item.installmentNumber}, Base ${baseAmount}, Rate ${penaltyRate}%, Amount ${penaltyAmount}`)

        // 4. Atomic Execution
        await prisma.$transaction(async (tx) => {
            // Re-check idempotency inside TX
            const currentItem = await tx.repaymentInstallment.findUnique({
                where: { id: item.id }
            })
            if (!currentItem || currentItem.penaltyDue.toNumber() > 0) {
                return // Already processed
            }

            // A. Update RepaymentSchedule
            await tx.repaymentInstallment.update({
                where: { id: item.id },
                data: {
                    penaltyDue: penaltyAmount
                }
            })

            // B. Update Loan Balance (Add penalty to total debt)
            // Note: `current_balance` tracks total outstanding. Penalties increase it.
            // Also track total penalties charged
            await tx.loan.update({
                where: { id: item.loanId },
                data: {
                    current_balance: { increment: penaltyAmount.toNumber() },
                    penalties: { increment: penaltyAmount.toNumber() }
                }
            })

            // C. Post Journal Entry (Dr Member Loan / Cr Penalty Income)
            // We reuse AccountingEngine
            // C. Post Journal Entry (Dr Member Loan / Cr Penalty Income)
            // We reuse AccountingEngine
            // C. Post Journal Entry (Dr Member Loan / Cr Penalty Income)
            // We reuse AccountingEngine
            await AccountingService.postLoanEvent(item.loanId, 'PENALTY_APPLIED', penaltyAmount.toNumber(), tx)

            // D. Create Journey Event
            await (tx as any).loanJourneyEvent.create({
                data: {
                    loanId: item.loanId,
                    eventType: 'PENALTY_APPLIED',
                    description: `Penalty of KES ${penaltyAmount} applied for missed installment #${item.installmentNumber}`,
                    actorId: 'SYSTEM',
                    actorName: 'System',
                    metadata: {
                        installmentNumber: item.installmentNumber,
                        daysOverdue: differenceInDays(new Date(), item.dueDate),
                        baseAmount: baseAmount.toNumber(),
                        penaltyAmount: penaltyAmount.toNumber()
                    }
                }
            })

            // E. Notify Member? (Optional, maybe later)
        })
    }
}


