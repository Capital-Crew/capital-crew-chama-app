
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- DEBUG ACCOUNT TYPE ---')

    const mapping = await prisma.systemAccountingMapping.findUnique({
        where: { type: 'CONTRIBUTIONS' },
        include: { account: true }
    })

    if (!mapping) {
        console.log('No mapping found for CONTRIBUTIONS')
        return
    }

    console.log(`Mapping found for CONTRIBUTIONS -> Account Code: ${mapping.account.code}`)
    console.log(`Account ID: ${mapping.account.id}`)
    console.log(`Account Name: ${mapping.account.name}`)
    console.log(`Account Type: ${mapping.account.type}`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
