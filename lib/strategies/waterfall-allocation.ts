import { Prisma, PrismaClient } from '@prisma/client';
import { LoanBalanceService } from '@/services/loan-balance';

/**
 * Waterfall Allocation Strategy
 * 
 * Implements Fineract-style "Horizontal Allocation" for loan repayments:
 * - Allocates payments across installments in chronological order (oldest first)
 * - Within each installment: Penalty → Interest → Principal
 * - Handles overpayment by reducing main loan principal
 * - Updates RepaymentSchedule records atomically
 * - Creates immutable LoanTransaction records
 */

type PrismaTransaction = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export class WaterfallAllocation {
    /**
     * Allocate a repayment amount across loan installments using waterfall logic
     * 
     * @param loanId - The loan to apply the payment to
     * @param amount - The payment amount (as number, will be converted to Decimal)
     * @param tx - Prisma transaction client
     * @returns Allocation breakdown
     */
    static async allocate(
        loanId: string,
        amount: number,
        tx: PrismaTransaction,
        options: {
            type?: 'REPAYMENT' | 'WAIVER',
            description?: string,
            postedAt?: Date,
            referenceId?: string
        } = {}
    ): Promise<{
        penalty: number;
        interest: number;
        principal: number;
        overpayment: number;
    }> {
        const { type = 'REPAYMENT', description } = options;
        // Convert to Decimal for precise calculations
        const amountDecimal = new Prisma.Decimal(amount);

        // 1. Fetch Schedules (Oldest First, Unpaid Only)
        const schedules = await tx.repaymentInstallment.findMany({
            where: {
                loanId,
                isFullyPaid: false
            },
            orderBy: { installmentNumber: 'asc' } // Changed from dueDate to installmentNumber for strict sequencing
        });

        let remaining = amountDecimal;
        let totalPenalty = new Prisma.Decimal(0);
        let totalInterest = new Prisma.Decimal(0);
        let totalPrincipal = new Prisma.Decimal(0);

        // 2. Iterate and Fill Buckets (Waterfall Pattern)
        for (const schedule of schedules) {
            if (remaining.lte(0)) break;

            // --- Bucket A: Penalties ---
            const penaltyDue = schedule.penaltyDue.minus(schedule.penaltyPaid);
            const payPenalty = Prisma.Decimal.min(remaining, penaltyDue);

            if (payPenalty.gt(0)) {
                schedule.penaltyPaid = schedule.penaltyPaid.add(payPenalty);
                totalPenalty = totalPenalty.add(payPenalty);
                remaining = remaining.minus(payPenalty);
            }

            // --- Bucket B: Interest ---
            if (remaining.lte(0)) {
                await this.updateSchedule(tx, schedule);
                continue;
            }

            const interestDue = schedule.interestDue.minus(schedule.interestPaid);
            const payInterest = Prisma.Decimal.min(remaining, interestDue);

            if (payInterest.gt(0)) {
                schedule.interestPaid = schedule.interestPaid.add(payInterest);
                totalInterest = totalInterest.add(payInterest);
                remaining = remaining.minus(payInterest);
            }

            // --- Bucket C: Principal ---
            if (remaining.lte(0)) {
                await this.updateSchedule(tx, schedule);
                continue;
            }

            const principalDue = schedule.principalDue.minus(schedule.principalPaid);
            const payPrincipal = Prisma.Decimal.min(remaining, principalDue);

            if (payPrincipal.gt(0)) {
                schedule.principalPaid = schedule.principalPaid.add(payPrincipal);
                totalPrincipal = totalPrincipal.add(payPrincipal);
                remaining = remaining.minus(payPrincipal);
            }

            // Update Schedule Row
            await this.updateSchedule(tx, schedule);
        }

        // 3. Handle Excess (Overpayment) - Only for Repayments
        let overpayment = new Prisma.Decimal(0);
        if (remaining.gt(0) && type === 'REPAYMENT') {
            overpayment = remaining;
            totalPrincipal = totalPrincipal.add(remaining);
            remaining = new Prisma.Decimal(0);
        }

        // 4. Update Loan Record (Balance and Accrued Totals)
        await tx.loan.update({
            where: { id: loanId },
            data: {
                // Decrement current balance by total amount (P+I+Pen)
                current_balance: { decrement: amountDecimal.toNumber() },
                // Sync Accrued Totals
                accruedInterestTotal: { decrement: totalInterest },
                penalties: { decrement: totalPenalty }
            }
        });

        // 4. Record the Transaction
        const finalDescription = description || (type === 'WAIVER' 
            ? `Waiver with Waterfall Allocation (P: ${totalPenalty.toFixed(2)}, I: ${totalInterest.toFixed(2)}, Pr: ${totalPrincipal.toFixed(2)})`
            : `Wallet Repayment with Waterfall Allocation (P: ${totalPenalty.toFixed(2)}, I: ${totalInterest.toFixed(2)}, Pr: ${totalPrincipal.toFixed(2)})`);

        const { postedAt, referenceId } = options;

        await tx.loanTransaction.create({
            data: {
                loanId,
                type: type,
                amount: amountDecimal,
                principalAmount: totalPrincipal,
                interestAmount: totalInterest,
                penaltyAmount: totalPenalty,
                description: finalDescription,
                postedAt: postedAt || new Date(),
                transactionDate: postedAt || new Date(),
                referenceId: referenceId
            }
        });

        // 5. Update Loan Balance (Derived from Ledger)
        await LoanBalanceService.updateLoanBalance(loanId, tx);

        return {
            penalty: totalPenalty.toNumber(),
            interest: totalInterest.toNumber(),
            principal: totalPrincipal.toNumber(),
            overpayment: overpayment.toNumber()
        };
    }

    /**
     * Update a repayment schedule and mark as fully paid if complete
     */
    private static async updateSchedule(
        tx: PrismaTransaction,
        schedule: {
            id: string;
            principalDue: Prisma.Decimal;
            interestDue: Prisma.Decimal;
            penaltyDue: Prisma.Decimal;
            principalPaid: Prisma.Decimal;
            interestPaid: Prisma.Decimal;
            penaltyPaid: Prisma.Decimal;
        }
    ) {
        // Check if installment is fully paid
        const isPaid =
            schedule.principalPaid.gte(schedule.principalDue) &&
            schedule.interestPaid.gte(schedule.interestDue) &&
            schedule.penaltyPaid.gte(schedule.penaltyDue);

        // Update DB Row
        await tx.repaymentInstallment.update({
            where: { id: schedule.id },
            data: {
                penaltyPaid: schedule.penaltyPaid,
                interestPaid: schedule.interestPaid,
                principalPaid: schedule.principalPaid,
                isFullyPaid: isPaid
            }
        });
    }
}
