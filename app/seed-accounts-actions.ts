'use server'

import { db as prisma } from '@/lib/db'
import { auth } from '@/auth'
import { AccountType, AuditLogAction } from '@prisma/client'
import { withAudit } from '@/lib/with-audit'

/**
 * Seed the Chart of Accounts with standard SACCO accounts (full hierarchy)
 */

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
        }
    }

    return prisma.ledgerAccount.upsert({
        where: { code },
        update: { name, type, subType, description, parentId },
        create: {
            code,
            name,
            type,
            subType,
            description,
            parentId,
            balance: 0,
            isActive: true,
            allowManualEntry: false
        }
    })
}

export const seedChartOfAccounts = withAudit(
    { actionType: AuditLogAction.MIGRATION, domain: 'SYSTEM', apiRoute: '/api/admin/seed' },
    async (ctx) => {
        ctx.beginStep('Verify Authorization');
        const session = await auth()

        if (!session?.user?.id) {
            ctx.setErrorCode('UNAUTHORIZED');
            throw new Error('Unauthorized')
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (!user || !['CHAIRPERSON', 'TREASURER', 'SYSTEM_ADMIN'].includes(session.user.role || '')) {
            ctx.setErrorCode('FORBIDDEN');
            throw new Error('Only Chairperson, Treasurer, or System Admin can seed accounts')
        }
        ctx.endStep('Verify Authorization');

        ctx.beginStep('Seeding Root Accounts');
        // ── 1. ROOT ACCOUNTS ──────────────────────────────────────────────────────
        const roots: { code: string; name: string; type: AccountType }[] = [
            { code: '1000', name: 'ASSETS', type: 'ASSET' },
            { code: '2000', name: 'LIABILITIES', type: 'LIABILITY' },
            { code: '3000', name: 'CONTRIBUTIONS', type: 'LIABILITY' }, // Member funds are liabilities to the SACCO
            { code: '4000', name: 'INCOME', type: 'INCOME' },
            { code: '5000', name: 'EXPENSES', type: 'EXPENSE' },
            { code: '6000', name: 'EQUITY', type: 'EQUITY' },
        ]

        for (const r of roots) {
            await upsertAccount(r.code, r.name, r.type, null, 'Root', `Total ${r.name}`)
        }
        ctx.endStep('Seeding Root Accounts');

        ctx.beginStep('Seeding Parent Accounts');
        // ── 2. PARENT ACCOUNTS (Level 1) ──────────────────────────────────────────
        const parents: { code: string; name: string; type: AccountType; parent: string }[] = [
            // ASSETS
            { code: '1010', name: 'Cash & Bank Equivalents', type: 'ASSET', parent: '1000' },
            { code: '1020', name: 'Loans Receivable', type: 'ASSET', parent: '1000' },
            { code: '1030', name: 'Other Assets', type: 'ASSET', parent: '1000' },
            // LIABILITIES
            { code: '2010', name: 'Payables', type: 'LIABILITY', parent: '2000' },
            { code: '2030', name: 'Suspense', type: 'LIABILITY', parent: '2000' },
            // CONTRIBUTIONS
            { code: '3010', name: 'Deposits & Savings', type: 'LIABILITY', parent: '3000' },
            { code: '3020', name: 'Risk Funds', type: 'LIABILITY', parent: '3000' },
            // INCOME
            { code: '4010', name: 'Interest Income', type: 'INCOME', parent: '4000' },
            { code: '4020', name: 'Fee Income', type: 'INCOME', parent: '4000' },
            // EXPENSES
            { code: '5010', name: 'Operational Costs', type: 'EXPENSE', parent: '5000' },
            { code: '5020', name: 'Financial Costs', type: 'EXPENSE', parent: '5020' }, // Corrected parent
            { code: '5030', name: 'Administrative', type: 'EXPENSE', parent: '5000' },
            // EQUITY
            { code: '6010', name: 'Reserves', type: 'EQUITY', parent: '6000' },
        ]

        for (const p of parents) {
            await upsertAccount(p.code, p.name, p.type, p.parent, 'Category Header')
        }
        ctx.endStep('Seeding Parent Accounts');

        ctx.beginStep('Seeding Child Accounts');
        // ── 3. CHILD ACCOUNTS (Level 2 — Active Ledgers) ─────────────────────────
        const children: { code: string; name: string; type: AccountType; parent: string }[] = [
            // 1010 Cash & Bank
            { code: '1011', name: 'Bank Account', type: 'ASSET', parent: '1010' },
            { code: '1012', name: 'M-Pesa Paybill (Collections)', type: 'ASSET', parent: '1010' },
            { code: '1013', name: 'M-Pesa B2C (Disbursement)', type: 'ASSET', parent: '1010' },
            { code: '1014', name: 'Petty Cash', type: 'ASSET', parent: '1010' },
            // 1020 Loans
            { code: '1021', name: 'Principal Loans to Members', type: 'ASSET', parent: '1020' },
            { code: '1022', name: 'Interest Receivable', type: 'ASSET', parent: '1020' },
            { code: '1023', name: 'Penalty Receivable', type: 'ASSET', parent: '1020' },
            { code: '1024', name: 'Fees Receivable', type: 'ASSET', parent: '1020' },
            // 1030 Other Assets
            { code: '1031', name: 'Prepaid Expenses', type: 'ASSET', parent: '1030' },
            { code: '1032', name: 'System Equipment & Hardware', type: 'ASSET', parent: '1030' },
            // 2010 Payables
            { code: '2011', name: 'Supplier/Vendor Payables', type: 'LIABILITY', parent: '2010' },
            { code: '2012', name: 'Legal Fees Payable', type: 'LIABILITY', parent: '2010' },
            // 2030 Suspense
            { code: '2031', name: 'Unidentified Deposits', type: 'LIABILITY', parent: '2030' },
            // 3010 Deposits
            { code: '3011', name: 'Non-Withdrawable Deposits', type: 'LIABILITY', parent: '3010' },
            { code: '3012', name: 'Member Withdrawable Wallet', type: 'LIABILITY', parent: '3010' },
            // 3020 Risk Funds
            { code: '3021', name: 'Benevolent / Insurance Fund', type: 'LIABILITY', parent: '3020' },
            // 4010 Interest Income
            { code: '4011', name: 'Interest on Loans', type: 'INCOME', parent: '4010' },
            { code: '4012', name: 'Interest on Penalties', type: 'INCOME', parent: '4010' },
            // 4020 Fee Income
            { code: '4021', name: 'Processing Fees', type: 'INCOME', parent: '4020' },
            { code: '4022', name: 'Registration/Joining Fees', type: 'INCOME', parent: '4020' },
            // 5010 Operational Costs
            { code: '5011', name: 'Hosting & Cloud Fees', type: 'EXPENSE', parent: '5010' },
            { code: '5012', name: 'Software Licenses', type: 'EXPENSE', parent: '5010' },
            { code: '5013', name: 'SMS & Bulk Notifications', type: 'EXPENSE', parent: '5010' },
            // 5020 Financial Costs
            { code: '5021', name: 'M-Pesa B2C Charges', type: 'EXPENSE', parent: '5020' },
            { code: '5022', name: 'Bank Maintenance Charges', type: 'EXPENSE', parent: '5020' },
            { code: '5023', name: 'Bad Debt Write-off', type: 'EXPENSE', parent: '5020' },
            // 5030 Administrative
            { code: '5031', name: 'Marketing & Advertising', type: 'EXPENSE', parent: '5030' },
            { code: '5032', name: 'Office Supplies', type: 'EXPENSE', parent: '5030' },
            { code: '5033', name: 'Professional/Audit Fees', type: 'EXPENSE', parent: '5030' },
            // 6010 Reserves
            { code: '6011', name: 'Retained Earnings', type: 'EQUITY', parent: '6010' },
            { code: '6012', name: 'Current Year P&L', type: 'EQUITY', parent: '6010' },
        ]

        for (const c of children) {
            await upsertAccount(c.code, c.name, c.type, c.parent, 'Active Account')
        }
        ctx.endStep('Seeding Child Accounts');

        const totalAccounts = roots.length + parents.length + children.length
        ctx.captureAfter({ totalAccounts, status: 'SUCCESS' });

        return {
            success: true,
            accountsCreated: totalAccounts
        }
    }
);
