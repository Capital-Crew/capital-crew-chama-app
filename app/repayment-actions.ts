'use server'

import { z } from 'zod'
import prisma from '@/lib/prisma'
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
        return await prisma.$transaction(async (tx) => {
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
            const pastRepayments = await tx.journalEntry.aggregate({
                _sum: {
                    totalCredit: true
                },
                where: {
                    referenceId: loanId,
                    referenceType: 'LOAN_REPAYMENT'
                }
            })

            const totalRepaid = pastRepayments._sum.totalCredit || 0

            // 4. Calculate True Outstanding Balance
            // Formula: True Outstanding = Principal - Sum(Past Repayments)
            const trueOutstandingBalance = principal - totalRepaid

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
            const entryNumber = `JN-${Date.now()}`
            await tx.journalEntry.create({
                data: {
                    entryNumber,
                    transactionDate: new Date(),
                    referenceType: 'LOAN_REPAYMENT',
                    referenceId: loanId,
                    description: `Robust Repayment - Loan ${loanId}`,
                    totalDebit: repaymentAmount,
                    totalCredit: repaymentAmount,
                    createdBy: 'SYSTEM_ROBUST_ACTION',
                    createdByName: 'System',
                    lines: {
                        create: [
                            {
                                accountId: 'mock-cash-id', // Ideally fetch real account, but using placeholders for robustness robustness
                                description: 'Cash Received',
                                debitAmount: repaymentAmount,
                                creditAmount: 0,
                                account: { connect: { code: '1000' } } // Connect via code is safer
                            },
                            {
                                accountId: 'mock-loan-id',
                                description: 'Loan Principal Repayment',
                                debitAmount: 0,
                                creditAmount: repaymentAmount,
                                account: { connect: { code: '1200' } }
                            }
                        ]
                    }
                }
            })

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
