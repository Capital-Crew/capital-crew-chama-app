import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log("🚀 Starting End-of-Month Contribution Processing...")

    // 1. Get Settings
    const settings = await prisma.saccoSettings.findFirst()
    const monthlyDue = settings?.monthlyContributionAmount ? Number(settings.monthlyContributionAmount) : 2000
    const penaltyAmount = settings?.latePaymentPenalty ? Number(settings.latePaymentPenalty) : 200

    console.log(`Config: Monthly Due: ${monthlyDue}, Penalty: ${penaltyAmount}`)

    // 2. Get All Active Members
    const members = await prisma.member.findMany({
        where: { status: 'ACTIVE' }
    })

    console.log(`Processing ${members.length} members...`)

    const now = new Date()
    // We assume this runs at the very end of the month or beginning of next.
    // Ideally we check if they paid for the *just concluded* month.
    // For simplicity of the script running "at 23:59 on last day", we check the current month.

    // START OF MONTH / END OF MONTH (Local Time logic might be tricky, relying on server time)
    // We'll use strict UTC dates for the query
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    for (const member of members) {
        // Check contributions
        const contributions = await prisma.income.aggregate({
            where: {
                memberId: member.id,
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
        const shortfall = monthlyDue - totalPaid

        // To support overpayment carry-forwards, we use negative `contributionArrears`.
        // A surplus is represented by a negative balance in `contributionArrears`.
        let penaltyToApply = 0

        if (shortfall > 0) {
            const currentArrears = Number(member.contributionArrears || 0)
            const surplusAvailable = currentArrears < 0 ? Math.abs(currentArrears) : 0
            const effectiveShortfall = Math.max(0, shortfall - surplusAvailable)

            if (effectiveShortfall > 0) {
                console.log(`Member ${member.memberNumber} (${member.name}): Effective Shortfall ${effectiveShortfall} (Buffer used: ${Math.min(shortfall, surplusAvailable)})`)
                penaltyToApply = penaltyAmount
            } else {
                console.log(`Member ${member.memberNumber} (${member.name}): Shortfall ${shortfall} fully covered by surplus buffer.`)
            }
        } else if (shortfall < 0) {
            console.log(`Member ${member.memberNumber} (${member.name}): Overpayment of ${Math.abs(shortfall)}. Adding to buffer.`)
        } else {
            // Unnecessary to log for every user exactly on time, but left to be cautious.
            console.log(`Member ${member.memberNumber} (${member.name}): Exact payment made.`)
        }

        // Apply any generated shortfall/surplus to the running arrears total unconditionally
        if (shortfall !== 0 || penaltyToApply > 0) {
            await prisma.member.update({
                where: { id: member.id },
                data: {
                    contributionArrears: { increment: shortfall },
                    ...(penaltyToApply > 0 && { penaltyArrears: { increment: penaltyToApply } })
                }
            })
        }
    }

    console.log("✅ End-of-Month Processing Complete.")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
