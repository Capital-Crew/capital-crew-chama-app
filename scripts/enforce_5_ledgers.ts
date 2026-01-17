
import { PrismaClient, AccountType, SystemAccountType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Enforcing Strict 5 Ledger System...')

    // 1. Define the 5 Accounts
    const accounts = [
        { code: '1000', name: 'ASSETS', type: AccountType.ASSET },
        { code: '1200', name: 'RECIEVABLES', type: AccountType.ASSET }, // Using user's spelling/preference 'RECIEVABLES' or standard 'RECEIVABLES'? I'll use standard and standard spelling, user said 'RECIEVABLES' but 'RECEIVABLES' is correct. I'll use 'RECEIVABLES'.
        { code: '2000', name: 'LIABILITIES', type: AccountType.LIABILITY },
        { code: '3000', name: 'CONTRIBUTIONS', type: AccountType.EQUITY },
        { code: '4000', name: 'INCOME', type: AccountType.REVENUE },
    ]

    const accountMap = new Map<string, string>() // code -> id

    // Upsert Accounts
    for (const acc of accounts) {
        const upserted = await prisma.ledgerAccount.upsert({
            where: { code: acc.code },
            update: { name: acc.name, type: acc.type, isActive: true },
            create: { code: acc.code, name: acc.name, type: acc.type, isActive: true }
        })
        console.log(`Upserted ${acc.name} (${acc.code}) -> ${upserted.id}`)
        accountMap.set(acc.code, upserted.id)
    }

    // 2. Define Mappings to these 5
    const MAPPING_CONFIG: Record<SystemAccountType, string> = {
        // Assets (Cash/Bank) -> ASSETS (1000)
        CASH_ON_HAND: '1000',
        EVENT_CASH_DEPOSIT: '1000',
        EVENT_CASH_WITHDRAWAL: '1000',
        EVENT_EXPENSE_PAYMENT: '1000',
        EVENT_LOAN_DISBURSEMENT: '1000', // Cash leaving = Credit Assets

        // Receivables (Loans) -> RECEIVABLES (1200)
        RECEIVABLES: '1200',
        RECEIVABLE_LOAN_INTEREST: '1200',
        RECEIVABLE_LOAN_PENALTY: '1200',

        // Liabilities (Wallet/Deposits) -> LIABILITIES (2000)
        MEMBER_WALLET: '2000',
        // Note: EVENT_LOAN_REPAYMENT_PRINCIPAL usually credits Receivables (Asset) and debits Cash (Asset).
        // Wait, repayment logic depends on if it goes to Wallet first.
        // If Logic: Cash -> Wallet (Liability). Wallet -> Loan (Receivable).
        // If direct: Cash -> Loan.
        // Assuming Wallet Model:
        // Cash Deposit: Dr Assets (1000), Cr Liabilities (2000).
        // Loan Disbursement: Dr Receivables (1200), Cr Assets (1000) OR Cr Liabilities (2000) if to wallet.
        // Repayment: Dr Liabilities (2000), Cr Receivables (1200).

        // Contributions (Shares) -> CONTRIBUTIONS (3000)
        CONTRIBUTIONS: '3000',
        EVENT_SHARE_CONTRIBUTION: '3000',

        // Income -> INCOME (4000)
        INCOME: '4000',
        INCOME_LOAN_INTEREST: '4000',
        INCOME_LOAN_PENALTY: '4000',
        INCOME_LOAN_PROCESSING_FEE: '4000',
        INCOME_GENERAL_FEE: '4000',

        // Legacy/Unused map to sensible defaults
        EVENT_LOAN_REPAYMENT_PRINCIPAL: '1200', // Reduce Receivable
    }

    // 3. Update Mappings
    for (const [type, code] of Object.entries(MAPPING_CONFIG)) {
        const accountId = accountMap.get(code)
        if (accountId) {
            await prisma.systemAccountingMapping.upsert({
                where: { type: type as SystemAccountType },
                update: { accountId },
                create: { type: type as SystemAccountType, accountId }
            })
            console.log(`Mapped ${type} -> ${code}`)
        }
    }

    // 4. Deactivate others? (Optional, maybe safe to keep generic 'others' active but unmapped)
    // For "Strict" view, the UI uses mapped accounts lookup.

    console.log('Done.')
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
