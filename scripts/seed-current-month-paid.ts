
import { PrismaClient } from '@prisma/client'
import { startOfMonth } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
    console.log("🛠️ Seeding Current Month Status...")

    // 1. Find the member (Using same logic or just the ID if found in debug)
    const members = await prisma.member.findMany({ include: { wallet: true } })
    const targetMember = members.find(m => Number(m.shareContributions) >= 105000) || members[0]

    if (!targetMember) throw new Error("Target member not found")

    console.log(`User: ${targetMember.name}`)

    // 2. Create/Update Monthly Tracker for Feb 2026 to PAID
    const now = new Date()
    const start = startOfMonth(now) // 2026-02-01

    const tracker = await prisma.monthlyTracker.upsert({
        where: {
            memberId_month_year: {
                memberId: targetMember.id,
                month: start,
                year: start.getFullYear()
            }
        },
        update: {
            status: 'PAID',
            paid: 2000,
            balance: 0,
            required: 2000
        },
        create: {
            memberId: targetMember.id,
            month: start,
            year: start.getFullYear(),
            required: 2000,
            paid: 2000,
            balance: 0,
            status: 'PAID'
        }
    })

    console.log("✅ Current Month Marked as PAID:", tracker)
}

main().finally(() => prisma.$disconnect())
