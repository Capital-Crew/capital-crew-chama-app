'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { ApprovalStatus, AuditLogAction, ExpenseStatus, SystemAccountType, ExpenseType } from '@prisma/client'
import { Decimal } from 'decimal.js'
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
    recipientId?: string        // NEW: Who gets paid
    type?: ExpenseType          // NEW: IMPREST, CLAIM, OPERATIONAL
    receiptUrl?: string
}): Promise<Serialized<any>> {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    const expenseType = data.type || ExpenseType.OPERATIONAL
    // For CLAIM/IMPREST, amount is requestedAmount
    // For OPERATIONAL, it is amount and requestedAmount

    try {
        const expense = await prisma.expense.create({
            data: {
                description: data.description,
                amount: data.type === ExpenseType.IMPREST ? 0 : data.amount, // Imprest "amount" is 0 until surrendered? No, it's an asset until then? Let's treat valid amount as requestedAmount.
                // Actually, let's store it in requestedAmount and amount for display compatibility
                requestedAmount: data.amount,
                // amount: data.amount, // REMOVED DUPLICATE

                date: data.date,
                expenseAccountId: data.expenseAccountId,
                subCategoryId: data.subCategoryId || null,
                recipientId: data.recipientId || null,
                type: expenseType,
                receiptUrl: data.receiptUrl,
                status: ExpenseStatus.PENDING_APPROVAL,
                requesterId: session.user.id!
            }
        })

        // Audit Log
        await prisma.auditLog.create({
            data: {
                userId: session.user.id!,
                action: AuditLogAction.EXPENSE_REQUESTED,
                details: `Requested ${expenseType} Expense: ${data.description} (KES ${data.amount})`
            }
        })

        // Initiate Workflow
        try {
            const { initiateWorkflow } = await import('@/app/actions/workflow-engine')
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
        where: { id: expenseId },
        include: { recipient: true, subCategory: true }
    })

    if (!expense) throw new Error("Expense not found during finalization")

    // Import AccountingEngine dynamically if needed to avoid circulars, or use helper
    const { AccountingEngine } = await import('@/lib/accounting/AccountingEngine')
    const mappings = await getSystemMappingsDict()

    // Determine Credit Account (Source of Funds)
    // If recipient is set, we still credit Cash/Bank (to pay them), OR we credit their Wallet (handled below)
    // Actually, usually Expense = Debit Expense, Credit Bank.
    // BUT if we are paying to a Member Wallet, we Credit Bank and Debit Wallet (Liability)? No.
    // If getting paid to Wallet: DR Expense, CR Member Wallet (Liability).
    // The Member then has funds in Wallet.

    let creditAccountId: string | null = null
    let isWalletTransaction = false
    let wallet: any = null

    if (expense.recipientId) {
        // Pay to Member Wallet
        wallet = await tx.wallet.findUnique({
            where: { memberId: expense.recipientId },
            include: { glAccount: true }
        })
        if (!wallet || !wallet.glAccount) throw new Error("Recipient member does not have an active wallet.")

        creditAccountId = wallet.glAccountId
        isWalletTransaction = true
    } else {
        // Pay from Bank (External Vendor / Cash)
        creditAccountId = await getPaymentSourceAccountId(mappings, tx)
    }

    if (!creditAccountId) {
        throw new Error("⚠️ Configuration Required: Please map the 'Expense Payment Source' GL account.")
    }

    const approvedAmount = expense.approvedAmount || expense.requestedAmount

    // 1. Create JE via AccountingEngine
    // DR Expense Account
    // CR Payment Source (Bank or Wallet)

    // WAIT! If we pay to wallet, we CREDIT Wallet (Structure: Liability).
    // Increasing Liability = Credit. Correct.
    // DR Expense (Equity down), CR Wallet (Liability up). Correct.

    await AccountingEngine.postJournalEntry({
        transactionDate: new Date(),
        referenceType: expense.type === ExpenseType.IMPREST ? 'LOAN_DISBURSEMENT' : 'EXPENSE_PAYOUT', // Use EXPENSE_PAYOUT generally
        referenceId: expense.id,
        description: `Expense Payment: ${expense.description}`,
        createdBy: expense.requesterId || 'SYSTEM',
        createdByName: 'Workflow Engine',
        lines: [
            {
                accountId: expense.expenseAccountId,
                debitAmount: Number(approvedAmount),
                creditAmount: 0,
                description: expense.description
            },
            {
                accountId: creditAccountId,
                debitAmount: 0,
                creditAmount: Number(approvedAmount),
                description: `Payment for Expense`
            }
        ]
    }, tx)

    // 2. If Wallet Transaction, create the record so member sees it
    if (isWalletTransaction && wallet) {
        await tx.walletTransaction.create({
            data: {
                walletId: wallet.id,
                type: expense.type === ExpenseType.IMPREST ? 'IMPREST_ADVANCE' : 'EXPENSE_PAYOUT',
                amount: approvedAmount,
                balanceAfter: 0, // Calculated by trigger or helper? We should ideally use a helper. 
                // But simplified: The JE handles the balance. We just record the event.
                // Actually, we must use a helper to ensure balance consistency if we weren't using the AccountingEngine exclusively. 
                // Since AccountingEngine updates GL, we just need a display record. The balance update is implicit via GL.
                // WAIT - Wallet balance is derived from GL? Yes, getMemberWalletBalance uses GL. 
                // So this transaction is just for user visibility.
                // balanceAfter: 0, // REMOVED DUPLICATE
                immutable: true
            }
        })
    }

    // 3. Update Status
    // For IMPREST, it becomes DISBURSED, waiting for surrender.
    // For others, it becomes CLOSED.

    const newStatus = expense.type === ExpenseType.IMPREST ? ExpenseStatus.DISBURSED : ExpenseStatus.CLOSED

    await tx.expense.update({
        where: { id: expenseId },
        data: {
            status: newStatus,
            approvedAmount: approvedAmount
        }
    })

    // Audit
    await tx.auditLog.create({
        data: {
            userId: expense.requesterId || 'SYSTEM',
            action: AuditLogAction.EXPENSE_PAID,
            details: `Expense ${expense.description} Finalized (KES ${approvedAmount})`
        }
    })
}

