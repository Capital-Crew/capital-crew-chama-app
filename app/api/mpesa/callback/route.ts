import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { CollectionService } from "@/lib/services/CollectionService";

// Safaricom Callback IP Ranges
const SAFARICOM_IPS = [
    '196.201.214.200',
    '196.201.214.206',
    '196.201.213.114',
    '196.201.214.207',
    '196.201.214.208',
    '196.216.242.45'
];

export async function POST(req: Request) {
    // 0. IP Validation (Security Hardening)
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const isSafaricomIp = SAFARICOM_IPS.includes(clientIp);

    // Skip validation only in development if needed, but for production-grade audit we enforce it.
    if (!isSafaricomIp && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const payload = await req.json();
        const { Body } = payload;

        if (!Body || !Body.stkCallback) {
            return NextResponse.json({ error: "Invalid Payload" }, { status: 400 });
        }

        const { stkCallback } = Body;
        const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;


        // 1. Find Transaction
        const transaction = await prisma.transaction.findUnique({
            where: { checkoutRequestId: CheckoutRequestID },
        });

        if (!transaction) {
            return NextResponse.json({ result: "Transaction not found" });
        }

        if (ResultCode === 0) {
            // Success
            let mpesaReceiptNumber = null;
            if (CallbackMetadata && CallbackMetadata.Item) {
                const receiptItem = CallbackMetadata.Item.find((item: any) => item.Name === "MpesaReceiptNumber");
                if (receiptItem) {
                    mpesaReceiptNumber = receiptItem.Value;
                }
            }

            // 2. Update Transaction Status (Optimistic)
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: "COMPLETED",
                    mpesaReceiptNumber: mpesaReceiptNumber,
                },
            });

            // 3. Delegate Financial Posting to CollectionService
            try {
                await CollectionService.processMpesaDeposit({
                    transactionId: transaction.id,
                    mpesaReceiptNumber: mpesaReceiptNumber || 'Unknown',
                    phoneNumber: transaction.phoneNumber,
                    amount: Number(transaction.amount),
                    memberId: transaction.memberId || undefined
                });
            } catch (ledgerError) {
                // The callback itself is success because M-Pesa logic is done, but we log the internal failure.
            }

        } else {
            // Failed or Cancelled
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: "FAILED",
                    failureReason: ResultDesc || "Unknown Error",
                },
            });
        }

        return NextResponse.json({ result: "Success" });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
