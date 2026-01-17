/**
 * Migration Script: Convert Member Contributions (1200) to ASSET
 * 
 * 1. Updates Account 1200 type to 'ASSET'
 * 2. Swaps Debit/Credit columns for all existing journal lines for this account
 *    to align with Asset accounting (Debit = Increase, Credit = Decrease)
 * 
 * Run with: npx tsx scripts/migrate-contributions-asset.ts
 */

import { db } from '../lib/db'

async function migrateContributions() {
    console.log('=== MIGRATING MEMBER CONTRIBUTIONS TO ASSET ===\n')

    const ACCOUNT_CODE = '1200'

    // 1. Get Account
    const account = await db.account.findUnique({
        where: { code: ACCOUNT_CODE }
    })

    if (!account) {
        throw new Error(`Account ${ACCOUNT_CODE} not found`)
    }

    console.log(`Found Account: ${account.name} (Type: ${account.type})`)

    // 2. Fetch all journal lines for this account
    const lines = await db.journalLine.findMany({
        where: {
            account: { code: ACCOUNT_CODE }
        }
    })

    console.log(`Found ${lines.length} journal lines to migrate.`)

    // 3. Update Lines (Swap Debit <-> Credit)
    console.log('Swapping Debit/Credit values...')

    let updatedCount = 0

    await db.$transaction(async (tx) => {
        // Update Account Type
        await tx.account.update({
            where: { code: ACCOUNT_CODE },
            data: { type: 'ASSET' }
        })
        console.log(`Updated Account Type to ASSET`)

        // Update Lines
        for (const line of lines) {
            await tx.journalLine.update({
                where: { id: line.id },
                data: {
                    debitAmount: line.creditAmount,  // Swap
                    creditAmount: line.debitAmount   // Swap
                }
            })
            updatedCount++
        }
    })

    console.log(`Successfully migrated ${updatedCount} lines.`)
    console.log('\n=== VERIFICATION ===')

    // 4. Verify New State
    const updatedLines = await db.journalLine.findMany({
        where: { account: { code: ACCOUNT_CODE } },
        include: { journalEntry: true },
        take: 5,
        orderBy: { journalEntry: { transactionDate: 'desc' } }
    })

    updatedLines.forEach((line: any) => {
        console.log(`Entry: ${line.journalEntry.description}`)
        console.log(`Type: ${line.journalEntry.referenceType}`)
        console.log(`New Debit: ${line.debitAmount}, New Credit: ${line.creditAmount}`)
        console.log('---')
    })
}

migrateContributions()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
