'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { ApprovalStatus, AuditLogAction, ExpenseStatus, SystemAccountType } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { getSystemMappingsDict } from './system-accounting'

const prisma = db

/**
 * Create a new expense request
 */
import { serializeFinancials, Serialized } from "@/lib/safe-serialization"
// ... existing imports ...

// ... existing code ...

/**
 * Create a new expense request
 */
export async function createExpenseRequest(data: {
    description: string
    amount: number
    date: Date
    expenseAccountId: string
    receiptUrl?: string
}): Promise<Serialized<any>> {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    try {
        const expense = await prisma.expense.create({
            data: {
                description: data.description,
                amount: data.amount,
                date: data.date,
                expenseAccountId: data.expenseAccountId,
                receiptUrl: data.receiptUrl,
                status: ExpenseStatus.PENDING,
                requesterId: session.user.id!
            }
        })

        // Audit Log
        await prisma.auditLog.create({
            data: {
                userId: session.user.id!,
                action: AuditLogAction.EXPENSE_REQUESTED,
                details: `Requested Expense: ${data.description} (KES ${data.amount})`
            }
        })

        revalidatePath('/accounts')
        return serializeFinancials({ success: true, expense })
    } catch (error: any) {
        console.error("Failed to create expense request:", error)
        return serializeFinancials({ success: false, error: error.message })
    }
}

/**
 * Approve an expense request
 */
export async function approveExpense(expenseId: string, notes?: string): Promise<Serialized<any>> {
    const session = await auth()

    // Strict Admin Check
    if (!session?.user || !['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN'].includes(session.user.role)) {
        throw new Error("Unauthorized: Only admins can approve expenses")
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const expense = await tx.expense.findUnique({
                where: { id: expenseId },
                include: { requester: true, approvals: true, expenseAccount: true }
            })

            if (!expense) throw new Error("Expense not found")
            if (expense.status !== 'PENDING') throw new Error("Expense is not pending approval")

            // Prevent self-approval if desired (though "2 approvals" allows it if user is admin)
            // But usually creator shouldn't approve.
            if (expense.requesterId === session.user.id) {
                // For testing/small teams, we might allow this, but let's enforce "non-members" (other officials) rule roughly?
                // The prompt said "approved by two other non-members". "Other" implies not the creator.
                throw new Error("You cannot approve your own expense request")
            }

            // Check if already approved by this user
            const existingApproval = expense.approvals.find(a => a.userId === session.user.id)
            if (existingApproval) throw new Error("You have already approved this expense")

            // Record Approval
            await tx.expenseApproval.create({
                data: {
                    expenseId,
                    userId: session.user.id!,
                    status: ApprovalStatus.APPROVED,
                }
            })

            // Audit the approval vote
            await tx.auditLog.create({
                data: {
                    userId: session.user.id!,
                    action: AuditLogAction.EXPENSE_APPROVED,
                    details: `Approved Expense: ${expense.description}`
                }
            })

            // Check if we have 2 approvals now
            const approvalCount = await tx.expenseApproval.count({
                where: { expenseId, status: 'APPROVED' }
            })

            let isFinalized = false

            if (approvalCount >= 2) {
                // FINALIZATION: Post to Ledger
                // Import AccountingEngine dynamically if needed to avoid circulars, or use helper
                const { AccountingEngine } = await import('@/lib/accounting/AccountingEngine')

                const mappings = await getSystemMappingsDict()
                const paymentSourceAccountId = await getPaymentSourceAccountId(mappings, tx)

                if (!paymentSourceAccountId) {
                    throw new Error("⚠️ Configuration Required: Please map the 'Expense Payment Source' GL account in the Ledger Config tab before approving expenses.")
                }

                // 1. Create JE via AccountingEngine
                // Dr Expense Account
                // Cr Bank/Cash (Payment Source)

                await AccountingEngine.postJournalEntry({
                    transactionDate: new Date(),
                    referenceType: 'MANUAL_ADJUSTMENT', // Or EXPENSE_PAYMENT if enum exists
                    referenceId: expense.id,
                    description: `Expense Payment: ${expense.description}`,
                    createdBy: session.user.id!,
                    createdByName: session.user.name || 'Admin',
                    lines: [
                        {
                            accountId: expense.expenseAccountId,
                            debitAmount: Number(expense.amount),
                            creditAmount: 0,
                            description: expense.description
                        },
                        {
                            accountId: paymentSourceAccountId,
                            debitAmount: 0,
                            creditAmount: Number(expense.amount),
                            description: `Payment for Expense`
                        }
                    ]
                }, tx)

                // 2. Update Status
                await tx.expense.update({
                    where: { id: expenseId },
                    data: { status: 'APPROVED' }
                })

                isFinalized = true

                // Audit
                await tx.auditLog.create({
                    data: {
                        userId: session.user.id!,
                        action: AuditLogAction.EXPENSE_PAID,
                        details: `Expense ${expense.description} Finalized and Paid (KES ${expense.amount})`
                    }
                })
            }

            return { success: true, isFinalized }
        })

        revalidatePath('/accounts')
        return serializeFinancials(result)

    } catch (error: any) {
        return serializeFinancials({ success: false, error: error.message })
    }
}

/**
 * Get Expenses
 */
export async function getExpenses(): Promise<Serialized<any>> {
    const expenses = await prisma.expense.findMany({
        include: {
            requester: { select: { name: true, role: true } },
            expenseAccount: { select: { name: true, code: true } },
            approvals: { include: { user: { select: { name: true } } } }
        },
        orderBy: { createdAt: 'desc' }
    })
    return serializeFinancials(expenses)
}

// Helper to resolve the credit account
async function getPaymentSourceAccountId(mappings: Record<string, string>, tx: any) {
    // Look for EVENT_EXPENSE_PAYMENT
    const mappedCode = mappings[SystemAccountType.EVENT_EXPENSE_PAYMENT]
    if (!mappedCode) return null

    const account = await tx.ledgerAccount.findUnique({ where: { code: mappedCode } })
    return account?.id
}
