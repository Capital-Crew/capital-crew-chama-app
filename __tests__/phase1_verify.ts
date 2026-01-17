
import { CoreLedger } from '../lib/accounting/CoreLedger'
import prisma from '../lib/prisma'
import { ReferenceType } from '@prisma/client'

async function main() {
    console.log('--- STARTING PHASE 1 VERIFICATION ---')

    // 1. Setup Test Account
    const accountCode = 'TEST-' + Date.now()
    const account = await prisma.ledgerAccount.create({

        data: {
            code: accountCode,
            name: 'Test Wallet',
            type: 'LIABILITY'
        }
    })
    console.log(`[PASS] Created Test Account: ${account.code}`)

    // 2. Test Unbalanced Entry (Should Fail)
    try {
        await CoreLedger.postTransaction({
            transactionDate: new Date(),
            referenceType: 'MANUAL_ADJUSTMENT',
            referenceId: 'REF-001',
            description: 'Unbalanced Test',
            createdBy: 'TEST',
            createdByName: 'Tester',
            lines: [
                { accountId: account.id, debit: BigInt(100), credit: BigInt(0) }
            ]
        })
        console.error('[FAIL] Unbalanced transaction was accepted!')
    } catch (e: any) {
        if (e.message.includes('Unbalanced')) {
            console.log('[PASS] Unbalanced transaction rejected.')
        } else {
            console.error(`[FAIL] Unexpected error: ${e.message}`)
        }
    }

    // 3. Test Balanced Entry & Caching
    // Need a contra account
    const contra = await prisma.ledgerAccount.create({
        data: { code: 'CONTRA-' + Date.now(), name: 'Cash', type: 'ASSET' }
    })

    const txId = await CoreLedger.postTransaction({
        transactionDate: new Date(),
        referenceType: 'SAVINGS_DEPOSIT',
        referenceId: 'REF-002',
        description: 'Deposit Test',
        createdBy: 'TEST',
        createdByName: 'Tester',
        lines: [
            { accountId: contra.id, debit: BigInt(1000), credit: BigInt(0) },
            { accountId: account.id, debit: BigInt(0), credit: BigInt(1000) }
        ]
    })
    console.log(`[PASS] Posted Balanced Transaction: ${txId}`)

    const depositId = await CoreLedger.postTransaction({
        transactionDate: new Date(),
        referenceType: 'SAVINGS_DEPOSIT',
        referenceId: 'REF-003',
        description: 'Real Deposit',
        createdBy: 'TEST',
        createdByName: 'Tester',
        lines: [
            { accountId: contra.id, debit: BigInt(5000), credit: BigInt(0) }, // Debit Cash 50.00
            { accountId: account.id, debit: BigInt(0), credit: BigInt(5000) }  // Credit Wallet 50.00
        ]
    })
    console.log(`[PASS] Posted Balanced Transaction: ${depositId}`)

    // Check Balance
    const balance = await CoreLedger.getAccountBalanceLocked(account.id, prisma)
    // Liability Credit increases balance? Our logic: Credit - Debit. 
    // 5000 - 0 = 5000.
    if (balance === BigInt(5000)) {
        console.log(`[PASS] Balance Check: ${balance} (Expected 5000)`)
    } else {
        console.error(`[FAIL] Balance Mismatch: ${balance}`)
    }

    // 4. Concurrency Test
    console.log('--- STARTING CONCURRENCY TEST ---')
    const iterations = 10
    const amount = BigInt(100)

    // We will try to Withdraw (Debit Wallet, Credit Contra) 10 times in parallel.
    // Total withdrawal = 1000. Remaining balance should be 4000.

    await Promise.all(Array(iterations).fill(0).map((_, i) => {
        return CoreLedger.postTransaction({
            transactionDate: new Date(),
            referenceType: 'SAVINGS_WITHDRAWAL',
            referenceId: `CONC-${i}`,
            description: `Concurrency Test ${i}`,
            createdBy: 'TEST',
            createdByName: 'Tester',
            lines: [
                { accountId: account.id, debit: amount, credit: BigInt(0) },
                { accountId: contra.id, debit: BigInt(0), credit: amount }
            ]
        })
    }))

    const finalBalance = await CoreLedger.getAccountBalanceLocked(account.id, prisma)
    if (finalBalance === BigInt(4000)) {
        console.log(`[PASS] Concurrency Test: Final Balance ${finalBalance} (Expected 4000)`)
    } else {
        console.error(`[FAIL] Concurrency Race Condition! Balance: ${finalBalance}`)
    }

    console.log('--- VERIFICATION COMPLETE ---')
}

main()
    .catch(console.error)
    .finally(async () => {
        // Cleanup?
        await prisma.$disconnect()
    })
