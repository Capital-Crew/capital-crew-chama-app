
import { db as prisma } from '@/lib/db'
import { AccountType } from '@prisma/client'

// Helper function to upsert an account
async function upsertAccount(
    code: string,
    name: string,
    type: AccountType,
    parentCode: string | null = null,
    subType: string = 'General',
    description: string = ''
) {
    let parentId = null
    if (parentCode) {
        const parent = await prisma.ledgerAccount.findUnique({ where: { code: parentCode } })
        if (parent) {
            parentId = parent.id
        } else {
            console.warn(`⚠️ Parent account ${parentCode} not found for ${code}. Skipping parent linkage.`)
        }
    }

    const account = await prisma.ledgerAccount.upsert({
        where: { code },
        update: {
            name,
            type,
            subType,
            description,
            parentId // Update parent linkage if changed
        },
        create: {
            code,
            name,
            type,
            subType,
            description,
            parentId,
            balance: 0,
            isActive: true
        }
    })
    console.log(`  ✓ ${code} - ${name}`)
    return account
}

export async function seedChartOfAccounts() {
    console.log('🌱 Seeding Detailed Chart of Accounts...')

    // 1. ROOT ACCOUNTS (Level 0)
    // We create these first so they exist for children
    const roots = [
        { code: '1000', name: 'ASSETS', type: 'ASSET' as const },
        { code: '2000', name: 'LIABILITIES', type: 'LIABILITY' as const },
        { code: '3000', name: 'CONTRIBUTIONS', type: 'LIABILITY' as const }, 
        { code: '4000', name: 'REVENUE', type: 'REVENUE' as const },
        { code: '5000', name: 'EXPENSES', type: 'EXPENSE' as const },
        { code: '6000', name: 'EQUITY', type: 'EQUITY' as const },
    ]

    console.log('\n--- Seeding Roots ---')
    for (const r of roots) {
        await upsertAccount(r.code, r.name, r.type, null, 'Root', `Total ${r.name}`)
    }

    // 2. PARENT ACCOUNTS (Level 1)
    const parents = [
        // ASSETS
        { code: '1010', name: 'Cash & Bank Equivalents', type: 'ASSET' as const, parent: '1000' },
        { code: '1020', name: 'Loans Receivable', type: 'ASSET' as const, parent: '1000' },
        { code: '1030', name: 'Other Assets', type: 'ASSET' as const, parent: '1000' },

        // LIABILITIES
        { code: '2010', name: 'Payables', type: 'LIABILITY' as const, parent: '2000' },
        { code: '2030', name: 'Suspense', type: 'LIABILITY' as const, parent: '2000' },

        // CONTRIBUTIONS
        { code: '3010', name: 'Deposits & Savings', type: 'LIABILITY' as const, parent: '3000' },
        { code: '3020', name: 'Risk Funds', type: 'LIABILITY' as const, parent: '3000' },

        // REVENUE
        { code: '4010', name: 'Interest Revenue', type: 'REVENUE' as const, parent: '4000' },
        { code: '4020', name: 'Fee Revenue', type: 'REVENUE' as const, parent: '4000' },

        // EXPENSES
        { code: '5010', name: 'Operational Costs', type: 'EXPENSE' as const, parent: '5000' },
        { code: '5020', name: 'Financial Costs', type: 'EXPENSE' as const, parent: '5000' },
        { code: '5030', name: 'Administrative', type: 'EXPENSE' as const, parent: '5000' },

        // EQUITY
        { code: '6010', name: 'Reserves', type: 'EQUITY' as const, parent: '6000' }
    ]

    console.log('\n--- Seeding Parents ---')
    for (const p of parents) {
        await upsertAccount(p.code, p.name, p.type, p.parent, 'Category Header')
    }

    // 3. CHILD ACCOUNTS (Level 2)
    const children = [
        // 1010 Cash & Bank
        { code: '1011', name: 'Bank Account', type: 'ASSET' as const, parent: '1010' },
        { code: '1012', name: 'M-Pesa Paybill (Collections)', type: 'ASSET' as const, parent: '1010' },
        { code: '1013', name: 'M-Pesa B2C (Disbursement)', type: 'ASSET' as const, parent: '1010' },
        { code: '1014', name: 'Petty Cash', type: 'ASSET' as const, parent: '1010' },

        // 1020 Loans
        { code: '1021', name: 'Principal Loans to Members', type: 'ASSET' as const, parent: '1020' },
        { code: '1022', name: 'Interest Receivable', type: 'ASSET' as const, parent: '1020' },
        { code: '1023', name: 'Penalty Receivable', type: 'ASSET' as const, parent: '1020' },
        { code: '1024', name: 'Fees Receivable', type: 'ASSET' as const, parent: '1020' },

        // 1030 Other Assets
        { code: '1031', name: 'Prepaid Expenses', type: 'ASSET' as const, parent: '1030' },
        { code: '1032', name: 'System Equipment & Hardware', type: 'ASSET' as const, parent: '1030' },

        // 2010 Payables
        { code: '2011', name: 'Supplier/Vendor Payables', type: 'LIABILITY' as const, parent: '2010' },
        { code: '2012', name: 'Legal Fees Payable', type: 'LIABILITY' as const, parent: '2010' },

        // 2030 Suspense
        { code: '2031', name: 'Unidentified Deposits', type: 'LIABILITY' as const, parent: '2030' },

        // 3010 Deposits
        { code: '3011', name: 'Member Contributions', type: 'LIABILITY' as const, parent: '3010', description: 'Non-Withdrawable Member Funds' },
        { code: '3012', name: 'Member Withdrawable Wallet', type: 'LIABILITY' as const, parent: '3010' },

        // 3020 Risk Funds
        { code: '3021', name: 'Benevolent / Insurance Fund', type: 'LIABILITY' as const, parent: '3020' },

        // 4010 Interest Revenue
        { code: '4011', name: 'Interest on Loans', type: 'REVENUE' as const, parent: '4010' },
        { code: '4012', name: 'Penalty Revenue', type: 'REVENUE' as const, parent: '4010' },

        // 4020 Fee Revenue
        { code: '4021', name: 'Processing Fees', type: 'REVENUE' as const, parent: '4020' },
        { code: '4022', name: 'Registration/Joining Fees', type: 'REVENUE' as const, parent: '4020' },

        // 5010 Ops Costs
        { code: '5011', name: 'Hosting & Cloud Fees', type: 'EXPENSE' as const, parent: '5010' },
        { code: '5012', name: 'Software Licenses', type: 'EXPENSE' as const, parent: '5010' },
        { code: '5013', name: 'SMS & Bulk Notifications', type: 'EXPENSE' as const, parent: '5010' },

        // 5020 Financial Costs
        { code: '5021', name: 'M-Pesa B2C Charges', type: 'EXPENSE' as const, parent: '5020' },
        { code: '5022', name: 'Bank Maintenance Charges', type: 'EXPENSE' as const, parent: '5020' },
        { code: '5023', name: 'Bad Debt Write-off', type: 'EXPENSE' as const, parent: '5020' },

        // 5030 Admin
        { code: '5031', name: 'Marketing & Advertising', type: 'EXPENSE' as const, parent: '5030' },
        { code: '5032', name: 'Office Supplies', type: 'EXPENSE' as const, parent: '5030' },
        { code: '5033', name: 'Professional/Audit Fees', type: 'EXPENSE' as const, parent: '5030' },

        // 6010 Reserves
        { code: '6011', name: 'Retained Earnings', type: 'EQUITY' as const, parent: '6010' },
        { code: '6012', name: 'Current Year P&L', type: 'EQUITY' as const, parent: '6010' },

        // --- SYSTEM DEFAULTS ---
        // Ensuring critical system defaults (like Wallet 3012) are handled.
    ]

    console.log('\n--- Seeding Children ---')
    for (const c of children) {
        await upsertAccount(c.code, c.name, c.type, c.parent, 'Active Account')
    }

    console.log('✅ Detailed Chart of Accounts seeded successfully!')
}

// Run directly
seedChartOfAccounts()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Error seeding Chart of Accounts:', error)
        process.exit(1)
    })
