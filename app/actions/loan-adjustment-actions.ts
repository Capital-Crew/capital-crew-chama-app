'use server'

import { db as prisma } from "@/lib/db"
import { auth } from "@/auth"
import { AdjustmentCategory } from "@/lib/types"
import { revalidatePath } from "next/cache"
import { SystemAccountType, Prisma, AuditLogAction } from "@prisma/client"
import { getLoanOutstandingBalance } from "@/lib/accounting/AccountingEngine"
import { LoanBalanceService } from "@/lib/services/LoanBalanceService"
import { withAudit } from "@/lib/with-audit"

export async function searchLoans(query: string) {
    if (!query) return []
    const rawQuery = query.trim()
    if (rawQuery.length < 1) return []

    const orConditions: any[] = []

    if (rawQuery.length >= 2) {
        orConditions.push({ loanApplicationNumber: { contains: rawQuery, mode: 'insensitive' } })
        orConditions.push({ member: { name: { contains: rawQuery, mode: 'insensitive' } } })
    }

    const numericPart = rawQuery.replace(/\D/g, '');

    if (numericPart.length > 0) {
        const numericValue = parseInt(numericPart, 10);
        if (!isNaN(numericValue)) {
            orConditions.push({ member: { memberNumber: numericValue } })
        }

        const paddedNumber = numericPart.padStart(3, '0');
        const canonicalId = `LN${paddedNumber}`;

        orConditions.push({ loanApplicationNumber: { equals: canonicalId, mode: 'insensitive' } })
        orConditions.push({ loanApplicationNumber: { contains: paddedNumber, mode: 'insensitive' } })
    }

    if (orConditions.length === 0) return []

    const loans = await prisma.loan.findMany({
        where: {
            OR: orConditions
        },
        select: {
            id: true,
            loanApplicationNumber: true,
            outstandingBalance: true,
            amount: true,
            member: {
                select: {
                    name: true,
                    memberNumber: true
                }
            },
            loanProduct: {
                select: {
                    name: true
                }
            },
            transactions: {
                orderBy: { postedAt: 'asc' }
            }
        },
        take: 5
    })

    const { processTransactions } = await import('@/lib/statementProcessor');

    const enrichedLoans = loans.map((loan) => {
        const rawTransactions = loan.transactions ? loan.transactions.map((tx: any) => ({
            ...tx,
            amount: Number(tx.amount),
            createdAt: tx.postedAt,
            type: tx.type
        })) : [];

        const mappedTransactions = rawTransactions.map((tx: any) => ({
            ...tx,
            type: tx.type === 'LOAN_DISBURSEMENT' || tx.type === 'DISBURSEMENT' ? 'DISBURSEMENT' :
                tx.type === 'LOAN_REPAYMENT' || tx.type === 'REPAYMENT' ? 'REPAYMENT' :
                    tx.type
        }));

        const statementRows = processTransactions(mappedTransactions as any[]);
        const statementBalance = statementRows.length > 0
            ? statementRows[statementRows.length - 1].runningBalance
            : 0;

        const finalBalance = mappedTransactions.length > 0 ? statementBalance : Number(loan.outstandingBalance || 0);

        return {
            id: loan.id,
            loanApplicationNumber: loan.loanApplicationNumber,
            outstandingBalance: finalBalance.toString(),
            member: loan.member,
            loanProduct: {
                name: loan.loanProduct.name,
                productName: loan.loanProduct.name
            }
        }
    })

    return enrichedLoans
}

