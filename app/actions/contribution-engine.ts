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

    // 3. Fetch MonthlyTracker for Current Month (Source of Truth)
    const currentMonthTracker = await db.monthlyTracker.findUnique({
        where: {
            memberId_month_year: {
                memberId,
                month: start,
                year: start.getFullYear()
            }
        }
    })

    if (currentMonthTracker) {
        return {
            monthlyDue: Number(currentMonthTracker.required),
            totalPaid: Number(currentMonthTracker.paid),
            balance: Number(currentMonthTracker.balance),
            status: currentMonthTracker.status
        }
    }

    // Default if no tracker exists yet (Implies PENDING)
    return {
        monthlyDue,
        totalPaid: 0,
        balance: monthlyDue,
        status: 'PENDING'
    }
}
