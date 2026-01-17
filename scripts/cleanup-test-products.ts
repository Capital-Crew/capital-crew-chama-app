
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Cleaning up Test Loan Products...')

    // 1. Find IDs of products to delete
    const products = await prisma.loanProduct.findMany({
        where: { name: { startsWith: 'Test Loan Product' } },
        select: { id: true }
    })

    if (products.length === 0) {
        console.log('No test products found.')
        return
    }

    const productIds = products.map(p => p.id)
    console.log(`Found ${productIds.length} products to delete.`)

    // 2. Delete Mappings
    console.log('...Deleting Product Accounting Mappings')
    await prisma.productAccountingMapping.deleteMany({
        where: { productId: { in: productIds } }
    })

    // 3. Delete Products
    const deleted = await prisma.loanProduct.deleteMany({
        where: { id: { in: productIds } }
    })

    console.log(`✅ Deleted ${deleted.count} test loan products.`)
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect())
