import { db } from '@/lib/db'
import { Prisma, ExpenseStatus, AuditLogAction, ExpenseType, SystemAccountType } from '@prisma/client'
import { Decimal } from 'decimal.js'
import { getSystemMappingsDict } from '@/app/actions/system-accounting'

/**
 * ExpenseService
 * 
 * Handles the domain logic for expense requests, payments, and surrenders.
 * Keeps business logic decoupled from the UI layer (Server Actions).
 */
export class ExpenseService {

    /**
     * Create a new expense request
     */
    static async createExpense(data: {
        description: string
        amount: number
        date: Date
        expenseAccountId: string
        requesterId: string
        subCategoryId?: string
        recipientId?: string
        type?: ExpenseType
        receiptUrl?: string
    }) {
        const expenseType = data.type || ExpenseType.OPERATIONAL

        const expense = await db.expense.create({
            data: {
                description: data.description,
                requestedAmount: data.amount,
                amount: data.amount,
                date: data.date,
                expenseAccountId: data.expenseAccountId,
                subCategoryId: data.subCategoryId || null,
                recipientId: data.recipientId || null,
                type: expenseType,
                receiptUrl: data.receiptUrl,
                status: ExpenseStatus.PENDING_APPROVAL,
                requesterId: data.requesterId
            }
        })

        // Audit Log
        await db.auditLog.create({
            data: {
                userId: data.requesterId,
                action: AuditLogAction.EXPENSE_REQUESTED,
                details: `Requested ${expenseType} Expense: ${data.description} (KES ${data.amount})`
            }
        })

        return expense
    }

    /**
     * FINALIZATION LOGIC (Called by Workflow Engine)
     */
    static async finalizeExpense(expenseId: string, tx: Prisma.TransactionClient) {
        const expense = await tx.expense.findUnique({
            where: { id: expenseId },
            include: { recipient: true, subCategory: true }
        })

        if (!expense) throw new Error("Expense not found during finalization")

        const { AccountingEngine } = await import('@/lib/accounting/AccountingEngine')
        const mappings = await getSystemMappingsDict()

        let creditAccountId: string | null = null
        let isWalletTransaction = false
        let wallet: any = null

        if (expense.recipientId) {
            wallet = await tx.wallet.findUnique({
                where: { memberId: expense.recipientId },
                include: { glAccount: true }
            })
            if (!wallet || !wallet.glAccount) throw new Error("Recipient member does not have an active wallet.")

            creditAccountId = wallet.glAccountId
            isWalletTransaction = true
        } else {
            creditAccountId = (await this.getPaymentSourceAccountId(mappings, tx)) || null
        }

        if (!creditAccountId) {
            throw new Error("⚠️ Configuration Required: Please map the 'Expense Payment Source' GL account.")
        }

        const approvedAmount = expense.approvedAmount || expense.requestedAmount

        // 1. Create JE
        await AccountingEngine.postJournalEntry({
            transactionDate: new Date(),
            referenceType: expense.type === ExpenseType.IMPREST ? 'LOAN_DISBURSEMENT' : 'EXPENSE_PAYOUT',
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

        // 2. Wallet Transaction record
        if (isWalletTransaction && wallet) {
            await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: expense.type === ExpenseType.IMPREST ? 'IMPREST_ADVANCE' : 'EXPENSE_PAYOUT',
                    amount: approvedAmount,
                    description: `CASH ADVANCE: ${expense.description}`,
                    balanceAfter: 0,
                    immutable: true
                }
            })
        }

        // 3. Update Status
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

    /**
     * submitExpenseSurrender
     */
    static async submitSurrender(expenseId: string, actualAmount: number, userId: string, userName: string, receiptUrl?: string) {
        return await db.$transaction(async (tx) => {
            const expense = await tx.expense.findUnique({
                where: { id: expenseId },
                include: { recipient: true }
            })

            if (!expense || expense.status !== ExpenseStatus.DISBURSED || expense.type !== ExpenseType.IMPREST) {
                throw new Error("Invalid expense for surrender.")
            }

            const approvedAmount = Number(expense.approvedAmount || expense.amount)
            const difference = approvedAmount - actualAmount

            const wallet = await tx.wallet.findUnique({
                where: { memberId: expense.requesterId },
                include: { glAccount: true }
            })

            if (!wallet || !wallet.glAccount) throw new Error("User wallet not found for surrender settlement.")

            const { AccountingEngine } = await import('@/lib/accounting/AccountingEngine')
            let balanceAction: any = null

            if (difference > 0) {
                balanceAction = 'REFUNDED_TO_SACCO'
                await AccountingEngine.postJournalEntry({
                    transactionDate: new Date(),
                    referenceType: 'MANUAL_ADJUSTMENT',
                    referenceId: expense.id,
                    description: `Imprest Surrender Refund: ${expense.description}`,
                    createdBy: userId,
                    createdByName: userName,
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
                            creditAmount: Number(difference),
                            description: "Adjustment for unspent amount"
                        }
                    ]
                }, tx)

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
                const amountToPay = Math.abs(difference)
                balanceAction = 'PAID_TO_USER'

                await AccountingEngine.postJournalEntry({
                    transactionDate: new Date(),
                    referenceType: 'EXPENSE_PAYOUT',
                    referenceId: expense.id,
                    description: `Imprest Surrender Top-up: ${expense.description}`,
                    createdBy: userId,
                    createdByName: userName,
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

            return await tx.expense.update({
                where: { id: expenseId },
                data: {
                    actualAmount: actualAmount,
                    receiptUrl: receiptUrl,
                    surrenderDate: new Date(),
                    balanceAction: balanceAction,
                    status: ExpenseStatus.CLOSED
                }
            })
        })
    }

    /**
     * getPaymentSourceAccountId
     */
    static async getPaymentSourceAccountId(mappings: Record<string, string>, tx: Prisma.TransactionClient) {
        const mappedCode = mappings[SystemAccountType.EVENT_EXPENSE_PAYMENT]
        if (!mappedCode) return null

        const account = await tx.ledgerAccount.findUnique({ where: { code: mappedCode } })
        return account?.id
    }
}
