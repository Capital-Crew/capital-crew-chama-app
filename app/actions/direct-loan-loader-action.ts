'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { getNextLoanNumber } from '@/lib/utils'
import { z } from 'zod'
import { withAudit } from '@/lib/with-audit'
import { AuditLogAction, LoanStatus, Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { RepaymentCalculator } from '@/lib/utils/repayment-calculator'
import { AccountingEngine } from '@/lib/accounting/AccountingEngine'
import { getSystemMappingsDict } from '@/app/actions/system-accounting'

const directLoanLoaderSchema = z.object({
    memberId: z.string().min(1, "Member is required"),
    loanProductId: z.string().min(1, "Loan Product is required"),
    amount: z.number().positive("Amount must be positive"),
    installments: z.number().int().positive().max(360, "Max 360 installments"),
    disbursementDate: z.string().min(1, "Disbursement date is required"),
})

export const directLoadLoan = withAudit(
    { actionType: AuditLogAction.LOAN_DISBURSED, domain: 'LOAN', apiRoute: '/api/admin/loans/direct-load' },
    async (ctx, data: unknown) => {
        ctx.beginStep('Validate Admin Session');
        const session = await auth()
        if (!session?.user) {
            ctx.setErrorCode('UNAUTHORIZED');
            throw new Error('Unauthorized')
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        })

        if (!['SYSTEM_ADMIN', 'CHAIRPERSON'].includes(user?.role || '')) {
            ctx.setErrorCode('FORBIDDEN');
            throw new Error('Forbidden: Only administrators can use this tool.')
        }
        ctx.endStep('Validate Admin Session');

        ctx.beginStep('Parse & Validate Payload');
        const result = directLoanLoaderSchema.safeParse(data)
        if (!result.success) {
            ctx.setErrorCode('INVALID_PAYLOAD');
            throw new Error('Invalid data: ' + result.error.issues[0].message)
        }
        const { memberId, loanProductId, amount, installments, disbursementDate } = result.data

        const [member, product] = await Promise.all([
            db.member.findUnique({ where: { id: memberId }, include: { wallet: true } }),
            db.loanProduct.findUnique({ where: { id: loanProductId } })
        ])

        if (!member) throw new Error('Member not found')
        if (!product) throw new Error('Loan Product not found')
        ctx.endStep('Parse & Validate Payload');

        ctx.beginStep('Atomic Loan Injection');
        try {
            const lastLoan = await db.loan.findFirst({
                orderBy: { loanApplicationNumber: 'desc' },
                select: { loanApplicationNumber: true }
            })
            const nextNumber = getNextLoanNumber(lastLoan?.loanApplicationNumber)
            const interestRate = parseFloat(product.interestRatePerPeriod?.toString() ?? '0')
            const disbDate = new Date(disbursementDate)
            const actorId = session.user.id!
            const actorName = session.user.name || 'Admin'

            const loan = await db.$transaction(async (tx) => {
                // STEP 1: Create the Loan record in ACTIVE status
                const newLoan = await tx.loan.create({
                    data: {
                        loanApplicationNumber: nextNumber,
                        memberId,
                        loanProductId,
                        amount,
                        installments,
                        disbursementDate: disbDate,
                        applicationDate: disbDate,
                        status: LoanStatus.ACTIVE,
                        interestRate,
                        interestRatePerMonth: interestRate, // store monthly rate
                        dueDate: new Date(new Date(disbDate).setMonth(disbDate.getMonth() + installments)),
                        approvalVotes: [],
                        memberContributionsAtApplication: 0,
                        grossQualifyingAmount: amount,
                        processingFee: 0,
                        insuranceFee: 0,
                        contributionDeduction: 0,
                        existingLoanOffset: 0,
                        totalDeductions: 0,
                        netDisbursementAmount: amount,
                    }
                })

                // STEP 2: Generate schedule using the product's interestType and amortizationType
                const interestType = (product.interestType as 'FLAT' | 'DECLINING_BALANCE') ?? 'DECLINING_BALANCE'
                const amortizationType = (product.amortizationType as 'EQUAL_INSTALLMENTS' | 'EQUAL_PRINCIPAL') ?? 'EQUAL_INSTALLMENTS'

                const scheduleData = RepaymentCalculator.generateSchedule(
                    newLoan.id,
                    {
                        principal: amount,
                        interestRatePerMonth: interestRate,
                        installments,
                        amortizationType,
                        interestType
                    },
                    disbDate
                )

                await tx.repaymentInstallment.createMany({
                    data: scheduleData.map(item => ({
                        ...item,
                        loanId: newLoan.id
                    }))
                })

                // STEP 3: Compute total outstanding (principal + all interest)
                // This is now purely via Ledger, no direct field update on Loan needed for authoritative balance
                // but we can call updateLoanBalance to ensure the 1.0 (read-only) cache is populated if we ever re-add it.
                const { LoanBalanceService } = await import('@/services/loan-balance')
                await LoanBalanceService.updateLoanBalance(newLoan.id, tx)

                // STEP 4: Balance B/F transaction entry
                await tx.loanTransaction.create({
                    data: {
                        loanId: newLoan.id,
                        type: 'DISBURSEMENT',
                        amount: new Prisma.Decimal(amount),
                        principalAmount: new Prisma.Decimal(amount),
                        description: `Balance B/F — Migrated existing loan`,
                        transactionDate: disbDate,
                        postedAt: disbDate,
                    }
                })

                // STEP 4: Post a GL Journal Entry (Debit Loan Portfolio, Credit Fund Source)
                // This ensures the accounting ledger reflects the loan correctly
                try {
                    const mappings = await getSystemMappingsDict()

                    const loanPortfolioAcc = mappings.EVENT_LOAN_DISBURSEMENT
                        ? await tx.ledgerAccount.findUnique({ where: { code: mappings.EVENT_LOAN_DISBURSEMENT } })
                        : null
                    const fundSourceAcc = mappings.CASH_ON_HAND
                        ? await tx.ledgerAccount.findUnique({ where: { code: mappings.CASH_ON_HAND } })
                        : null

                    if (loanPortfolioAcc && fundSourceAcc) {
                        await AccountingEngine.postJournalEntry({
                            transactionDate: disbDate,
                            referenceType: 'LOAN_DISBURSEMENT',
                            referenceId: newLoan.id,
                            description: `Balance B/F — Loan ${nextNumber}`,
                            lines: [
                                {
                                    accountId: loanPortfolioAcc.id,
                                    debitAmount: amount,
                                    creditAmount: 0,
                                    description: `Loan Portfolio — Balance B/F`
                                },
                                {
                                    accountId: fundSourceAcc.id,
                                    debitAmount: 0,
                                    creditAmount: amount,
                                    description: `Fund Source — Balance B/F`
                                }
                            ],
                            createdBy: actorId,
                            createdByName: actorName
                        }, tx)
                    }
                } catch (glError) {
                    // GL is best-effort for migration. The loan and schedule are the priority.
                    console.warn('[DirectLoanLoader] GL entry skipped:', glError)
                }

                // STEP 5: Create Loan Journey Events (mirrors normal disbursement)
                await tx.loanJourneyEvent.create({
                    data: {
                        loanId: newLoan.id,
                        eventType: 'LOAN_DISBURSED',
                        description: `Loan migrated via Direct Loader. Balance B/F: KES ${amount.toLocaleString()}`,
                        actorId,
                        actorName,
                    }
                })

                return newLoan
            }, {
                maxWait: 10000,
                timeout: 30000
            })

            ctx.captureAfter(loan);
            ctx.endStep('Atomic Loan Injection', { loanId: loan.id });

            revalidatePath('/loans')
            revalidatePath('/dashboard')
            revalidatePath('/accounts')
            return { success: true, loanId: loan.id, loanNumber: loan.loanApplicationNumber }

        } catch (error: any) {
            ctx.setErrorCode('TRANSACTION_FAILED');
            ctx.failStep('Atomic Loan Injection', error);
            throw new Error(`Failed to load loan: ${error.message}`)
        }
    }
)
