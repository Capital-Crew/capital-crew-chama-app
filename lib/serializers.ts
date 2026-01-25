import { Loan, Member } from '@prisma/client'

/**
 * Serializes a member object by converting all Prisma Decimal fields to plain JavaScript numbers.
 */
export function serializeMember<T extends Partial<Member>>(member: T): T {
    return {
        ...member,
        shareContributions: member.shareContributions ? Number(member.shareContributions) : 0,
        contributionArrears: member.contributionArrears ? Number(member.contributionArrears) : 0,
        penaltyArrears: member.penaltyArrears ? Number(member.penaltyArrears) : 0,
        welfareArrears: (member as any).welfareArrears ? Number((member as any).welfareArrears) : 0,
    } as T
}

/**
 * Serializes an array of member objects
 */
export function serializeMembers<T extends Partial<Member>>(members: T[]): T[] {
    return members.map(serializeMember)
}


/**
 * Serializes a loan object by converting all Prisma Decimal fields to plain JavaScript numbers.
 * This is required when passing loan data from Server Components to Client Components in Next.js.
 * 
 * @param loan - The loan object with Decimal fields from Prisma
 * @returns The same loan object with all Decimal fields converted to numbers
 */
export function serializeLoan<T extends Partial<Loan>>(loan: T): T {
    return {
        ...loan,
        outstandingBalance: loan.outstandingBalance ? Number(loan.outstandingBalance) : 0,
        amount: loan.amount ? Number(loan.amount) : 0,
        processingFee: loan.processingFee ? Number(loan.processingFee) : 0,
        insuranceFee: loan.insuranceFee ? Number(loan.insuranceFee) : 0,
        shareCapitalDeduction: loan.shareCapitalDeduction ? Number(loan.shareCapitalDeduction) : 0,
        existingLoanOffset: loan.existingLoanOffset ? Number(loan.existingLoanOffset) : 0,
        totalDeductions: loan.totalDeductions ? Number(loan.totalDeductions) : 0,
        netDisbursementAmount: loan.netDisbursementAmount ? Number(loan.netDisbursementAmount) : 0,
        memberSharesAtApplication: loan.memberSharesAtApplication ? Number(loan.memberSharesAtApplication) : 0,
        grossQualifyingAmount: loan.grossQualifyingAmount ? Number(loan.grossQualifyingAmount) : 0,
        monthlyInstallment: loan.monthlyInstallment ? Number(loan.monthlyInstallment) : 0,
        accruedInterestTotal: loan.accruedInterestTotal ? Number(loan.accruedInterestTotal) : 0,
        penaltyRate: loan.penaltyRate ? Number(loan.penaltyRate) : 0,
        interestRate: loan.interestRate ? Number(loan.interestRate) : 0,
        interestRatePerMonth: loan.interestRatePerMonth ? Number(loan.interestRatePerMonth) : 0,
    } as T
}

/**
 * Serializes an array of loan objects
 */
export function serializeLoans<T extends Partial<Loan>>(loans: T[]): T[] {
    return loans.map(serializeLoan)
}

/**
 * Serializes a ledger entry (previously journal line) object by converting Decimals to numbers
 */
export function serializeJournalLine(line: any): any {
    return {
        ...line,
        debitAmount: line.debitAmount ? Number(line.debitAmount) : 0,
        creditAmount: line.creditAmount ? Number(line.creditAmount) : 0,
        // Map ledgerAccount to account for frontend compatibility if needed
        account: line.ledgerAccount || line.account,
        accountId: line.ledgerAccountId || line.accountId
    }
}

/**
 * Serializes a ledger transaction (previously journal entry) object by converting Decimals to numbers
 */
export function serializeJournalEntry(entry: any): any {
    const lines = entry.ledgerEntries || entry.lines || []
    const serializedLines = lines.map(serializeJournalLine)

    // Calculate totals if not present (LedgerTransaction doesn't store them)
    // Note: This relies on lines being present.
    const calculatedTotalDebit = serializedLines.reduce((sum: number, l: any) => sum + (l.debitAmount || 0), 0)
    const calculatedTotalCredit = serializedLines.reduce((sum: number, l: any) => sum + (l.creditAmount || 0), 0)

    return {
        ...entry,
        totalDebit: entry.totalDebit ? Number(entry.totalDebit) : calculatedTotalDebit,
        totalCredit: entry.totalCredit ? Number(entry.totalCredit) : calculatedTotalCredit,
        amount: entry.amount ? Number(entry.amount) : Math.max(calculatedTotalDebit, calculatedTotalCredit), // Best guess for "amount"
        lines: serializedLines,
        // Map new fields to old names if necessary, or just expose them
    }
}

/**
 * Serializes an approval request object by converting Decimals to numbers
 */
export function serializeApprovalRequest(request: any): any {
    return {
        ...request,
        amount: request.amount ? Number(request.amount) : null,
    }
}
