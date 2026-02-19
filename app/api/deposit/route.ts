import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/db"; // (Default export from lib/prisma.ts)
import { initiateSTKPush } from "@/lib/mpesa";

export async function POST(req: Request) {
    try {
        const { phoneNumber, amount, memberId } = await req.json();

        if (!phoneNumber || !amount || !memberId) {
            return NextResponse.json(
                { error: "Phone, Amount, and Member ID are required" },
                { status: 400 }
            );
        }

        // Create a pending transaction
        const tempId = `PENDING_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        const transaction = await prisma.transaction.create({
            data: {
                phoneNumber: phoneNumber,
                amount: amount,
                memberId: memberId,
                status: "PENDING", // Enum value
                checkoutRequestId: tempId,
            },
        });

        try {
            const stkResponse = await initiateSTKPush(phoneNumber, amount);
            const checkoutRequestId = stkResponse.CheckoutRequestID;

            // Update the transaction with the real CheckoutRequestID
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    checkoutRequestId: checkoutRequestId,
                },
            });

            return NextResponse.json({ success: true, message: "STK Push Initiated", checkoutRequestId });
        } catch (error: any) {
            // If STK push fails, mark transaction as FAILED
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: { status: "FAILED" },
            });
            console.error("STK Push Failed:", error);
            return NextResponse.json({ error: error.message || "STK Push Failed" }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Deposit Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
