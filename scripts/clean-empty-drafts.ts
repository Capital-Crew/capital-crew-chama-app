import { db } from '@/lib/db'

/**
 * Clean up empty draft Loan records
 * These are created when users click "New Application" but don't fill in any data
 */
async function cleanEmptyDrafts() {
    console.log('🧹 Cleaning empty draft loans...')

    // Find all DRAFT loans with no amount and no product set
    const emptyDrafts = await db.loan.findMany({
        where: {
            status: 'DRAFT',
            amount: 0,
            loanProductId: null
        },
        select: {
            id: true,
            loanApplicationNumber: true,
            createdAt: true
        }
    })

    console.log(`Found ${emptyDrafts.length} empty drafts:`)
    emptyDrafts.forEach(draft => {
        console.log(`  - ${draft.loanApplicationNumber} (created: ${draft.createdAt})`)
    })

    if (emptyDrafts.length === 0) {
        console.log('✅ No empty drafts to clean')
        return
    }

    // Delete them
    const result = await db.loan.deleteMany({
        where: {
            status: 'DRAFT',
            amount: 0,
            loanProductId: null
        }
    })

    console.log(`✅ Deleted ${result.count} empty drafts`)
}

cleanEmptyDrafts()
    .then(() => {
        console.log('✅ Done')
        process.exit(0)
    })
    .catch((error) => {
        console.error('❌ Error:', error)
        process.exit(1)
    })
