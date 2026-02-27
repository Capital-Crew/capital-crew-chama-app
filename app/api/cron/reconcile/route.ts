
import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils";
import { checkTransactionStatus } from "@/lib/mpesa-status";
import { WalletService } from "@/lib/services/WalletService";
import { ReconciliationService } from "@/lib/services/reconciliation-service";
import { AccountingEngine } from "@/lib/accounting/AccountingEngine";
import { ReferenceType, SystemAccountType } from "@prisma/client";

export async function GET(req: Request) {
    // 1. Security Check
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log("Starting Reconciliation Cron Job...");

        // 2. Find Stuck Transactions
        // Logic: PENDING status, Created > 1 min ago, Created < 24 hours ago
        const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const stuckTransactions = await prisma.transaction.findMany({
            where: {
                status: 'PENDING',
                createdAt: {
                    lt: oneMinuteAgo,
                    gt: twentyFourHoursAgo
                }
            },
            include: {
                member: true // Need member for wallet update
            }
        });

        console.log(`Found ${stuckTransactions.length} stuck transactions.`);

        const results = {
            processed: stuckTransactions.length,
            fixed: 0,
            failed: 0,
            stillPending: 0
        };

        // 3. Process Each Transaction
        for (const tx of stuckTransactions) {
            try {
                // Use the shared service
                const result = await ReconciliationService.reconcileTransaction(tx.id);

                if (result.status === 'COMPLETED') {
                    results.fixed++;
                    console.log(`FIXED: Transaction ${tx.id} marked COMPLETED.`);
                } else if (result.status === 'FAILED') {
                    results.failed++;
                    console.log(`UPDATED: Transaction ${tx.id} marked FAILED.`);
                } else {
                    results.stillPending++;
                }
            } catch (err) {
                console.error(`Error processing transaction ${tx.id}:`, err);
                // Don't halt the whole loop
            }
        }

        // 4. Clean Up Expired Transactions (> 24 Hours)
        const expiredTransactions = await prisma.transaction.updateMany({
            where: {
                status: 'PENDING',
                createdAt: {
                    lt: twentyFourHoursAgo
                }
            },
            data: {
                status: 'FAILED',
                failureReason: 'Transaction Expired (Automated)'
            }
        });

        if (expiredTransactions.count > 0) {
            console.log(`EXPIRED: Marked ${expiredTransactions.count} old pending transactions as FAILED.`);
        }

        return NextResponse.json({ success: true, results, expired: expiredTransactions.count });

    } catch (error) {
        return handleApiError(error, 'Reconcile Cron GET');
    }
}
