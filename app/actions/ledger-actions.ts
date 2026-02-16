'use server';

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { LedgerService } from "@/lib/services/ledger-service";
import { withAudit } from "@/lib/with-audit";
import { LedgerStatus, AccountType, NormalBalance, AuditLogAction } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { serializeFinancials } from "@/lib/safe-serialization";
import { AccountingEngine } from "@/lib/accounting/AccountingEngine";

export async function getTransactionLedger(transactionId: string) {
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
        console.error("Error fetching ledger:", error);
        return null;
    }
}

// ========================================
// LEDGER MANAGEMENT ACTIONS
// ========================================

/**
 * Creates a new ledger in PENDING state (Maker-Checker 1/2)
 */
export const createLedgerAction = withAudit({ action: AuditLogAction.LEDGER_CREATED, context: 'FINANCE' }, async (formData: FormData) => {
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
    return serializeFinancials(ledger);
});

/**
 * Approves a pending ledger (Maker-Checker 2/2)
 */
export const approveLedgerAction = withAudit({ action: AuditLogAction.LEDGER_APPROVED, context: 'FINANCE' }, async (ledgerId: string) => {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const ledger = await db.ledgerAccount.findUnique({ where: { id: ledgerId } });
    if (!ledger) throw new Error("Ledger not found");
    if (ledger.status !== LedgerStatus.PENDING) throw new Error("Ledger is not in PENDING status");

    // Enforce Maker-Checker: Approver must be different from Creator
    if (ledger.createdBy === session.user.id) {
        throw new Error("Checker cannot be the same user as the Maker. Please ask another administrator to approve.");
    }

    const updated = await db.ledgerAccount.update({
        where: { id: ledgerId },
        data: {
            status: LedgerStatus.ACTIVE, // Assuming activation happens on approval for simplicity, or add explicit ACTIVATE
            approvedBy: session.user.id,
            activatedBy: session.user.id,
            activatedAt: new Date(),
            version: { increment: 1 }
        }
    });

    revalidatePath('/admin');
    return serializeFinancials(updated);
});

/**
 * Closes a ledger (e.g. for discontinued products)
 */
export const closeLedgerAction = withAudit({ action: AuditLogAction.LEDGER_CLOSED, context: 'FINANCE' }, async (ledgerId: string) => {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const ledger = await db.ledgerAccount.findUnique({ where: { id: ledgerId } });
    if (!ledger) throw new Error("Ledger not found");

    // Check if balance is zero before closing (optional but recommended)
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
    return serializeFinancials(updated);
});

/**
 * Reactivates a closed ledger
 */
export const reactivateLedgerAction = withAudit({ action: AuditLogAction.LEDGER_APPROVED, context: 'FINANCE' }, async (ledgerId: string) => {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const ledger = await db.ledgerAccount.findUnique({ where: { id: ledgerId } });
    if (!ledger) throw new Error("Ledger not found");
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
    return serializeFinancials(updated);
});

/**
 * Rejects (deletes) a pending ledger
 */
export const rejectLedgerAction = withAudit({ action: AuditLogAction.LEDGER_CLOSED, context: 'FINANCE' }, async (ledgerId: string) => {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const ledger = await db.ledgerAccount.findUnique({ where: { id: ledgerId } });
    if (!ledger) throw new Error("Ledger not found");
    if (ledger.status !== LedgerStatus.PENDING) throw new Error("Only pending ledgers can be rejected");

    // Maker-Checker: Rejector must be different from Creator
    if (ledger.createdBy === session.user.id) {
        throw new Error("You cannot reject your own ledger request. Please ask another administrator.");
    }

    await db.ledgerAccount.delete({ where: { id: ledgerId } });

    revalidatePath('/admin');
    return { success: true };
});

/**
 * Fetch all ledgers with full hierarchy
 */
export async function getAllLedgers() {
    const ledgers = await db.ledgerAccount.findMany({
        orderBy: { code: 'asc' },
        include: {
            children: true
        }
    });

    // Enrich with creator names for pending approvals
    const enriched = await Promise.all(
        ledgers.map(async (ledger) => {
            let createdByName = null;
            let approvedByName = null;
            if (ledger.createdBy) {
                const creator = await db.user.findUnique({
                    where: { id: ledger.createdBy },
                    select: { name: true }
                });
                createdByName = creator?.name || 'Unknown';
            }
            if (ledger.approvedBy) {
                const approver = await db.user.findUnique({
                    where: { id: ledger.approvedBy },
                    select: { name: true }
                });
                approvedByName = approver?.name || 'Unknown';
            }
            return { ...ledger, createdByName, approvedByName };
        })
    );

    return serializeFinancials(enriched);
}

/**
 * Fetch auditable journal transactions
 */
export async function getJournalTransactions(limit = 50, offset = 0) {
    const transactions = await db.ledgerTransaction.findMany({
        take: limit,
        skip: offset,
        orderBy: { transactionDate: 'desc' },
        include: {
            ledgerEntries: {
                include: {
                    ledgerAccount: {
                        select: { code: true, name: true }
                    }
                }
            }
        }
    });
    return serializeFinancials(transactions);
}

/**
 * Reverse a journal entry via AccountingEngine
 */
export const reverseJournalEntryAction = withAudit({ action: AuditLogAction.JOURNAL_REVERSAL, context: 'FINANCE' }, async (journalEntryId: string, reason: string) => {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const result = await AccountingEngine.reverseJournalEntry(
        journalEntryId,
        reason,
        session.user.id,
        session.user.name || 'Admin'
    );

    revalidatePath('/admin');
    return serializeFinancials(result);
});
