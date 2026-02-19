import { Prisma, PrismaClient } from '@prisma/client'
import { db as prisma } from '@/lib/db'
import { InsufficientBalanceError, OverdraftPreventionError } from './errors'

type DbClient = Prisma.TransactionClient | PrismaClient

export interface JournalLine {
    accountId: string
    accountCode?: string
    accountType: string
    description: string
    debitAmount: number
    creditAmount: number
}

export interface ValidationResult {
    valid: boolean
    errors: string[]
    warnings: string[]
}

/**
 * Balance Checker Service
 * Prevents overdrafts by validating account balances before transactions
 */
export class BalanceChecker {
    /**
     * Get current balance for an account from the general ledger
     */
    static async getAccountBalance(
        accountCode: string,
        tx?: DbClient
    ): Promise<number> {
        const db = tx || prisma

        // Get account
        const account = await db.ledgerAccount.findUnique({
            where: { code: accountCode }
        })

        if (!account) {
            throw new Error(`Account ${accountCode} not found`)
        }

        // Sum all journal lines for this account
        const result = await db.ledgerEntry.aggregate({
            where: { ledgerAccountId: account.id },
            _sum: {
                debitAmount: true,
                creditAmount: true
            }
        })

        const totalDebits = Number(result._sum.debitAmount || 0)
        const totalCredits = Number(result._sum.creditAmount || 0)

        // Balance calculation based on account type
        // Assets: Debit increases, Credit decreases → Balance = Debits - Credits
        // Liabilities/Income: Credit increases, Debit decreases → Balance = Credits - Debits
        let balance = 0
        if (account.type === 'ASSET') {
            balance = totalDebits - totalCredits
        } else {
            balance = totalCredits - totalDebits
        }

        // Convert Cents to Units
        return balance / 100
    }

    /**
     * Get account details by code
     */
    static async getAccount(accountCode: string, tx?: DbClient) {
        const db = tx || prisma
        return await db.ledgerAccount.findUnique({
            where: { code: accountCode }
        })
    }

    /**
     * Validate that a debit operation won't cause an overdraft
     * 
     * For ASSET accounts: Debits increase balance (always OK)
     * For LIABILITY/INCOME accounts: Debits decrease balance (check if sufficient)
     */
    static async validateDebit(
        accountCode: string,
        debitAmount: number,
        tx?: DbClient
    ): Promise<void> {
        if (debitAmount <= 0) return // No validation needed for zero or negative

        const account = await this.getAccount(accountCode, tx)
        if (!account) {
            throw new Error(`Account ${accountCode} not found`)
        }

        // For ASSET accounts, debits increase balance - always allowed
        if (account.type === 'ASSET') {
            return
        }

        // For LIABILITY and INCOME accounts, debits decrease balance
        // Check if sufficient balance exists
        const currentBalance = await this.getAccountBalance(accountCode, tx)

        if (currentBalance < debitAmount) {
            throw new OverdraftPreventionError(
                accountCode,
                account.name,
                debitAmount,
                currentBalance
            )
        }
    }

    /**
     * Validate that a credit operation won't cause an overdraft
     * 
     * For ASSET accounts: Credits decrease balance (check if sufficient)
     * For LIABILITY/INCOME accounts: Credits increase balance (always OK)
     */
    static async validateCredit(
        accountCode: string,
        creditAmount: number,
        tx?: DbClient
    ): Promise<void> {
        if (creditAmount <= 0) return // No validation needed for zero or negative

        const account = await this.getAccount(accountCode, tx)
        if (!account) {
            throw new Error(`Account ${accountCode} not found`)
        }

        // For LIABILITY and INCOME accounts, credits increase balance - always allowed
        if (account.type === 'LIABILITY' || account.type === 'INCOME') {
            return
        }

        // For ASSET accounts, credits decrease balance
        // Check if sufficient balance exists
        const currentBalance = await this.getAccountBalance(accountCode, tx)

        if (currentBalance < creditAmount) {
            throw new OverdraftPreventionError(
                accountCode,
                account.name,
                creditAmount,
                currentBalance
            )
        }
    }

    /**
     * Validate an entire journal entry won't cause any overdrafts
     * This checks all lines before committing the transaction
     */
    static async validateJournalEntry(
        journalLines: JournalLine[],
        tx?: DbClient
    ): Promise<ValidationResult> {
        const errors: string[] = []
        const warnings: string[] = []

        // Group lines by account to calculate net effect
        const accountEffects = new Map<string, { debit: number; credit: number }>()

        for (const line of journalLines) {
            const accountCode = line.accountCode || ''
            if (!accountCode) continue

            const existing = accountEffects.get(accountCode) || { debit: 0, credit: 0 }
            accountEffects.set(accountCode, {
                debit: existing.debit + line.debitAmount,
                credit: existing.credit + line.creditAmount
            })
        }

        // Validate each account's net effect
        for (const [accountCode, { debit, credit }] of accountEffects) {
            try {
                if (debit > 0) {
                    await this.validateDebit(accountCode, debit, tx)
                }
                if (credit > 0) {
                    await this.validateCredit(accountCode, credit, tx)
                }
            } catch (error) {
                if (error instanceof OverdraftPreventionError) {
                    errors.push(error.message)
                } else {
                    errors.push(String(error))
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        }
    }

    /**
     * Verify no accounts have negative balances after a transaction
     * This is a safety check that should never fail if validation is working
     */
    static async verifyNoNegativeBalances(
        accountCodes: string[],
        tx?: DbClient
    ): Promise<void> {
        for (const code of accountCodes) {
            const balance = await this.getAccountBalance(code, tx)
            if (balance < 0) {
                const account = await this.getAccount(code, tx)
                throw new Error(
                    `CRITICAL: Negative balance detected in ${account?.name} (${code}): ` +
                    `KES ${balance.toLocaleString()}`
                )
            }
        }
    }

    /**
     * Check if member wallet has sufficient balance
     * Convenience method for common wallet checks
     */
    static async validateWalletBalance(
        memberId: string,
        requiredAmount: number,
        tx?: DbClient
    ): Promise<void> {
        const db = tx || prisma

        // Get member wallet balance from accounting engine
        const { getMemberWalletBalance } = await import('./AccountingEngine')
        const walletBalance = await getMemberWalletBalance(memberId, tx)

        if (walletBalance < requiredAmount) {
            throw new InsufficientBalanceError(
                '3012',
                'Member Withdrawable Wallet',
                requiredAmount,
                walletBalance
            )
        }
    }
}
