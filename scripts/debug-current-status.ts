import { PrismaClient } from '@prisma/client'
import { startOfMonth } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
    console.log("🔍 Debugging Member Status...")

    // 1. Find Member with ~105k contributions (Member in screenshot)
    // We'll search by iterating or using a range since we saw 105000.00
    const members = await prisma.member.findMany({
        include: { wallet: true }
    })

    // Manual filter to avoid Decimal strict equality issues
    const targetMember = members.find(m => Number(m.shareContributions) === 105000 || Number(m.shareContributions) === 10500000)
        || members[0] // Fallback to first member if not found

    if (!targetMember) {
        console.log("❌ No member found.")
        return
    }

    console.log(`👤 Analyzing Member: ${targetMember.name} (${targetMember.id})`)
    console.log(`💰 Share Contributions: ${targetMember.shareContributions}`)

    // 2. Check Monthly Tracker
    const now = new Date()
    const start = startOfMonth(now)

    console.log(`Checking Tracker for: ${start.toISOString()}`)

    const tracker = await prisma.monthlyTracker.findUnique({
        where: {
            memberId_month_year: {
                memberId: targetMember.id,
                month: start,
                year: start.getFullYear()
            }
        }
    })

    if (tracker) {
        console.log("✅ Tracker Found:")
        console.log(tracker)
    } else {
        console.log("❌ No MonthlyTracker found for current month.")
        console.log("   -> Outcome: Code defaults to 'PENDING' with full amount due (2000).")
    }

    // 3. Check Wallet Transactions (New System)
    const recentTx = await prisma.contributionTransaction.findMany({
        where: { memberId: targetMember.id },
        orderBy: { createdAt: 'desc' },
        take: 3
    })
    console.log("Recent ContributionTransactions:", recentTx)
}

main().finally(() => prisma.$disconnect())
