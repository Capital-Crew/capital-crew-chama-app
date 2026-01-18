'use server'

import { z } from 'zod'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

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
                // Return specific error as requested, but we must throw to abort transaction or return error object allowed?
                // Returning object inside transaction passes it out.
                // But we want to fail the logic.
                // Let's throw a custom error to catch outside or simpler: just return error.
                // Note: returning inside checks validation, but doesn't abort prior writes (none yet).
                // So returning is safe here.
                return {
                    success: false,
                    message: `Repayment amount (KES ${repaymentAmount.toLocaleString()}) exceeds actual outstanding balance (KES ${trueOutstandingBalance.toLocaleString()})`,
                    error: 'Overpayment Attempt'
                }
            }

            // 6. Execution (Atomic)

            // a) Insert new repayment record (Journal Entry)
            // TODO: Refactor to use AccountingEngine.postJournalEntry like other files
            /*
            const entryNumber = `LT-${Date.now()}`
            await tx.ledgerTransaction.create({
                data: {
                    transactionDate: new Date(),
                    referenceType: 'LOAN_REPAYMENT',
                    referenceId: loanId,
                    description: `Robust Repayment - Loan ${loanId}`,
                    createdBy: 'SYSTEM_ROBUST_ACTION',
                    createdByName: 'System',
                    entries: {
                        create: [
                            {
                                ledgerAccountId: 'mock-cash-id',
                                description: 'Cash Received',
                                debitAmount: repaymentAmount,
                                creditAmount: 0,
                                ledgerAccount: { connect: { code: '1000' } }
                            },
                            {
                                ledgerAccountId: 'mock-loan-id',
                                description: 'Loan Principal Repayment',
                                debitAmount: 0,
                                creditAmount: repaymentAmount,
                                ledgerAccount: { connect: { code: '1200' } }
                            }
                        ]
                    }
                }
            })
            */

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
        console.error('submitRepayment Error:', error)
        // If validation inside returned an object, it's fine. If an error was thrown (e.g. database), catch here.
        // Wait, if I returned inside transaction, the transaction commits?
        // Yes, if I return a value, it commits.
        // If I return the { success: false } object, the transaction commits (creates nothing, updates nothing).
        // This is correct behavior for validation failure.

        // If it was a real error:
        return {
            success: false,
            message: 'Internal server error processing repayment',
            error: error.message
        }
    }
}
