'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/auth'

/**
 * Seed the Chart of Accounts with standard SACCO accounts
 */
export async function seedChartOfAccounts() {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    // Check admin permissions
    const user = await prisma.user.findUnique({
        where: { id: session.user.id }
    })

    if (!user || !['CHAIRPERSON', 'TREASURER'].includes(session.user.role || '')) {
        throw new Error('Only Chairperson or Treasurer can seed accounts')
    }

    // Check if accounts already exist
    const existingCount = await prisma.ledgerAccount.count()
    if (existingCount > 0) {
        throw new Error('Chart of Accounts already exists. Please delete existing accounts first.')
    }

    const accounts = [
        // ASSETS
        { code: '1100', name: 'Cash on Hand', type: 'ASSET', subType: 'Current Asset', description: 'Physical cash held by the SACCO' },
        { code: '1110', name: 'Bank Account', type: 'ASSET', subType: 'Current Asset', description: 'SACCO bank account balance' },
        { code: '1300', name: 'Receivables', type: 'ASSET', subType: 'Current Asset', description: 'General receivables' },
        { code: '1310', name: 'Loan Portfolio', type: 'ASSET', subType: 'Current Asset', description: 'Outstanding loan principal' },
        { code: '1320', name: 'Interest Receivable', type: 'ASSET', subType: 'Current Asset', description: 'Accrued interest on loans' },

        // LIABILITIES
        { code: '2200', name: 'Member Wallet', type: 'LIABILITY', subType: 'Current Liability', description: 'Withdrawable member funds' },
        { code: '2300', name: 'Accounts Payable', type: 'LIABILITY', subType: 'Current Liability', description: 'Outstanding payments' },

        // EQUITY / SHARES (Mapped to 1200 in Constants as Asset/Equity hybrid, keeping as Asset 1200 for consistency)
        { code: '1200', name: 'Contributions', type: 'ASSET', subType: 'Member Equity', description: 'Member share contributions' },

        // PURE EQUITY
        { code: '3000', name: 'Retained Earnings', type: 'EQUITY', subType: 'Equity', description: 'Accumulated profits' },

        // INCOME
        { code: '4100', name: 'Income', type: 'INCOME', subType: 'Operating Income', description: 'All revenue: Interest, Fees, Penalties' },

        // EXPENSES
        { code: '5000', name: 'Operating Expenses', type: 'EXPENSE', subType: 'Operating Expense', description: 'General operating expenses' },
        { code: '5200', name: 'Loan Loss Provision', type: 'EXPENSE', subType: 'Operating Expense', description: 'Provision for bad debts' },
    ]

    // Create all accounts
    for (const account of accounts) {
        await prisma.ledgerAccount.create({
            data: {
                ...account,
                type: account.type as any, // Cast string to Enum
                isActive: true,
                allowManualEntry: false
            }
        })
    }

    // Create audit log
    await prisma.auditLog.create({
        data: {
            userId: session.user.id,
            action: 'MIGRATION',
            details: `Seeded Chart of Accounts with ${accounts.length} standard accounts`
        }
    })

    return {
        success: true,
        accountsCreated: accounts.length
    }
}
