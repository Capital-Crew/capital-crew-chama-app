'use server'

import { db as prisma } from "@/lib/db"
import { auth } from '@/auth'
import { AccountingEngine } from "@/lib/accounting/AccountingEngine"
import { revalidatePath } from "next/cache"
import { ReferenceType, AuditLogAction } from "@prisma/client"
import { withAudit } from "@/lib/with-audit"

export const assignTransactionToMember = withAudit(
    { actionType: AuditLogAction.MPESA_RECONCILED, domain: 'MPESA', apiRoute: '/api/admin/mpesa/reconcile' },
    async (ctx, transactionId: string, memberId: string) => {
        ctx.beginStep('Verify Authorization');
        const session = await auth()
        if (!session?.user || !['SYSTEM_ADMIN', 'CHAIRPERSON', 'TREASURER'].includes(session.user.role)) {
            ctx.setErrorCode('UNAUTHORIZED');
            return { success: false, error: "Unauthorized: Access Restricted" }
        }
        ctx.endStep('Verify Authorization');

        try {
            ctx.beginStep('Fetch Transaction and Member');
            const transaction = await prisma.transaction.findUnique({
                where: { id: transactionId }
            });

            if (!transaction) {
                ctx.setErrorCode('TRANSACTION_NOT_FOUND');
                return { success: false, error: "Transaction not found" };
            }

            if (transaction.memberId) {
                ctx.setErrorCode('ALREADY_ASSIGNED');
                return { success: false, error: "Transaction is already assigned to a member" };
            }

            const member = await prisma.member.findUnique({
                where: { id: memberId },
                include: { wallet: true }
            });

            if (!member) {
                ctx.setErrorCode('MEMBER_NOT_FOUND');
                return { success: false, error: "Member not found" };
            }
            ctx.captureBefore('Transaction', transactionId, transaction);
            ctx.endStep('Fetch Transaction and Member');

            // 1. Link Member to Transaction
            ctx.beginStep('Update Transaction');
            await prisma.transaction.update({
                where: { id: transactionId },
                data: { memberId: member.id }
            });
            ctx.endStep('Update Transaction');

            // 2. Check and Post Ledger Entry
            ctx.beginStep('Post Ledger Entry');
            const existingLedger = await prisma.ledgerTransaction.findFirst({
                where: {
                    referenceId: transaction.id
                }
            });

            const existingLedgerByReceipt = transaction.mpesaReceiptNumber ? await prisma.ledgerTransaction.findFirst({
                where: { referenceId: transaction.mpesaReceiptNumber }
            }) : null;

            if (existingLedger || existingLedgerByReceipt) {
                revalidatePath('/admin/system');
                ctx.endStep('Post Ledger Entry', { exists: true });
                return { success: true, message: "Transaction linked. Ledger entry already existed." };
            }

            let wallet = member.wallet;
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
                ctx.setErrorCode('ASSET_ACCOUNT_NOT_CONFIGURED');
                return { success: false, error: "System Asset Account (EVENT_CASH_DEPOSIT) not configured." };
            }

            if (!liabilityAccountMap?.account) {
                ctx.setErrorCode('LIABILITY_ACCOUNT_NOT_CONFIGURED');
                return { success: false, error: "Member Liability Account (MEMBER_WALLET) not configured." };
            }

            if (!wallet) {
                wallet = await prisma.wallet.create({
                    data: {
                        memberId: member.id,
                        status: 'ACTIVE',
                        glAccountId: liabilityAccountMap.account.id,
                        accountRef: `WALLET_${member.memberNumber}`
                    }
                });
            }

            const description = `Manual Reconciliation: Deposit (${member.memberNumber})`;

            await AccountingEngine.postJournalEntry({
                description,
                transactionDate: transaction.createdAt,
                referenceType: ReferenceType.SAVINGS_DEPOSIT,
                referenceId: transaction.id,
                createdBy: session.user.id!,
                createdByName: session.user.name || "Manual Reconciliation",
                externalReferenceId: transaction.mpesaReceiptNumber || transaction.checkoutRequestId,
                lines: [
                    {
                        accountId: assetAccountMap.account.id,
                        debitAmount: Number(transaction.amount),
                        creditAmount: 0,
                        description: `Cash Deposit (Reconciled)`
                    },
                    {
                        accountId: wallet.glAccountId,
                        debitAmount: 0,
                        creditAmount: Number(transaction.amount),
                        description: `Credit to Wallet (${member.memberNumber})`
                    }
                ]
            });
            ctx.endStep('Post Ledger Entry');

            ctx.beginStep('Create Wallet Transaction');
            await prisma.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'DEPOSIT',
                    amount: Number(transaction.amount),
                    balanceAfter: 0,
                    description: `Deposit via M-Pesa (${transaction.mpesaReceiptNumber || 'Reconciled'})`,
                    immutable: true
                }
            });
            ctx.endStep('Create Wallet Transaction');

            const updatedTransaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
            if (updatedTransaction) ctx.captureAfter(updatedTransaction);

            revalidatePath('/admin/system');
            return { success: true, message: "Transaction linked and wallet credited successfully." };

        } catch (error: any) {
            ctx.setErrorCode('RECONCILIATION_FAILED');
            return { success: false, error: error.message || "Failed to reconcile transaction" };
        }
    }
);
