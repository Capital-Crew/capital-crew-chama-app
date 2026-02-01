/**
 * Synchronization Script: Update Loan Balances from Transaction History
 * 
 * This script recalculates loan balances from transaction history
 * and updates the database to match, also updating statuses as needed.
 */

import { PrismaClient, Prisma } from '@prisma/client'
import { Decimal } from 'decimal.js'

const prisma = new PrismaClient()

function calculateBalanceFromTransactions(transactions: any[]): number {
    let runningBalance = new Decimal(0)

    // Sort by posted date
    const sorted = [...transactions].sort((a, b) =>
        new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime()
    )

    for (const tx of sorted) {
        const amount = new Decimal(tx.amount)
        const type = tx.type.toUpperCase()

        if (['DISBURSEMENT', 'CHARGE', 'PENALTY', 'INTEREST', 'FEE'].includes(type)) {
            runningBalance = runningBalance.plus(amount)
        } else if (['REPAYMENT', 'WAIVER', 'PAYMENT'].includes(type)) {
            runningBalance = runningBalance.minus(amount)
        }
    }

    return runningBalance.toNumber()
}

async function main() {
    console.log('🔄 Synchronizing Loan Balances from Transaction History...\n')

    // Get all loans (not just active ones, to catch any status issues)
    const loans = await prisma.loan.findMany({
        where: {
            status: { in: ['ACTIVE', 'OVERDUE', 'CLEARED'] }
        },
        include: {
            transactions: {
                orderBy: { postedAt: 'asc' }
            },
            member: {
                select: { name: true, memberNumber: true }
            }
        }
    })

    console.log(`📋 Processing ${loans.length} loans\n`)

    let updated = 0
    let statusChanged = 0
    let alreadyCorrect = 0

    for (const loan of loans) {
        const dbBalance = Number(loan.outstandingBalance)
        const calculatedBalance = calculateBalanceFromTransactions(loan.transactions)
        const difference = Math.abs(dbBalance - calculatedBalance)

        // Determine correct status
        let correctStatus = loan.status
        if (calculatedBalance === 0 && loan.status !== 'CLEARED') {
            correctStatus = 'CLEARED'
        } else if (calculatedBalance > 0 && loan.status === 'CLEARED') {
            correctStatus = 'ACTIVE'
        }

        const needsBalanceUpdate = difference > 0
        const needsStatusUpdate = correctStatus !== loan.status

        if (!needsBalanceUpdate && !needsStatusUpdate) {
            alreadyCorrect++
            continue
        }

        console.log(`🔧 ${loan.loanApplicationNumber} - ${loan.member.name}`)
        console.log(`   Current: Balance=${dbBalance.toFixed(2)}, Status=${loan.status}`)
        console.log(`   Correct: Balance=${calculatedBalance.toFixed(2)}, Status=${correctStatus}`)

        try {
            await prisma.loan.update({
                where: { id: loan.id },
                data: {
                    outstandingBalance: new Prisma.Decimal(calculatedBalance),
                    status: correctStatus
                }
            })

            if (needsBalanceUpdate) {
                console.log(`   ✓ Updated balance: ${dbBalance.toFixed(2)} → ${calculatedBalance.toFixed(2)}`)
                updated++
            }

            if (needsStatusUpdate) {
                console.log(`   ✓ Updated status: ${loan.status} → ${correctStatus}`)
                statusChanged++
            }

            console.log('')

        } catch (error) {
            console.error(`   ❌ Failed to update:`, error)
        }
    }

    console.log('\n📊 Summary:')
    console.log(`   Total Loans Processed: ${loans.length}`)
    console.log(`   Already Correct: ${alreadyCorrect}`)
    console.log(`   Balance Updates: ${updated}`)
    console.log(`   Status Changes: ${statusChanged}`)

    if (updated === 0 && statusChanged === 0) {
        console.log('\n✅ All loans are already synchronized!')
    } else {
        console.log('\n✨ Synchronization completed successfully!')
    }

    // Final verification
    console.log('\n🔍 Final Verification:')
    const stillIncorrect = await prisma.loan.count({
        where: {
            status: { in: ['ACTIVE', 'OVERDUE'] },
            outstandingBalance: 0
        }
    })

    if (stillIncorrect > 0) {
        console.log(`⚠️  ${stillIncorrect} ACTIVE/OVERDUE loans still have zero balance`)
    } else {
        console.log('✅ No ACTIVE/OVERDUE loans with zero balance')
    }

    const clearedWithBalance = await prisma.loan.count({
        where: {
            status: 'CLEARED',
            outstandingBalance: { gt: 0 }
        }
    })

    if (clearedWithBalance > 0) {
        console.log(`⚠️  ${clearedWithBalance} CLEARED loans have non-zero balance`)
    } else {
        console.log('✅ No CLEARED loans with non-zero balance')
    }
}

main()
    .catch((e) => {
        console.error('❌ Synchronization failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
