
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { checkTransactionStatus } from './lib/mpesa-status'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Diagnosing Latest Pending Transaction ---')
    // 1. Get latest Pending
    const tx = await prisma.transaction.findFirst({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' }
    })

    if (!tx) {
        console.log('No PENDING transactions found to diagnose.')
        return
    }

    console.log(`Diagnosing TX: ${tx.id}`)
    console.log(`CheckoutRequestID: ${tx.checkoutRequestId}`)
    console.log(`Amount: ${tx.amount}`)
    console.log(`Time: ${tx.createdAt.toISOString()}`)

    // 2. Query M-Pesa
    try {
        console.log('Querying M-Pesa...')
        const result = await checkTransactionStatus(tx.checkoutRequestId)
        console.log('--- M-PESA STATUS RESULT ---')
        console.log(JSON.stringify(result, null, 2))
    } catch (error: any) {
        console.error('Failed to query M-Pesa:', error.message)
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
