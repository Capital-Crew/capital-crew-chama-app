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
    subCategoryId?: string
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
                subCategoryId: data.subCategoryId || null,
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

        // Initiate Workflow
        try {
            const { initiateWorkflow } = await import('@/app/actions/workflow-engine')
            // EntityType.EXPENSE assumed valid enum
            await initiateWorkflow('EXPENSE', expense.id, session.user.id!)
        } catch (e) {
            console.error("Failed to initiate expense workflow:", e)
        }

        revalidatePath('/accounts')
        return serializeFinancials({ success: true, expense })
    } catch (error: any) {
        console.error("Failed to create expense request:", error)
        return serializeFinancials({ success: false, error: error.message })
    }
}

/**
 * Approve an expense request (Wrapper for Workflow)
 */
export async function approveExpense(expenseId: string, notes?: string): Promise<Serialized<any>> {
    try {
        // Find active workflow request
        const request = await prisma.workflowRequest.findFirst({
            where: { entityId: expenseId, entityType: 'EXPENSE', status: 'PENDING' }
        })

        if (!request) throw new Error("No active approval request found for this expense")

        // Call Workflow Engine
        const { processWorkflowAction } = await import('@/app/actions/workflow-engine')
        await processWorkflowAction(request.id, 'APPROVED', notes)

        return { success: true }
    } catch (e: any) {
        return serializeFinancials({ success: false, error: e.message })
    }
}

/**
 * FINALIZATION LOGIC (Called by Workflow Engine)
 */
export async function finalizeExpense(expenseId: string, tx: any) {
    const expense = await tx.expense.findUnique({
        where: { id: expenseId }
    })

    if (!expense) throw new Error("Expense not found during finalization")

    // Import AccountingEngine dynamically if needed to avoid circulars, or use helper
    const { AccountingEngine } = await import('@/lib/accounting/AccountingEngine')
    const mappings = await getSystemMappingsDict()
    const paymentSourceAccountId = await getPaymentSourceAccountId(mappings, tx)

    if (!paymentSourceAccountId) {
        throw new Error("⚠️ Configuration Required: Please map the 'Expense Payment Source' GL account in the Ledger Config tab.")
    }

    // 1. Create JE via AccountingEngine
    await AccountingEngine.postJournalEntry({
        transactionDate: new Date(),
        referenceType: 'MANUAL_ADJUSTMENT',
        referenceId: expense.id,
        description: `Expense Payment: ${expense.description}`,
        createdBy: expense.requesterId || 'SYSTEM',
        createdByName: 'Workflow Engine',
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

    // Audit
    await tx.auditLog.create({
        data: {
            userId: expense.requesterId || 'SYSTEM',
            action: AuditLogAction.EXPENSE_PAID,
            details: `Expense ${expense.description} Finalized and Paid (KES ${expense.amount})`
        }
    })
}

/**
 * Get Expenses
 */
export async function getExpenses(): Promise<Serialized<any>> {
    const expenses = await prisma.expense.findMany({
        include: {
            requester: { select: { id: true, name: true, role: true } },
            expenseAccount: { select: { name: true, code: true } },
            approvals: { include: { user: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: 'desc' }
    })
    return serializeFinancials(expenses)
}

/**
 * Get Expense Categories (Groups + SubCategories) for dropdowns
 */
export async function getExpenseCategories() {
    const groups = await prisma.expenseCategoryGroup.findMany({
        where: { isActive: true },
        include: {
            subCategories: {
                where: { isActive: true },
                orderBy: { sortOrder: 'asc' },
                select: { id: true, name: true, slug: true }
            }
        },
        orderBy: { sortOrder: 'asc' }
    })
    return groups
}

// Helper to resolve the credit account
async function getPaymentSourceAccountId(mappings: Record<string, string>, tx: any) {
    // Look for EVENT_EXPENSE_PAYMENT
    const mappedCode = mappings[SystemAccountType.EVENT_EXPENSE_PAYMENT]
    if (!mappedCode) return null

    const account = await tx.ledgerAccount.findUnique({ where: { code: mappedCode } })
    return account?.id
}
