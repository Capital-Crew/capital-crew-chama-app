'use server'

import { db } from "@/lib/db"
import { startOfMonth, endOfMonth } from "date-fns"

export async function calculateCurrentMonthStatus(memberId: string) {
    if (!memberId) return null

    // 1. Fetch Settings
    const settings = await db.saccoSettings.findFirst()
    const monthlyDue = settings?.monthlyContributionAmount ? Number(settings.monthlyContributionAmount) : 2000

    // 2. Fetch Contributions for Current Month
    const now = new Date()
    const start = startOfMonth(now)
    const end = endOfMonth(now)

    // Using INCOME model for contributions as per schema
    // Category: MONTHLY_CONTRIBUTION
    const contributions = await db.income.aggregate({
        where: {
            memberId: memberId,
            category: 'MONTHLY_CONTRIBUTION',
            date: {
                gte: start,
                lte: end
            }
        },
        _sum: {
            amount: true
        }
    })

    const totalPaid = Number(contributions._sum.amount || 0)
    let balance = monthlyDue - totalPaid

    // If overpaid, balance is 0 (or negative to indicate advance, but UI usually expects Due Amount)
    // The prompt says: "If the result is negative (user overpaid), show 0 or 'Advance'."
    // We'll return the raw balance, negative means advance.

    const status = balance <= 0 ? 'PAID' : (totalPaid > 0 ? 'PARTIAL' : 'PENDING')

    return {
        monthlyDue,
        totalPaid,
        balance, // Positive = Due, Negative = Advance
        status
    }
}
