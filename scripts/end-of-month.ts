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

        if (shortfall > 0) {
            console.log(`Member ${member.memberNumber} (${member.name}): Shortfall ${shortfall}`)

            // Add to arrears
            await prisma.member.update({
                where: { id: member.id },
                data: {
                    contributionArrears: { increment: shortfall },
                    penaltyArrears: { increment: penaltyAmount }
                }
            })

            // Optional: Create a Penalty Charge Record (Income/Receivable)
            // For now, simpler implementation just updates the tracking fields.
            // If we wanted strictly double-entry, we'd add a Receivable transaction here.
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
