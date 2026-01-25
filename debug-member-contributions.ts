
import { PrismaClient } from '@prisma/client'
import { getMemberContributionBalance } from './lib/accounting/AccountingEngine'

const prisma = new PrismaClient()

async function main() {
    const email = 'testuser2@example.com' // Assuming this is the email, or I'll search by name

    console.log('Searching for "Test User 2"...')
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { name: { contains: 'Test User 2' } },
                { email: { contains: 'test' } } // Broad search if specific name fails
            ]
        },
        include: { member: true }
    })

    if (!user || !user.member) {
        console.log('User or Member not found.')
        const allUsers = await prisma.user.findMany({ take: 5, include: { member: true } })
        console.log('Available users:', allUsers.map(u => ({ name: u.name, email: u.email, memberId: u.memberId })))
        return
    }

    console.log(`Found User: ${user.name} (${user.email})`)
    console.log(`Member ID: ${user.member.id}`)
    console.log(`Member Number: ${user.member.memberNumber}`)
    console.log(`Member Share Contributions (Model Field): ${user.member.shareContributions}`)
    console.log(`Member Contribution Arrears: ${user.member.contributionArrears}`)

    console.log('\n--- Checking Accounting Engine Balance ---')
    try {
        const balance = await getMemberContributionBalance(user.member.id)
        console.log(`Accounting Engine Contribution Balance: ${balance}`)
    } catch (e) {
        console.error('Error fetching accounting balance:', e)
    }

    console.log('\n--- Checking Ledger Entries ---')
    // Find ledger entries related to this member's contributions
    // We need to know which account is their contribution account.
    // Usually it involves specific account codes. 
    // Let's check ShareTransactions first as they are the source of truth for shares usually

    const shareTx = await prisma.shareTransaction.findMany({
        where: { memberId: user.member.id }
    })
    console.log(`Found ${shareTx.length} ShareTransactions`)
    console.log(shareTx)

}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
