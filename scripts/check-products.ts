import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
async function main() {
    const products = await db.loanProduct.findMany({ orderBy: { name: 'asc' } })
    console.log(`\nLoan Products (${products.length} total):`)
    products.forEach(p => {
        console.log(`  [${p.id}] ${p.name} | Rate: ${p.interestRate}% | Amort: ${p.amortizationType}`)
    })

    const loan = await db.loan.findFirst({
        where: { loanApplicationNumber: 'LN001' },
        select: { id: true, amount: true, installments: true, interestRate: true, loanProductId: true, disbursementDate: true, loanProduct: true }
    })
    if (loan) {
        console.log(`\nLN001 details:`)
        console.log(`  Product ID:   ${loan.loanProductId}`)
        console.log(`  Product Name: ${loan.loanProduct?.name}`)
        console.log(`  Stored Rate:  ${loan.interestRate}%`)
        console.log(`  Product Rate: ${loan.loanProduct?.interestRate}%`)
    }
}
main().catch(e => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
