/**
 * Debug script to check Total Contributions calculation
 * Run with: npx tsx scripts/debug-contributions.ts
 */

import { db } from '../lib/db'

async function debugContributions() {
    console.log('=== DEBUGGING TOTAL CONTRIBUTIONS ===\n')

    // 1. Check Account 1200 exists and its type
    const account1200 = await db.account.findUnique({
        where: { code: '1200' }
    })

    console.log('Account 1200 Details:')
    console.log(account1200)
    console.log('')

    // 2. Get all journal lines for Account 1200
    const journalLines = await db.journalLine.findMany({
        where: {
            account: { code: '1200' },
            journalEntry: { isReversed: false }
        },
        include: {
            journalEntry: {
                select: {
                    id: true,
                    referenceType: true,
                    referenceId: true,
                    description: true,
                    transactionDate: true
                }
            }
        },
        orderBy: {
            journalEntry: {
                transactionDate: 'desc'
            }
        },
        take: 20
    })

    console.log(`Found ${journalLines.length} journal lines for Account 1200:\n`)

    let totalDebits = 0
    let totalCredits = 0

    journalLines.forEach((line: any, index) => {
        const debit = Number(line.debitAmount)
        const credit = Number(line.creditAmount)
        totalDebits += debit
        totalCredits += credit

        console.log(`${index + 1}. ${line.journalEntry.description}`)
        console.log(`   Date: ${line.journalEntry.transactionDate}`)
        console.log(`   Type: ${line.journalEntry.referenceType}`)
        console.log(`   Debit: ${debit}, Credit: ${credit}`)
        console.log('')
    })

    console.log('=== SUMMARY ===')
    console.log(`Total Debits: ${totalDebits}`)
    console.log(`Total Credits: ${totalCredits}`)
    console.log(`Balance (Credit - Debit): ${totalCredits - totalDebits}`)
    console.log('')

    // 3. Check aggregation (what dashboard uses)
    const agg = await db.journalLine.aggregate({
        where: {
            account: { code: '1200' },
            journalEntry: { isReversed: false }
        },
        _sum: { debitAmount: true, creditAmount: true }
    })

    const aggDebit = Number(agg._sum.debitAmount || 0)
    const aggCredit = Number(agg._sum.creditAmount || 0)
    const balance = aggCredit - aggDebit

    console.log('=== AGGREGATION (Dashboard Calculation) ===')
    console.log(`Sum of Debits: ${aggDebit}`)
    console.log(`Sum of Credits: ${aggCredit}`)
    console.log(`Balance (Credit - Debit): ${balance}`)
    console.log('')

    // 4. Check if there are any reversed entries
    const reversedCount = await db.journalLine.count({
        where: {
            account: { code: '1200' },
            journalEntry: { isReversed: true }
        }
    })

    console.log(`Reversed entries (excluded): ${reversedCount}`)

    await db.$disconnect()
}

debugContributions().catch(console.error)
