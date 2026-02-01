
import { PrismaClient } from '@prisma/client'
import { ContributionsService } from '../lib/services/contributions-service'

const prisma = new PrismaClient()

async function main() {
    console.log("🚀 Testing Contribution Waterfall Logic...")

    // 1. Get a Test Member
    // Using "Test user" found in inspection
    const member = await prisma.member.findUnique({
        where: { id: 'cmkw1110k0000tmgsfev4rrsu' },
        include: { wallet: true }
    })

    if (!member || !member.wallet) {
        throw new Error("No active member with wallet found")
    }

    console.log(`Using Member: ${member.name} (${member.memberNumber})`)
    const walletId = member.wallet.id

    // 2. Clean State (Reset Trackers for this member usually, but let's just see what happens if we add)
    // To prove waterfall, let's delete existing trackers for this member for a clean slate
    await prisma.monthlyTracker.deleteMany({
        where: { memberId: member.id }
    })
    console.log("Cleared existing MonthlyTrackers for verification.")

    // 3. Seed Wallet (Deposit 10,000)
    console.log("Seeding wallet with 10,000...")
    const { AccountingEngine } = await import('../lib/accounting/AccountingEngine')
    await AccountingEngine.postJournalEntry({
        transactionDate: new Date(),
        referenceType: 'CASH_DEPOSIT',
        referenceId: member.id,
        description: 'Test Seed Deposit',
        createdBy: 'TEST',
        createdByName: 'Test Script',
        lines: [
            {
                accountCode: '1100', // Cash on Hand
                debitAmount: 10000,
                creditAmount: 0
            },
            {
                accountId: member.wallet.glAccountId, // Member Wallet
                debitAmount: 0,
                creditAmount: 10000
            }
        ]
    })

    const amount = 4500
    console.log(`\nAttempting to populate with Amount: ${amount} (Should cover 3 months @ 1500 assumed, or 2.25 @ 2000)`)

    try {
        await ContributionsService.recordContribution(member.id, amount, walletId)
        console.log("✅ Contribution Recorded Successfully.")
    } catch (e) {
        console.error("❌ Error recording contribution:", e)
        // If funds insufficient, we might stop here.
        return
    }

    // 4. Verify Buckets
    const trackers = await prisma.monthlyTracker.findMany({
        where: { memberId: member.id },
        orderBy: { month: 'asc' }
    })

    console.log("\n--- Generated Monthly Trackers ---")
    trackers.forEach(t => {
        console.log(`Month: ${t.month.toISOString().substring(0, 10)} | Required: ${t.required} | Paid: ${t.paid} | Balance: ${t.balance} | Status: ${t.status}`)
    })

    // 5. Verify Transaction
    const tx = await prisma.contributionTransaction.findFirst({
        where: { memberId: member.id },
        orderBy: { createdAt: 'desc' }
    })

    console.log(`\nTransaction Created: ${tx?.id} amount=${tx?.amount}`)

}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect())
