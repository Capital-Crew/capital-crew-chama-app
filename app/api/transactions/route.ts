import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");

        const whereClause: any = {};
        if (status) {
            whereClause.status = status;
        }

        const transactions = await prisma.transaction.findMany({
            where: whereClause,
            orderBy: {
                createdAt: "desc",
            },
            take: 100, // Limit for performance, implement pagination if needed
            include: {
                member: {
                    select: {
                        id: true, // Needed for retry
                        name: true,
                        memberNumber: true,
                        contactInfo: {
                            select: {
                                mobile: true
                            }
                        }
                    }
                }
            }
        });

        // Format for frontend
        const formatted = transactions.map((t: any) => ({
            id: t.id,
            date: t.createdAt,
            memberId: t.member?.id,
            phoneNumber: t.phoneNumber,
            memberName: t.member?.name || 'Unknown',
            amount: Number(t.amount),
            status: t.status,
            receipt: t.mpesaReceiptNumber || '-',
            failureReason: t.failureReason || '-',
            checkoutRequestId: t.checkoutRequestId
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
    }
}
