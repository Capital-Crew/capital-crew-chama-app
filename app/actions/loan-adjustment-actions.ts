'use server'

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { AdjustmentCategory } from "@/lib/types"
import { revalidatePath } from "next/cache"
import { SystemAccountType, Prisma } from "@prisma/client"

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
            outstandingBalance: true,
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
            }
        },
        take: 5
    })

    return loans
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
    const loanPortfolioCode = '1200'

    // 2. Contra Account (Income or Expense)
    let contraAccountCode = '4000' // Default Income

    if (adjustmentType === 'increase') {
        // CHARGE/PENALTY -> Credit Income
        // Map category to System Account Type
        switch (category) {
            case AdjustmentCategory.PENALTY:
            case AdjustmentCategory.BOUNCED_CHEQUE:
                contraAccountCode = getCode('INCOME_LOAN_PENALTY') || '4000'
                break;
            case AdjustmentCategory.LEGAL_FEE:
            case AdjustmentCategory.RECOVERY_COST:
                contraAccountCode = getCode('INCOME_GENERAL_FEE') || '4000'
                break;
            default:
                contraAccountCode = '4000'
        }
    } else {
        // WAIVER/DECREASE -> Debit Expense (Waiver Expense)
        contraAccountCode = '6000' // General Expense for now unless specific Waiver account
    }

    // Find Accounts IDs
    const loanAccount = await prisma.ledgerAccount.findUnique({ where: { code: loanPortfolioCode } })
    const contraAccount = await prisma.ledgerAccount.findUnique({ where: { code: contraAccountCode } })

    if (!loanAccount || !contraAccount) {
        throw new Error(`Ledger accounts configuration error. Missing ${loanPortfolioCode} or ${contraAccountCode}`)
    }

    // 3. Post Journal Entry
    // INCREASE: Debit Loan (Asset), Credit Income
    // DECREASE: Debit Expense (Waiver), Credit Loan (Asset)

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Update Loan Balance
        const newBalance = adjustmentType === 'increase'
            ? Number(loan.outstandingBalance) + amount
            : Number(loan.outstandingBalance) - amount

        await tx.loan.update({
            where: { id: loan.id },
            data: {
                outstandingBalance: newBalance
            }
        })

        // Create Transaction Record
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
                            // Debit Loan
                            ledgerAccount: { connect: { id: loanAccount.id } },
                            debitAmount: amount,
                            creditAmount: 0,
                            description: `Loan Check - ${loan.loanApplicationNumber}`
                        },
                        {
                            // Credit Income
                            ledgerAccount: { connect: { id: contraAccount.id } },
                            debitAmount: 0,
                            creditAmount: amount,
                            description: `${category} - ${loan.loanApplicationNumber}`
                        }
                    ] : [
                        {
                            // Debit Expense (Waiver)
                            ledgerAccount: { connect: { id: contraAccount.id } },
                            debitAmount: amount,
                            creditAmount: 0,
                            description: `Waiver/Adjustment - ${loan.loanApplicationNumber}`
                        },
                        {
                            // Credit Loan (Reduce Asset)
                            ledgerAccount: { connect: { id: loanAccount.id } },
                            debitAmount: 0,
                            creditAmount: amount,
                            description: `Ref: ${loan.loanApplicationNumber}`
                        }
                    ]
                }
            }
        })

        // Also create LoanTransaction for statement visibility
        await tx.loanTransaction.create({
            data: {
                loanId: loan.id,
                type: adjustmentType === 'increase' ? 'PENALTY' : 'WAIVER',
                amount: amount,
                description: description,
                referenceId: journal.id,
                penaltyAmount: adjustmentType === 'increase' ? amount : 0,
                principalAmount: adjustmentType === 'decrease' ? amount : 0
            }
        })
    })

    revalidatePath('/admin/system')
    revalidatePath(`/loans/${loanId}`)
    return { success: true }
}
