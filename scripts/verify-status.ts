import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log("🧪 Starting Contribution Status Verification...")

    // 1. Get or Create a Test Member
    let member = await prisma.member.findFirst({
        where: { status: 'ACTIVE' }
    })

    let createdMember = false;
    if (!member) {
        console.log("⚠️ No active members found. Creating temporary test member...")
        // Generate unique member number
        const count = await prisma.member.count()
        const uniqueNum = 90000 + count

        try {
            member = await prisma.member.create({
                data: {
                    name: "Test User",
                    memberNumber: uniqueNum,
                    status: 'ACTIVE',
                    contact: "0000000000",
                    // Add required fields if any (check schema if issues arise)
                }
            })
            createdMember = true;
        } catch (e) {
            console.error("Failed to create member:", e)
            return
        }
    }

    console.log(`👤 Testing with Member: ${member.name} (${member.memberNumber})`)

    // 2. Logic Helper (Replicating calculateCurrentMonthStatus logic)
    async function checkStatus(memberId: string) {
        const settings = await prisma.saccoSettings.findFirst()
        const monthlyDue = settings?.monthlyContributionAmount ? Number(settings.monthlyContributionAmount) : 2000

        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        const contributions = await prisma.income.aggregate({
            where: {
                memberId: memberId,
                category: 'MONTHLY_CONTRIBUTION',
                date: { gte: start, lte: end }
            },
            _sum: { amount: true }
        })

        const totalPaid = Number(contributions._sum.amount || 0)
        const balance = monthlyDue - totalPaid

        return { monthlyDue, totalPaid, balance }
    }

    const initial = await checkStatus(member.id)
    console.log(`📊 Initial Status: Due: ${initial.monthlyDue}, Paid: ${initial.totalPaid}, Balance: ${initial.balance}`)

    // 3. Simulate Payment
    console.log("💸 Simulating Payment of 500...")
    let payment = null;
    try {
        payment = await prisma.income.create({
            data: {
                amount: 500,
                date: new Date(),
                description: "Test Contribution",
                category: "MONTHLY_CONTRIBUTION",
                memberId: member.id,
                transactionId: `TEST-${Date.now()}`
            }
        })

        // 4. Check New Status
        const afterPayment = await checkStatus(member.id)
        console.log(`📊 Post-Payment Status: Due: ${afterPayment.monthlyDue}, Paid: ${afterPayment.totalPaid}, Balance: ${afterPayment.balance}`)

        // 5. Verification
        if (afterPayment.totalPaid === initial.totalPaid + 500) {
            console.log("✅ SUCCESS: Payment correctly reflected in status calculation.")
        } else {
            console.error("❌ FAILURE: Payment not reflected.")
        }

    } catch (e) {
        console.error("Error during payment simulation:", e)
    } finally {
        // 6. Cleanup
        console.log("🧹 Cleaning up test data...")
        if (payment) {
            await prisma.income.delete({ where: { id: payment.id } })
        }
        if (createdMember && member) {
            console.log("🧹 Deleting temporary test member...")
            await prisma.member.delete({ where: { id: member.id } })
        }
    }
    console.log("✨ Test Complete.")
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect())
