'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { AccountingEngine } from '@/lib/accounting/AccountingEngine'
import { AccountingService } from '@/lib/services/AccountingService'
import { revalidatePath } from 'next/cache'
import { serializeJournalEntry } from '@/lib/serializers'

/**
 * Get Chart of Accounts
 */
import { serializeFinancials, Serialized } from "@/lib/safe-serialization"

/**
 * Get Chart of Accounts
 */
export async function getChartOfAccounts(): Promise<Serialized<any[]>> {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    const accounts = await prisma.ledgerAccount.findMany({
        orderBy: [
            { code: 'asc' }
        ],
        include: {
            _count: {
                select: { ledgerEntries: true }
            }
        }
    })

    // Calculate balances for each account
    const accountsWithBalances = await Promise.all(
        accounts.map(async (account: any) => {
            const balance = await AccountingEngine.getAccountBalance(account.code)
            return {
                ...account,
                balance
            }
        })
    )

    return serializeFinancials(accountsWithBalances)
}

/**
 * Get Journal Entries with filters
 */
export async function getJournalEntries(filters?: {
    startDate?: Date
    endDate?: Date
    referenceType?: string
    searchTerm?: string
    page?: number
    pageSize?: number
}): Promise<{ entries: Serialized<any[]>, pagination: any }> {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    const page = filters?.page || 1
    const pageSize = filters?.pageSize || 20
    const skip = (page - 1) * pageSize

    const where: any = {}

    if (filters?.startDate || filters?.endDate) {
        where.transactionDate = {}
        if (filters.startDate) where.transactionDate.gte = filters.startDate
        if (filters.endDate) where.transactionDate.lte = filters.endDate
    }

    if (filters?.referenceType) {
        where.referenceType = filters.referenceType
    }

    if (filters?.searchTerm) {
        where.OR = [
            // Entry Number removed from schema, searching by description only
            { description: { contains: filters.searchTerm, mode: 'insensitive' } },
            // Can add referenceId search if useful
            { referenceId: { contains: filters.searchTerm, mode: 'insensitive' } }
        ]
    }

    const [entries, total] = await Promise.all([
        prisma.ledgerTransaction.findMany({
            where,
            orderBy: { transactionDate: 'desc' },
            skip,
            take: pageSize,
            include: {
                ledgerEntries: {
                    include: {
                        ledgerAccount: true
                    }
                }
            }
        }),
        prisma.ledgerTransaction.count({ where })
    ])

    return {
        entries: serializeFinancials(entries.map(serializeJournalEntry)),
        pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize)
        }
    }
}

/**
 * Get single journal entry details
 */
export async function getJournalEntryDetails(entryId: string): Promise<Serialized<any> | null> {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    const entry = await prisma.ledgerTransaction.findUnique({
        where: { id: entryId },
        include: {
            ledgerEntries: {
                include: {
                    ledgerAccount: true
                }
            }
        }
    })

    return entry ? serializeFinancials(serializeJournalEntry(entry)) : null
}

/**
 * Get Trial Balance
 */
export async function getTrialBalance(asOfDate?: Date): Promise<Serialized<any>> {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    const accounts = await prisma.ledgerAccount.findMany({
        where: { isActive: true },
        orderBy: { code: 'asc' }
    })

    const trialBalance = await Promise.all(
        accounts.map(async (account: any) => {
            const balance = await AccountingEngine.getAccountBalance(
                account.code,
                undefined,
                asOfDate
            )

            // Determine debit/credit column based on account type and balance
            let debit = 0
            let credit = 0

            if (balance !== 0) {
                if (['ASSET', 'EXPENSE'].includes(account.type)) {
                    // Normal debit balance accounts
                    if (balance > 0) {
                        debit = balance
                    } else {
                        credit = Math.abs(balance)
                    }
                } else {
                    // Normal credit balance accounts (LIABILITY, EQUITY, INCOME)
                    if (balance > 0) {
                        credit = balance
                    } else {
                        debit = Math.abs(balance)
                    }
                }
            }

            return {
                code: account.code,
                name: account.name,
                type: account.type,
                debit,
                credit,
                balance
            }
        })
    )

    const totalDebits = trialBalance.reduce((sum, acc) => sum + acc.debit, 0)
    const totalCredits = trialBalance.reduce((sum, acc) => sum + acc.credit, 0)
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01

    return serializeFinancials({
        accounts: trialBalance.filter(acc => acc.debit !== 0 || acc.credit !== 0),
        totalDebits,
        totalCredits,
        isBalanced,
        difference: totalDebits - totalCredits
    })
}

