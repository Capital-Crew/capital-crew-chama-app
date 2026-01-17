
import prisma from "@/lib/prisma";
import { checkTransactionStatus } from "@/lib/mpesa-status";
import { WalletService } from "@/lib/services/WalletService";
import { AccountingEngine } from "@/lib/accounting/AccountingEngine";
import { ReferenceType, SystemAccountType } from "@prisma/client";

export class ReconciliationService {

    /**
     * Reconciles a single transaction by checking its status with M-Pesa
     * and updating the database (Transaction, Ledger, Wallet) safely.
     */
    /**
     * Helper to process the successful completion of a transaction (Atomic DB Update)
     */
    private static async _processSuccessfulReconciliation(tx: any, mpesaReceiptNumber: string) {
        await prisma.$transaction(async (prismaTx: any) => {
            // A. Update Transaction Status
            await prismaTx.transaction.update({
                where: { id: tx.id },
                data: {
                    status: "COMPLETED",
                    mpesaReceiptNumber: mpesaReceiptNumber || tx.mpesaReceiptNumber
                }
            });

            // B. Ledger & Wallet Update (Only if not already recorded)
            if (tx.memberId) {
                const wallet = await WalletService.createWallet(tx.memberId, prismaTx);

                const assetAccountCode = await prismaTx.systemAccountingMapping.findUnique({
                    where: { type: SystemAccountType.EVENT_CASH_DEPOSIT },
                    include: { account: true }
                });

                if (!assetAccountCode?.account) {
                    throw new Error("System Asset Account not configured");
                }

                // Check for existing ledger entry by INTERNAL reference ID
                const existingEntryByRef = await prismaTx.ledgerTransaction.findFirst({
                    where: { referenceId: tx.id }
                });

                // Check for existing ledger entry by EXTERNAL reference ID (M-Pesa Receipt)
                const existingEntryByReceipt = mpesaReceiptNumber
                    ? await prismaTx.ledgerTransaction.findUnique({
                        where: { externalReferenceId: mpesaReceiptNumber }
                    })
                    : null;

                if (!existingEntryByRef && !existingEntryByReceipt) {
                    const amount = Number(tx.amount);

                    await AccountingEngine.postJournalEntry({
                        transactionDate: new Date(),
                        referenceType: ReferenceType.SAVINGS_DEPOSIT,
                        referenceId: tx.id,
                        description: `Reconciled M-Pesa Deposit`,
                        createdBy: "SYSTEM_RECONCILE",
                        createdByName: "Reconciler",
                        externalReferenceId: mpesaReceiptNumber,
                        lines: [
                            {
                                accountId: assetAccountCode.account.id,
                                debitAmount: amount,
                                creditAmount: 0,
                                description: `Cash Deposit from ${tx.phoneNumber}`
                            },
                            {
                                accountId: wallet.glAccountId,
                                debitAmount: 0,
                                creditAmount: amount,
                                description: `Credit to Wallet (${tx.member?.memberNumber || 'Unknown'})`
                            }
                        ]
                    }, prismaTx);

                    // Create Wallet Transaction Record
                    const updatedWalletGL = await prismaTx.ledgerAccount.findUnique({ where: { id: wallet.glAccountId } });
                    await prismaTx.walletTransaction.create({
                        data: {
                            walletId: wallet.id,
                            type: 'DEPOSIT',
                            amount: amount,
                            balanceAfter: updatedWalletGL?.balance || 0,
                            description: `Reconciled Deposit (${mpesaReceiptNumber || 'Ref Unknown'})`
                        }
                    });
                }
            }
        });
    }

    /**
     * REFACTOR: Automated Check
     */
    static async reconcileTransaction(transactionId: string) {
        // 1. Fetch Transaction
        const tx = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { member: true }
        });

        if (!tx) {
            throw new Error(`Transaction ${transactionId} not found`);
        }

        if (tx.status !== 'PENDING') {
            return { success: false, status: tx.status, message: `Transaction is already ${tx.status}` };
        }

        // 2. Check Status with M-Pesa
        const statusResult = await checkTransactionStatus(tx.checkoutRequestId);

        // 3. Update Database based on result
        if (statusResult.status === 'COMPLETED') {
            await this._processSuccessfulReconciliation(tx, statusResult.mpesaReceiptNumber || "N/A");
            return { success: true, status: 'COMPLETED', message: 'Transaction successfully reconciled and funds deposited.' };
        } else if (statusResult.status === 'FAILED') {
            // Mark as FAILED
            await prisma.transaction.update({
                where: { id: tx.id },
                data: {
                    status: 'FAILED',
                    failureReason: statusResult.failureReason
                }
            });
            return { success: true, status: 'FAILED', message: `Transaction failed: ${statusResult.failureReason}` };
        } else {
            return { success: false, status: 'PENDING', message: 'Transaction is still processing at M-Pesa.' };
        }
    }

    /**
     * NEW: Manual Resolved by User Input
     */
    static async resolveManually(transactionId: string, mpesaReceiptNumber: string) {
        const tx = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { member: true }
        });

        if (!tx) throw new Error(`Transaction ${transactionId} not found`);
        if (tx.status !== 'PENDING') throw new Error("Only pending transactions can be manually resolved");
        if (!mpesaReceiptNumber) throw new Error("M-Pesa Receipt Number is required");

        await this._processSuccessfulReconciliation(tx, mpesaReceiptNumber);
        return { success: true, message: "Transaction manually resolved." };
    }

    /**
     * Fixes "Completed" transactions that are missing Ledger Entries
     */
    static async syncTransactionLedger(transactionId: string) {
        const tx = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { member: true }
        });

        if (!tx) throw new Error("Transaction not found");
        if (tx.status !== 'COMPLETED') throw new Error("Transaction must be COMPLETED to sync ledger");

        // Check if Ledger Entry ALREADY exists
        const existingViaRef = await prisma.ledgerTransaction.findFirst({
            where: { referenceId: tx.id }
        });

        const existingViaReceipt = tx.mpesaReceiptNumber
            ? await prisma.ledgerTransaction.findUnique({ where: { externalReferenceId: tx.mpesaReceiptNumber } })
            : null;

        if (existingViaRef || existingViaReceipt) {
            return { success: false, message: "Ledger entry already exists. No action taken." };
        }

        // If missing, we force post it.
        // We reuse the internal logic but ensure we pass the correct receipt (or fallback to ID if receipt is missing/bad)
        const receiptToUse = tx.mpesaReceiptNumber || tx.checkoutRequestId;

        await this._processSuccessfulReconciliation(tx, receiptToUse);

        return { success: true, message: "Ledger entry created successfully." };
    }
}

