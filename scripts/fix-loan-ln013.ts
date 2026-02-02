/**
 * Fix Loan LN013 - Populate Missing Fields and Generate Schedule
 * 
 * Root Cause: Loan was created without copying interestRate, durationMonths, 
 * and interestType from the loan product.
 */

import { db } from '../lib/db'
import { ScheduleGeneratorService } from '../lib/services/ScheduleGeneratorService'

async function fixLoanLN013() {
    console.log('🔧 Fixing Loan LN013\n')
    console.log('='.repeat(60))

    // 1. Find loan LN013
    const loan = await db.loan.findFirst({
        where: {
            loanApplicationNumber: 'LN013'
        },
        include: {
            loanProduct: true
        }
    })

    if (!loan) {
        console.log('❌ Loan LN013 not found')
        return
    }

    console.log('\n📋 CURRENT LOAN DATA')
    console.log('='.repeat(60))
    console.log(`Loan Number: ${loan.loanApplicationNumber}`)
    console.log(`Principal: KES ${Number(loan.amount).toLocaleString()}`)
    console.log(`Interest Rate: ${loan.interestRate ? Number(loan.interestRate) : 0}%`)
    console.log(`Installments (Duration): ${loan.installments} months`)

    if (!loan.loanProduct) {
        console.log('\n❌ Loan product not found. Cannot fix.')
        return
    }

    console.log('\n📊 LOAN PRODUCT DATA')
    console.log('='.repeat(60))
    console.log(`Product: ${loan.loanProduct.name}`)
    console.log(`Product Interest Rate Per Period: ${Number(loan.loanProduct.interestRatePerPeriod)}%`)
    console.log(`Product Interest Type: ${loan.loanProduct.interestType}`)
    console.log(`Product Max Repayment Terms: ${loan.loanProduct.maxRepaymentTerms} months`)

    // 2. Determine correct values
    // The loan product stores annual interest rate in interestRatePerPeriod
    const correctInterestRate = Number(loan.loanProduct.interestRatePerPeriod)
    const correctInterestType = loan.loanProduct.interestType

    // Use loan's installments if set, otherwise use 5 (from screenshot)
    const correctInstallments = loan.installments || 5

    console.log('\n✅ CORRECTED VALUES')
    console.log('='.repeat(60))
    console.log(`Interest Rate: ${correctInterestRate}%`)
    console.log(`Interest Type: ${correctInterestType}`)
    console.log(`Installments: ${correctInstallments} months`)

    // 3. Update loan with correct values
    console.log('\n🔄 Updating loan...')
    await db.loan.update({
        where: { id: loan.id },
        data: {
            interestRate: correctInterestRate,
            installments: correctInstallments
        }
    })
    console.log('✅ Loan updated')

    // 4. Generate repayment schedule
    console.log('\n📅 Generating repayment schedule...')

    const scheduleItems = ScheduleGeneratorService.generate(
        Number(loan.amount),
        correctInterestRate,
        correctInstallments,
        correctInterestType as 'FLAT' | 'DECLINING_BALANCE',
        loan.disbursementDate || new Date(),
        loan.id
    )

    // 5. Delete existing installments (if any) and create new ones
    await db.repaymentInstallment.deleteMany({
        where: { loanId: loan.id }
    })

    await db.repaymentInstallment.createMany({
        data: scheduleItems.map(item => ({
            ...item,
            loanId: loan.id
        }))
    })

    console.log(`✅ Created ${scheduleItems.length} repayment installments`)

    // 6. Display summary
    console.log('\n📊 SCHEDULE SUMMARY')
    console.log('='.repeat(60))

    const totalPrincipal = scheduleItems.reduce((sum, item) => sum + Number(item.principalDue), 0)
    const totalInterest = scheduleItems.reduce((sum, item) => sum + Number(item.interestDue), 0)

    console.log(`Total Principal: KES ${totalPrincipal.toLocaleString()}`)
    console.log(`Total Interest: KES ${totalInterest.toLocaleString()}`)
    console.log(`Total Payable: KES ${(totalPrincipal + totalInterest).toLocaleString()}`)

    console.log('\nFirst 3 installments:')
    scheduleItems.slice(0, 3).forEach((item, index) => {
        console.log(`  Month ${index + 1}: Principal KES ${Number(item.principalDue).toLocaleString()}, Interest KES ${Number(item.interestDue).toLocaleString()}`)
    })

    console.log('\n' + '='.repeat(60))
    console.log('✅ Loan LN013 fixed successfully!')
    console.log('   The loan now has the correct interest rate and repayment schedule.')
    console.log('='.repeat(60))
}

fixLoanLN013()
    .then(() => {
        console.log('\n✅ Fix complete')
        process.exit(0)
    })
    .catch((error) => {
        console.error('\n❌ Error:', error)
        process.exit(1)
    })
