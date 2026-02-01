/**
 * Data Repair Script: Backfill Missing Loan Transactions
 * 
 * This script creates transaction history for loans that were created
 * before the transaction tracking system was implemented.
 */

import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔧 Starting Data Repair: Backfilling Loan Transactions...\n')

    // Find active loans without transactions
    const loansWithoutTransactions = await prisma.loan.findMany({
        where: {
            status: { in: ['ACTIVE', 'OVERDUE'] }
        },
        include: {
            transactions: true,
            member: {
                select: { name: true, memberNumber: true }
            }
        }
    })

    const loansNeedingRepair = loansWithoutTransactions.filter(loan => loan.transactions.length === 0)

    console.log(`📋 Found ${loansNeedingRepair.length} loans without transaction history\n`)

    if (loansNeedingRepair.length === 0) {
        console.log('✅ All loans have transaction history. No repair needed.')
        return
    }

    // Display loans to be repaired
    console.log('Loans to be repaired:')
    loansNeedingRepair.forEach((loan, index) => {
        console.log(`   ${index + 1}. ${loan.loanApplicationNumber} - ${loan.member.name}`)
        console.log(`      Amount: ${loan.amount}, Outstanding: ${loan.outstandingBalance}`)
    })
    console.log('')

    // Repair each loan
    let repaired = 0
    for (const loan of loansNeedingRepair) {
        console.log(`🔧 Repairing ${loan.loanApplicationNumber}...`)

        const disbursementDate = loan.disbursementDate || loan.createdAt
        const amount = Number(loan.amount)
        const outstanding = Number(loan.outstandingBalance)
        const repaid = amount - outstanding

        try {
            await prisma.$transaction(async (tx) => {
                // 1. Create DISBURSEMENT transaction
                await tx.loanTransaction.create({
                    data: {
                        loanId: loan.id,
                        type: 'DISBURSEMENT',
                        amount: new Prisma.Decimal(amount),
                        description: 'Legacy loan disbursement (backfilled)',
                        postedAt: disbursementDate,
                        referenceId: 'LEGACY_BACKFILL'
                    }
                })

                console.log(`   ✓ Created DISBURSEMENT: ${amount}`)

                // 2. Create REPAYMENT transaction if any amount has been repaid
                if (repaid > 0) {
                    await tx.loanTransaction.create({
                        data: {
                            loanId: loan.id,
                            type: 'REPAYMENT',
                            amount: new Prisma.Decimal(repaid),
                            description: 'Legacy repayments (backfilled)',
                            postedAt: new Date(), // Use current date for repayments
                            referenceId: 'LEGACY_BACKFILL'
                        }
                    })

                    console.log(`   ✓ Created REPAYMENT: ${repaid}`)
                }

                // 3. If outstanding is 0, mark as CLEARED
                if (outstanding === 0) {
                    await tx.loan.update({
                        where: { id: loan.id },
                        data: { status: 'CLEARED' }
                    })
                    console.log(`   ✓ Updated status to CLEARED`)
                }
            })

            repaired++
            console.log(`   ✅ Successfully repaired ${loan.loanApplicationNumber}\n`)

        } catch (error) {
            console.error(`   ❌ Failed to repair ${loan.loanApplicationNumber}:`, error)
        }
    }

    console.log(`\n✨ Repair completed: ${repaired}/${loansNeedingRepair.length} loans repaired\n`)

    // Verify the repair
    console.log('🔍 Verifying repairs...')
    const stillMissing = await prisma.loan.count({
        where: {
            status: { in: ['ACTIVE', 'OVERDUE'] },
            transactions: { none: {} }
        }
    })

    if (stillMissing === 0) {
        console.log('✅ All active loans now have transaction history!')
    } else {
        console.log(`⚠️  ${stillMissing} loans still missing transaction history`)
    }
}

main()
    .catch((e) => {
        console.error('❌ Repair failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
