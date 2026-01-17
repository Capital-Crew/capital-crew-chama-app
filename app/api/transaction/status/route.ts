
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const checkoutRequestId = searchParams.get("id");

    if (!checkoutRequestId) {
        return NextResponse.json({ error: "Missing checkoutRequestId" }, { status: 400 });
    }

    try {
        const transaction = await prisma.transaction.findUnique({
            where: { checkoutRequestId },
            select: { status: true }
        });

        if (!transaction) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        return NextResponse.json({ status: transaction.status });
    } catch (error) {
        console.error("Error fetching transaction status:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
