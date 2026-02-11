/**
 * Seed Script: Expense Categories & Sub-Categories
 *
 * Populates the ExpenseCategoryGroup and ExpenseSubCategory tables
 * with the official SACCO expense hierarchy.
 *
 * Usage:
 *   npx tsx prisma/seed-expense-categories.ts
 *
 * Safe to re-run — uses upsert to avoid duplicates.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ──────────────────────────────────────────
// Data Definition
// ──────────────────────────────────────────

interface SubCategoryDef {
    name: string
    slug: string
    description: string
}

interface CategoryDef {
    name: string
    slug: string
    description: string
    subCategories: SubCategoryDef[]
}

const EXPENSE_HIERARCHY: CategoryDef[] = [
    {
        name: 'Member Returns',
        slug: 'member-returns',
        description: 'Distributions to members',
        subCategories: [
            {
                name: 'Dividend Payments',
                slug: 'dividend-payments',
                description: 'Annual payout based on contribution',
            },
            {
                name: 'Holiday/Christmas Payouts',
                slug: 'holiday-christmas-payouts',
                description: 'Festive season payouts',
            },
        ],
    },
    {
        name: 'Governance & Meetings',
        slug: 'governance-meetings',
        description: 'Committee & meeting costs',
        subCategories: [
            {
                name: 'Committee Allowances',
                slug: 'committee-allowances',
                description: 'Stipends for sitting in meetings',
            },
            {
                name: 'Meeting Refreshments',
                slug: 'meeting-refreshments',
                description: 'Tea, snacks, lunch',
            },
            {
                name: 'Transport Reimbursement',
                slug: 'transport-reimbursement',
                description: 'Refund for official travel',
            },
            {
                name: 'AGM Costs',
                slug: 'agm-costs',
                description: 'Annual General Meeting preparations',
            },
        ],
    },
    {
        name: 'Administrative & Operations',
        slug: 'administrative-operations',
        description: 'Operational running costs',
        subCategories: [
            {
                name: 'Communication',
                slug: 'communication',
                description: 'Airtime & Data bundles',
            },
            {
                name: 'Printing & Stationery',
                slug: 'printing-stationery',
                description: 'Receipt books, files, forms',
            },
            {
                name: 'Software & Hosting',
                slug: 'software-hosting',
                description: 'Web app, domain, cloud database',
            },
        ],
    },
    {
        name: 'Financial & Banking Charges',
        slug: 'financial-banking-charges',
        description: 'Bank and transaction fees',
        subCategories: [
            {
                name: 'Bank Ledger Fees',
                slug: 'bank-ledger-fees',
                description: 'Monthly maintenance charges',
            },
            {
                name: 'Transaction Costs',
                slug: 'transaction-costs',
                description: 'Withdrawal & Transfer charges',
            },
        ],
    },
    {
        name: 'Legal & Compliance',
        slug: 'legal-compliance',
        description: 'Regulatory costs',
        subCategories: [
            {
                name: 'Government Fees',
                slug: 'government-fees',
                description: 'Annual returns filing',
            },
            {
                name: 'Legal Fees',
                slug: 'legal-fees',
                description: 'Drafting bylaws, perfecting securities',
            },
        ],
    },
]

// ──────────────────────────────────────────
// Seed Logic
// ──────────────────────────────────────────

async function main() {
    console.log('🌱 Seeding Expense Categories...\n')

    let groupCount = 0
    let subCount = 0

    for (let gi = 0; gi < EXPENSE_HIERARCHY.length; gi++) {
        const cat = EXPENSE_HIERARCHY[gi]

        // Upsert parent category group
        const group = await prisma.expenseCategoryGroup.upsert({
            where: { slug: cat.slug },
            update: {
                name: cat.name,
                description: cat.description,
                sortOrder: gi + 1,
            },
            create: {
                name: cat.name,
                slug: cat.slug,
                description: cat.description,
                sortOrder: gi + 1,
            },
        })
        groupCount++
        console.log(`  📁 ${group.name}`)

        // Upsert each sub-category
        for (let si = 0; si < cat.subCategories.length; si++) {
            const sub = cat.subCategories[si]

            await prisma.expenseSubCategory.upsert({
                where: { slug: sub.slug },
                update: {
                    name: sub.name,
                    description: sub.description,
                    sortOrder: si + 1,
                    groupId: group.id,
                },
                create: {
                    name: sub.name,
                    slug: sub.slug,
                    description: sub.description,
                    sortOrder: si + 1,
                    groupId: group.id,
                },
            })
            subCount++
            console.log(`     └─ ${sub.name}`)
        }
    }

    console.log(`\n✅ Done! Seeded ${groupCount} groups and ${subCount} sub-categories.`)
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
