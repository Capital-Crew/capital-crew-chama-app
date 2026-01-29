
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Fixing System Accounting Configuration...')

    // 1. Ensure Ledger Accounts Exist (Idempotent)
    const accounts = [
        { code: '1100', name: 'Cash on Hand', type: 'ASSET' },
        { code: '1200', name: 'Contributions', type: 'ASSET' }, // Hybrid/Equity
        { code: '1310', name: 'Loan Portfolio', type: 'ASSET' },
        { code: '1320', name: 'Interest Receivable', type: 'ASSET' },
        { code: '2200', name: 'Member Wallet', type: 'LIABILITY' },
        { code: '4100', name: 'Income', type: 'REVENUE' }, // Unified Income
    ]

    for (const acc of accounts) {
        await prisma.ledgerAccount.upsert({
            where: { code: acc.code },
            update: {}, // Don't overwrite if exists
            create: {
                code: acc.code,
                name: acc.name,
                type: acc.type as any,
                isActive: true
            }
        })
    }

    // 2. Map System Types to Accounts
    const mappings = [
        // The one causing the error
        { type: 'CONTRIBUTIONS', code: '1200' },

        // Logical Mappings
        { type: 'EVENT_SHARE_CONTRIBUTION', code: '1200' },
        { type: 'MEMBER_WALLET', code: '2200' },
        { type: 'EVENT_CASH_DEPOSIT', code: '1100' }, // Assuming Cash
        { type: 'EVENT_CASH_WITHDRAWAL', code: '1100' },

        // Loan Mappings
        { type: 'EVENT_LOAN_DISBURSEMENT', code: '2200' }, // Debited from Wallet (or Cash)
        { type: 'EVENT_LOAN_REPAYMENT_PRINCIPAL', code: '1310' },
        { type: 'RECEIVABLE_LOAN_INTEREST', code: '1320' },

        // Income Mappings (Mapping all to General Income 4100 for simplicity)
        // In a real setup, these might be separate sub-accounts
        { type: 'INCOME', code: '4100' },
        { type: 'INCOME_LOAN_INTEREST', code: '4100' },
        { type: 'INCOME_LOAN_PENALTY', code: '4100' },
        { type: 'INCOME_LOAN_PROCESSING_FEE', code: '4100' },
        { type: 'INCOME_GENERAL_FEE', code: '4100' },

        // Other Receivables (Mapping Penalties/Fees to Interest Receivable 1320 or Generic 1300 if existed)
        // Using 1320 for simplicity as it's an Asset
        { type: 'RECEIVABLE_LOAN_PENALTY', code: '1320' },
        { type: 'RECEIVABLE_LOAN_FEES', code: '1320' },
    ]

    for (const map of mappings) {
        // Find account first
        const account = await prisma.ledgerAccount.findUnique({ where: { code: map.code } })
        if (!account) {
            console.error(`Account verification failed for code ${map.code}`)
            continue
        }

        await prisma.systemAccountingMapping.upsert({
            where: { type: map.type as any },
            update: {
                accountId: account.id
            },
            create: {
                type: map.type as any,
                accountId: account.id
            }
        })
        console.log(`Mapped ${map.type} -> ${map.code}`)
    }

    console.log('Configuration Fixed.')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