// ========================================
// NEW: IMPREST SURRENDER & CLAIMS
// ========================================

/**
 * Surrender an Imprest (Advance)
 * User reports how much they actually spent.
 */
export async function submitExpenseSurrender(expenseId: string, actualAmount: number, receiptUrl?: string) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    return await prisma.$transaction(async (tx) => {
        const expense = await tx.expense.findUnique({
            where: { id: expenseId },
            include: { recipient: true }
        })

        if (!expense || expense.status !== ExpenseStatus.DISBURSED || expense.type !== ExpenseType.IMPREST) {
            throw new Error("Invalid expense for surrender.")
        }

        const approvedAmount = Number(expense.approvedAmount || expense.amount)
        const difference = approvedAmount - actualAmount

        // Get User Wallet
        const wallet = await tx.wallet.findUnique({
            where: { memberId: expense.requesterId }, // Assuming requester = recipient for Imprest?
            include: { glAccount: true }
        })

        if (!wallet || !wallet.glAccount) throw new Error("User wallet not found for surrender settlement.")

        const { AccountingEngine } = await import('@/lib/accounting/AccountingEngine')
        let balanceAction: any = null

        if (difference > 0) {
            // REFUND TO SACCO (User spent LESS than advance)
            // They have extra cash. They need to return it.
            // In reality, they likely return Cash. 
            // OR if the Advance was to Wallet, they pay back from Wallet.
            // Let's assume Wallet settlement.

            // DR User Wallet (Reduce Liability? No. DR Liability = Reduce Liability = Reduce Balance)
            // CR Expense Account (Reduce Expense?) 
            // Wait. If they spent LESS, the Expense was overstated.
            // We Debit Wallet (take money back), Credit Expense (reduce recorded expense).

            balanceAction = 'REFUNDED_TO_SACCO'

            await AccountingEngine.postJournalEntry({
                transactionDate: new Date(),
                referenceType: 'MANUAL_ADJUSTMENT',
                referenceId: expense.id,
                description: `Imprest Surrender Refund: ${expense.description}`,
                createdBy: session.user.id!,
                createdByName: session.user.name || 'User',
                lines: [
                    {
                        accountId: wallet.glAccountId,
                        debitAmount: Number(difference),
                        creditAmount: 0,
                        description: "Refund of unspent imprest"
                    },
                    {
                        accountId: expense.expenseAccountId,
                        debitAmount: 0,
                        creditAmount: Number(difference), // Crediting expense reduces it
                        description: "Adjustment for unspent amount"
                    }
                ]
            }, tx)

            // Wallet Transaction Display
            await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'IMPREST_REFUND',
                    amount: new Decimal(difference),
                    description: `Surrender Refund: ${expense.description}`,
                    balanceAfter: 0,
                    immutable: true
                }
            })

        } else if (difference < 0) {
            // TOP UP TO USER (User spent MORE than advance)
            // We owe them money.
            // DR Expense (Increase Expense), CR Wallet (Increase Liability/Balance)

            const amountToPay = Math.abs(difference)
            balanceAction = 'PAID_TO_USER'

            await AccountingEngine.postJournalEntry({
                transactionDate: new Date(),
                referenceType: 'EXPENSE_PAYOUT',
                referenceId: expense.id,
                description: `Imprest Surrender Top-up: ${expense.description}`,
                createdBy: session.user.id!,
                createdByName: session.user.name || 'User',
                lines: [
                    {
                        accountId: expense.expenseAccountId,
                        debitAmount: Number(amountToPay),
                        creditAmount: 0,
                        description: "Additional expense incurred"
                    },
                    {
                        accountId: wallet.glAccountId,
                        debitAmount: 0,
                        creditAmount: Number(amountToPay),
                        description: "Reimbursement for overspend"
                    }
                ]
            }, tx)

            await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'EXPENSE_PAYOUT',
                    amount: new Decimal(amountToPay),
                    description: `Surrender Top-up: ${expense.description}`,
                    balanceAfter: 0,
                    immutable: true
                }
            })
        }

        // Close Expense
        const updated = await tx.expense.update({
            where: { id: expenseId },
            data: {
                actualAmount: actualAmount,
                receiptUrl: receiptUrl,
                surrenderDate: new Date(),
                balanceAction: balanceAction,
                status: ExpenseStatus.CLOSED
            }
        })

        return serializeFinancials({ success: true, expense: updated })
    })
}

/**
 * Approve a Claim (Reimbursement)
 * Admin approves a user's expense claim.
 */
export async function approveReimbursementClaim(expenseId: string) {
    const session = await auth() // Check admin permission in real app

    // This basically just triggers finalizeExpense? 
    // Yes, but finalizeExpense logic handles "Recipient -> Wallet" payout already.
    // So for claims, we created the expense with type=CLAIM and recipientId=Requester.
    // Then standard workflow runs.

    // IF standard workflow calls finalizeExpense, we are good.
    // But if we want a manual "Instant Approve" button:

    return await prisma.$transaction(async (tx) => {
        await finalizeExpense(expenseId, tx)
        return { success: true }
    })
}

/**
 * Get Expenses
 */
export async function getExpenses(): Promise<Serialized<any>> {
    const expenses = await prisma.expense.findMany({
        include: {
            requester: { select: { id: true, name: true, role: true } },
            recipient: { select: { id: true, name: true } }, // Include Recipient
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
