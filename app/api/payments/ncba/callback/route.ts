import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { normalizeMSISDN } from "@/lib/utils/phone";
import { AccountingEngine } from "@/lib/accounting/AccountingEngine";
import { getSystemMappingsDict } from "@/app/actions/system-accounting";
import { subMinutes, addMinutes } from "date-fns";
import { revalidatePath } from "next/cache";

/**
 * NCBA STK Push Callback Handler
 * Implements multi-stage matching and secure wallet crediting.
 */
export async function POST(req: Request) {
    try {
        const payload = await req.json();
        console.log("NCBA Callback Received:", payload);

        // Extract fields from NCBA payload (Adapting to standard NCBA/Safaricom-style callback)
        // Typically NCBA will send a reference, MSISDN, Amount, and ResultCode
        const { 
            transactionReference, 
            msisdn, 
            amount, 
            status: ncbaStatus,
            transactionTimestamp
        } = payload;

        if (!msisdn || !amount) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        const normalizedPayerPhone = normalizeMSISDN(msisdn);
        const floatAmount = Number(amount);

        // STEP 1: Match by ncba_reference
        let pendingTx = await prisma.pendingTransaction.findFirst({
            where: {
                ncbaReference: transactionReference,
                status: 'pending'
            },
            include: { user: true, wallet: true }
        });

        // STEP 2: Fallback Match (Phone + Amount + Time Window)
        if (!pendingTx) {
            const callbackTime = transactionTimestamp ? new Date(transactionTimestamp) : new Date();
            const windowStart = subMinutes(callbackTime, 10);
            const windowEnd = addMinutes(callbackTime, 10);

            pendingTx = await prisma.pendingTransaction.findFirst({
                where: {
                    payingPhone: normalizedPayerPhone,
                    amount: floatAmount,
                    status: 'pending',
                    initiatedAt: {
                        gte: windowStart,
                        lte: windowEnd
                    }
                },
                include: { user: true, wallet: true }
            });
        }

        // Handle Failure from NCBA
        if (ncbaStatus !== 'SUCCESS' && ncbaStatus !== '0') {
             if (pendingTx) {
                await prisma.pendingTransaction.update({
                    where: { id: pendingTx.id },
                    data: { 
                        status: 'failed',
                        callbackReceivedAt: new Date()
                    }
                });
            }
            return NextResponse.json({ message: "Callback processed (Transaction failed)" });
        }

        // STEP 3: Process Success
        if (pendingTx) {
            // Check for potential race conditions/duplicates
            if (pendingTx.status !== 'pending') {
                return NextResponse.json({ message: "Transaction already processed" });
            }

            const result = await prisma.$transaction(async (tx) => {
                // Update Pending Transaction
                await tx.pendingTransaction.update({
                    where: { id: pendingTx!.id },
                    data: {
                        status: 'completed',
                        callbackReceivedAt: new Date(),
                        ncbaReference: transactionReference // Ensure it's stored if matched via fallback
                    }
                });

                // Credit Wallet via Accounting Engine
                const mappings = await getSystemMappingsDict();
                const bankAccountCode = mappings.EVENT_CASH_DEPOSIT || mappings.CASH_ON_HAND; 
                // Note: ideally we have an 'NCBA_COLLECTION' account mapping

                if (!bankAccountCode) {
                    throw new Error("System mapping for deposit source not found");
                }

                await AccountingEngine.postJournalEntry({
                    transactionDate: new Date(),
                    referenceType: 'SAVINGS_DEPOSIT',
                    referenceId: pendingTx!.userId,
                    externalReferenceId: transactionReference || pendingTx!.id,
                    description: `NCBA Deposit - ${msisdn}`,
                    lines: [
                        {
                            accountCode: bankAccountCode,
                            debitAmount: floatAmount,
                            creditAmount: 0,
                            description: `NCBA Funds Received (${msisdn})`
                        },
                        {
                            accountId: pendingTx!.wallet.glAccountId,
                            debitAmount: 0,
                            creditAmount: floatAmount,
                            description: `Wallet Credit (${pendingTx!.user.name})`
                        }
                    ],
                    createdBy: 'SYSTEM_NCBA_CALLBACK',
                    createdByName: 'NCBA Callback Handler'
                }, tx as any);

                return { success: true };
            });

            // Revalidate paths
            revalidatePath('/wallet');
            revalidatePath('/dashboard');

            return NextResponse.json({ success: true, message: "Wallet credited successfully" });

        } else {
            // STEP 4: Unmatched Callback
            console.error("UNMATCHED NCBA CALLBACK:", { normalizedPayerPhone, floatAmount, transactionReference });
            // TODO: Alert Ops Team
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

    } catch (error: any) {
        console.error("NCBA Callback Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
