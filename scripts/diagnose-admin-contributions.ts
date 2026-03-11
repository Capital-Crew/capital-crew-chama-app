import * as dotenv from 'dotenv'
dotenv.config()

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('\n=== System Admin Contribution Diagnostic ===\n')

    // Find the System Admin user (use email as fallback)
    const adminUser = await prisma.user.findFirst({
        where: { email: 'admin@capitalcrew.com' },
        include: { member: true }
    })

    if (!adminUser) {
        // Try finding any user with admin in name/email
        const allUsers = await prisma.user.findMany({ select: { name: true, role: true, email: true, memberId: true }, take: 20 })
        console.log('All users:')
        allUsers.forEach(u => console.log(`  ${u.name} (${u.role}) <${u.email}> memberId=${u.memberId}`))
        process.exit(0)
    }

    console.log(`User     : ${adminUser.name} (${adminUser.role})`)
    console.log(`Email    : ${adminUser.email}`)
    console.log(`User ID  : ${adminUser.id}`)
    console.log(`memberId : ${adminUser.memberId || 'NULL — no member record linked!'}`)

    if (!adminUser.memberId || !adminUser.member) {
        console.log('\n❌ ROOT CAUSE: This User account has NO linked Member record.')
        console.log('   The system calculates contributions by memberId.')
        console.log('   Without a member, contributions will always be 0.')
        process.exit(0)
    }

    const memberId = adminUser.member.id
    console.log(`\nMember   : ${adminUser.member.name} (${memberId})`)
    console.log(`shareContributions field: ${Number(adminUser.member.shareContributions || 0)}`)

    // Check ledger entries for this member
    const entries = await prisma.ledgerEntry.findMany({
        where: { memberId },
        take: 10,
        orderBy: { id: 'desc' },
        include: { ledgerAccount: { select: { code: true, name: true } } }
    })

    console.log(`\nTotal ledger entries for member: ${entries.length}`)
    entries.forEach(e => {
        console.log(`  [${e.ledgerAccount.code}] ${e.ledgerAccount.name} — Dr: ${Number(e.debit)} Cr: ${Number(e.credit)}`)
    })

    if (entries.length === 0) {
        console.log('\n❌ ROOT CAUSE: No ledger entries for this member.')
        console.log('   Contributions were never posted to the General Ledger.')
    }

    // Check contribution transactions
    const contribTxs = await prisma.contributionTransaction.findMany({
        where: { memberId },
        take: 5,
        orderBy: { date: 'desc' }
    })
    console.log(`\nContribution transactions: ${contribTxs.length}`)
    contribTxs.forEach(t => {
        console.log(`  ${t.date?.toISOString().slice(0, 10)} — KES ${Number(t.amount)} (${t.type})`)
    })

    console.log('\n=== Diagnostic Complete ===\n')
}

main()
    .catch(e => { console.error('Error:', e.message) })
    .finally(async () => { await prisma.$disconnect() })
