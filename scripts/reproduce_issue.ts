
import { db } from '@/lib/db'
import { TransactionReplayService } from '@/lib/services/TransactionReplayService'
import { v4 as uuidv4 } from 'uuid'

async function main() {
    console.log('Starting reproduction script...')

    const userId = uuidv4()
    const memberId = uuidv4()
    const loanId = uuidv4()

    try {
        console.log('Creating test data...')

        await db.member.create({
            data: {
                id: memberId,
                name: 'Reproduction User',
                email: `repro-${uuidv4()}@example.com`,
                phone: `+254${Math.floor(Math.random() * 1000000000)}`,
                registrationDate: new Date(),
                status: 'ACTIVE',
                memberNo: `M-${Math.floor(Math.random() * 10000)}`
            }
        })

        await db.loan.create({
            data: {
                id: loanId,
                memberId: memberId,
                loanProduct: 'EMERGENCY',
                appliedAmount: 100000,
                principal: 100000,
                interestRate: 10,
                status: 'ACTIVE',
                applicationDate: new Date(),
                approvalDate: new Date(),
                disbursementDate: new Date(),
                repaymentPeriod: 12,
                repaymentFrequency: 'MONTHLY'
            }
        })

        console.log(`Created Loan ${loanId}`)

        console.log('Creating installments...')
        for (let i = 1; i <= 12; i++) {
            await db.repaymentInstallment.create({
                data: {
                    loanId,
                    installmentNumber: i,
                    dueDate: new Date(new Date().setMonth(new Date().getMonth() + i)),
                    principalDue: 8333.33,
                    interestDue: 833.33,
                    feeDue: 0,
                    penaltyDue: 0,
                    isFullyPaid: false
                }
            })
        }

        const txCount = 100
        console.log(`Creating ${txCount} transactions to stress the loop...`)

        for (let i = 0; i < txCount; i++) {
            await db.loanTransaction.create({
                data: {
                    loanId,
                    type: 'REPAYMENT',
                    amount: 1000,
                    description: `Payment ${i}`,
                    postedAt: new Date(new Date().setDate(new Date().getDate() + i)),
                    principalAmount: 0,
                    interestAmount: 0,
                    feeAmount: 0,
                    penaltyAmount: 0
                }
            })
        }

        console.log(`Created ${txCount} transactions. Starting Replay...`)

        const startTime = Date.now()

        // 4. Trigger Replay directly
        await db.$transaction(async (tx) => {
            const result = await TransactionReplayService.replayTransactions(loanId, undefined, tx)
            console.log('Replay Result:', result)
        }, {
            timeout: 10000 // 10s timeout should be PLENTY now
        })

        const endTime = Date.now()
        console.log(`Replay completed in ${(endTime - startTime) / 1000}s`)

    } catch (e: any) {
        console.error('Reproduction Failed (Expected if not fixed, Unexpected if fixed):', e)
        if (e.code) console.log('Error Code:', e.code)
    } finally {
        // Cleanup with robust error handling
        console.log('Cleaning up...')
        try { await db.loanTransaction.deleteMany({ where: { loanId } }) } catch (e) { console.error('Failed cleanup txs', e) }
        try { await db.repaymentInstallment.deleteMany({ where: { loanId } }) } catch (e) { console.error('Failed cleanup installments', e) }
        try { await db.loan.delete({ where: { id: loanId } }) } catch (e) { console.error('Failed cleanup loan', e) }
        try { await db.member.delete({ where: { id: memberId } }) } catch (e) { console.error('Failed cleanup member', e) }
    }
}

main()
