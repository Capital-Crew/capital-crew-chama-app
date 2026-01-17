import { NextResponse } from "next/server";
import { WithdrawalService } from "@/lib/services/WithdrawalService";

export async function POST(req: Request) {
    try {
        const { userId, amount, phoneNumber } = await req.json();

        if (!userId || !amount || !phoneNumber) {
            return NextResponse.json(
                { error: "UserId, Amount, and PhoneNumber are required" },
                { status: 400 }
            );
        }

        // Process Withdrawal
        // We use a generated reference for now, or could use M-Pesa's if we had async B2C.
        const reference = `WD-${Date.now()}`;

        // Call Service
        const transactionId = await WithdrawalService.processWithdrawal(userId, Number(amount), reference);

        // In a real B2C set up, we would initiate the M-Pesa request here.
        // Since we are "ensuring logic", the Service handling the Ledger/Wallet debit is the key part.

        return NextResponse.json({
            success: true,
            message: "Withdrawal processed successfully",
            transactionId,
            reference
        });

    } catch (error: any) {
        console.error("Withdrawal Error:", error);
        return NextResponse.json({ error: error.message || "Withdrawal Failed" }, { status: 500 });
    }
}
