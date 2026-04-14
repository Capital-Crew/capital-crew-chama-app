import { AccountingEngine, JournalEntryInput } from '@/lib/accounting/AccountingEngine';
import { db as prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { Decimal } from 'decimal.js';

export class CLNAccountingService {
    /**
     * Post individual subscription (Wallet -> Escrow)
     */
    static async postSubscription(params: {
        userId?: string;
        groupId?: string;
        loanNoteId: string;
        amount: number;
        idempotencyKey: string;
        tx: Prisma.TransactionClient;
    }) {
        const { userId, groupId, loanNoteId, amount, idempotencyKey, tx } = params;

        if (!userId && !groupId) throw new Error('Either userId or groupId must be provided');

        // Resolve Wallet & GL Account
        let glAccountId: string;
        let descriptionActor: string;

        if (userId) {
            const wallet = await tx.wallet.findFirst({
                where: { member: { user: { id: userId } } },
                include: { glAccount: true }
            });
            if (!wallet) throw new Error('Subscriber wallet not found');
            glAccountId = wallet.glAccountId;
            descriptionActor = `User ${userId}`;
        } else {
            const groupWallet = await tx.groupWallet.findFirst({
                where: { groupId },
                include: { glAccount: true }
            });
            if (!groupWallet || !groupWallet.glAccountId) throw new Error('Group treasury wallet/mapping not found');
            glAccountId = groupWallet.glAccountId;
            descriptionActor = `Group ${groupId}`;
        }

        // Escrow account for the note
        const escrowMapping = await tx.systemAccountingMapping.findUnique({
            where: { type: 'EVENT_CLN_ESCROW' as any }
        });
        
        // Actually, the prompt says escrow:{loan_note_id}
        // In our system, we might create a specific account or use a central one with referenceId.
        // Let's use a central "Loan Escrow" account and tag with referenceId.
        const escrowAccount = await tx.ledgerAccount.findUnique({
            where: { code: 'ESCROW-CLN' } // Assuming this exists or we create it
        });

        if (!escrowAccount) throw new Error('Escrow account (ESCROW-CLN) not found in ledger');

        // 2. Post Journal Entry
        // DR wallet (Liability decrease) / CR escrow (Liability increase)
        // Wait, members' wallets are liabilities to the group.
        // If money moves from member's pocket to the group's pocket, it's still a liability (the group owes the member).
        // BUT, in double-entry:
        // Member Wallet (Liability) -> Escrow (Liability)
        // Correct Entry:
        // DR Wallet:{user_id}   (Reducing what we owe to the member's wallet)
        // CR Escrow:{cln_id}   (Increasing what we owe to the escrow/noteholders)
        
        return await AccountingEngine.postJournalEntry({
            transactionDate: new Date(),
            referenceType: 'CLN_SUBSCRIPTION' as any,
            referenceId: loanNoteId,
            description: `Subscription to Loan Note ${loanNoteId} - ${descriptionActor}`,
            createdBy: userId || 'SYSTEM',
            createdByName: userId ? 'Subscriber' : 'Group Treasury',
            externalReferenceId: idempotencyKey,
            lines: [
                {
                    accountId: glAccountId,
                    debitAmount: amount,
                    creditAmount: 0,
                    description: 'Debit Subscriber Wallet/Treasury'
                },
                {
                    accountId: escrowAccount.id,
                    debitAmount: 0,
                    creditAmount: amount,
                    description: 'Credit Note Escrow'
                }
            ]
        }, tx);
    }

    /**
     * Post Escrow Release to Floater (Escrow -> Floater Wallet)
     */
    static async postEscrowRelease(params: {
        loanNoteId: string;
        floaterId: string;
        amount: number;
        idempotencyKey: string;
        tx: Prisma.TransactionClient;
    }) {
        const { loanNoteId, floaterId, amount, idempotencyKey, tx } = params;

        const floaterWallet = await tx.wallet.findFirst({
            where: { member: { user: { id: floaterId } } },
            include: { glAccount: true }
        });
        if (!floaterWallet) throw new Error('Floater wallet not found');

        const escrowAccount = await tx.ledgerAccount.findUnique({
            where: { code: 'ESCROW-CLN' }
        });
        if (!escrowAccount) throw new Error('Escrow account not found');

        // DR Escrow (Liability decrease) / CR Floater Wallet (Liability increase)
        return await AccountingEngine.postJournalEntry({
            transactionDate: new Date(),
            referenceType: 'CLN_ESCROW_RELEASE' as any,
            referenceId: loanNoteId,
            description: `Escrow Release for Loan Note ${loanNoteId} to Floater ${floaterId}`,
            createdBy: 'SYSTEM',
            createdByName: 'System',
            externalReferenceId: idempotencyKey,
            lines: [
                {
                    accountId: escrowAccount.id,
                    debitAmount: amount,
                    creditAmount: 0,
                    description: 'Debit Note Escrow'
                },
                {
                    accountId: floaterWallet.glAccountId,
                    debitAmount: 0,
                    creditAmount: amount,
                    description: 'Credit Floater Wallet'
                }
            ]
        }, tx);
    }

    /**
     * Post Payment Event (Floater -> Subscribers)
     */
    static async postPayout(params: {
        paymentScheduleId: string;
        floaterId: string;
        totalAmount: number;
        disbursements: {
            subscriberId?: string;
            groupId?: string;
            amount: number;
            glAccountId: string;
        }[];
        idempotencyKey: string;
        tx: Prisma.TransactionClient;
    }) {
        const { paymentScheduleId, floaterId, totalAmount, disbursements, idempotencyKey, tx } = params;

        const floaterWallet = await tx.wallet.findFirst({
            where: { member: { user: { id: floaterId } } },
            include: { glAccount: true }
        });
        if (!floaterWallet) throw new Error('Floater wallet not found');

        // DR Floater Wallet (Liability decrease)
        const lines = [
            {
                accountId: floaterWallet.glAccountId,
                debitAmount: totalAmount,
                creditAmount: 0,
                description: 'Debit Floater Wallet for Payout'
            }
        ];

        // CR Subscriber Wallets / Group Treasury (Liability increase)
        for (const d of disbursements) {
            lines.push({
                accountId: d.glAccountId,
                debitAmount: 0,
                creditAmount: d.amount,
                description: `Credit Subscriber/Treasury`
            });
        }

        return await AccountingEngine.postJournalEntry({
            transactionDate: new Date(),
            referenceType: 'CLN_PAYMENT' as any,
            referenceId: paymentScheduleId,
            description: `Payment Payout for Schedule ${paymentScheduleId}`,
            createdBy: 'SYSTEM',
            createdByName: 'System',
            externalReferenceId: idempotencyKey,
            lines
        }, tx);
    }
}