/**
 * Reverse a journal entry (admin only)
 */
export async function reverseJournalEntry(entryId: string, reason: string): Promise<Serialized<any>> {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    // Check permissions
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { member: { select: { name: true } } }
    })

    console.log(`[Reversal] User: ${session.user.email}, Role: ${user?.role}, Permissions:`, user?.permissions)

    const permissions = (user?.permissions as any) || {}
    const hasPermission =
        ['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN'].includes(user?.role || '') ||
        permissions.canReverse === true

    if (!hasPermission) {
        console.warn(`[Reversal] Access Denied: User ${session.user.email} attempted reversal without permissions`)
        throw new Error('You do not have permission to reverse journal entries. Please contact your system administrator.')
    }

    // Get original entry to check reference type for side effects
    const originalEntry = await prisma.ledgerTransaction.findUnique({
        where: { id: entryId },
        include: { ledgerEntries: true } // Need entries to calculate amount for side effects
    })

    if (!originalEntry) {
        throw new Error('Journal entry not found')
    }

    // Wrap everything in a single transaction for atomicity
    const result = await prisma.$transaction(async (tx: any) => {
        const reversalEntry = await AccountingEngine.reverseJournalEntry(
            entryId,
            reason,
            session.user.id!,
            user?.member?.name || user?.name || session.user.name || 'Admin',
            tx
        )

        // Handle Side Effects based on Reference Type
        if (originalEntry.referenceType === 'SHARE_CONTRIBUTION') {
            // Calculate amount from credit entries to 'Contributions' account? 
            // Better: use the ShareTransaction if linked. 
            // Or assume total credits in this transaction = amount.

            // Re-calculate amount since it's not on the transaction object
            const amount = originalEntry.ledgerEntries.reduce((sum: number, line: any) => sum + Number(line.creditAmount), 0)

            // 1. Decrement member share contributions field
            if (originalEntry.referenceId) {
                await tx.member.update({
                    where: { id: originalEntry.referenceId },
                    data: {
                        shareContributions: {
                            decrement: amount
                        }
                    }
                })
            }

            // 2. Mark ShareTransaction as reversed
            await tx.shareTransaction.updateMany({
                where: { ledgerEntryId: originalEntry.id },
                data: {
                    isReversed: true,
                    reversalId: reversalEntry.id
                }
            })
        } else if (originalEntry.referenceType === 'LOAN_REPAYMENT') {
            // If loan was cleared by this repayment, set it back to ACTIVE
            if (originalEntry.referenceId) {
                const loan = await tx.loan.findUnique({
                    where: { id: originalEntry.referenceId }
                })
                if (loan && loan.status === 'CLEARED') {
                    await tx.loan.update({
                        where: { id: originalEntry.referenceId },
                        data: { status: 'ACTIVE' }
                    })
                }
            }
        }

        return reversalEntry
    }, {
        maxWait: 5000,
        timeout: 20000
    })

    const reversalEntry = result

    // Create audit log
    await prisma.auditLog.create({
        data: {
            userId: session.user.id,
            action: 'JOURNAL_REVERSAL',
            details: `Reversed journal entry ${originalEntry.id}. Reason: ${reason}. Reference: ${originalEntry.referenceType}:${originalEntry.referenceId}`
        }
    })

    revalidatePath('/accounts')
    revalidatePath('/dashboard')
    revalidatePath('/wallet')
    revalidatePath('/loans')

    return serializeFinancials(reversalEntry)
}

/**
 * Get account ledger (all transactions for a specific account)
 */