export const postLoanAdjustment = withAudit(
    { actionType: AuditLogAction.LOAN_ADJUSTED, domain: 'LOAN', apiRoute: '/api/loans/adjust' },
    async (ctx, data: {
        loanId: string,
        adjustmentType: 'increase' | 'decrease',
        category: AdjustmentCategory,
        amount: number,
        description: string
    }) => {
        ctx.beginStep('Verify Authorization');
        const session = await auth()
        if (!session?.user) {
            ctx.setErrorCode('UNAUTHORIZED');
            throw new Error("Unauthorized")
        }

        const allowedRoles = ['SYSTEM_ADMIN', 'TREASURER', 'CHAIRPERSON']
        if (!allowedRoles.includes(session.user.role)) {
            ctx.setErrorCode('FORBIDDEN');
            throw new Error("Insufficient permissions. Only System Admin, Treasurer or Chairperson can post adjustments.")
        }

        const { loanId, adjustmentType, category, amount, description } = data
        if (amount <= 0) {
            ctx.setErrorCode('INVALID_AMOUNT');
            throw new Error("Amount must be positive")
        }

        ctx.beginStep('Validate Loan Record');
        const loan = await prisma.loan.findUnique({
            where: { id: loanId },
            include: { loanProduct: true }
        })

        if (!loan) {
            ctx.setErrorCode('LOAN_NOT_FOUND');
            throw new Error("Loan not found")
        }
        ctx.captureBefore('Loan', loan.id, loan);
        ctx.endStep('Validate Loan Record');

        ctx.beginStep('Resolve Accounting Configuration');
        const { getSystemMappingsDict } = await import('@/app/actions/system-accounting')
        const mappings = await getSystemMappingsDict()
        const getCode = (type: string) => mappings[type as SystemAccountType]

        const portfolioAcc = await prisma.ledgerAccount.findUnique({ where: { code: '1310' } })
        const interestAcc = await prisma.ledgerAccount.findUnique({ where: { code: '1320' } })

        let contraAccountCode = '4100'
        if (adjustmentType === 'increase') {
            switch (category) {
                case AdjustmentCategory.PENALTY:
                case AdjustmentCategory.BOUNCED_CHEQUE:
                    contraAccountCode = getCode('INCOME_LOAN_PENALTY') || '4100'
                    break;
                case AdjustmentCategory.LEGAL_FEE:
                case AdjustmentCategory.RECOVERY_COST:
                    contraAccountCode = getCode('INCOME_GENERAL_FEE') || '4100'
                    break;
                default:
                    contraAccountCode = '4100'
            }
        } else {
            contraAccountCode = '6000'
        }

        const targetAssetAccount = (category === AdjustmentCategory.INTEREST || category === AdjustmentCategory.PENALTY)
            ? interestAcc
            : portfolioAcc

        const contraAccount = await prisma.ledgerAccount.findUnique({ where: { code: contraAccountCode } })

        if (!targetAssetAccount || !contraAccount) {
            ctx.setErrorCode('ACCOUNT_MAPPING_MISSING');
            throw new Error(`Ledger accounts configuration error. Missing asset or contra account.`)
        }
        ctx.endStep('Resolve Accounting Configuration');

        try {
            ctx.beginStep('Post Adjustment Transaction');
            await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                const journal = await tx.ledgerTransaction.create({
                    data: {
                        transactionDate: new Date(),
                        totalAmount: amount,
                        description: `Manual Adjustment: ${description} (${category})`,
                        referenceType: 'MANUAL_ADJUSTMENT',
                        referenceId: loan.id,
                        createdBy: session.user.id || '',
                        ledgerEntries: {
                            create: adjustmentType === 'increase' ? [
                                {
                                    ledgerAccount: { connect: { id: targetAssetAccount.id } },
                                    debitAmount: amount,
                                    creditAmount: 0,
                                    description: `Manual Charge - ${loan.loanApplicationNumber} (${category})`
                                },
                                {
                                    ledgerAccount: { connect: { id: contraAccount.id } },
                                    debitAmount: 0,
                                    creditAmount: amount,
                                    description: `Accrued ${category} - ${loan.loanApplicationNumber}`
                                }
                            ] : [
                                {
                                    ledgerAccount: { connect: { id: contraAccount.id } },
                                    debitAmount: amount,
                                    creditAmount: 0,
                                    description: `Manual Waiver/Adjustment - ${loan.loanApplicationNumber}`
                                },
                                {
                                    ledgerAccount: { connect: { id: targetAssetAccount.id } },
                                    debitAmount: 0,
                                    creditAmount: amount,
                                    description: `Waiver Ref: ${loan.loanApplicationNumber}`
                                }
                            ]
                        }
                    }
                })

                await tx.loanTransaction.create({
                    data: {
                        loanId: loan.id,
                        type: adjustmentType === 'increase' ? (category === AdjustmentCategory.INTEREST ? 'INTEREST' : 'PENALTY') : 'WAIVER',
                        amount: amount,
                        description: description,
                        referenceId: journal.id,
                        postedAt: new Date(),
                        principalAmount: (adjustmentType === 'decrease' && targetAssetAccount.id === portfolioAcc?.id) ? amount : 0,
                        interestAmount: (targetAssetAccount.id === interestAcc?.id) ? amount : 0,
                        penaltyAmount: (adjustmentType === 'increase' && category === AdjustmentCategory.PENALTY) ? amount : 0,
                    }
                })

                const { LoanBalanceService } = await import('@/services/loan-balance')
                const verifiedBalance = await LoanBalanceService.updateLoanBalance(loan.id, tx)

                if (verifiedBalance.eq(0)) {
                    await tx.loan.update({
                        where: { id: loan.id },
                        data: {
                            status: 'CLEARED',
                            outstandingBalance: new Prisma.Decimal(0)
                        }
                    })

                    await tx.loanJourneyEvent.create({
                        data: {
                            loanId: loan.id,
                            eventType: 'LOAN_CLEARED',
                            description: `Loan cleared via adjustment: ${description}`,
                            actorId: session.user.id || 'SYSTEM',
                            actorName: session.user.name || 'System'
                        }
                    })
                }
            })
            ctx.endStep('Post Adjustment Transaction');

            const updatedLoan = await prisma.loan.findUnique({ where: { id: loanId } });
            if (updatedLoan) ctx.captureAfter(updatedLoan);

            revalidatePath('/admin/system')
            revalidatePath(`/loans/${loanId}`)
            return { success: true }
        } catch (error) {
            ctx.setErrorCode('ADJUSTMENT_FAILED');
            throw error;
        }
    }
);
