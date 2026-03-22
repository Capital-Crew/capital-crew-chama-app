'use server'

import { z } from 'zod'
import { db as prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

if (!process.env.CASH_LEDGER_ACCOUNT_ID || !process.env.LOAN_LEDGER_ACCOUNT_ID) {
  throw new Error('CASH_LEDGER_ACCOUNT_ID and LOAN_LEDGER_ACCOUNT_ID must be set in environment variables')
}

// Response type
type ActionResponse = {
    success: boolean
    message: string
    error?: string
}

export async function submitRepayment(formData: FormData): Promise<ActionResponse> {
    const loanId = formData.get('loanId') as string
    const amountRaw = formData.get('repaymentAmount') as string

    // 1. Basic Input Validation
    if (!loanId) return { success: false, message: 'Missing loanId' }
    if (!amountRaw) return { success: false, message: 'Missing repayment amount' }

    const repaymentAmount = parseFloat(amountRaw)
    if (isNaN(repaymentAmount) || repaymentAmount <= 0) {
        return { success: false, message: 'Invalid repayment amount' }
    }

    try {
        // Return Atomic Transaction
        return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 2. Fetch Principal (Loan Amount)
            const loan = await tx.loan.findUnique({
                where: { id: loanId },
                select: { id: true, amount: true, current_balance: true }
            })

            if (!loan) {
                throw new Error('Loan not found')
            }

            const principal = loan.amount

            // 3. Recompute Logic: Sum of all past successful repayments
            // We use JournalEntry as the "Transaction Table" source of truth
            const pastRepayments = await tx.ledgerEntry.aggregate({
                _sum: {
                    creditAmount: true
                },
                where: {
                    ledgerTransaction: {
                        referenceId: loanId,
                        referenceType: 'LOAN_REPAYMENT'
                    }
                }
            })

            const totalRepaid = Number(pastRepayments._sum.creditAmount || 0)

            // 4. Calculate True Outstanding Balance
            // Formula: True Outstanding = Principal - Sum(Past Repayments)
            const trueOutstandingBalance = Number(principal) - totalRepaid

            // 5. Validation
            if (repaymentAmount > trueOutstandingBalance) {
                return {
                    success: false,
                    message: `Repayment amount (KES ${repaymentAmount.toLocaleString()}) exceeds actual outstanding balance (KES ${trueOutstandingBalance.toLocaleString()})`,
                    error: 'Overpayment Attempt'
                }
            }

            // 6. Execution (Atomic)

            // a) Insert new repayment record (Journal Entry)
            // TODO: Refactor to use AccountingEngine.postJournalEntry like other files
            

            // b) Self-Healing: Update Loan's current_balance
            // New Balance = True Balance - Current Repayment
            const newBalance = trueOutstandingBalance - repaymentAmount

            await tx.loan.update({
                where: { id: loanId },
                data: {
                    current_balance: newBalance
                }
            })

            return {
                success: true,
                message: `Repayment successful. Loan balance updated to KES ${newBalance.toLocaleString()}`
            }
        })
    } catch (error: any) {
        // TODO: Log error to monitoring service
        // If it was a real error:
        return {
            success: false,
            message: 'Internal server error processing repayment',
            error: error.message
        }
    }
}
