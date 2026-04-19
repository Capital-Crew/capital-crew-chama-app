'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { MESSAGES } from "@/lib/constants/messages"
import { AuditLogAction, ExpenseType } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { serializeFinancials, Serialized } from "@/lib/safe-serialization"
import { ExpenseService } from '@/lib/services/ExpenseService'
import { withAudit } from '@/lib/with-audit'

const prisma = db

/**
 * Create a new expense request
 */
export const createExpenseRequest = withAudit(
    { actionType: AuditLogAction.EXPENSE_REQUESTED, domain: 'FINANCE', apiRoute: '/api/finance/expense/create' },
    async (ctx, data: {
        description: string
        amount: number
        date: Date
        expenseAccountId: string
        subCategoryId?: string
        recipientId?: string
        type?: ExpenseType
        receiptUrl?: string
    }): Promise<Serialized<any>> => {
        ctx.beginStep('Verify Authorization');
        const session = await auth()
        if (!session?.user?.id) {
            ctx.setErrorCode('UNAUTHORIZED');
            throw new Error(MESSAGES.AUTH.UNAUTHORIZED)
        }

        try {
            ctx.beginStep('Execute Expense Creation');
            const expense = await ExpenseService.createExpense({
                description: data.description,
                amount: data.amount,
                date: data.date,
                expenseAccountId: data.expenseAccountId,
                subCategoryId: data.subCategoryId,
                recipientId: data.recipientId,
                type: data.type,
                receiptUrl: data.receiptUrl,
                requesterId: session.user.id,
                status: 'DRAFT' as any // Start as DRAFT — user must explicitly send for approval
            })
            ctx.captureAfter(expense);
            ctx.endStep('Execute Expense Creation');

            revalidatePath('/accounts')
            return serializeFinancials({ success: true, expense })
        } catch (error: any) {
            ctx.setErrorCode('EXPENSE_CREATION_FAILED');
            return serializeFinancials({ success: false, error: error.message })
        }
    }
);

/**
 * Approve an expense request (Wrapper for Workflow)
 */
export const approveExpense = withAudit(
    { actionType: AuditLogAction.EXPENSE_APPROVED, domain: 'FINANCE', apiRoute: '/api/finance/expense/approve' },
    async (ctx, expenseId: string, notes?: string): Promise<Serialized<any>> => {
        ctx.beginStep('Verify Authorization');
        const session = await auth()
        if (!session?.user?.id) {
            ctx.setErrorCode('UNAUTHORIZED');
            throw new Error(MESSAGES.AUTH.UNAUTHORIZED)
        }

        ctx.beginStep('Validation');
        const request = await prisma.workflowRequest.findFirst({
            where: { entityId: expenseId, entityType: 'EXPENSE', status: 'PENDING' }
        })

        if (!request) {
            ctx.setErrorCode('REQUEST_NOT_FOUND');
            throw new Error(MESSAGES.EXPENSE.NO_WORKFLOW)
        }
        ctx.captureBefore('WorkflowRequest', request.id, request);

        try {
            ctx.beginStep('Process Workflow Action');
            const { processWorkflowAction } = await import('@/app/actions/workflow-engine')
            await processWorkflowAction(request.id, 'APPROVED', notes)
            ctx.endStep('Process Workflow Action');

            return { success: true }
        } catch (e: any) {
            ctx.setErrorCode('APPROVAL_FAILED');
            return serializeFinancials({ success: false, error: e.message })
        }
    }
);

/**
 * FINALIZATION LOGIC (Called by Workflow Engine)
 */
export async function finalizeExpense(expenseId: string, tx: any) {
    return await ExpenseService.finalizeExpense(expenseId, tx)
}

/**
 * submitExpenseSurrender
 */
export const submitExpenseSurrender = withAudit(
    { actionType: AuditLogAction.FINANCIAL_RECORD_RECORDED, domain: 'FINANCE', apiRoute: '/api/finance/expense/surrender' },
    async (ctx, expenseId: string, actualAmount: number, receiptUrl?: string) => {
        ctx.beginStep('Verify Authorization');
        const session = await auth()
        if (!session?.user?.id) {
            ctx.setErrorCode('UNAUTHORIZED');
            throw new Error(MESSAGES.AUTH.UNAUTHORIZED)
        }

        ctx.beginStep('Capture Initial State');
        const existingExpense = await prisma.expense.findFirst({ where: { id: expenseId } });
        if (existingExpense) ctx.captureBefore('Expense', expenseId, existingExpense);

        try {
            ctx.beginStep('Execute Surrender Service');
            const updated = await ExpenseService.submitSurrender(
                expenseId,
                actualAmount,
                session.user.id,
                session.user.name || 'User',
                receiptUrl
            )
            ctx.captureAfter(updated);
            ctx.endStep('Execute Surrender Service');

            revalidatePath('/accounts')
            return serializeFinancials({ success: true, expense: updated })
        } catch (error: any) {
            ctx.setErrorCode('SURRENDER_FAILED');
            return serializeFinancials({ success: false, error: error.message })
        }
    }
);

/**
 * Approve a Claim (Reimbursement)
 */
export async function approveReimbursementClaim(expenseId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error(MESSAGES.AUTH.UNAUTHORIZED)
    const allowedRoles = ['SYSTEM_ADMIN', 'CHAIRPERSON', 'TREASURER']
    if (!allowedRoles.includes(session.user.role as string)) throw new Error(MESSAGES.AUTH.FORBIDDEN)

    return await prisma.$transaction(async (tx) => {
        await ExpenseService.finalizeExpense(expenseId, tx)
        return { success: true }
    })
}

