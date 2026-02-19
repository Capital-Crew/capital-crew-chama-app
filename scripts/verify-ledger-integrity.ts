
import { PrismaClient } from '@prisma/client'
import { Decimal } from 'decimal.js'

const prisma = new PrismaClient()

async function verifyLedgerIntegrity() {
    console.log('🔍 Starting Ledger Integrity Verification...')
    console.log('==========================================')

    try {
        // 1. Fetch all parent accounts (Control Accounts)
        const controlAccounts = await prisma.ledgerAccount.findMany({
            where: {
                children: { some: {} }
            },
            include: {
                children: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        balance: true
                    }
                }
            }
        })

        if (controlAccounts.length === 0) {
            console.log('ℹ️ No control accounts found with children.')
            return
        }

        let totalDiscrepancies = 0

        for (const parent of controlAccounts) {
            console.log(`\nEvaluating Control Account: ${parent.code} - ${parent.name}`)

            const parentBalance = new Decimal(parent.balance.toString())
            const childrenSum = parent.children.reduce(
                (sum, child) => sum.plus(new Decimal(child.balance.toString())),
                new Decimal(0)
            )

            const difference = parentBalance.minus(childrenSum).abs()

            console.log(`- Parent Balance:   ${parentBalance.toFixed(2)}`)
            console.log(`- Sum of ${parent.children.length} Children: ${childrenSum.toFixed(2)}`)

            if (difference.gt(0.01)) {
                console.error(`❌ DISCREPANCY DETECTED: ${difference.toFixed(2)}`)
                totalDiscrepancies++
            } else {
                console.log(`✅ Integrity Verified (Match)`)
            }
        }

        console.log('\n--- Summary ---')
        if (totalDiscrepancies === 0) {
            console.log('✅ ALL CONTROL ACCOUNTS ARE IN BALANCE.')
        } else {
            console.warn(`⚠️ FOUND ${totalDiscrepancies} DISCREPANCIES. Investigation required.`)
        }

    } catch (error) {
        console.error('❌ Verification Failed:', error)
    } finally {
        await prisma.$disconnect()
    }
}

verifyLedgerIntegrity()
