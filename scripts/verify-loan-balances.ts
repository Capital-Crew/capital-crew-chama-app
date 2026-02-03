/**
 * Verification Script: Validate Loan Balances
 * 
 * This script verifies that loan balances are correctly calculated
 * by comparing the database outstandingBalance with transaction history.
 */

import { PrismaClient } from '@prisma/client'
import { Decimal } from 'decimal.js'

const prisma = new PrismaClient()

function processTransactions(transactions: any[]): number {
    let runningBalance = new Decimal(0)

    // Sort by posted date
    const sorted = [...transactions].sort((a, b) =>
        new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime()
    )

    for (const tx of sorted) {
        const amount = new Decimal(tx.amount)
        const type = tx.type.toUpperCase()

        // Skip reversed transactions
        if (tx.isReversed) continue

        if (['DISBURSEMENT', 'CHARGE', 'PENALTY', 'INTEREST', 'FEE'].includes(type)) {
            // Increases balance
            runningBalance = runningBalance.plus(amount)
        } else if (['REPAYMENT', 'WAIVER', 'PAYMENT'].includes(type)) {
            // Decreases balance
            runningBalance = runningBalance.minus(amount)
        }
    }

    return runningBalance.toNumber()
}

async function main() {
    console.log('🔍 Verifying Loan Balances...\n')

    // Get all active loans
    const activeLoans = await prisma.loan.findMany({
        where: {
            status: { in: ['ACTIVE', 'OVERDUE'] }
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

    console.log(`📋 Checking ${activeLoans.length} active loans\n`)

    let discrepancies = 0
    let exactMatches = 0

    for (const loan of activeLoans) {
        const dbBalance = Number(loan.outstandingBalance)
        const calculatedBalance = processTransactions(loan.transactions)
        const difference = Math.abs(dbBalance - calculatedBalance)

        const status = difference === 0 ? '✅' : difference < 0.01 ? '⚠️' : '❌'

        console.log(`${status} ${loan.loanApplicationNumber} - ${loan.member.name}`)
        console.log(`   DB Balance: ${dbBalance.toFixed(2)}`)
        console.log(`   Calculated: ${calculatedBalance.toFixed(2)}`)

        if (difference > 0) {
            console.log(`   Difference: ${difference.toFixed(2)}`)
            if (difference >= 0.01) {
                discrepancies++
            }
        }

        if (difference === 0) {
            exactMatches++
        }

        console.log('')
    }

    // Summary
    console.log('📊 Summary:')
    console.log(`   Total Loans Checked: ${activeLoans.length}`)
    console.log(`   Exact Matches: ${exactMatches}`)
    console.log(`   Discrepancies (>= 0.01): ${discrepancies}`)

    if (discrepancies > 0) {
        console.log('\n⚠️  Warning: Some loans have balance discrepancies!')
        console.log('   Consider running LoanBalanceService.updateLoanBalance() for affected loans.')
    } else {
        console.log('\n✅ All loan balances are accurate!')
    }

    // Check for loans that should be cleared
    const shouldBeCleared = activeLoans.filter(loan => {
        const calculatedBalance = processTransactions(loan.transactions)
        return calculatedBalance === 0
    })

    if (shouldBeCleared.length > 0) {
        console.log(`\n⚠️  ${shouldBeCleared.length} loans have zero balance but are not CLEARED:`)
        shouldBeCleared.forEach(loan => {
            console.log(`   - ${loan.loanApplicationNumber} (${loan.member.name})`)
        })
    }
}

main()
    .catch((e) => {
        console.error('❌ Verification failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
