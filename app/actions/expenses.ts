import { auth } from '@/auth'
import { db } from '@/lib/db'
import { ApprovalStatus, AuditLogAction, ExpenseStatus, ExpenseType } from '@prisma/client'
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
            throw new Error("Unauthorized")
        }

        try {
            ctx.beginStep('Execute Expense Creation');
            const expense = await ExpenseService.createExpense({
                ...data,
                requesterId: session.user.id
            })
            ctx.captureAfter(expense);
            ctx.endStep('Execute Expense Creation');

            ctx.beginStep('Initiate Approval Workflow');
            try {
                const { initiateWorkflow } = await import('@/app/actions/workflow-engine')
                await initiateWorkflow('EXPENSE', expense.id, session.user.id)
            } catch (e) { }
            ctx.endStep('Initiate Approval Workflow');

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
            throw new Error("Unauthorized")
        }

        ctx.beginStep('Validation');
        const request = await prisma.workflowRequest.findFirst({
            where: { entityId: expenseId, entityType: 'EXPENSE', status: 'PENDING' }
        })

        if (!request) {
            ctx.setErrorCode('REQUEST_NOT_FOUND');
            throw new Error("No active approval request found for this expense")
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
            throw new Error("Unauthorized")
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
