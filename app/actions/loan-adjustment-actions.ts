'use server'

import { db as prisma } from "@/lib/db"
import { auth } from "@/auth"
import { AdjustmentCategory } from "@/lib/types"
import { revalidatePath } from "next/cache"
import { SystemAccountType, Prisma } from "@prisma/client"
import { getLoanOutstandingBalance } from "@/lib/accounting/AccountingEngine"
import { LoanBalanceService } from "@/lib/services/LoanBalanceService"

export async function searchLoans(query: string) {
    if (!query) return []
    const rawQuery = query.trim()
    if (rawQuery.length < 1) return [] // Allow shorter queries if just number

    const orConditions: any[] = []

    // 1. Text Search (Standard)
    // Always search for literal matches in Name or AppNumber
    if (rawQuery.length >= 2) {
        orConditions.push({ loanApplicationNumber: { contains: rawQuery, mode: 'insensitive' } })
        orConditions.push({ member: { name: { contains: rawQuery, mode: 'insensitive' } } })
    }

    // 2. Smart ID Generation (The "Auto-Pad" Logic)
    // Strip non-numeric to find the "intent" number
    const numericPart = rawQuery.replace(/\D/g, '');

    if (numericPart.length > 0) {
        // User typed some numbers (e.g. "5", "LN 5", "005")

        // A. Search by exact Member Number (if it matches the number)
        const numericValue = parseInt(numericPart, 10);
        if (!isNaN(numericValue)) {
            orConditions.push({ member: { memberNumber: numericValue } })
        }

        // B. Generate Canonical Loan ID (LN + 3 digits)
        // If user typed "5" -> "005" -> "LN005"
        const paddedNumber = numericPart.padStart(3, '0');
        const canonicalId = `LN${paddedNumber}`;

        // Add to search
        orConditions.push({ loanApplicationNumber: { equals: canonicalId, mode: 'insensitive' } })

        // C. Fallback: Search for the padded sequence anywhere (e.g. matches "LN-005" or "LN 005")
        // This is robust against format variations
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
            outstandingBalance: true, // Keep for fallback/reference
            amount: true, // Needed for parsing
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
            transactions: { // Fetch transactions
                orderBy: { postedAt: 'asc' }
            }
        },
        take: 5
    })

    // Import statement processor for consistent balance calculation
    const { processTransactions } = await import('@/lib/statementProcessor');

    // 3. ENRICH WITH REAL-TIME BALANCE FROM TRANSACTIONS
    const enrichedLoans = loans.map((loan) => {
        // Map LoanTransaction to structure expected by processTransactions
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

        // Fallback: If no transactions (e.g. legacy/migration), use DB outstandingBalance
        // If transactions exist, statementBalance is the truth.
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

export async function postLoanAdjustment(data: {
    loanId: string,
    adjustmentType: 'increase' | 'decrease',
    category: AdjustmentCategory,
    amount: number,
    description: string
}) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    const allowedRoles = ['SYSTEM_ADMIN', 'TREASURER', 'CHAIRPERSON']
    if (!allowedRoles.includes(session.user.role)) {
        throw new Error("Insufficient permissions. Only System Admin, Treasurer or Chairperson can post adjustments.")
    }

    const { loanId, adjustmentType, category, amount, description } = data

    if (amount <= 0) throw new Error("Amount must be positive")

    const loan = await prisma.loan.findUnique({
        where: { id: loanId },
        include: { loanProduct: true }
    })

    if (!loan) throw new Error("Loan not found")

    // ACCOUNTING ENGINE LOGIC
    // We need to fetch the Accounting Engine or Account IDs
    const { getSystemMappingsDict } = await import('@/app/actions/system-accounting')
    const mappings = await getSystemMappingsDict()

    // Helper to get account code
    const getCode = (type: string) => mappings[type as SystemAccountType]

    // Determine Accounts
    // Use the correctly mapped Asset accounts instead of hardcoded Equity (1200)
    const portfolioAcc = await prisma.ledgerAccount.findUnique({ where: { code: '1310' } })
    const interestAcc = await prisma.ledgerAccount.findUnique({ where: { code: '1320' } })
    const incomeAcc = await prisma.ledgerAccount.findUnique({ where: { code: '4100' } })

    let contraAccountCode = '4100'

    if (adjustmentType === 'increase') {
        // CHARGE/PENALTY -> Credit Income, Debit Asset
        // Map category to System Account Type
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
        // WAIVER/DECREASE -> Debit Expense (Waiver Expense), Credit Asset
        contraAccountCode = '6000'
    }

    // Determine target Loan Asset account
    // Principal adjustments should hit 1310, Interest should hit 1320
    const targetAssetAccount = (category === AdjustmentCategory.INTEREST || category === AdjustmentCategory.PENALTY)
        ? interestAcc
        : portfolioAcc

    const contraAccount = await prisma.ledgerAccount.findUnique({ where: { code: contraAccountCode } })

    if (!targetAssetAccount || !contraAccount) {
        throw new Error(`Ledger accounts configuration error. Missing asset or contra account.`)
    }

    // 3. Post Journal Entry
    // INCREASE: Debit Loan (Asset), Credit Income
    // DECREASE: Debit Expense (Waiver), Credit Loan (Asset)

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Create ledger transaction
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
                            // Debit Loan Asset
                            ledgerAccount: { connect: { id: targetAssetAccount.id } },
                            debitAmount: amount,
                            creditAmount: 0,
                            description: `Manual Charge - ${loan.loanApplicationNumber} (${category})`
                        },
                        {
                            // Credit Income
                            ledgerAccount: { connect: { id: contraAccount.id } },
                            debitAmount: 0,
                            creditAmount: amount,
                            description: `Accrued ${category} - ${loan.loanApplicationNumber}`
                        }
                    ] : [
                        {
                            // Debit Expense (Waiver)
                            ledgerAccount: { connect: { id: contraAccount.id } },
                            debitAmount: amount,
                            creditAmount: 0,
                            description: `Manual Waiver/Adjustment - ${loan.loanApplicationNumber}`
                        },
                        {
                            // Credit Loan Asset (Reduce Asset)
                            ledgerAccount: { connect: { id: targetAssetAccount.id } },
                            debitAmount: 0,
                            creditAmount: amount,
                            description: `Waiver Ref: ${loan.loanApplicationNumber}`
                        }
                    ]
                }
            }
        })

        // Create LoanTransaction sub-ledger record for statement visibility
        await tx.loanTransaction.create({
            data: {
                loanId: loan.id,
                type: adjustmentType === 'increase' ? (category === AdjustmentCategory.INTEREST ? 'INTEREST' : 'PENALTY') : 'WAIVER',
                amount: amount,
                description: description,
                referenceId: journal.id,
                postedAt: new Date(),
                // Breakdown
                principalAmount: (adjustmentType === 'decrease' && targetAssetAccount.id === portfolioAcc?.id) ? amount : 0,
                interestAmount: (targetAssetAccount.id === interestAcc?.id) ? amount : 0,
                penaltyAmount: (adjustmentType === 'increase' && category === AdjustmentCategory.PENALTY) ? amount : 0,
            }
        })

        // ✅ FIX: Use LoanBalanceService to calculate from transaction history
        const { LoanBalanceService } = await import('@/services/loan-balance')
        const verifiedBalance = await LoanBalanceService.updateLoanBalance(loan.id, tx)

        // ✅ FIX: Check if loan should be cleared (exact zero check)
        if (verifiedBalance.eq(0)) {
            await tx.loan.update({
                where: { id: loan.id },
                data: {
                    status: 'CLEARED',
                    outstandingBalance: new Prisma.Decimal(0)
                }
            })

            // Log clearance event
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

    revalidatePath('/admin/system')
    revalidatePath(`/loans/${loanId}`)
    return { success: true }
}
