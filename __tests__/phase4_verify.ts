
import { SafetyNet } from '../lib/accounting/SafetyNet'
import { db as prisma } from '../lib/db'

async function main() {
    console.log('--- STARTING PHASE 4 VERIFICATION (Safety Net) ---')

    // 1. Check Global Ledger Integrity
    console.log('[INFO] Checking Ledger Integrity (Debits == Credits)...')
    const integrity = await SafetyNet.checkLedgerIntegrity()

    console.log(`[INFO] Total Debits: ${integrity.totalDebit}`)
    console.log(`[INFO] Total Credits: ${integrity.totalCredit}`)
    console.log(`[INFO] Difference: ${integrity.difference}`)

    if (integrity.isBalanced) {
        console.log('[PASS] Ledger is Balanced!')
    } else {
        console.error('[FAIL] Ledger is Imbalanced!')
    }

    // 2. Check Account Balance Cache Integrity
    console.log('[INFO] Checking Account Balance Caches...')
    const mismatches = await SafetyNet.validateAccountBalances()

    if (mismatches.length === 0) {
        console.log('[PASS] All Account Balances Match Ledger Entries.')
    } else {
        console.error(`[FAIL] Found ${mismatches.length} mismatches!`)
        mismatches.forEach(m => {
            console.error(`   - Account ${m.code}: Cached=${m.cachedBalance}, Calculated=${m.calculatedBalance}`)
        })
    }

    console.log('--- PHASE 4 COMPLETE ---')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
