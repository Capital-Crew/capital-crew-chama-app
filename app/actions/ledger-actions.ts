'use server';

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { LedgerService } from "@/lib/services/ledger-service";
import { withAudit } from "@/lib/with-audit";
import { LedgerStatus, AccountType, NormalBalance, AuditLogAction } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { serializeFinancials } from "@/lib/safe-serialization";

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
    if (!new Decimal(ledger.balance.toString()).isZero()) {
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
 * Fetch all ledgers with full hierarchy
 */
export async function getAllLedgers() {
    const ledgers = await db.ledgerAccount.findMany({
        orderBy: { code: 'asc' },
        include: {
            children: true
        }
    });
    return serializeFinancials(ledgers);
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
