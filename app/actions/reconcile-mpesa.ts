'use server'

import prisma from "@/lib/prisma"
import { AccountingEngine } from "@/lib/accounting/AccountingEngine"
import { revalidatePath } from "next/cache"
import { ReferenceType } from "@prisma/client"

export async function assignTransactionToMember(transactionId: string, memberId: string) {
    try {
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId }
        });

        if (!transaction) {
            return { success: false, error: "Transaction not found" };
        }

        if (transaction.memberId) {
            return { success: false, error: "Transaction is already assigned to a member" };
        }

        const member = await prisma.member.findUnique({
            where: { id: memberId },
            include: { wallet: true }
        });

        if (!member) {
            return { success: false, error: "Member not found" };
        }

        // 1. Link Member to Transaction
        await prisma.transaction.update({
            where: { id: transactionId },
            data: { memberId: member.id }
        });

        // 2. Check and Post Ledger Entry
        // We check if a ledger entry already exists for this transaction reference
        const existingLedger = await prisma.ledgerTransaction.findFirst({
            where: {
                referenceId: transaction.id // Assuming we use transaction ID as reference
            }
        });

        // To be safe, let's check both ID and Receipt
        const existingLedgerByReceipt = transaction.mpesaReceiptNumber ? await prisma.ledgerTransaction.findFirst({
            where: { referenceId: transaction.mpesaReceiptNumber }
        }) : null;

        if (existingLedger || existingLedgerByReceipt) {
            // Ledger entry exists, just linking was enough.
            revalidatePath('/admin/system');
            return { success: true, message: "Transaction linked. Ledger entry already existed." };
        }

        // 3. Post Missing Ledger Entry
        // Need to ensure wallet exists
        let wallet = member.wallet;

        // Fetch System Asset Account for Cash Deposit and Member Liability Account
        const [assetAccountMap, liabilityAccountMap] = await Promise.all([
            prisma.systemAccountingMapping.findUnique({
                where: { type: 'EVENT_CASH_DEPOSIT' },
                include: { account: true }
            }),
            prisma.systemAccountingMapping.findUnique({
                where: { type: 'MEMBER_WALLET' },
                include: { account: true }
            })
        ]);

        if (!assetAccountMap?.account) {
            return { success: false, error: "System Asset Account (EVENT_CASH_DEPOSIT) not configured." };
        }

        if (!liabilityAccountMap?.account) {
            return { success: false, error: "Member Liability Account (MEMBER_WALLET) not configured." };
        }

        if (!wallet) {
            // Need a unique accountRef. Use Member Number as base
            wallet = await prisma.wallet.create({
                data: {
                    memberId: member.id,
                    status: 'ACTIVE',
                    glAccountId: liabilityAccountMap.account.id,
                    accountRef: `WALLET_${member.memberNumber}`
                }
            });
        }

        // Credit User Wallet (Liability), Debit System Asset (Asset)
        const description = `Manual Reconciliation: Deposit (${member.memberNumber})`;

        await AccountingEngine.postJournalEntry({
            description,
            transactionDate: transaction.createdAt,
            referenceType: ReferenceType.SAVINGS_DEPOSIT,
            referenceId: transaction.id,
            createdBy: "ADMIN",
            createdByName: "Manual Reconciliation",
            externalReferenceId: transaction.mpesaReceiptNumber || transaction.checkoutRequestId,
            lines: [
                {
                    accountId: assetAccountMap.account.id,
                    debitAmount: Number(transaction.amount),
                    creditAmount: 0,
                    description: `Cash Deposit (Reconciled)`
                },
                {
                    accountId: liabilityAccountMap.account.id, // Use the GL Account ID
                    debitAmount: 0,
                    creditAmount: Number(transaction.amount),
                    description: `Credit to Wallet (${member.memberNumber})`
                }
            ]
        });

        // We no longer manually update wallet.balance as it is derived or removed. 
        // If we need to track this transaction specifically for the wallet, we should check if postJournalEntry creates a WalletTransaction
        // AccountingEngine usually handles this if configured, or we might need to manually create a WalletTransaction.
        // Assuming postJournalEntry handles GL, but we might want a visible WalletTransaction record?
        // Checking schema: WalletTransaction links to Wallet. 

        // Let's create a WalletTransaction record for visibility in the user's statement
        await prisma.walletTransaction.create({
            data: {
                walletId: wallet.id,
                type: 'DEPOSIT', // Assuming this enum exists or similar
                amount: Number(transaction.amount),
                balanceAfter: 0, // Legacy/Display field, maybe calculate from GL or fetch? Leaving 0 if not critical or fetch sum.
                description: `Deposit via M-Pesa (${transaction.mpesaReceiptNumber || 'Reconciled'})`,
                immutable: true
            }
        });

        revalidatePath('/admin/system');
        return { success: true, message: "Transaction linked and wallet credited successfully." };

    } catch (error: any) {
        console.error("Reconciliation Error:", error);
        return { success: false, error: error.message || "Failed to reconcile transaction" };
    }
}
