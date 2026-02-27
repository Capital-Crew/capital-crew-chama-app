import { NextResponse } from "next/server";
import { MpesaService } from "@/lib/mpesa";
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

        const cleanPhone = phoneNumber.startsWith("+") ? phoneNumber.substring(1) : phoneNumber;

        // Use MpesaService
        const result = await MpesaService.initiateSTKPush(
            cleanPhone,
            Number(amount)
        );

        if (result.ResponseCode === "0") {
            return NextResponse.json({
                success: true,
                message: "Payment requested. Please check your phone for the M-Pesa pin prompt.",
                checkoutRequestId: result.CheckoutRequestID
            });
        } else {
            throw new Error(result.ResponseDescription || "STK Push Failed");
        }

    } catch (error: any) {
        return handleApiError(error, 'Deposit POST');
    }
}
