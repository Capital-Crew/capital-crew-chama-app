/**
 * Debug script to investigate why loan LN013 has zero interest in schedule
 */

import { db } from '../lib/db'
import { calculateLoanSchedule } from '../lib/services/loanCalculator'

async function debugLoanSchedule() {
    console.log('🔍 Investigating Loan LN013 Interest Issue\n')
    console.log('='.repeat(60))

    // Find loan LN013
    const loan = await db.loan.findFirst({
        where: {
            loanApplicationNumber: 'LN013'
        },
        include: {
            loanProduct: true,
            repaymentInstallments: {
                orderBy: { installmentNumber: 'asc' }
            }
        }
    })

    if (!loan) {
        console.log('❌ Loan LN013 not found')
        return
    }

    console.log('\n📋 LOAN DETAILS')
    console.log('='.repeat(60))
    console.log(`Loan Number: ${loan.loanApplicationNumber}`)
    console.log(`Product: ${loan.loanProduct?.name || 'N/A'}`)
    console.log(`Principal: KES ${Number(loan.amount).toLocaleString()}`)
    console.log(`Interest Rate: ${Number(loan.interestRate)}%`)
    console.log(`Duration: ${loan.durationMonths} months`)
    console.log(`Interest Type: ${loan.interestType}`)
    console.log(`Disbursement Date: ${loan.disbursementDate}`)
    console.log(`Status: ${loan.status}`)

    console.log('\n📊 LOAN PRODUCT DETAILS')
    console.log('='.repeat(60))
    if (loan.loanProduct) {
        console.log(`Product Name: ${loan.loanProduct.name}`)
        console.log(`Product Interest Rate: ${Number(loan.loanProduct.interestRate)}%`)
        console.log(`Product Interest Type: ${loan.loanProduct.interestType}`)
        console.log(`Product Max Duration: ${loan.loanProduct.maxDuration} months`)
    }

    console.log('\n🔢 REPAYMENT INSTALLMENTS FROM DATABASE')
    console.log('='.repeat(60))
    if (loan.repaymentInstallments && loan.repaymentInstallments.length > 0) {
        console.log(`Total Installments: ${loan.repaymentInstallments.length}\n`)

        loan.repaymentInstallments.forEach((inst, index) => {
            if (index < 3 || index === loan.repaymentInstallments.length - 1) {
                console.log(`Month ${inst.installmentNumber}:`)
                console.log(`  Due Date: ${inst.dueDate.toISOString().split('T')[0]}`)
                console.log(`  Principal Due: KES ${Number(inst.principalDue).toLocaleString()}`)
                console.log(`  Interest Due: KES ${Number(inst.interestDue).toLocaleString()}`)
                console.log(`  Total: KES ${(Number(inst.principalDue) + Number(inst.interestDue)).toLocaleString()}`)
                console.log('')
            } else if (index === 3) {
                console.log('  ...\n')
            }
        })

        // Calculate totals
        const totalPrincipal = loan.repaymentInstallments.reduce((sum, inst) => sum + Number(inst.principalDue), 0)
        const totalInterest = loan.repaymentInstallments.reduce((sum, inst) => sum + Number(inst.interestDue), 0)

        console.log('TOTALS:')
        console.log(`  Total Principal: KES ${totalPrincipal.toLocaleString()}`)
        console.log(`  Total Interest: KES ${totalInterest.toLocaleString()}`)
        console.log(`  Total Payable: KES ${(totalPrincipal + totalInterest).toLocaleString()}`)
    } else {
        console.log('⚠️  No repayment installments found in database')
    }

    console.log('\n🧮 RECALCULATED SCHEDULE (Using Loan Calculator)')
    console.log('='.repeat(60))

    const recalculated = calculateLoanSchedule({
        principal: Number(loan.amount),
        annualInterestRate: Number(loan.interestRate),
        durationMonths: loan.durationMonths,
        interestType: loan.interestType as 'FLAT' | 'DECLINING_BALANCE',
        startDate: loan.disbursementDate || new Date()
    })

    console.log(`Monthly Payment: KES ${recalculated.summary.monthlyPaymentAmount.toLocaleString()}`)
    console.log(`Total Interest: KES ${recalculated.summary.totalInterest.toLocaleString()}`)
    console.log(`Total Payable: KES ${recalculated.summary.totalPayable.toLocaleString()}\n`)

    console.log('First 3 months:')
    recalculated.schedule.slice(0, 3).forEach(item => {
        console.log(`Month ${item.monthNo}:`)
        console.log(`  Principal: KES ${item.principalPayment.toLocaleString()}`)
        console.log(`  Interest: KES ${item.interestPayment.toLocaleString()}`)
        console.log(`  Total: KES ${item.totalPayment.toLocaleString()}`)
        console.log('')
    })

    console.log('\n🔍 DIAGNOSIS')
    console.log('='.repeat(60))

    if (Number(loan.interestRate) === 0) {
        console.log('❌ ISSUE FOUND: Loan interest rate is 0%')
        console.log('   This is why the schedule shows zero interest.')
        console.log('   The loan product has an interest rate, but the loan itself does not.')
    } else if (recalculated.summary.totalInterest > 0 && loan.repaymentInstallments.every(inst => Number(inst.interestDue) === 0)) {
        console.log('❌ ISSUE FOUND: Loan has interest rate but installments show zero interest')
        console.log('   The schedule needs to be regenerated.')
    } else if (recalculated.summary.totalInterest === 0) {
        console.log('⚠️  Calculator also returns zero interest')
        console.log('   Check if interest type or rate is correct.')
    } else {
        console.log('✅ Loan data appears correct')
        console.log('   Interest should be showing in the schedule.')
    }

    console.log('\n' + '='.repeat(60))
}

debugLoanSchedule()
    .then(() => {
        console.log('\n✅ Debug complete')
        process.exit(0)
    })
    .catch((error) => {
        console.error('❌ Error:', error)
        process.exit(1)
    })
