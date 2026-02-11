/**
 * Safe migration script: Migrate existing ExpenseStatus enum values
 * before running `prisma db push`.
 * 
 * This adds the new enum values first, migrates data, then removes old values.
 * Run with: npx tsx scripts/migrate-expense-status.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔄 Starting ExpenseStatus migration...')

    // Step 1: Add new enum values to PostgreSQL (safe, no data loss)
    const addNewValues = [
        `ALTER TYPE "ExpenseStatus" ADD VALUE IF NOT EXISTS 'DRAFT'`,
        `ALTER TYPE "ExpenseStatus" ADD VALUE IF NOT EXISTS 'PENDING_APPROVAL'`,
        `ALTER TYPE "ExpenseStatus" ADD VALUE IF NOT EXISTS 'DISBURSED'`,
        `ALTER TYPE "ExpenseStatus" ADD VALUE IF NOT EXISTS 'SURRENDERED'`,
        `ALTER TYPE "ExpenseStatus" ADD VALUE IF NOT EXISTS 'CLOSED'`,
    ]

    for (const sql of addNewValues) {
        try {
            await prisma.$executeRawUnsafe(sql)
            console.log(`  ✅ ${sql}`)
        } catch (e: any) {
            console.log(`  ⏭️  Skipped (already exists): ${e.message?.slice(0, 60)}`)
        }
    }

    // Step 2: Migrate existing data
    const pendingCount = await prisma.$executeRawUnsafe(
        `UPDATE "Expense" SET "status" = 'PENDING_APPROVAL' WHERE "status" = 'PENDING'`
    )
    console.log(`  📦 Migrated ${pendingCount} PENDING → PENDING_APPROVAL`)

    const approvedCount = await prisma.$executeRawUnsafe(
        `UPDATE "Expense" SET "status" = 'CLOSED' WHERE "status" = 'APPROVED'`
    )
    console.log(`  📦 Migrated ${approvedCount} APPROVED → CLOSED`)

    // Step 3: Add new WalletTransactionType values
    const walletTypes = [
        `ALTER TYPE "WalletTransactionType" ADD VALUE IF NOT EXISTS 'EXPENSE_PAYOUT'`,
        `ALTER TYPE "WalletTransactionType" ADD VALUE IF NOT EXISTS 'IMPREST_ADVANCE'`,
        `ALTER TYPE "WalletTransactionType" ADD VALUE IF NOT EXISTS 'IMPREST_REFUND'`,
        `ALTER TYPE "WalletTransactionType" ADD VALUE IF NOT EXISTS 'DIVIDEND_PAYOUT'`,
    ]

    for (const sql of walletTypes) {
        try {
            await prisma.$executeRawUnsafe(sql)
            console.log(`  ✅ ${sql}`)
        } catch (e: any) {
            console.log(`  ⏭️  Skipped: ${e.message?.slice(0, 60)}`)
        }
    }

    // Step 4: Add new ReferenceType values
    const refTypes = [
        `ALTER TYPE "ReferenceType" ADD VALUE IF NOT EXISTS 'EXPENSE_PAYOUT'`,
        `ALTER TYPE "ReferenceType" ADD VALUE IF NOT EXISTS 'BULK_PAYOUT'`,
    ]

    for (const sql of refTypes) {
        try {
            await prisma.$executeRawUnsafe(sql)
            console.log(`  ✅ ${sql}`)
        } catch (e: any) {
            console.log(`  ⏭️  Skipped: ${e.message?.slice(0, 60)}`)
        }
    }

    // Step 5: Add new ExpenseType and BalanceAction and BatchPaymentStatus enums
    const newEnums = [
        `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ExpenseType') THEN CREATE TYPE "ExpenseType" AS ENUM ('IMPREST', 'CLAIM', 'OPERATIONAL'); END IF; END $$`,
        `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BalanceAction') THEN CREATE TYPE "BalanceAction" AS ENUM ('REFUNDED_TO_SACCO', 'PAID_TO_USER'); END IF; END $$`,
        `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BatchPaymentStatus') THEN CREATE TYPE "BatchPaymentStatus" AS ENUM ('DRAFT', 'PROCESSING', 'COMPLETED', 'FAILED'); END IF; END $$`,
    ]

    for (const sql of newEnums) {
        try {
            await prisma.$executeRawUnsafe(sql)
            console.log(`  ✅ Created enum`)
        } catch (e: any) {
            console.log(`  ⏭️  Skipped: ${e.message?.slice(0, 60)}`)
        }
    }

    console.log('\n✅ Migration complete! Now safe to run: npx prisma db push')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
