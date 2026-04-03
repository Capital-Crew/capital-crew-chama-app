export interface MemberStats {
    // Column 1
    memberNumber: string;
    name: string;
    shareCapital: number;
    normalShares: number;
    fosaShares: number;

    // Real-time fields
    memberSavings?: number;
    contributions?: number;
    cumulativeContributions?: number;

    // Legacy / Calculated
    totalBorrowed?: number;
    totalPenaltiesPaid?: number;

    // Column 2
    currentAccountBalance: number;
    dividendAmount: number;
    totalOutstandingBalance: number;
    outstandingLoans?: number; // Add this field
    principalInArrears: number;
    totalInterestInArrears: number;

    // Column 3
    loanOtherCharges: number;
    loanPenalty: number;
    totalLoanArrears: number;
    monthlyDue: number;
    totalDue: number;
}

export interface LoanPortfolioItem {
    id: string;
    loanNumber: string;
    productName: string;
    approvedAmount: number;
    category: 'Performing' | 'Substandard' | 'Defaulted' | 'Closed' | 'N/A';
    periodInArrears: number; // Days or period count
    daysInArrears: number; // For SASRA Risk Buckets
    totalLoanBalance: number;
    principalInArrears: number;
    interestArrears: number;
    penaltyCharged: number;
    otherCharges: number;
    totalArrears: number;
    principalDue: number;
    interestDue: number;
    totalDue: number;
    isArrears: boolean;
    unpaidPenalty: number;
}
