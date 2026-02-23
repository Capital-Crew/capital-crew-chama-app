import { NextResponse } from "next/server";
import { WithdrawalService } from "@/lib/services/WithdrawalService";
import { auth } from "@/auth";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { userId, amount, phoneNumber } = await req.json();

        if (!userId || !amount || !phoneNumber) {
            return NextResponse.json(
                { error: "UserId, Amount, and PhoneNumber are required" },
                { status: 400 }
            );
        }

        // RBAC: Only admin or the user themselves can initiate withdrawal
        const isAdmin = ['SYSTEM_ADMIN', 'CHAIRPERSON', 'TREASURER'].includes(session.user.role);
        if (!isAdmin && session.user.id !== userId) {
            return NextResponse.json({ error: "Forbidden: You can only withdraw from your own wallet" }, { status: 403 });
        }

        if (Number(amount) <= 0) {
            return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
        }

        // Process Withdrawal
        const reference = `WD-${Date.now()}`;

        // Call Service
        const transactionId = await WithdrawalService.processWithdrawal(userId, Number(amount), reference);

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
