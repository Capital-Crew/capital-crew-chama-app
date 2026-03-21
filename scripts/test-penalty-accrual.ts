import { PrismaClient } from '@prisma/client'
import { PenaltyService } from '../services/penalty-engine'
import { subDays, addDays } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
    console.log("===============================================")
    console.log("🧪 TESTING PENALTY ACCRUAL FOR OVERDUE LOANS")
    console.log("===============================================")

    // 1. Find a suitable active loan to test with, or create one if none exist
    let loan = await prisma.loan.findFirst({
        where: {
            status: 'ACTIVE',
            repaymentInstallments: {
                some: {
                    isFullyPaid: false
                }
            }
        },
        include: {
            repaymentInstallments: {
                where: { isFullyPaid: false },
                orderBy: { dueDate: 'asc' },
                take: 1
            }
        }
    })

    if (!loan || loan.repaymentInstallments.length === 0) {
        console.error("❌ No suitable active loan found with unpaid installments. Please ensure there is at least one active loan.")
        process.exit(1)
    }

    const targetInstallment = loan.repaymentInstallments[0]
    const originalDueDate = targetInstallment.dueDate

    console.log(`📌 Selected Loan ID: ${loan.id}`)
    console.log(`📌 Target Installment #: ${targetInstallment.installmentNumber}`)
    console.log(`📌 Installment Principal Due: ${targetInstallment.principalDue}`)
    console.log(`📌 Installment Interest Due: ${targetInstallment.interestDue}`)
    console.log(`📌 Current Penalty Due: ${targetInstallment.penaltyDue}`)
    console.log(`📌 Original Due Date: ${originalDueDate}`)

    // 2. Modify the installment's due date to be strictly past (e.g., 1 day ago)
    const newDueDate = subDays(new Date(), 1)
    console.log(`\n🕒 TIME TRAVEL: Changing Due Date to ${newDueDate.toISOString()} (1 day ago, strictly past due) and resetting penalty...`)

    await prisma.repaymentInstallment.update({
        where: { id: targetInstallment.id },
        data: { dueDate: newDueDate, penaltyDue: 0 }
    })

    console.log(`✅ Due Date and penalty updated successfully.`)

    // 3. Run the Penalty Engine
    console.log(`\n⚙️ Running Penalty Engine...`)
    const results = await PenaltyService.runDailyCheck()

    console.log(`\n📊 Penalty Engine Results:`, results)

    // 4. Verify the penalty was applied
    const updatedInstallment = await prisma.repaymentInstallment.findUnique({
        where: { id: targetInstallment.id }
    })

    if (!updatedInstallment) {
        console.error("❌ Failed to fetch updated installment.")
        process.exit(1)
    }

    console.log(`\n🔍 Verification:`)
    console.log(`📌 Updated Penalty Due: ${updatedInstallment.penaltyDue}`)

    const hasPenalty = Number(updatedInstallment.penaltyDue) > 0

    if (hasPenalty) {
        console.log(`✅ TEST PASSED: Penalty correctly accrued to ${updatedInstallment.penaltyDue}`)
    } else {
        console.log(`❌ TEST FAILED: Penalty was not accrued.`)
    }

    // 5. Cleanup: Revert the due date and penalty
    console.log(`\n🧹 Cleaning up... Reverting Date and Penalty to original state.`)
    
    // Reverse changes
    // If the penalty was successfully accrued during this test, we need to completely revert what it did
    // The engine adds penaltyAmount based on due amounts to penaltyDue, and increments `current_balance` and `penalties`
    // We want to revert `penaltyDue` back to `targetInstallment.penaltyDue`, and subtract the *difference* in penalty from the balances
    const penaltyAppliedDuringTest = Number(updatedInstallment.penaltyDue)
    
    await prisma.$transaction([
        prisma.repaymentInstallment.update({
            where: { id: targetInstallment.id },
            data: {
                dueDate: originalDueDate,
                penaltyDue: targetInstallment.penaltyDue // restore original
            }
        }),
        prisma.loan.update({
            where: { id: loan.id },
            data: {
                current_balance: { decrement: penaltyAppliedDuringTest },
                penalties: { decrement: penaltyAppliedDuringTest }
            }
        }),
        // Also delete any loan journey events and journal entries for 'PENALTY_APPLIED'
        prisma.loanJourneyEvent.deleteMany({
            where: {
                loanId: loan.id,
                eventType: 'PENALTY_APPLIED'
            }
        })
    ])

    console.log(`✅ Cleanup complete.`)
}

main()
    .catch(e => {
        console.error("Unhandled error:", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
