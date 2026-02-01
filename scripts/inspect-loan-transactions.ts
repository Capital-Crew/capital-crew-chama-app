/**
 * Diagnostic Script: Inspect Loan Transactions
 * 
 * This script provides detailed information about loan transactions
 * to help diagnose balance calculation issues.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Inspecting Loan Transactions...\n')

    // Get all active loans with transactions
    const loans = await prisma.loan.findMany({
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

    for (const loan of loans) {
        console.log(`\n${'='.repeat(60)}`)
        console.log(`Loan: ${loan.loanApplicationNumber} - ${loan.member.name}`)
        console.log(`Status: ${loan.status}`)
        console.log(`Amount: ${loan.amount}`)
        console.log(`DB Outstanding Balance: ${loan.outstandingBalance}`)
        console.log(`Transaction Count: ${loan.transactions.length}`)
        console.log(`${'='.repeat(60)}`)

        if (loan.transactions.length === 0) {
            console.log('⚠️  No transactions found!')
            continue
        }

        console.log('\nTransaction History:')
        console.log('Date                 | Type          | Amount      | Description')
        console.log('-'.repeat(80))

        let runningBalance = 0
        for (const tx of loan.transactions) {
            const amount = Number(tx.amount)
            const type = tx.type.toUpperCase()

            // Calculate effect on balance
            if (['DISBURSEMENT', 'CHARGE', 'PENALTY', 'INTEREST', 'FEE'].includes(type)) {
                runningBalance += amount
            } else if (['REPAYMENT', 'WAIVER', 'PAYMENT'].includes(type)) {
                runningBalance -= amount
            } else {
                console.log(`⚠️  Unknown transaction type: ${type}`)
            }

            const date = new Date(tx.postedAt).toISOString().split('T')[0]
            console.log(`${date} | ${type.padEnd(13)} | ${amount.toFixed(2).padStart(11)} | ${tx.description}`)
        }

        console.log('-'.repeat(80))
        console.log(`Calculated Balance: ${runningBalance.toFixed(2)}`)
        console.log(`DB Balance:         ${Number(loan.outstandingBalance).toFixed(2)}`)
        console.log(`Difference:         ${(Number(loan.outstandingBalance) - runningBalance).toFixed(2)}`)
    }

    console.log('\n' + '='.repeat(60))
}

main()
    .catch((e) => {
        console.error('❌ Inspection failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
