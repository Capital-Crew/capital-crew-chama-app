

export interface MemberStats {
    memberId: string;
    memberName: string;
    memberNumber: string;

    // Core Balances
    savingsBalance: number;  // "C Member Savings" (Wallet/Deposits)
    totalOutstandingBalance: number; // Sum of all active loans
}

export interface ActiveLoanRow {
    id: string;
    loanNumber: string;
    productName: string;
    approvedAmount: number;
    status?: string; // loan status from LoanStatus enum

    // Monthly installment from RepaymentSchedule (current unpaid period)
    // Monthly installment from RepaymentSchedule (current unpaid period)
    arrears: number;
    expectedAmount: number;
    nextExpectedDate: Date | string | null;
    isOverdue: boolean;

    // Total outstanding balance from ledger
    totalLoanBalance: number;
}
