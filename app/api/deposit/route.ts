import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { handleApiError } from "@/lib/api-utils";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { amount, phoneNumber } = await req.json();

        if (!amount || !phoneNumber) {
            return NextResponse.json({ error: "Amount and Phone Number are required" }, { status: 400 });
        }

        // Import and call the new initiation logic
        const { initiatePayment } = await import("@/app/actions/payment-actions");
        
        // Note: initiatePayment is a withAudit action. For an API route, 
        // we might need to handle context differently, but calling it directly 
        // will at least trigger the flow.
        const result = await initiatePayment({
            amount: Number(amount),
            payingPhone: phoneNumber
        });

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: result.message,
                transactionId: result.transactionId
            });
        } else {
            throw new Error("NCBA Payment Initiation Failed");
        }

    } catch (error: any) {
        return handleApiError(error, 'Deposit POST');
    }
}
