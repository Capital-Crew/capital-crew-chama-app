
import prisma from '@/lib/prisma'
import { Prisma, ReferenceType, AccountType } from '@prisma/client'

// Utility to handle BigInt serialization for JSON (if needed)
// Usage: JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v)

export interface LedgerEntryInput {
    accountId: string // MUST be the ID, not code. Resolve codes before calling.
    description?: string
    // Amounts in CENTS
    debit: bigint
    credit: bigint
}

export interface TransactionInput {
    transactionDate: Date
    referenceType: ReferenceType
    referenceId: string
    description: string
    notes?: string
    externalReferenceId?: string // Idempotency Key (e.g. M-Pesa ID)
    lines: LedgerEntryInput[]
    createdBy: string
    createdByName: string
}

export class CoreLedger {
    /**
     * Post a strictly validated Double-Entry Transaction
     * Acid Compliant.
     */
    static async postTransaction(input: TransactionInput): Promise<string> {
        // 1. Validate Balance (Sum Debits == Sum Credits)
        const totalDebit = input.lines.reduce((sum, line) => sum + line.debit, BigInt(0))
        const totalCredit = input.lines.reduce((sum, line) => sum + line.credit, BigInt(0))

        if (totalDebit !== totalCredit) {
            throw new Error(`Transaction Unbalanced: Debits (${totalDebit}) != Credits (${totalCredit})`)
        }

        if (totalDebit <= BigInt(0)) {
            throw new Error('Transaction must have a positive value')
        }

        // 2. Validate Idempotency (if external ref provided)
        if (input.externalReferenceId) {
            const existing = await prisma.ledgerTransaction.findUnique({
                where: { externalReferenceId: input.externalReferenceId }
            })
            if (existing) {
                // Idempotent success (return existing ID)
                return existing.id
            }
        }

        // 3. Execute in Transaction
        return await prisma.$transaction(async (tx) => {
            // A. Create Transaction Header
            const transaction = await tx.ledgerTransaction.create({
                data: {
                    transactionDate: input.transactionDate,
                    referenceType: input.referenceType,
                    referenceId: input.referenceId,
                    description: input.description,
                    notes: input.notes,
                    externalReferenceId: input.externalReferenceId,
                    totalAmount: totalDebit,
                    createdBy: input.createdBy,
                    createdByName: input.createdByName,
                    ledgerEntries: {
                        create: input.lines.map(line => ({
                            ledgerAccountId: line.accountId,
                            debitAmount: line.debit,
                            creditAmount: line.credit,
                            description: line.description || input.description
                        }))
                    }
                }
            })

            // B. Update Account Balances (Cached Aggregate)
            // We iterate strictly to avoid deadlocks? 
            // Better: Just fire updates. Row-level locks in Postgres handles safety if we assume short transactions.
            // For rigorous safety with high concurrency, we might want to sort account IDs first.

            // Sort lines by account ID to prevent deadlocks (A->B vs B->A)
            const sortedLines = [...input.lines].sort((a, b) => a.accountId.localeCompare(b.accountId))

            for (const line of sortedLines) {
                const netChange = line.credit - line.debit // Standard accounting: Credit +, Debit - (for Liability/Equity/Revenue)

                // However, we need to respect account types for "Natural Balance" if we want "Balance" to mean "Positive Value"?
                // NO. The user requested: "SELECT SUM(credit - debit)". 
                // So Balance = Total Credits - Total Debits.
                // This means Assets will be negative (Debits > Credits). Liabilities will be positive.
                // WE MUST STICK TO THIS RAW DEFINITION for consistency.

                // Using atomic operations (increment/decrement)
                // Note: BigInt support in Prisma increment is standard.

                await tx.ledgerAccount.update({
                    where: { id: line.accountId },
                    data: {
                        balance: {
                            increment: netChange
                        }
                    }
                })
            }

            return transaction.id
        })
    }

    /**
     * Get Balance with Pessimistic Locking
     * Essential for "Spending" checks to prevent double-spend.
     */
    static async getAccountBalanceLocked(accountId: string, tx: Prisma.TransactionClient): Promise<bigint> {
        // Raw query for FOR UPDATE
        const result = await tx.$queryRaw<{ balance: bigint }[]>`
            SELECT balance FROM "LedgerAccount"
            WHERE id = ${accountId}
            FOR UPDATE
        `

        if (!result || result.length === 0) {
            throw new Error(`Account ${accountId} not found`)
        }

        return result[0].balance
    }

    /**
     * Helper: Get formatted balance (Number) for UI
     * WARNING: Precision loss possible for massive numbers (> 2^53).
     * For display purposes (KES) usually fine.
     */
    static async getBalanceDisplay(accountId: string): Promise<number> {
        const account = await prisma.ledgerAccount.findUnique({
            where: { id: accountId },
            select: { balance: true }
        })

        if (!account) return 0

        // Convert Cents (BigInt) to Units (Number)
        // e.g. 1050 cents -> 10.50
        return Number(account.balance) / 100
    }

    /**
     * Get validated balance (Number)
     * ALIAS for getBalanceDisplay for Service compatibility
     */
    static async getAccountBalance(accountId: string): Promise<number> {
        return this.getBalanceDisplay(accountId)
    }
}
