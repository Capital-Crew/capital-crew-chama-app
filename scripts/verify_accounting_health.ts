
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🏥 Starting Accounting Health Check...')
    let errors = 0
    let warnings = 0

    // 1. Verify Active Accounts
    console.log('\n1️⃣ Checking Active Accounts...')
    const accounts = await prisma.ledgerAccount.findMany({
        where: { isActive: true },
        select: { id: true, code: true, name: true, type: true }
    })
    console.log(`   Found ${accounts.length} active accounts.`)
    if (accounts.length !== 5) {
        console.error(`   ❌ CRITICAL: Expected 5 active accounts, found ${accounts.length}.`)
        errors++
    } else {
        console.log('   ✅ Account count correct.')
    }

    // 2. Verify Mappings
    console.log('\n2️⃣ Checking System Mappings...')
    const mappings = await prisma.systemAccountingMapping.findMany({
        include: { account: true }
    })
    console.log(`   Found ${mappings.length} system mappings.`)

    const requiredTypes = [
        'CASH_ON_HAND', 'RECEIVABLES', 'MEMBER_WALLET', 'CONTRIBUTIONS', 'INCOME',
        'EVENT_CASH_DEPOSIT', 'EVENT_CASH_WITHDRAWAL', 'EVENT_LOAN_DISBURSEMENT',
        'EVENT_LOAN_REPAYMENT_PRINCIPAL', 'EVENT_SHARE_CONTRIBUTION',
        'INCOME_LOAN_INTEREST', 'RECEIVABLE_LOAN_INTEREST', 'INCOME_LOAN_PENALTY'
    ]

    for (const type of requiredTypes) {
        const map = mappings.find((m: any) => m.type === type)
        if (!map) {
            console.warn(`   ⚠️  Missing mapping for ${type}`)
            warnings++
        } else if (!map.account) {
            console.error(`   ❌ Mapping for ${type} has dead account link!`)
            errors++
        }
    }
    console.log('   Mappings check complete.')

    // 3. Trial Balance Check
    console.log('\n3️⃣ Checking Logic & Balances...')
    // We can't easily check historical balance validity without a full history replay, 
    // but we can check if orphaned ledger entries exist.
    const orphanedEntries = await prisma.ledgerEntry.count({
        where: {
            ledgerAccountId: { notIn: accounts.map(a => a.id) }
        }
    })

    if (orphanedEntries > 0) {
        console.warn(`   ⚠️  Found ${orphanedEntries} ledger entries linked to inactive/deleted accounts.`)
        console.warn('       (This is expected if you deleted accounts but kept history in a non-cascading way, or if history was deleted)')
        // In our purge, we deleted entries. So this should be 0.
        if (orphanedEntries > 0) {
            console.error('   ❌ This suggests incomplete purge. Entries exist for non-existent accounts.')
            errors++
        }
    } else {
        console.log('   ✅ No orphaned ledger entries found.')
    }

    // 4. Wallet Integrity
    console.log('\n4️⃣ Checking Wallet Integrity...')
    const wallets = await prisma.wallet.findMany({
        include: { glAccount: true }
    })

    // Check if any wallets point to non-existent accounts (Prisma handles this via FK, but checking logical validity)
    const liabilityAccount = accounts.find(a => a.code === '2000')
    let badWallets = 0
    for (const w of wallets) {
        if (!w.glAccount) {
            console.error(`   ❌ Wallet ${w.id} has no GL Account!`)
            badWallets++
        } else if (liabilityAccount && w.glAccountId !== liabilityAccount.id) {
            console.warn(`   ⚠️  Wallet ${w.id} is mapped to ${w.glAccount.code} (Expected 2000)`)
            warnings++
        }
    }
    if (badWallets === 0 && warnings === 0) console.log('   ✅ All wallets mapped correctly to LIABILITIES (2000).')


    console.log('\n===========================================')
    if (errors === 0) {
        console.log('✅ HEALTH CHECK PASSED')
        if (warnings > 0) console.log(`with ${warnings} warnings.`)
    } else {
        console.error(`❌ HEALTH CHECK FAILED with ${errors} critical errors.`)
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
