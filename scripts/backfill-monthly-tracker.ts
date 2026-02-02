/**
 * Backfill MonthlyTracker for Existing Contributions
 * 
 * This script creates MonthlyTracker records for members who have already made contributions
 * but don't have corresponding tracker records. It analyzes their contribution history and
 * creates appropriate tracker entries with PAID status.
 */

import { db } from '../lib/db'
import { MonthlyTrackerStatus } from '@prisma/client'
import { startOfMonth, format } from 'date-fns'

async function backfillMonthlyTracker() {
    console.log('🔄 Starting MonthlyTracker backfill...\n')

    // 1. Get SACCO settings for monthly contribution amount
    const settings = await db.saccoSettings.findFirst()
    const monthlyDue = settings?.monthlyContributionAmount ? Number(settings.monthlyContributionAmount) : 2000

    console.log(`📋 Monthly contribution requirement: KES ${monthlyDue.toLocaleString()}\n`)

    // 2. Get all members (regardless of status)
    const members = await db.member.findMany({
        select: {
            id: true,
            name: true,
            memberNumber: true,
            shareContributions: true,
            status: true
        },
        orderBy: {
            memberNumber: 'asc'
        }
    })

    console.log(`👥 Found ${members.length} total members\n`)

    if (members.length === 0) {
        console.log('⚠️  No members found in database. Exiting.')
        return
    }

    let processedCount = 0
    let skippedCount = 0
    let createdRecords = 0

    for (const member of members) {
        const totalContributions = Number(member.shareContributions || 0)

        // Skip members with no contributions
        if (totalContributions <= 0) {
            skippedCount++
            continue
        }

        // Check if member already has MonthlyTracker records
        const existingTrackers = await db.monthlyTracker.findMany({
            where: { memberId: member.id }
        })

        if (existingTrackers.length > 0) {
            console.log(`⏭️  Skipping ${member.name} (#${member.memberNumber}) - Already has ${existingTrackers.length} tracker records`)
            skippedCount++
            continue
        }

        // Calculate how many months this member has paid for
        const monthsPaid = Math.floor(totalContributions / monthlyDue)
        const remainingAmount = totalContributions % monthlyDue

        console.log(`\n✅ Processing ${member.name} (#${member.memberNumber})`)
        console.log(`   Total contributions: KES ${totalContributions.toLocaleString()}`)
        console.log(`   Months fully paid: ${monthsPaid}`)
        console.log(`   Remaining amount: KES ${remainingAmount.toLocaleString()}`)

        // Create tracker records for each fully paid month
        // Start from current month and work backwards
        const currentMonth = startOfMonth(new Date())
        const trackerRecords = []

        for (let i = 0; i < monthsPaid; i++) {
            const monthDate = new Date(currentMonth)
            monthDate.setMonth(monthDate.getMonth() - i)
            const monthStart = startOfMonth(monthDate)

            trackerRecords.push({
                memberId: member.id,
                month: monthStart,
                year: monthStart.getFullYear(),
                required: monthlyDue,
                paid: monthlyDue,
                balance: 0,
                status: 'PAID' as MonthlyTrackerStatus
            })
        }

        // If there's a remaining amount, create a partial payment record for the next month
        if (remainingAmount > 0) {
            const nextMonthDate = new Date(currentMonth)
            nextMonthDate.setMonth(nextMonthDate.getMonth() - monthsPaid)
            const nextMonthStart = startOfMonth(nextMonthDate)

            trackerRecords.push({
                memberId: member.id,
                month: nextMonthStart,
                year: nextMonthStart.getFullYear(),
                required: monthlyDue,
                paid: remainingAmount,
                balance: monthlyDue - remainingAmount,
                status: 'PARTIAL' as MonthlyTrackerStatus
            })
        }

        // Create all tracker records
        if (trackerRecords.length > 0) {
            await db.monthlyTracker.createMany({
                data: trackerRecords
            })

            console.log(`   ✅ Created ${trackerRecords.length} tracker records`)
            createdRecords += trackerRecords.length
            processedCount++

            // Show breakdown
            trackerRecords.forEach(record => {
                console.log(`      - ${format(record.month, 'MMM yyyy')}: ${record.status} (Paid: KES ${record.paid}, Balance: KES ${record.balance})`)
            })
        }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 Backfill Summary:')
    console.log('='.repeat(60))
    console.log(`✅ Members processed: ${processedCount}`)
    console.log(`⏭️  Members skipped: ${skippedCount}`)
    console.log(`📝 Tracker records created: ${createdRecords}`)
    console.log('='.repeat(60))
    console.log('\n✨ MonthlyTracker backfill complete!\n')
}

// Run the script
backfillMonthlyTracker()
    .then(() => {
        console.log('✅ Script completed successfully')
        process.exit(0)
    })
    .catch((error) => {
        console.error('❌ Error during backfill:', error)
        process.exit(1)
    })
