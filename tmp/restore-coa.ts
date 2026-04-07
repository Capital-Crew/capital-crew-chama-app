
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function upsertAccount(
    code: string,
    name: string,
    type: any,
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

async function main() {
    console.log('🚀 Restoring Chart of Accounts...');

    // ── 1. ROOT ACCOUNTS ──────────────────────────────────────────────────────
    const roots = [
        { code: '1000', name: 'ASSETS', type: 'ASSET' },
        { code: '2000', name: 'LIABILITIES', type: 'LIABILITY' },
        { code: '3000', name: 'CONTRIBUTIONS', type: 'LIABILITY' }, 
        { code: '4000', name: 'REVENUE', type: 'REVENUE' },
        { code: '5000', name: 'EXPENSES', type: 'EXPENSE' },
        { code: '6000', name: 'EQUITY', type: 'EQUITY' },
    ]

    for (const r of roots) {
        await upsertAccount(r.code, r.name, r.type, null, 'Root', `Total ${r.name}`)
    }

    // ── 2. PARENT ACCOUNTS (Level 1) ──────────────────────────────────────────
    const parents = [
        { code: '1010', name: 'Cash & Bank Equivalents', type: 'ASSET', parent: '1000' },
        { code: '1020', name: 'Loans Receivable', type: 'ASSET', parent: '1000' },
        { code: '1030', name: 'Other Assets', type: 'ASSET', parent: '1000' },
        { code: '2010', name: 'Payables', type: 'LIABILITY', parent: '2000' },
        { code: '2030', name: 'Suspense', type: 'LIABILITY', parent: '2000' },
        { code: '3010', name: 'Deposits & Savings', type: 'LIABILITY', parent: '3000' },
        { code: '3020', name: 'Risk Funds', type: 'LIABILITY', parent: '3000' },
        { code: '4010', name: 'Interest Revenue', type: 'REVENUE', parent: '4000' },
        { code: '4020', name: 'Fee Revenue', type: 'REVENUE', parent: '4000' },
        { code: '5010', name: 'Operational Costs', type: 'EXPENSE', parent: '5000' },
        { code: '5020', name: 'Financial Costs', type: 'EXPENSE', parent: '5020' }, 
        { code: '5030', name: 'Administrative', type: 'EXPENSE', parent: '5000' },
        { code: '6010', name: 'Reserves', type: 'EQUITY', parent: '6000' },
    ]

    for (const p of parents) {
        await upsertAccount(p.code, p.name, p.type, p.parent, 'Category Header')
    }

    // ── 3. CHILD ACCOUNTS (Level 2) ─────────────────────────
    const children = [
        { code: '1011', name: 'Bank Account', type: 'ASSET', parent: '1010' },
        { code: '1014', name: 'Petty Cash', type: 'ASSET', parent: '1010' },
        { code: '1021', name: 'Principal Loans to Members', type: 'ASSET', parent: '1020' },
        { code: '1022', name: 'Interest Receivable', type: 'ASSET', parent: '1020' },
        { code: '1023', name: 'Penalty Receivable', type: 'ASSET', parent: '1020' },
        { code: '1024', name: 'Fees Receivable', type: 'ASSET', parent: '1020' },
        { code: '3011', name: 'Non-Withdrawable Deposits', type: 'LIABILITY', parent: '3010' },
        { code: '3012', name: 'Member Withdrawable Wallet', type: 'LIABILITY', parent: '3010' },
        { code: '4011', name: 'Interest on Loans', type: 'REVENUE', parent: '4010' },
        { code: '4012', name: 'Interest on Penalties', type: 'REVENUE', parent: '4010' },
        { code: '4021', name: 'Processing Fees', type: 'REVENUE', parent: '4020' },
    ]

    for (const c of children) {
        await upsertAccount(c.code, c.name, c.type, c.parent, 'Active Account')
    }

    console.log('✅ Chart of Accounts restored.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
