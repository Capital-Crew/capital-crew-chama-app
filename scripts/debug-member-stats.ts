
import { db } from '../lib/db'
import { getDetailedMemberStats } from '../app/actions/member-dashboard-actions'

async function main() {
    // 1. Find Member #4 (admin@capitalcrew.com)
    console.log("Searching for admin@capitalcrew.com...")

    // Try via ContactInfo first
    const contact = await db.memberContact.findFirst({ where: { email: 'admin@capitalcrew.com' } })
    let member = null

    if (contact) {
        member = await db.member.findUnique({ where: { id: contact.memberId } })
    }

    if (!member) {
        // Fallback to Member model email check (if exists there) or name
        member = await db.member.findFirst({
            where: {
                OR: [
                    { name: { contains: 'Admin', mode: 'insensitive' } },
                    { contact: 'admin@capitalcrew.com' }
                ]
            }
        })
    }

    if (!member) {
        console.log("Member not found, listing all members:")
        const members = await db.member.findMany({ take: 5 })
        members.forEach(m => console.log(`- ${m.name} (${m.id})`))
        return
    }

    console.log(`Found Target Member: ${member.name} (${member.id})`)
    await testMember(member.id)
}

async function testMember(memberId: string) {
    console.log("--- Fetching Stats ---")
    const result = await getDetailedMemberStats(memberId)

    if (!result) {
        console.error("Result is null")
        return
    }

    console.log("Stats Result:")
    console.log(JSON.stringify(result.stats, null, 2))

    // Check key fields
    console.log(`\nChecking Specific Fields:`)
    console.log(`- Member Savings (Wallet): ${result.stats.memberSavings}`)
    console.log(`- Contributions (Asset 1200): ${result.stats.contributions}`)
    console.log(`- Original Wallet field: ${result.stats.currentAccountBalance}`)
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await db.$disconnect()
    })
