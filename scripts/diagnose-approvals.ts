import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function diagnoseApprovals() {
    console.log('=== APPROVALS DIAGNOSIS ===\n')

    // 1. Check total approval requests
    const totalRequests = await prisma.approvalRequest.count()
    console.log(`📊 Total Approval Requests: ${totalRequests}`)

    // 2. Check pending approval requests
    const pendingRequests = await prisma.approvalRequest.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' }
    })
    console.log(`⏳ Pending Approval Requests: ${pendingRequests.length}\n`)

    if (pendingRequests.length > 0) {
        console.log('📋 Pending Requests Details:\n')
        pendingRequests.forEach((req, index) => {
            console.log(`${index + 1}. ${req.type} - ${req.requesterName}`)
            console.log(`   ID: ${req.id}`)
            console.log(`   Reference: ${req.referenceTable} (${req.referenceId})`)
            console.log(`   Amount: ${req.amount ? `KES ${req.amount}` : 'N/A'}`)
            console.log(`   Required Permission: ${req.requiredPermission}`)
            console.log(`   Description: ${req.description}`)
            console.log(`   Created: ${req.createdAt}`)
            console.log('')
        })
    }

    // 3. Check loans pending approval
    const pendingLoans = await prisma.loan.findMany({
        where: { status: 'PENDING_APPROVAL' },
        select: {
            id: true,
            loanApplicationNumber: true,
            amount: true,
            status: true,
            member: {
                select: {
                    name: true,
                    memberNumber: true
                }
            }
        }
    })
    console.log(`🏦 Loans with PENDING_APPROVAL status: ${pendingLoans.length}`)

    if (pendingLoans.length > 0) {
        console.log('\n📋 Pending Loans:\n')
        pendingLoans.forEach((loan, index) => {
            console.log(`${index + 1}. ${loan.loanApplicationNumber} - ${loan.member.name}`)
            console.log(`   Amount: KES ${loan.amount}`)
            console.log(`   Status: ${loan.status}`)
            console.log('')
        })
    }

    // 4. Check if approval requests exist for pending loans
    console.log('\n🔍 Checking if ApprovalRequests exist for pending loans...\n')
    for (const loan of pendingLoans) {
        const approvalRequest = await prisma.approvalRequest.findFirst({
            where: {
                referenceId: loan.id,
                type: 'LOAN',
                status: 'PENDING'
            }
        })

        if (approvalRequest) {
            console.log(`✅ ${loan.loanApplicationNumber} - Has approval request (${approvalRequest.id})`)
        } else {
            console.log(`❌ ${loan.loanApplicationNumber} - MISSING approval request!`)
            console.log(`   → Need to create ApprovalRequest for loan ID: ${loan.id}`)
        }
    }

    // 5. Check members pending approval
    const pendingMembers = await prisma.member.findMany({
        where: { status: 'PENDING_APPROVAL' },
        select: {
            id: true,
            name: true,
            memberNumber: true,
            email: true,
            status: true
        }
    })
    console.log(`\n👥 Members with PENDING_APPROVAL status: ${pendingMembers.length}`)

    if (pendingMembers.length > 0) {
        console.log('\n📋 Pending Members:\n')
        pendingMembers.forEach((member, index) => {
            console.log(`${index + 1}. ${member.name} (${member.memberNumber})`)
            console.log(`   Email: ${member.email}`)
            console.log(`   Status: ${member.status}`)
            console.log('')
        })

        // Check if approval requests exist for pending members
        console.log('🔍 Checking if ApprovalRequests exist for pending members...\n')
        for (const member of pendingMembers) {
            const approvalRequest = await prisma.approvalRequest.findFirst({
                where: {
                    referenceId: member.id,
                    type: 'MEMBER',
                    status: 'PENDING'
                }
            })

            if (approvalRequest) {
                console.log(`✅ ${member.name} - Has approval request (${approvalRequest.id})`)
            } else {
                console.log(`❌ ${member.name} - MISSING approval request!`)
                console.log(`   → Need to create ApprovalRequest for member ID: ${member.id}`)
            }
        }
    }

    // 6. Summary
    console.log('\n=== SUMMARY ===')
    console.log(`Total ApprovalRequests in DB: ${totalRequests}`)
    console.log(`Pending ApprovalRequests: ${pendingRequests.length}`)
    console.log(`Loans awaiting approval: ${pendingLoans.length}`)
    console.log(`Members awaiting approval: ${pendingMembers.length}`)

    if (pendingRequests.length === 0 && (pendingLoans.length > 0 || pendingMembers.length > 0)) {
        console.log('\n⚠️  ISSUE DETECTED:')
        console.log('There are loans/members with PENDING_APPROVAL status,')
        console.log('but no corresponding ApprovalRequest records exist!')
        console.log('\nThis means the approval workflow was not triggered properly.')
    }

    await prisma.$disconnect()
}

diagnoseApprovals()
    .catch((error) => {
        console.error('Error:', error)
        process.exit(1)
    })
