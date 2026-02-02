import { db } from "@/lib/db";
import { AccountingEngine } from "@/lib/accounting/AccountingEngine";
import { startOfMonth, addMonths, isSameMonth } from "date-fns";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export class ContributionsService {
    /**
     * Records a contribution with "Waterfall" logic:
     * 1. Fills Arrears (Oldest first)
     * 2. Fills Current Month
     * 3. Pre-pays Future Months
     * 4. Books GL Transaction (Debit Wallet, Credit Contributions)
     */
    static async recordContribution(memberId: string, amount: number, walletId: string) {
        if (amount <= 0) throw new Error("Amount must be positive");

        return await db.$transaction(async (tx) => {
            // 1. Fetch Settings & Wallet
            const settings = await tx.saccoSettings.findFirst();
            const monthlyRate = Number(settings?.monthlyContributionAmount || 2000);

            const wallet = await tx.wallet.findUnique({
                where: { id: walletId },
                include: { glAccount: true }
            });

            if (!wallet || !wallet.glAccount) throw new Error("Wallet or GL Account not found");

            // 2. Validate Funds (Optional: GL Validation handles this, but good UI feedback)
            const walletBalance = await AccountingEngine.getAccountBalance(wallet.glAccount.code, undefined, undefined, tx as any);
            if (walletBalance < amount) {
                throw new Error("Insufficient funds in wallet");
            }

            // 3. Waterfall Logic
            let remainingAmount = amount;

            // Phase A: Fill Existing Unpaid Trackers (Arrears -> Current)
            // Find all trackers with balance > 0, ordered effectively by date (oldest first)
            const pendingTrackers = await tx.monthlyTracker.findMany({
                where: {
                    memberId,
                    balance: { gt: 0 }
                },
                orderBy: { month: 'asc' }
            });

            for (const tracker of pendingTrackers) {
                if (remainingAmount <= 0) break;

                const balance = Number(tracker.balance);
                const payment = Math.min(remainingAmount, balance);

                await tx.monthlyTracker.update({
                    where: { id: tracker.id },
                    data: {
                        paid: { increment: payment },
                        balance: { decrement: payment },
                        status: (Number(tracker.paid) + payment) >= Number(tracker.required) ? 'PAID' : 'PARTIAL'
                    }
                });

                remainingAmount -= payment;
            }

            // Phase B: Future Contributions (Pre-payment)
            // If money remains, we need to find the "Next" month to start creating buckets for.
            if (remainingAmount > 0) {
                // Determine start date for new buckets
                let nextMonthDate: Date;

                // Get the latest tracker date
                const lastTracker = await tx.monthlyTracker.findFirst({
                    where: { memberId },
                    orderBy: { month: 'desc' }
                });

                if (lastTracker) {
                    nextMonthDate = addMonths(lastTracker.month, 1);
                } else {
                    // If no trackers exist, start from THIS month (if not already covered) or maybe checking join date?
                    // Safe default: Start of current month
                    nextMonthDate = startOfMonth(new Date());
                }

                while (remainingAmount > 0) {
                    const payment = Math.min(remainingAmount, monthlyRate);

                    // Create new tracker
                    await tx.monthlyTracker.create({
                        data: {
                            memberId,
                            month: nextMonthDate,
                            year: nextMonthDate.getFullYear(),
                            required: monthlyRate,
                            paid: payment,
                            balance: monthlyRate - payment,
                            status: payment >= monthlyRate ? 'PAID' : 'PARTIAL'
                        }
                    });

                    remainingAmount -= payment;
                    nextMonthDate = addMonths(nextMonthDate, 1);
                }
            }

            // 4. Record Contribution Transaction (Audit)
            const contribTx = await tx.contributionTransaction.create({
                data: {
                    memberId,
                    walletId,
                    amount: amount
                }
            });

            // 5. Post to General Ledger
            // Debit: Member Wallet (Liability decreases)
            // Credit: Contributions (Asset/Liability? Account 1200)
            const journalEntry = await AccountingEngine.postJournalEntry({
                transactionDate: new Date(),
                referenceType: 'SHARE_CONTRIBUTION',
                referenceId: memberId,
                description: `Contribution Payment - Member ${memberId}`,
                createdBy: 'SYSTEM', // Asking user ID might be better if passed
                createdByName: 'System',
                lines: [
                    {
                        accountId: wallet.glAccountId, // Debit Member Wallet
                        debitAmount: amount,
                        creditAmount: 0,
                        description: `Transfer to Contributions`
                    },
                    {
                        accountCode: '1200', // Credit Contributions (Member Fund)
                        debitAmount: 0,
                        creditAmount: amount,
                        description: `Share Contribution`
                    }
                ]
            }, tx as any);

            // Link Ledger Entry to Contribution Transaction
            await tx.contributionTransaction.update({
                where: { id: contribTx.id },
                data: { ledgerTransactionId: journalEntry.id }
            });

            // 6. Update member.shareContributions (Legacy field for compatibility)
            await tx.member.update({
                where: { id: memberId },
                data: {
                    shareContributions: {
                        increment: amount
                    }
                }
            });

            return contribTx;
        });
    }

    /**
     * Cron Job Logic: Runs monthly to apply penalties on missed payments.
     */
    static async applyMonthlyPenalties() {
        // Implementation for Cron Job (TODO)
        // Find trackers for passed months where balance > 0 and !isPenalized
    }
}
