import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createMissingApprovalRequests() {
    console.log('=== CREATING MISSING APPROVAL REQUESTS ===\n')

    // 1. Find loans with PENDING_APPROVAL status
    const pendingLoans = await prisma.loan.findMany({
        where: { status: 'PENDING_APPROVAL' },
        include: {
            member: {
                select: {
                    id: true,
                    name: true,
                    memberNumber: true
                }
            },
            loanProduct: {
                select: {
                    name: true
                }
            }
        }
    })

    console.log(`Found ${pendingLoans.length} loans with PENDING_APPROVAL status\n`)

    for (const loan of pendingLoans) {
        // Check if approval request already exists
        const existingRequest = await prisma.approvalRequest.findFirst({
            where: {
                referenceId: loan.id,
                type: 'LOAN',
                status: 'PENDING'
            }
        })

        if (existingRequest) {
            console.log(`✓ ${loan.loanApplicationNumber} - Already has approval request`)
            continue
        }

        // Create approval request
        try {
            const approvalRequest = await prisma.approvalRequest.create({
                data: {
                    type: 'LOAN',
                    referenceId: loan.id,
                    referenceTable: 'Loan',
                    requesterId: loan.memberId,
                    requesterName: loan.member.name,
                    description: `${loan.loanProduct.name} - ${loan.member.name} (${loan.member.memberNumber})`,
                    amount: loan.amount,
                    status: 'PENDING',
                    requiredPermission: 'APPROVE_LOANS'
                }
            })

            console.log(`✅ Created approval request for ${loan.loanApplicationNumber}`)
            console.log(`   Request ID: ${approvalRequest.id}`)
            console.log(`   Amount: KES ${loan.amount}`)
            console.log(`   Member: ${loan.member.name}\n`)
        } catch (error) {
            console.error(`❌ Failed to create approval request for ${loan.loanApplicationNumber}:`, error)
        }
    }

    console.log('\n=== DONE ===')
    await prisma.$disconnect()
}

createMissingApprovalRequests()
    .catch((error) => {
        console.error('Error:', error)
        process.exit(1)
    })
