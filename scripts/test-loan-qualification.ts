
import { calculateLoanQualification } from '../app/sacco-settings-actions'
import prisma from '../lib/prisma'

async function main() {
    console.log('Running Loan Qualification Test...')

    // 1. Get a test member
    const member = await prisma.member.findFirst()

    if (!member) {
        console.error('No active member found to test with!')
        process.exit(1)
    }

    console.log(`Testing with Member: ${member.name} (${member.memberNumber})`)

    try {
        // 2. Run the calculation
        const result = await calculateLoanQualification(member.id, [], 10000)

        console.log('✅ Qualification Calculation Success!')
        console.log('Result:', result)

        console.log('Accounting Engine Mappings are correctly configured.')

    } catch (error: any) {
        console.error('❌ Qualification Calculation Failed!')
        console.error(error)

        if (error.message?.includes('System accounting mapping not configured')) {
            console.error('FAIL: The system mapping error persists.')
        }
        process.exit(1)
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
