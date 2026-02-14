
export interface GLEntry {
    id: string;
    transactionId: string;
    glAccountNo: string;
    glAccountName: string;
    debitAmount: number; // 0 if credit
    creditAmount: number; // 0 if debit
    runningBalance?: number;
}

export interface LoanTransaction {
    id: string;
    loanNo?: string; // loanApplicationNumber
    loanId?: string;
    glCode?: string; // Primary GL Code
    postingDate: string | Date; // ISO String or Date
    createdAt: string | Date;
    entryType: 'INITIAL' | 'INTEREST' | 'PRINCIPAL' | 'REVERSAL' | 'REPAYMENT' | 'PENALTY';
    description: string;
    documentRef?: string;
    amount: number;
    currency?: string;
    userId?: string;
    user?: {
        name: string;
        image?: string | null;
    };
    // Relation
    glEntries?: GLEntry[];

    // Breakdown
    principalAmount?: number;
    interestAmount?: number;
    penaltyAmount?: number;
    feeAmount?: number;

    // UI Helpers
    isReversal?: boolean;
    isReversed?: boolean;
}

export interface LoansSummary {
    totalPrincipal: number;
    totalInterest: number;
    totalOutstanding: number;
    activeLoanCount: number;
}
