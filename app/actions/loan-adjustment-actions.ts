'use server'

import { db as prisma } from "@/lib/db"
import { auth } from "@/auth"
import { AdjustmentCategory } from "@/lib/types"
import { revalidatePath } from "next/cache"
import { SystemAccountType, Prisma, AuditLogAction } from "@prisma/client"
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

        const finalBalance = mappedTransactions.length > 0 ? statementBalance : 0;

        return {
            id: loan.id,
            loanApplicationNumber: loan.loanApplicationNumber,
            outstandingBalance: finalBalance.toString(),
            member: loan.member,
            loanProduct: {
                name: loan.loanProduct?.name || 'Standard Loan',
                productName: loan.loanProduct?.name || 'Standard Loan'
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
        description: string,
        transactionDate?: Date
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

        const { loanId, adjustmentType, category, amount, description, transactionDate } = data
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

        const effectiveDate = transactionDate ? new Date(transactionDate) : new Date();
        const isBackdated = transactionDate && new Date(transactionDate).getTime() < (new Date().getTime() - 1000 * 60 * 60); // More than 1 hour ago

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
                    contraAccountCode = getCode('REVENUE_LOAN_PENALTY') || '4012'
                    break;
                case AdjustmentCategory.LEGAL_FEE:
                case AdjustmentCategory.RECOVERY_COST:
                    contraAccountCode = getCode('REVENUE_GENERAL_FEE') || '4021'
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
                // 1. Create Ledger Transaction
                const journal = await tx.ledgerTransaction.create({
                    data: {
                        transactionDate: effectiveDate,
                        totalAmount: amount,
                        description: `${isBackdated ? '[BACKDATED] ' : ''}Manual Adjustment: ${description} (${category})`,
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
                                ...(adjustmentType === 'decrease' && !isBackdated ? [
                                    // These will be calculated/added later by waterfall if NOT backdated
                                    // (Actually we placeholder them if we didn't use TransactionReplayService)
                                ] : [])
                            ]
                        }
                    }
                })

                // Note: Replay and Transaction creation is consolidated below to avoid double-posting

                // Standard Flow (or Backdated but we calculate allocation manually for ledger)
                let allocation = {
                    penalty: 0,
                    interest: 0,
                    principal: 0,
                    overpayment: 0
                };

                if (adjustmentType === 'decrease') {
                    // Use Waterfall Allocation for waivers
                    const { WaterfallAllocation } = await import('@/lib/strategies/waterfall-allocation');
                    // Important: Waterfall should use the state AS OF the effective date if backdated.
                    // But for now, we use the current state and then let Replay re-adjust if needed.
                    // Actually, if we use WaterfallAllocation now, it creates the credit ledger entries.
                    allocation = await WaterfallAllocation.allocate(loan.id, amount, tx, {
                        type: 'WAIVER',
                        description: `Waiver Adjustment: ${description}`,
                        postedAt: effectiveDate,
                        referenceId: journal.id
                    });

                    // --- Restore Ledger Entries based on allocation ---
                    // The LedgerTransaction was created with only the DEBIT. We need to add the CREDITS now.
                    if (allocation.penalty > 0) {
                        await tx.ledgerEntry.create({
                            data: {
                                ledgerTransactionId: journal.id,
                                ledgerAccountId: (await tx.ledgerAccount.findUnique({ where: { code: mappings.RECEIVABLE_LOAN_PENALTY || '1320' } }))!.id,
                                debitAmount: 0,
                                creditAmount: allocation.penalty,
                                description: `Waiver Applied: Penalty - ${loan.loanApplicationNumber}`
                            }
                        });
                    }
                    if (allocation.interest > 0) {
                        await tx.ledgerEntry.create({
                            data: {
                                ledgerTransactionId: journal.id,
                                ledgerAccountId: interestAcc!.id,
                                debitAmount: 0,
                                creditAmount: allocation.interest,
                                description: `Waiver Applied: Interest - ${loan.loanApplicationNumber}`
                            }
                        });
                    }
                    if (allocation.principal > 0) {
                        await tx.ledgerEntry.create({
                            data: {
                                ledgerTransactionId: journal.id,
                                ledgerAccountId: portfolioAcc!.id,
                                debitAmount: 0,
                                creditAmount: allocation.principal,
                                description: `Waiver Applied: Principal - ${loan.loanApplicationNumber}`
                            }
                        });
                    }
                } else {
                    // Increase Adjustment
                    await tx.loanTransaction.create({
                        data: {
                            loanId: loan.id,
                            type: category === AdjustmentCategory.INTEREST ? 'INTEREST' : 'PENALTY',
                            amount: amount,
                            description: description,
                            referenceId: journal.id,
                            postedAt: effectiveDate,
                            transactionDate: effectiveDate,
                            principalAmount: 0,
                            interestAmount: (targetAssetAccount.id === interestAcc?.id) ? amount : 0,
                            penaltyAmount: (category === AdjustmentCategory.PENALTY) ? amount : 0,
                        }
                    })
                    
                    const { LoanBalanceService } = await import('@/services/loan-balance')
                    await LoanBalanceService.updateLoanBalance(loan.id, tx)
                }

                if (isBackdated) {
                    const { TransactionReplayService } = await import('@/lib/services/TransactionReplayService');
                    await TransactionReplayService.replayTransactions(loan.id, effectiveDate, tx);
                }

                const { getLoanPrincipalBalance, getLoanInterestBalance, getLoanPenaltyBalance, getLoanFeeBalance } =
                    await import('@/lib/accounting/AccountingEngine');
                const p = await getLoanPrincipalBalance(loan.id);
                const i = await getLoanInterestBalance(loan.id);
                const pen = await getLoanPenaltyBalance(loan.id);
                const f = await getLoanFeeBalance(loan.id);
                const currentBalance = p + i + pen + f;

                if (currentBalance <= 0.01) {
                    await tx.loan.update({
                        where: { id: loan.id },
                        data: {
                            status: 'CLEARED'
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
            }, {
                maxWait: 10000,
                timeout: 60000
            })

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
