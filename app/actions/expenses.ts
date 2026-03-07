'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { ApprovalStatus, AuditLogAction, ExpenseStatus, ExpenseType } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { serializeFinancials, Serialized } from "@/lib/safe-serialization"
import { ExpenseService } from '@/lib/services/ExpenseService'

const prisma = db

/**
 * Create a new expense request
 */
export async function createExpenseRequest(data: {
    description: string
    amount: number
    date: Date
    expenseAccountId: string
    subCategoryId?: string
    recipientId?: string
    type?: ExpenseType
    receiptUrl?: string
}): Promise<Serialized<any>> {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    try {
        const expense = await ExpenseService.createExpense({
            ...data,
            requesterId: session.user.id
        })

        // Initiate Workflow
        try {
            const { initiateWorkflow } = await import('@/app/actions/workflow-engine')
            await initiateWorkflow('EXPENSE', expense.id, session.user.id)
        } catch (e) {
        }

        revalidatePath('/accounts')
        return serializeFinancials({ success: true, expense })
    } catch (error: any) {
        return serializeFinancials({ success: false, error: error.message })
    }
}

/**
 * Approve an expense request (Wrapper for Workflow)
 */
export async function approveExpense(expenseId: string, notes?: string): Promise<Serialized<any>> {
    try {
        const request = await prisma.workflowRequest.findFirst({
            where: { entityId: expenseId, entityType: 'EXPENSE', status: 'PENDING' }
        })

        if (!request) throw new Error("No active approval request found for this expense")

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
    return await ExpenseService.finalizeExpense(expenseId, tx)
}

/**
 * submitExpenseSurrender
 */
export async function submitExpenseSurrender(expenseId: string, actualAmount: number, receiptUrl?: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    try {
        const updated = await ExpenseService.submitSurrender(
            expenseId,
            actualAmount,
            session.user.id,
            session.user.name || 'User',
            receiptUrl
        )
        revalidatePath('/accounts')
        return serializeFinancials({ success: true, expense: updated })
    } catch (error: any) {
        return serializeFinancials({ success: false, error: error.message })
    }
}

/**
 * Approve a Claim (Reimbursement)
 */
export async function approveReimbursementClaim(expenseId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')
    const allowedRoles = ['SYSTEM_ADMIN', 'CHAIRPERSON', 'TREASURER']
    if (!allowedRoles.includes(session.user.role as string)) throw new Error('Forbidden: Insufficient permissions')

    return await prisma.$transaction(async (tx) => {
        await ExpenseService.finalizeExpense(expenseId, tx)
        return { success: true }
    })
}

/**
 * Get Expenses
 */
export async function getExpenses(): Promise<Serialized<any>> {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    const expenses = await prisma.expense.findMany({
        include: {
            requester: { select: { id: true, name: true, role: true } },
            recipient: { select: { id: true, name: true } },
            expenseAccount: { select: { name: true, code: true } },
            approvals: { include: { user: { select: { id: true, name: true } } } },
            subCategory: true
        },
        orderBy: { createdAt: 'desc' }
    })
    return serializeFinancials(expenses)
}

/**
 * Get Expense Categories (Groups + SubCategories) for dropdowns
 */
export async function getExpenseCategories() {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    return await prisma.expenseCategoryGroup.findMany({
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
}
