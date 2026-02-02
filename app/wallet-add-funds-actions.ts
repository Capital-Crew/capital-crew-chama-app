'use server'

import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { Prisma } from '@prisma/client'
import { AccountingEngine, getMemberWalletBalance } from '@/lib/accounting/AccountingEngine'
import { revalidatePath } from 'next/cache'
import { getSystemMappingsDict } from '@/app/actions/system-accounting'
import { WalletService } from '@/lib/services/WalletService'

/**
 * Add Member Contribution
 * 
 * Business Rules:
 * - Non-withdrawable (increases contribution balance)
 * - Increases loan qualification (multiplier applied)
 * - Posts to Account 1200 (Contributions & Loan Portfolio)
 * - Debits member wallet, credits contributions
 * - Updates MonthlyTracker with waterfall logic (arrears → current → future)
 */
export async function addContribution(input: {
    memberId: string
    amount: number
    description: string
}) {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    // Validate amount
    if (input.amount <= 0) {
        throw new Error('Amount must be greater than zero')
    }

    // Get member
    const member = await prisma.member.findUnique({
        where: { id: input.memberId },
        include: { wallet: true }
    })

    if (!member) {
        throw new Error('Member not found')
    }

    if (!member.wallet) {
        throw new Error('Member wallet not found')
    }

    // Check wallet balance
    const walletBalance = await getMemberWalletBalance(input.memberId)
    if (input.amount > walletBalance) {
        throw new Error(`Insufficient wallet balance. Available: KES ${walletBalance.toLocaleString()}`)
    }

    // Get user for audit
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { member: true }
    })

    // Use ContributionsService to handle:
    // - Waterfall logic (arrears → current → future)
    // - MonthlyTracker updates
    // - Ledger posting
    // - ShareTransaction creation
    const { ContributionsService } = await import('@/lib/services/contributions-service')

    await ContributionsService.recordContribution(
        input.memberId,
        input.amount,
        member.wallet.id
    )

    // Create audit log
    await prisma.auditLog.create({
        data: {
            userId: session.user.id,
            action: 'WALLET_TRANSACTION_CREATED',
            details: `Member contribution: ${member.name} - KES ${input.amount} - ${input.description}`
        }
    })

    revalidatePath('/wallet')
    revalidatePath('/dashboard')
    revalidatePath('/accounts')
    revalidatePath(`/members/${input.memberId}`)

    // Get updated share balance
    const updatedMember = await prisma.member.findUnique({
        where: { id: input.memberId },
        select: { shareContributions: true }
    })

    return {
        success: true,
        message: 'Contribution recorded successfully',
        newShareBalance: Number(updatedMember?.shareContributions || 0)
    }
}

/**
 * Add Penalty Payment
 * 
 * Business Rules:
 * - Paid from member's withdrawable balance
 * - Decreases withdrawable balance (Account 2000)
 * - Posts to Penalty Income (Account 4200)
 * - Does NOT affect loan balances or share capital
 */
export async function addPenaltyPayment(input: {
    memberId: string
    amount: number
    description: string
}) {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    // Validate amount
    if (input.amount <= 0) {
        throw new Error('Amount must be greater than zero')
    }

    // Get member and check withdrawable balance
    const member = await prisma.member.findUnique({
        where: { id: input.memberId }
    })

    if (!member) {
        throw new Error('Member not found')
    }

    // Check wallet balance
    const walletBalance = await getMemberWalletBalance(input.memberId)
    if (input.amount > walletBalance) {
        throw new Error(`Insufficient wallet balance. Available: KES ${walletBalance.toLocaleString()}`)
    }

    // Get user for audit
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { member: true }
    })

    // 0. Get system mappings
    const mappings = await getSystemMappingsDict()

    // Validate required mapping exists
    if (!mappings.INCOME_LOAN_PENALTY) {
        throw new Error('System mapping for INCOME_LOAN_PENALTY not found. Please run: npx tsx prisma/seed-mappings.ts')
    }

    // 0a. Resolve Wallet Account
    const wallet = await WalletService.createWallet(input.memberId)

    // 1. Post journal entry via AccountingEngine (it handles its own transaction)
    const journalEntry = await AccountingEngine.postJournalEntry({
        transactionDate: new Date(),
        referenceType: 'MANUAL_ADJUSTMENT', // Or create new type PENALTY_PAYMENT
        referenceId: input.memberId,
        description: `Penalty payment - ${member.name}`,
        notes: input.description,
        lines: [
            {
                accountId: wallet.glAccountId, // Member Wallet (DR - decreases liability/balance)
                debitAmount: input.amount,
                creditAmount: 0,
                description: `${member.name} penalty withdrawal`
            },
            {
                accountCode: mappings.INCOME_LOAN_PENALTY, // Penalty Income (CR - increases income)
                debitAmount: 0,
                creditAmount: input.amount,
                description: 'Penalty income received'
            }
        ],
        createdBy: session.user.id,
        createdByName: user?.member?.name || session.user.name || 'System'
    })

    // 2. Create audit log
    await prisma.auditLog.create({
        data: {
            userId: session.user.id,
            action: 'WALLET_TRANSACTION_CREATED',
            details: `Penalty payment: ${member.name} - KES ${input.amount} - ${input.description}`
        }
    })

    revalidatePath('/wallet')
    revalidatePath('/dashboard')
    revalidatePath('/accounts')

    return {
        success: true,
        journalEntryId: journalEntry.id,
        newWithdrawableBalance: walletBalance - input.amount
    }
}

