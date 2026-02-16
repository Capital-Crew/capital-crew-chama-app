'use server'

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { withAudit } from "@/lib/with-audit";
import { AccountingPeriodStatus, AuditLogAction } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { serializeFinancials } from "@/lib/safe-serialization";

/**
 * Opens a new accounting period
 */
export const openAccountingPeriodAction = withAudit({ action: AuditLogAction.PERIOD_REOPENED, context: 'FINANCE' }, async (formData: FormData) => {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const startDate = new Date(formData.get('startDate') as string);
    const endDate = new Date(formData.get('endDate') as string);
    const memo = formData.get('memo') as string;

    // Validate no overlap
    const overlap = await db.accountingPeriod.findFirst({
        where: {
            OR: [
                { startDate: { lte: endDate }, endDate: { gte: startDate } }
            ]
        }
    });

    if (overlap) {
        throw new Error("This period overlaps with an existing accounting period.");
    }

    const period = await db.accountingPeriod.create({
        data: {
            startDate,
            endDate,
            memo,
            status: AccountingPeriodStatus.OPEN
        }
    });

    revalidatePath('/admin');
    return serializeFinancials(period);
});

/**
 * Closes an open accounting period
 */
export const closeAccountingPeriodAction = withAudit({ action: AuditLogAction.PERIOD_CLOSED, context: 'FINANCE' }, async (periodId: string) => {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const period = await db.accountingPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new Error("Period not found");
    if (period.status === AccountingPeriodStatus.CLOSED) throw new Error("Period is already closed.");

    const updated = await db.accountingPeriod.update({
        where: { id: periodId },
        data: {
            status: AccountingPeriodStatus.CLOSED,
            closedAt: new Date(),
            closedBy: session.user.id
        }
    });

    revalidatePath('/admin');
    return serializeFinancials(updated);
});

/**
 * Fetch all periods
 */
export async function getAccountingPeriods() {
    const periods = await db.accountingPeriod.findMany({
        orderBy: { startDate: 'desc' }
    });
    return serializeFinancials(periods);
}

/**
 * Get current open period
 */
export async function getCurrentPeriod() {
    const now = new Date();
    const period = await db.accountingPeriod.findFirst({
        where: {
            startDate: { lte: now },
            endDate: { gte: now },
            status: AccountingPeriodStatus.OPEN
        }
    });
    return serializeFinancials(period);
}
