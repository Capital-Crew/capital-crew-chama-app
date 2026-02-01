/**
 * Migration Script: Update DISBURSED loans to ACTIVE
 * 
 * This script:
 * 1. Finds all loans with DISBURSED status
 * 2. Updates them to ACTIVE status
 * 3. Verifies balance consistency
 * 4. Reports on any loans with exact zero balance that should be CLEARED
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Starting Loan Status Migration...\n')

    // 1. Count loans by status
    console.log('📊 Current Loan Status Distribution:')
    const statusCounts = await prisma.loan.groupBy({
        by: ['status'],
        _count: true
    })

    statusCounts.forEach(({ status, _count }) => {
        console.log(`   ${status}: ${_count}`)
    })
    console.log('')

    // 2. Find DISBURSED loans
    const disbursedLoans = await prisma.loan.findMany({
        where: { status: 'DISBURSED' },
        select: {
            id: true,
            loanApplicationNumber: true,
            outstandingBalance: true,
            amount: true,
            member: {
                select: { name: true, memberNumber: true }
            }
        }
    })

    console.log(`📋 Found ${disbursedLoans.length} loans with DISBURSED status\n`)

    if (disbursedLoans.length === 0) {
        console.log('✅ No DISBURSED loans found. Migration not needed.')
        return
    }

    // 3. Display loans to be updated
    console.log('Loans to be updated:')
    disbursedLoans.forEach((loan, index) => {
        console.log(`   ${index + 1}. ${loan.loanApplicationNumber} - ${loan.member.name} (${loan.member.memberNumber})`)
        console.log(`      Amount: ${loan.amount}, Outstanding: ${loan.outstandingBalance}`)
    })
    console.log('')

    // 4. Check for loans with zero balance (should be CLEARED, not ACTIVE)
    const zeroBalanceLoans = disbursedLoans.filter(l => Number(l.outstandingBalance) === 0)

    if (zeroBalanceLoans.length > 0) {
        console.log(`⚠️  Warning: ${zeroBalanceLoans.length} loans have zero balance and should be CLEARED:`)
        zeroBalanceLoans.forEach(loan => {
            console.log(`   - ${loan.loanApplicationNumber} (${loan.member.name})`)
        })
        console.log('')
    }

    // 5. Perform migration
    console.log('🔄 Updating DISBURSED → ACTIVE...')

    const updateResult = await prisma.loan.updateMany({
        where: {
            status: 'DISBURSED',
            outstandingBalance: { gt: 0 } // Only update loans with outstanding balance
        },
        data: {
            status: 'ACTIVE'
        }
    })

    console.log(`✅ Updated ${updateResult.count} loans to ACTIVE status\n`)

    // 6. Update zero-balance loans to CLEARED
    if (zeroBalanceLoans.length > 0) {
        console.log('🔄 Updating zero-balance loans → CLEARED...')

        const clearedResult = await prisma.loan.updateMany({
            where: {
                status: 'DISBURSED',
                outstandingBalance: 0
            },
            data: {
                status: 'CLEARED'
            }
        })

        console.log(`✅ Updated ${clearedResult.count} loans to CLEARED status\n`)
    }

    // 7. Verify final status distribution
    console.log('📊 Final Loan Status Distribution:')
    const finalStatusCounts = await prisma.loan.groupBy({
        by: ['status'],
        _count: true
    })

    finalStatusCounts.forEach(({ status, _count }) => {
        console.log(`   ${status}: ${_count}`)
    })
    console.log('')

    // 8. Check for any remaining issues
    console.log('🔍 Checking for potential issues...')

    // Loans with ACTIVE status but zero balance
    const activeZeroBalance = await prisma.loan.count({
        where: {
            status: 'ACTIVE',
            outstandingBalance: 0
        }
    })

    if (activeZeroBalance > 0) {
        console.log(`⚠️  Warning: ${activeZeroBalance} ACTIVE loans have zero balance (should be CLEARED)`)
    }

    // Loans with CLEARED status but non-zero balance
    const clearedNonZero = await prisma.loan.count({
        where: {
            status: 'CLEARED',
            outstandingBalance: { gt: 0 }
        }
    })

    if (clearedNonZero > 0) {
        console.log(`⚠️  Warning: ${clearedNonZero} CLEARED loans have non-zero balance`)
    }

    if (activeZeroBalance === 0 && clearedNonZero === 0) {
        console.log('✅ No issues found. All loans are consistent.')
    }

    console.log('\n✨ Migration completed successfully!')
}

main()
    .catch((e) => {
        console.error('❌ Migration failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