/**
 * Add Loan Repayment
 * 
 * Business Rules:
 * - Must select specific active loan
 * - Cannot exceed outstanding balance (strict validation)
 * - Allocation waterfall: Penalty -> Fees -> Interest -> Principal
 * - Updates loan repayment schedule
 * - Updates loan status if fully paid
 */
export async function addLoanRepayment(input: {
    memberId: string
    loanId: string
    amount: number
    description: string
}) {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    // Validate amount
    if (input.amount <= 0) {
        throw new Error('Amount must be greater than zero')
    }

    // Get loan with details
    const loan = await prisma.loan.findUnique({
        where: { id: input.loanId },
        include: { member: true }
    })

    if (!loan) {
        throw new Error('Loan not found')
    }

    if (loan.memberId !== input.memberId) {
        throw new Error('Loan does not belong to this member')
    }

    if (!['ACTIVE', 'OVERDUE'].includes(loan.status)) {
        throw new Error(`Cannot repay loan with status: ${loan.status}`)
    }

    // Get outstanding balances from AccountingEngine
    // Note: We need a getLoanFeesBalance in the future. For now assume 0 or implement placeholder.
    // Get outstanding balances from AccountingEngine
    const { getLoanPenaltyBalance, getLoanInterestBalance, getLoanPrincipalBalance, getLoanFeeBalance } = await import('@/lib/accounting/AccountingEngine')

    const penaltyBalance = await getLoanPenaltyBalance(input.loanId)
    const interestBalance = await getLoanInterestBalance(input.loanId)
    let principalBalance = await getLoanPrincipalBalance(input.loanId)
    const feesBalance = await getLoanFeeBalance(input.loanId)

    // Ledger Balances Object
    const balances = {
        penalty: penaltyBalance,
        fees: feesBalance,
        interest: interestBalance,
        principal: principalBalance
    }

    let totalOutstanding = balances.penalty + balances.fees + balances.interest + balances.principal

    // Fallback: If ledger is empty (0) but loan is ACTIVE, assume it's fully outstanding
    if (totalOutstanding <= 0) {
        balances.principal = Number(loan.amount)
        principalBalance = balances.principal
        totalOutstanding = balances.principal
    }

    // STRICT VALIDATION: Prevent overpayment
    if (input.amount > totalOutstanding) {
        throw new Error(
            `Repayment amount (KES ${input.amount.toLocaleString()}) exceeds outstanding balance (KES ${totalOutstanding.toLocaleString()})`
        )
    }

    // USE WATERFALL LOGIC
    const { distributeRepayment } = await import('@/lib/finance/waterfall')
    const allocation = distributeRepayment(input.amount, balances)

    // Get user for audit
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { member: true }
    })

    // 0. Get system mappings
    const mappings = await getSystemMappingsDict()

    // Validate required mappings exist
    const requiredMappings = [
        'RECEIVABLE_LOAN_PENALTY',
        'RECEIVABLE_LOAN_FEES',
        'RECEIVABLE_LOAN_INTEREST',
        'EVENT_LOAN_REPAYMENT_PRINCIPAL'
    ] as const

    for (const mapping of requiredMappings) {
        if (!mappings[mapping]) {
            throw new Error(`System mapping for ${mapping} not found. Please run: npx tsx prisma/seed-mappings.ts`)
        }
    }

    // Check wallet balance
    const walletBalance = await getMemberWalletBalance(input.memberId)
    if (input.amount > walletBalance) {
        throw new Error(`Insufficient wallet balance. Available: KES ${walletBalance.toLocaleString()}`)
    }

    const journalLines: Array<{ accountCode?: string; accountId?: string; debitAmount: number; creditAmount: number; description: string }> = []

    // Build journal lines based on allocation
    if (allocation.paidPenalty > 0) {
        journalLines.push({
            accountCode: mappings.RECEIVABLE_LOAN_PENALTY, // Penalty Receivable (CR - decrease asset)
            debitAmount: 0,
            creditAmount: allocation.paidPenalty,
            description: 'Penalty paid (Waterfall)'
        })
    }

    // Fees (Need Mapping)
    if (allocation.paidFees > 0) {
        // Feature Future: Add Fee Receivable mapping (RECEIVABLE_LOAN_FEES)
        // Currently fee accounts are likely tied to Disbursement (Capitalized) or separate invoices.
        // If fees are capitalized, they are paid as part of Principal.
        // If strictly tracked as separate receivable, uncomment below when mapping exists:

        journalLines.push({
            accountCode: mappings.RECEIVABLE_LOAN_FEES,
            debitAmount: 0,
            creditAmount: allocation.paidFees,
            description: 'Fees paid (Waterfall)'
        })

    }

    if (allocation.paidInterest > 0) {
        journalLines.push({
            accountCode: mappings.RECEIVABLE_LOAN_INTEREST, // Interest Receivable (CR - decrease asset)
            debitAmount: 0,
            creditAmount: allocation.paidInterest,
            description: 'Interest paid (Waterfall)'
        })
    }

    if (allocation.paidPrincipal > 0) {
        journalLines.push({
            accountCode: mappings.EVENT_LOAN_REPAYMENT_PRINCIPAL, // Loan Portfolio (CR - decrease asset)
            debitAmount: 0,
            creditAmount: allocation.paidPrincipal,
            description: 'Principal paid (Waterfall)'
        })
    }

    // 0a. Resolve Wallet
    const wallet = await WalletService.createWallet(input.memberId)

    // Wallet deduction (DR)
    journalLines.push({
        accountId: wallet.glAccountId, // Member Wallet (DR - decrease liability)
        debitAmount: input.amount,
        creditAmount: 0,
        description: 'Loan repayment withdrawal'
    })

    // 1. Post journal entry (AccountingEngine handles its own transaction)
    const journalEntry = await AccountingEngine.postJournalEntry({
        transactionDate: new Date(),
        referenceType: 'LOAN_REPAYMENT',
        referenceId: input.loanId,
        description: `Loan repayment - ${loan.loanApplicationNumber}`,
        notes: input.description,
        lines: journalLines,
        createdBy: session.user.id,
        createdByName: user?.member?.name || session.user.name || 'System'
    })

    // 2. Calculate new outstanding balance
    const newOutstanding = totalOutstanding - input.amount
    const isFullyPaid = Math.abs(newOutstanding) < 0.01

    // 3. Update loan status if fully paid
    if (isFullyPaid) {
        await prisma.loan.update({
            where: { id: input.loanId },
            data: { status: 'CLEARED' }
        })
    }

    // 4. Create loan journey event
    await prisma.loanJourneyEvent.create({
        data: {
            loanId: input.loanId,
            eventType: 'REPAYMENT_MADE',
            description: `Repayment of KES ${input.amount.toLocaleString()} (Penalty: ${allocation.paidPenalty}, Fees: ${allocation.paidFees}, Interest: ${allocation.paidInterest}, Principal: ${allocation.paidPrincipal})`,
            actorId: session.user.id,
            actorName: user?.member?.name || session.user.name || 'System',
            metadata: {
                amount: input.amount,
                allocation,
                journalEntryId: journalEntry.id
            }
        }
    })

    // 5. Create Loan Transaction for Statement (Strict Ledger)
    await prisma.loanTransaction.create({
        data: {
            loanId: input.loanId,
            type: 'REPAYMENT',
            amount: new Prisma.Decimal(input.amount),
            description: input.description,
            principalAmount: new Prisma.Decimal(allocation.paidPrincipal),
            interestAmount: new Prisma.Decimal(allocation.paidInterest),
            penaltyAmount: new Prisma.Decimal(allocation.paidPenalty),
            feeAmount: new Prisma.Decimal(allocation.paidFees), // NEW
            postedAt: new Date(),
            referenceId: journalEntry.id
        }
    })

    // 6. Force Update Loan Outstanding Balance (Strict)
    await prisma.loan.update({
        where: { id: input.loanId },
        data: {
            outstandingBalance: new Prisma.Decimal(newOutstanding),
        }
    })

    // 7. Create audit log
    await prisma.auditLog.create({
        data: {
            userId: session.user.id,
            action: 'WALLET_TRANSACTION_CREATED',
            details: `Loan repayment: ${loan.loanApplicationNumber} - KES ${input.amount} ${isFullyPaid ? '(LOAN CLEARED)' : ''}`
        }
    })

    revalidatePath('/wallet')
    revalidatePath('/loans')
    revalidatePath('/dashboard')
    revalidatePath('/accounts')
    revalidatePath(`/members/${input.memberId}`)

    return {
        success: true,
        journalEntryId: journalEntry.id,
        allocation,
        newOutstanding,
        isFullyPaid,
        loanStatus: isFullyPaid ? 'CLEARED' : loan.status
    }
}

