
import { db } from '../lib/db'
import { getDashboardStats } from '../app/dashboard-actions'

async function main() {
    console.log("--- Fetching Dashboard Stats ---")

    // We need to mock auth() if getDashboardStats uses it. 
    // It does verify session. Since this is a script, we might need a workaround or just comment out the auth check temporarily?
    // Or we can mock the module. But in 'tsx', mocking imports is hard.

    // Actually, getDashboardStats throws Error('Unauthorized') if no session.
    // I should modify getDashboardStats temporarily or use a bypass if possible? 
    // Wait, the auth check is: 
    // const session = await auth()
    // if (!session) throw new Error('Unauthorized')

    // This script won't have a session.
    // I will try to call it. It might fail.

    try {
        const stats = await getDashboardStats()
        console.log("Stats Result:", JSON.stringify(stats, null, 2))
    } catch (e) {
        console.error("Error fetching stats (likely auth):", e)
    }
}

// Just running it to check syntax/imports first.
// If auth blocks, I might have to inspect the DB directly with the SAME logic to verify.

async function verifyLogic() {
    console.log("\n--- Manual Verification Logic (Bypassing Auth) ---")
    const allMembers = await db.member.findMany({ select: { id: true, name: true } })
    const memberIds = allMembers.map(m => m.id)
    console.log(`Found ${memberIds.length} members`)

    // 1. Get System Mapping for CONTRIBUTIONS
    const mapping = await db.systemAccountingMapping.findUnique({
        where: { type: 'CONTRIBUTIONS' },
        include: { account: true }
    })

    if (!mapping) {
        console.error("Mapping for CONTRIBUTIONS not found!")
        return
    }

    const code = mapping.account.code
    console.log(`System maps CONTRIBUTIONS to Account Code: ${code} (${mapping.account.name})`)

    const agg = await db.journalLine.aggregate({
        where: {
            account: { code: code },
            journalEntry: {
                isReversed: false,
                referenceType: 'SHARE_CONTRIBUTION',
                referenceId: { in: memberIds }
            }
        },
        _sum: { debitAmount: true, creditAmount: true }
    })

    const debit = Number(agg._sum.debitAmount || 0)
    const credit = Number(agg._sum.creditAmount || 0)
    const balance = credit - debit // Credit Normal

    console.log(`Manual Aggregation Result:`)
    console.log(`- Debits: ${debit}`)
    console.log(`- Credits: ${credit}`)
    console.log(`- Total Balance (Credit Normal): ${balance}`)
}

verifyLogic()
    .catch(console.error)
    .finally(async () => await db.$disconnect())
