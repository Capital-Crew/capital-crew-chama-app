
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Checking for Stale Negative Data...')

    // 1. Check Loans (Snapshots)
    const loans = await prisma.loan.findMany({
        where: {
            // Check for negative shares snapshot
            memberSharesAtApplication: { lt: 0 }
        },
        select: {
            id: true,
            loanApplicationNumber: true,
            memberSharesAtApplication: true,
            status: true
        }
    })

    console.log(`Found ${loans.length} loans with negative member shares snapshot.`)
    if (loans.length > 0) {
        console.table(loans)
    }

    // 2. Check Member fields (if any cached)
    // Based on schema review, we'll see if Member has 'shareContributions' or similar
    // For now just dump one member to see values
    const member = await prisma.member.findFirst()
    if (member) {
        console.log('Sample Member:', member)
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