export async function getAccountLedger(accountCode: string, limit = 100): Promise<Serialized<any>> {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    const account = await prisma.ledgerAccount.findUnique({
        where: { code: accountCode }
    })

    if (!account) {
        throw new Error('Account not found')
    }

    const lines = await prisma.ledgerEntry.findMany({
        where: {
            ledgerAccountId: account.id
        },
        include: {
            ledgerTransaction: true
        },
        orderBy: {
            ledgerTransaction: {
                transactionDate: 'desc'
            }
        },
        take: limit
    })

    // Calculate running balance for each line
    let runningBalance = 0
    // Note: We need to process from oldest to newest to calculate running balance correctly, 
    // but we want to display newest first.
    // However, if we only fetch the last 100, we might miss the opening balance.
    // For now, assuming relative running balance within the fetched set or simple addition.
    // Actually, the previous logic reversed lines, calculated, then reversed back.

    // Reverse to calculate balance from oldest to newest (of the fetched set)
    const ledgerLines = lines.reverse().map((line: any) => {
        // Asset/Expense: Debit increases, Credit decreases
        // Liability/Equity/Income: Credit increases, Debit decreases
        if (['ASSET', 'EXPENSE'].includes(account.type)) {
            runningBalance += Number(line.debitAmount) - Number(line.creditAmount)
        } else {
            runningBalance += Number(line.creditAmount) - Number(line.debitAmount)
        }

        return {
            date: line.ledgerTransaction.transactionDate,
            entryNumber: line.ledgerTransaction.id.substring(0, 8).toUpperCase(), // Fallback
            description: line.description || line.ledgerTransaction.description,
            debit: Number(line.debitAmount),
            credit: Number(line.creditAmount),
            balance: runningBalance,
            journalEntryId: line.ledgerTransaction.id
        }
    })

    return serializeFinancials({
        account,
        lines: ledgerLines.reverse(), // Most recent first
        currentBalance: runningBalance
    })
}
// ========================================
// ACCOUNT MANAGEMENT ACTIONS
// ========================================

export async function toggleAccountStatus(accountId: string, isActive: boolean) {
    const session = await auth();
    if (!session?.user || !['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN'].includes(session.user.role)) {
        throw new Error("Unauthorized");
    }

    try {
        await prisma.ledgerAccount.update({
            where: { id: accountId },
            data: { isActive }
        });
        revalidatePath('/accounts');
        return { success: true };
    } catch (error: any) {
        throw new Error(error.message || "Failed to update account status");
    }
}

export async function deleteAccount(accountId: string) {
    const session = await auth();
    if (!session?.user || !['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN'].includes(session.user.role)) {
        throw new Error("Unauthorized");
    }

    try {
        // Check for existing transactions
        const account = await prisma.ledgerAccount.findUnique({
            where: { id: accountId },
            include: { _count: { select: { ledgerEntries: true } } }
        });

        if (!account) throw new Error("Account not found");

        if (account._count.ledgerEntries > 0) {
            throw new Error("Cannot delete account with existing transactions. Deactivate it instead.");
        }

        // Check for system mappings
        const mapping = await prisma.systemAccountingMapping.findFirst({
            where: { accountId }
        });

        if (mapping) {
            throw new Error("Cannot delete account that is mapped to a system event. Remove mapping first.");
        }

        await prisma.ledgerAccount.delete({
            where: { id: accountId }
        });

        revalidatePath('/accounts');
        return { success: true };
    } catch (error: any) {
        throw new Error(error.message || "Failed to delete account");
    }
}

export async function updateAccountType(accountId: string, newType: string) {
    const session = await auth();
    if (!session?.user || !['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN'].includes(session.user.role)) {
        throw new Error("Unauthorized");
    }

    // Validate type
    const validTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'];
    if (!validTypes.includes(newType)) {
        throw new Error("Invalid account type");
    }

    try {
        await prisma.$transaction(async (tx: any) => {
            // Get current account type
            const account = await tx.ledgerAccount.findUnique({
                where: { id: accountId },
                select: { type: true, code: true }
            });

            if (!account) {
                throw new Error("Account not found");
            }

            const oldType = account.type;


            // Update account type
            await tx.ledgerAccount.update({
                where: { id: accountId },
                data: { type: newType as any }
            });

            console.log(`[Account Type Update] ${account.code}: ${oldType} -> ${newType}`);
            console.log(`Note: Historical journal entries remain unchanged. Balance calculation will use new type.`);
        });

        revalidatePath('/accounts');
        return { success: true };
    } catch (error: any) {
        throw new Error(error.message || "Failed to update account type");
    }
}

/**
 * Get Balance Sheet Report
 */
export async function getBalanceSheetReport(asOfDate?: Date): Promise<Serialized<any>> {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    const report = await AccountingService.getBalanceSheet(asOfDate || new Date())
    return serializeFinancials(report)
}