/**
 * Get active loans for a member (for loan repayment dropdown)
 */
export async function getActiveLoansByMember(memberId: string) {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error('Unauthorized')
    }

    const loans = await prisma.loan.findMany({
        where: {
            memberId,
            status: { in: ['ACTIVE', 'OVERDUE'] }
        },
        include: {
            loanProduct: {
                select: {
                    name: true
                }
            },
            _count: {
                select: { transactions: true }
            }
        },
        orderBy: { applicationDate: 'desc' }
    })

    // Get outstanding balances for each loan
    const { getLoanPenaltyBalance, getLoanInterestBalance, getLoanPrincipalBalance, getLoanFeeBalance } = await import('@/lib/accounting/AccountingEngine')

    const loansWithBalances = await Promise.all(
        loans.map(async (loan: any) => {
            let penalty = 0
            let interest = 0
            let principal = 0
            let fees = 0

            // Try to get balances, but handle gracefully if accounts aren't seeded yet
            try {
                penalty = await getLoanPenaltyBalance(loan.id)
                interest = await getLoanInterestBalance(loan.id)
                principal = await getLoanPrincipalBalance(loan.id)
                fees = await getLoanFeeBalance(loan.id)
            } catch (error) {
                // If accounts aren't seeded or error, fail safe to 0 to trigger fallback below if needed
                console.error(`Error fetching balances for loan ${loan.id}:`, error)
            }

            let outstanding = penalty + interest + principal + fees

            // Fallback Logic:
            // Only use loan amount if:
            // 1. Calculated outstanding is <= 0 (ledger empty or cleared)
            // 2. AND No transactions exist (implies it's a new/legacy loan not yet seeded in ledger)
            // This prevents "Resurrecting" a paid-off loan that is still marked ACTIVE
            if (outstanding <= 0 && loan._count.transactions === 0) {
                principal = Number(loan.amount)
                outstanding = principal
            }

            // Ensure we don't return negative small dust
            if (outstanding < 0.01) outstanding = 0

            // SELF-HEAL: If balance is 0 and status is ACTIVE, update it to CLEARED
            // Only do this if we are confident (transactions exist)
            let finalStatus = loan.status
            if (outstanding === 0 && (loan.status === 'ACTIVE' || loan.status === 'OVERDUE') && loan._count.transactions > 0) {
                try {
                    await prisma.loan.update({
                        where: { id: loan.id },
                        data: { status: 'CLEARED' }
                    })
                    finalStatus = 'CLEARED'
                } catch (err) {
                    console.error('Error auto-clearing loan:', err)
                }
            }

            return {
                id: loan.id,
                loanApplicationNumber: loan.loanApplicationNumber,
                productName: loan.loanProduct.name,
                disbursedAmount: Number(loan.amount), // Ensure this is returned
                outstandingBalance: outstanding,
                penaltyBalance: penalty,
                interestBalance: interest,
                principalBalance: principal,
                feesBalance: fees,
                status: finalStatus
            }
        })
    )

    // Filter out loans with 0 balance (fully paid)
    return loansWithBalances.filter(loan => loan.outstandingBalance > 0)
}

/**
 * Get fresh loan balance (for real-time verification in modals/tabs)
 */
export async function getLoanFreshBalance(loanId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')

    // Get ledger balances
    const { getLoanPenaltyBalance, getLoanInterestBalance, getLoanPrincipalBalance, getLoanFeeBalance } = await import('@/lib/accounting/AccountingEngine')

    let penalty = 0
    let interest = 0
    let principal = 0
    let fees = 0

    try {
        penalty = await getLoanPenaltyBalance(loanId)
        interest = await getLoanInterestBalance(loanId)
        principal = await getLoanPrincipalBalance(loanId)
        fees = await getLoanFeeBalance(loanId)
    } catch (e) {
        console.error('Error fetching fresh balance:', e)
    }

    let outstanding = penalty + interest + principal + fees
    if (outstanding < 0.01) outstanding = 0

    return {
        outstandingBalance: outstanding,
        penaltyBalance: penalty,
        interestBalance: interest,
        principalBalance: principal,
        feesBalance: fees
    }
}
