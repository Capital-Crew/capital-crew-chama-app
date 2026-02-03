import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function applyConstraints() {
    console.log('🔒 Applying Ledger Integrity Constraints...\n')

    try {
        // 1. Enforce Linkage: LoanTransaction MUST have referenceId (Ledger Link)
        // Check for nulls first?
        const nulls = await prisma.loanTransaction.count({ where: { referenceId: null } })
        if (nulls > 0) {
            console.error(`❌ Cannot apply constraint: Found ${nulls} transactions without ledger link.`)
            console.error('Run scripts/link-orphaned-transactions.ts first.')
            process.exit(1)
        }

        // Apply Constraint check (Postgres specific) or catch trigger?
        // Since we use Prisma handle, we can't easily alter table structure ddl without migration.
        // But we can check if migration is preferred.
        // For now, I will simulate it or log that it should be added to schema.prisma

        console.log('⚠️  To enforce constraints permanently, add this to schema.prisma:')
        console.log(`
model LoanTransaction {
  // ...
  referenceId String // Remove '?' to make execution strictly required
}
        `)

        console.log('\n✅ Data is clean. You can now safely make `referenceId` required in schema.')

    } catch (e) {
        console.error(e)
    }
}

applyConstraints()