// ─── APPROVAL WORKFLOW ACTIONS ──────────────────────────────────────────────

/**
 * Get the live workflow status for an expense — used to power the approval panel.
 */
export async function getExpenseWorkflowStatus(expenseId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error(MESSAGES.AUTH.UNAUTHORIZED)

    const request = await prisma.workflowRequest.findFirst({
        where: { entityId: expenseId, entityType: 'EXPENSE' },
        include: {
            currentStage: true,
            actions: {
                include: { actor: { select: { id: true, name: true, role: true } } },
                orderBy: { createdAt: 'asc' } as any
            }
        },
        orderBy: { createdAt: 'desc' }
    })

    return serializeFinancials({ request, currentUserId: session.user.id, currentUserRole: session.user.role })
}

/**
 * Send an expense for approval — moves it from DRAFT → PENDING_APPROVAL and creates the workflow.
 */
export async function sendExpenseForApproval(expenseId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error(MESSAGES.AUTH.UNAUTHORIZED)

    const expense = await prisma.expense.findUnique({ where: { id: expenseId } })
    if (!expense) throw new Error(MESSAGES.EXPENSE.NOT_FOUND)
    if (expense.status !== 'DRAFT') throw new Error(MESSAGES.EXPENSE.INVALID_STATUS(expense.status))

    // Check no active workflow already
    const existing = await db.workflowRequest.findFirst({
        where: { entityId: expenseId, entityType: 'EXPENSE', status: 'PENDING' }
    })
    if (existing) throw new Error(MESSAGES.EXPENSE.ALREADY_PENDING)

    const { initiateWorkflow } = await import('@/app/actions/workflow-engine')
    await initiateWorkflow('EXPENSE', expenseId, session.user.id)

    await prisma.expense.update({
        where: { id: expenseId },
        data: { status: 'PENDING_APPROVAL' }
    })

    revalidatePath('/accounts')
    return { success: true }
}

/**
 * Cancel an in-flight expense approval — resets to DRAFT so it can be edited and re-sent.
 */
export async function cancelExpenseApproval(expenseId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error(MESSAGES.AUTH.UNAUTHORIZED)

    const request = await db.workflowRequest.findFirst({
        where: { entityId: expenseId, entityType: 'EXPENSE', status: 'PENDING' }
    })
    if (!request) throw new Error(MESSAGES.EXPENSE.NO_WORKFLOW)

    // Delete all actions then the request
    await prisma.workflowAction.deleteMany({ where: { requestId: request.id } })
    await prisma.workflowRequest.delete({ where: { id: request.id } })

    await prisma.expense.update({
        where: { id: expenseId },
        data: { status: 'DRAFT' }
    })

    revalidatePath('/accounts')
    return { success: true }
}

/**
 * Admin vote on an expense — APPROVE or REJECT.
 */
export async function voteOnExpenseApproval(expenseId: string, action: 'APPROVED' | 'REJECTED', notes?: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error(MESSAGES.AUTH.UNAUTHORIZED)

    const adminRoles = ['SYSTEM_ADMIN', 'CHAIRPERSON', 'TREASURER', 'SECRETARY']
    if (!adminRoles.includes(session.user.role as string)) throw new Error(MESSAGES.AUTH.FORBIDDEN)

    const request = await db.workflowRequest.findFirst({
        where: { entityId: expenseId, entityType: 'EXPENSE', status: 'PENDING' }
    })
    if (!request) throw new Error(MESSAGES.EXPENSE.NO_WORKFLOW)

    const { processWorkflowAction } = await import('@/app/actions/workflow-engine')
    await processWorkflowAction(request.id, action as any, notes)

    // If rejected, update expense status
    if (action === 'REJECTED') {
        await prisma.expense.update({
            where: { id: expenseId },
            data: { status: 'REJECTED' }
        })
    }

    revalidatePath('/accounts')
    return { success: true }
}

/**
 * Get Expenses
 */
export async function getExpenses(): Promise<Serialized<any>> {
    const session = await auth()
    if (!session?.user?.id) throw new Error(MESSAGES.AUTH.UNAUTHORIZED)

    const expenses = await prisma.expense.findMany({
        include: {
            requester: { select: { id: true, name: true, role: true } },
            recipient: { select: { id: true, name: true } },
            expenseAccount: { select: { name: true, code: true } },
            subCategory: true
        },
        orderBy: { createdAt: 'desc' }
    })

    // Enrich with workflow status
    const enrichedExpenses = await Promise.all(expenses.map(async (expense) => {
        const workflow = await prisma.workflowRequest.findFirst({
            where: { entityId: expense.id, entityType: 'EXPENSE' },
            include: {
                currentStage: true,
                actions: {
                    include: { actor: { select: { id: true, name: true, role: true } } },
                    orderBy: { createdAt: 'asc' } as any
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return {
            ...expense,
            workflow
        }
    }))

    return serializeFinancials(enrichedExpenses)
}

/**
 * Get Expense Categories (Groups + SubCategories) for dropdowns
 */
export async function getExpenseCategories() {
    const session = await auth()
    if (!session?.user?.id) throw new Error(MESSAGES.AUTH.UNAUTHORIZED)

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
