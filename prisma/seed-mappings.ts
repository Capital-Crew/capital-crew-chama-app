import prisma from '@/lib/prisma'
import { SystemAccountType } from '@prisma/client'

/**
 * Seed System Ledger Mappings
 * Connects System Events to GL Accounts
 */
export async function seedLedgerMappings() {
    console.log('🔗 Seeding Ledger Mappings...')

    const mappings = [
        // Legacy Support
        { type: 'CASH_ON_HAND', accountCode: '1100' },
        { type: 'RECEIVABLES', accountCode: '1021' }, // Principal Loans to Members
        { type: 'MEMBER_WALLET', accountCode: '2200' },
        { type: 'CONTRIBUTIONS', accountCode: '3011' }, // Non-Withdrawable Deposits
        { type: 'INCOME', accountCode: '4011' }, // Interest on Loans

        // Event Mappings
        { type: 'EVENT_CASH_DEPOSIT', accountCode: '1100' }, // Dr Cash
        { type: 'EVENT_CASH_WITHDRAWAL', accountCode: '1100' }, // Cr Cash
        { type: 'EVENT_EXPENSE_PAYMENT', accountCode: '1100' }, // Cr Cash
        { type: 'EVENT_LOAN_DISBURSEMENT', accountCode: '2200' }, // Cr Wallet (Funds added to wallet)
        { type: 'EVENT_LOAN_REPAYMENT_PRINCIPAL', accountCode: '1021' }, // Principal Loans to Members
        { type: 'EVENT_SHARE_CONTRIBUTION', accountCode: '3011' }, // Non-Withdrawable Deposits

        // Income & Receivable Mappings
        { type: 'INCOME_LOAN_INTEREST', accountCode: '4011' }, // Interest on Loans
        { type: 'RECEIVABLE_LOAN_INTEREST', accountCode: '1022' }, // Interest Receivable

        { type: 'INCOME_LOAN_PENALTY', accountCode: '4012' }, // Interest on Penalties
        { type: 'RECEIVABLE_LOAN_PENALTY', accountCode: '1023' }, // Penalty Receivable

        { type: 'INCOME_LOAN_PROCESSING_FEE', accountCode: '4021' }, // Processing Fees
        { type: 'INCOME_GENERAL_FEE', accountCode: '4021' }, // Processing Fees
        { type: 'RECEIVABLE_LOAN_FEES', accountCode: '1024' } // Fees Receivable
    ]

    for (const map of mappings) {
        const account = await prisma.ledgerAccount.findUnique({
            where: { code: map.accountCode }
        })

        if (!account) {
            console.error(`⚠️ Account ${map.accountCode} not found! Skipping mapping for ${map.type}`)
            continue
        }

        // Upsert mapping
        await prisma.systemAccountingMapping.upsert({
            where: { type: map.type as SystemAccountType },
            update: { accountId: account.id },
            create: {
                type: map.type as SystemAccountType,
                accountId: account.id
            }
        })
        console.log(`  ✓ Mapped ${map.type} -> ${account.name} (${account.code})`)
    }

    console.log('✅ Ledger Mappings seeded successfully!')
}

// Run directly
seedLedgerMappings()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Error seeding mappings:', error)
        process.exit(1)
    })

