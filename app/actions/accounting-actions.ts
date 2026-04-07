'use server'

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { LedgerService } from "@/lib/services/ledger-service";
import { withAudit } from "@/lib/with-audit";
import { AuditLogAction, LedgerStatus, AccountType, NormalBalance, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { serializeFinancials, Serialized } from "@/lib/safe-serialization";
import { AccountingEngine } from "@/lib/accounting/AccountingEngine";
import { AccountingService } from "@/lib/services/AccountingService";
import { serializeJournalEntry } from '@/lib/serializers';


/**
 * Fetch all ledgers with full hierarchy and balances
 */
export async function getChartOfAccounts(): Promise<Serialized<any[]>> {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const ledgers = await db.ledgerAccount.findMany({
        orderBy: { code: 'asc' },
        include: {
            children: true,
            _count: {
                select: { ledgerEntries: true }
            }
        }
    });

    // Enrich with balances and creator names
    const enriched = await Promise.all(
        ledgers.map(async (l: any) => {
            const balance = await AccountingEngine.getAccountBalance(l.code);

            let createdByName = null;
            let approvedByName = null;
            if (l.createdBy) {
                const creator = await db.user.findUnique({
                    where: { id: l.createdBy },
                    select: { name: true }
                });
                createdByName = creator?.name || 'Unknown';
            }
            if (l.approvedBy) {
                const approver = await db.user.findUnique({
                    where: { id: l.approvedBy },
                    select: { name: true }
                });
                approvedByName = approver?.name || 'Unknown';
            }

            return {
                ...l,
                balance,
                createdByName,
                approvedByName
            };
        })
    );

    return serializeFinancials(enriched);
}

// Alias for legacy support
export const getAllLedgers = getChartOfAccounts;


/**
 * Creates a new ledger in PENDING state (Maker-Checker 1/2)
 */
export const createLedgerAction = withAudit({ actionType: AuditLogAction.LEDGER_CREATED, domain: 'FINANCE', apiRoute: '/api/accounts/ledger/create' }, async (ctx, formData: FormData) => {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const name = formData.get('name') as string;
    const code = formData.get('code') as string;
    const type = formData.get('type') as AccountType;
    const parentId = formData.get('parentId') as string || null;
    const normalBalance = formData.get('normalBalance') as NormalBalance;
    const description = formData.get('description') as string;

    // Validate hierarchy
    await LedgerService.validateLedgerCode(code, type, parentId);

    const ledger = await db.ledgerAccount.create({
        data: {
            name,
            code,
            type,
            parentId,
            normalBalance,
            description,
            status: LedgerStatus.PENDING,
            createdBy: session.user.id
        }
    });

    revalidatePath('/admin');
    revalidatePath('/accounts');
    return serializeFinancials(ledger);
});

import { withIdempotency } from "@/lib/idempotency";

/**
 * Approves a pending ledger (Maker-Checker 2/2)
 */
export const approveLedgerAction = withAudit({ actionType: AuditLogAction.LEDGER_APPROVED, domain: 'FINANCE', apiRoute: '/api/accounts/ledger/approve' }, async (ctx, ledgerId: string, idempotencyKey?: string) => {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const businessLogic = async () => {
        const ledger = await db.ledgerAccount.findUnique({ where: { id: ledgerId } });
        if (!ledger) throw new Error("Ledger not found");
        
        if (ledger.status === LedgerStatus.ACTIVE) return serializeFinancials(ledger);
        if (ledger.status !== LedgerStatus.PENDING) throw new Error("Ledger is not in PENDING status");

        // Enforce Maker-Checker: Approver must be different from Creator
        if (ledger.createdBy === session.user.id) {
            throw new Error("Checker cannot be the same user as the Maker. Please ask another administrator to approve.");
        }

        const updated = await db.ledgerAccount.update({
            where: { id: ledgerId },
            data: {
                status: LedgerStatus.ACTIVE,
                approvedBy: session.user.id,
                activatedBy: session.user.id,
                activatedAt: new Date(),
                version: { increment: 1 }
            }
        });

        revalidatePath('/admin');
        revalidatePath('/accounts');
        return serializeFinancials(updated);
    }

    if (idempotencyKey) {
        return await withIdempotency({
            key: idempotencyKey,
            path: 'approveLedgerAction',
            businessLogic
        });
    }
    return await businessLogic();
});

export const closeLedgerAction = withAudit({ actionType: AuditLogAction.LEDGER_CLOSED, domain: 'FINANCE', apiRoute: '/api/accounts/ledger/close' }, async (ctx, ledgerId: string, idempotencyKey?: string) => {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const businessLogic = async () => {
        const ledger = await db.ledgerAccount.findUnique({ where: { id: ledgerId } });
        if (!ledger) throw new Error("Ledger not found");

        if (ledger.status === LedgerStatus.CLOSED) return serializeFinancials(ledger);

        if (Number(ledger.balance) !== 0) {
            throw new Error("Ledger must have zero balance before it can be closed.");
        }

        const updated = await db.ledgerAccount.update({
            where: { id: ledgerId },
            data: {
                status: LedgerStatus.CLOSED,
                closedAt: new Date(),
                version: { increment: 1 }
            }
        });

        revalidatePath('/admin');
        revalidatePath('/accounts');
        return serializeFinancials(updated);
    }

    if (idempotencyKey) {
        return await withIdempotency({
            key: idempotencyKey,
            path: 'closeLedgerAction',
            businessLogic
        });
    }
    return await businessLogic();
});

export const reactivateLedgerAction = withAudit({ actionType: AuditLogAction.LEDGER_APPROVED, domain: 'FINANCE', apiRoute: '/api/accounts/ledger/reactivate' }, async (ctx, ledgerId: string, idempotencyKey?: string) => {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const businessLogic = async () => {
        const ledger = await db.ledgerAccount.findUnique({ where: { id: ledgerId } });
        if (!ledger) throw new Error("Ledger not found");
        
        if (ledger.status === LedgerStatus.ACTIVE) return serializeFinancials(ledger);
        if (ledger.status !== LedgerStatus.CLOSED) throw new Error("Only closed ledgers can be reactivated");

        const updated = await db.ledgerAccount.update({
            where: { id: ledgerId },
            data: {
                status: LedgerStatus.ACTIVE,
                closedAt: null,
                activatedAt: new Date(),
                activatedBy: session.user.id,
                version: { increment: 1 }
            }
        });

        revalidatePath('/admin');
        revalidatePath('/accounts');
        return serializeFinancials(updated);
    }

    if (idempotencyKey) {
        return await withIdempotency({
            key: idempotencyKey,
            path: 'reactivateLedgerAction',
            businessLogic
        });
    }
    return await businessLogic();
});

export const rejectLedgerAction = withAudit({ actionType: AuditLogAction.LEDGER_CLOSED, domain: 'FINANCE', apiRoute: '/api/accounts/ledger/reject' }, async (ctx, ledgerId: string, idempotencyKey?: string) => {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const businessLogic = async () => {
        const ledger = await db.ledgerAccount.findUnique({ where: { id: ledgerId } });
        if (!ledger) throw new Error("Ledger not found");
        if (ledger.status !== LedgerStatus.PENDING) throw new Error("Only pending ledgers can be rejected");

        if (ledger.createdBy === session.user.id) {
            throw new Error("You cannot reject your own ledger request. Please ask another administrator.");
        }

        await db.ledgerAccount.delete({ where: { id: ledgerId } });

        revalidatePath('/admin');
        revalidatePath('/accounts');
        return { success: true };
    }

    if (idempotencyKey) {
        return await withIdempotency({
            key: idempotencyKey,
            path: 'rejectLedgerAction',
            businessLogic
        });
    }
    return await businessLogic();
});


/**
 * Get Journal Entries with advanced filters and pagination
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
    if (!session?.user) throw new Error('Unauthorized')

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
            { description: { contains: filters.searchTerm, mode: 'insensitive' } },
            { referenceId: { contains: filters.searchTerm, mode: 'insensitive' } },
            { externalReferenceId: { contains: filters.searchTerm, mode: 'insensitive' } }
        ]
    }

    const [entries, total] = await Promise.all([
        db.ledgerTransaction.findMany({
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
        db.ledgerTransaction.count({ where })
    ])

    const entriesWithCreator = await Promise.all(entries.map(async (entry) => {
        let createdBy = null;
        if (entry.createdBy) {
            const user = await db.user.findUnique({ where: { id: entry.createdBy }, select: { name: true } });
            createdBy = user?.name || 'Unknown';
        }
        return { ...serializeJournalEntry(entry), createdBy };
    }));

    return {
        entries: serializeFinancials(entriesWithCreator),
        pagination: {
            total,
            pages: Math.ceil(total / pageSize),
            currentPage: page,
            pageSize
        }
    }
}

// Alias for compatibility
export async function getJournalTransactions() {
    const result = await getJournalEntries();
    return result.entries;
}


/**
 * Get single journal entry details
 */
export async function getJournalEntryDetails(entryId: string): Promise<Serialized<any> | null> {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const entry = await db.ledgerTransaction.findUnique({
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
 * Get ledger for a specific business transaction ID
 */
export async function getTransactionLedger(transactionId: string) {
    const session = await auth()
    if (!session?.user) return null

    try {
        const ledgerEntry = await db.ledgerTransaction.findFirst({
            where: {
                OR: [
                    { referenceId: transactionId },
                ]
            },
            include: {
                ledgerEntries: {
                    include: {
                        ledgerAccount: true
                    }
                }
            }
        });

        if (!ledgerEntry) {
            const tx = await db.transaction.findUnique({
                where: { id: transactionId }
            });

            if (tx?.mpesaReceiptNumber) {
                const fallbackEntry = await db.ledgerTransaction.findUnique({
                    where: { externalReferenceId: tx.mpesaReceiptNumber },
                    include: {
                        ledgerEntries: {
                            include: { ledgerAccount: true }
                        }
                    }
                });
                return serializeFinancials(fallbackEntry);
            }
            return null;
        }

        return serializeFinancials(ledgerEntry);
    } catch (error) {
        // TODO: Log error to monitoring service
        return null;
    }
}

/**
 * Reverse a journal entry with all side effects and audit trail
 */
export const reverseJournalEntryAction = withAudit({ actionType: AuditLogAction.JOURNAL_REVERSAL, domain: 'FINANCE', apiRoute: '/api/accounts/journal/reverse' }, async (ctx, entryId: string, reason: string) => {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    // Check permissions
    const userRole = session.user.role;
    const isPrivileged = ['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN'].includes(userRole);
    // Note: We might want more granular permission check here if stored in user.permissions

    if (!isPrivileged) {
        throw new Error('You do not have permission to reverse journal entries.');
    }

    const originalEntry = await db.ledgerTransaction.findUnique({
        where: { id: entryId },
        include: { ledgerEntries: true }
    })

    if (!originalEntry) throw new Error('Journal entry not found')

    const result = await db.$transaction(async (tx) => {
        const reversalEntry = await AccountingEngine.reverseJournalEntry(
            entryId,
            reason,
            session.user.id!,
            session.user.name || 'Admin',
            tx
        )

        // Handle Side Effects
        if (originalEntry.referenceType === 'CONTRIBUTION_PAYMENT' || originalEntry.referenceType === 'SAVINGS_DEPOSIT') {
            const amount = originalEntry.ledgerEntries.reduce((sum, line) => sum + Number(line.creditAmount), 0)
            if (originalEntry.referenceId) {
                await tx.member.update({
                    where: { id: originalEntry.referenceId },
                    data: { contributionBalance: { decrement: amount } }
                })
            }
            // Note: shareTransaction replaced by contributionTransaction or generic ledger
            await tx.contributionTransaction.updateMany({
                where: { ledgerTransactionId: originalEntry.id },
                data: { isReversed: true }
            })
        } else if (originalEntry.referenceType === 'LOAN_REPAYMENT') {
            if (originalEntry.referenceId) {
                const loan = await tx.loan.findUnique({ where: { id: originalEntry.referenceId } })
                if (loan && loan.status === 'CLEARED') {
                    await tx.loan.update({
                        where: { id: originalEntry.referenceId },
                        data: { status: 'ACTIVE' }
                    })
                }
            }
        }

        return reversalEntry
    });

    revalidatePath('/accounts')
    revalidatePath('/dashboard')
    revalidatePath('/wallet')
    revalidatePath('/loans')

    return serializeFinancials(result)
});


/**
 * Get Trial Balance
 */
export async function getTrialBalance(asOfDate?: Date): Promise<Serialized<any>> {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const accounts = await db.ledgerAccount.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { code: 'asc' }
    })

    const trialBalance = await Promise.all(
        accounts.map(async (account) => {
            const balance = await AccountingEngine.getAccountBalance(
                account.code,
                undefined,
                asOfDate
            )

            let debit = 0
            let credit = 0

            if (balance !== 0) {
                if (['ASSET', 'EXPENSE'].includes(account.type)) {
                    if (balance > 0) debit = balance
                    else credit = Math.abs(balance)
                } else {
                    if (balance > 0) credit = balance
                    else debit = Math.abs(balance)
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
 * Get Balance Sheet Report
 */
export async function getBalanceSheetReport(asOfDate?: Date): Promise<Serialized<any>> {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const report = await AccountingService.getBalanceSheet(asOfDate || new Date())
    return serializeFinancials(report)
}

/**
 * Get account ledger (running balance history)
 */
export async function getAccountLedger(accountCode: string, limit = 100): Promise<Serialized<any>> {
    const session = await auth()
    if (!session?.user) throw new Error('Unauthorized')

    const account = await db.ledgerAccount.findUnique({
        where: { code: accountCode }
    })

    if (!account) throw new Error('Account not found')

    const lines = await db.ledgerEntry.findMany({
        where: { ledgerAccountId: account.id },
        include: { ledgerTransaction: true },
        orderBy: { ledgerTransaction: { transactionDate: 'desc' } },
        take: limit
    })

    let runningBalance = 0
    const ledgerLines = lines.reverse().map((line: any) => {
        if (['ASSET', 'EXPENSE'].includes(account.type)) {
            runningBalance += Number(line.debitAmount) - Number(line.creditAmount)
        } else {
            runningBalance += Number(line.creditAmount) - Number(line.debitAmount)
        }

        return {
            date: line.ledgerTransaction.transactionDate,
            entryNumber: line.ledgerTransaction.id.substring(0, 8).toUpperCase(),
            description: line.description || line.ledgerTransaction.description,
            debit: Number(line.debitAmount),
            credit: Number(line.creditAmount),
            balance: runningBalance,
            journalEntryId: line.ledgerTransaction.id
        }
    })

    return serializeFinancials({
        account,
        lines: ledgerLines.reverse(),
        currentBalance: runningBalance
    })
}


/**
 * Toggle account active status
 */
export async function toggleAccountStatus(accountId: string, isActive: boolean) {
    const session = await auth();
    if (!session?.user || !['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN'].includes(session.user.role)) {
        throw new Error("Unauthorized");
    }

    try {
        await db.ledgerAccount.update({
            where: { id: accountId },
            data: { isActive }
        });
        revalidatePath('/accounts');
        return { success: true };
    } catch (error: any) {
        // TODO: Log error to monitoring service
        throw new Error(error.message || "Failed to update account status");
    }
}

/**
 * Delete account (only if no transactions exist)
 */
export async function deleteAccount(accountId: string) {
    const session = await auth();
    if (!session?.user || !['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN'].includes(session.user.role)) {
        throw new Error("Unauthorized");
    }

    try {
        const account = await db.ledgerAccount.findUnique({
            where: { id: accountId },
            include: { _count: { select: { ledgerEntries: true } } }
        });

        if (!account) throw new Error("Account not found");

        if (account._count.ledgerEntries > 0) {
            throw new Error("Cannot delete account with existing transactions. Deactivate it instead.");
        }

        const mapping = await db.systemAccountingMapping.findFirst({
            where: { accountId }
        });

        if (mapping) {
            throw new Error("Cannot delete account that is mapped to a system event. Remove mapping first.");
        }

        await db.ledgerAccount.delete({
            where: { id: accountId }
        });

        revalidatePath('/accounts');
        return { success: true };
    } catch (error: any) {
        // TODO: Log error to monitoring service
        throw new Error(error.message || "Failed to delete account");
    }
}

/**
 * Update account type
 */
export async function updateAccountType(accountId: string, newType: string) {
    const session = await auth();
    if (!session?.user || !['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN'].includes(session.user.role)) {
        throw new Error("Unauthorized");
    }

    const validTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
    if (!validTypes.includes(newType)) {
        throw new Error("Invalid account type");
    }

    try {
        await db.$transaction(async (tx) => {
            const account = await tx.ledgerAccount.findUnique({
                where: { id: accountId },
                select: { type: true, code: true }
            });

            if (!account) throw new Error("Account not found");

            await tx.ledgerAccount.update({
                where: { id: accountId },
                data: { type: newType as any }
            });
        });

        revalidatePath('/accounts');
        return { success: true };
    } catch (error: any) {
        // TODO: Log error to monitoring service
        throw new Error(error.message || "Failed to update account type");
    }
}

