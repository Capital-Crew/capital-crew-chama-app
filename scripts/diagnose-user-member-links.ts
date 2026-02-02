/**
 * Database Diagnosis Script
 * Run this to check which member profile is linked to the logged-in user
 * 
 * Usage: npx tsx scripts/diagnose-user-member-links.ts
 */

import { db } from '@/lib/db'

async function diagnoseUserMemberLink() {
    console.log('=== User-Member Link Diagnosis ===\n')

    // Get all users with their linked members
    const users = await db.user.findMany({
        include: {
            member: true
        },
        orderBy: {
            email: 'asc'
        }
    })

    console.log('All Users and Their Linked Members:\n')
    console.log('┌─────────────────────────────────────────────────────────────────────────────┐')
    console.log('│ Email                    │ User Name          │ Member Name        │ Member# │')
    console.log('├─────────────────────────────────────────────────────────────────────────────┤')

    for (const user of users) {
        const email = (user.email || '').padEnd(24)
        const userName = (user.name || 'N/A').padEnd(18)
        const memberName = (user.member?.name || 'NO MEMBER').padEnd(18)
        const memberNum = user.member?.memberNumber?.toString() || 'N/A'

        console.log(`│ ${email} │ ${userName} │ ${memberName} │ #${memberNum.padEnd(6)} │`)
    }
    console.log('└─────────────────────────────────────────────────────────────────────────────┘\n')

    // Check for duplicate member links
    const memberIds = users.map(u => u.memberId).filter(Boolean)
    const duplicates = memberIds.filter((id, index) => memberIds.indexOf(id) !== index)

    if (duplicates.length > 0) {
        console.log('⚠️  WARNING: Multiple users linked to the same member profile!')
        console.log('Member IDs with duplicates:', [...new Set(duplicates)])
        console.log('')
    }

    // Check for users without member profiles
    const usersWithoutMembers = users.filter(u => !u.memberId)
    if (usersWithoutMembers.length > 0) {
        console.log('⚠️  Users without member profiles:')
        usersWithoutMembers.forEach(u => {
            console.log(`   - ${u.email} (${u.name})`)
        })
        console.log('')
    }

    // Show all members
    const members = await db.member.findMany({
        orderBy: {
            memberNumber: 'asc'
        }
    })

    console.log('\nAll Members in Database:\n')
    console.log('┌────────────────────────────────────────────────┐')
    console.log('│ Member #  │ Name                    │ Has User? │')
    console.log('├────────────────────────────────────────────────┤')

    for (const member of members) {
        const memberNum = `#${member.memberNumber}`.padEnd(9)
        const name = (member.name || '').padEnd(23)
        const hasUser = users.some(u => u.memberId === member.id) ? '✅ Yes' : '❌ No'

        console.log(`│ ${memberNum} │ ${name} │ ${hasUser.padEnd(9)} │`)
    }
    console.log('└────────────────────────────────────────────────┘\n')

    console.log('=== Diagnosis Complete ===')
}

diagnoseUserMemberLink()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Error:', error)
        process.exit(1)
    })
