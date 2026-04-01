export type LoanCategory = 'Performing' | 'Defaulted' | 'Closed';

export interface MemberLoanTableRow {
    // 1. Loan No
    id: string; // Internal ID for linking
    loanNumber: string;
    memberId?: string;
    memberName?: string;
    memberNumber?: string | number;
    status?: string;
    date?: Date; // Already have 'date' field? No I see 'id', 'loanNumber', 'productName'...


    // 2. Loan Product Name
    productName: string;

    // 3. Approved Amount
    approvedAmount: number;

    // 4. Loans Category
    category: LoanCategory;

    // 5. Period in Arrears (Number, 2 decimals)
    periodInArrears: number;

    // 6. Total Loan Balance (Source of Truth)
    totalLoanBalance: number;

    // 7. Principal in Arrears
    principalInArrears: number;

    // 8. Interest in Arrears
    interestInArrears: number;

    // 9. Penalty Charged
    penaltyCharged: number;

    // 10. Loan Other Charges
    otherCharges: number;

    // 11. Total Arrears
    totalArrears: number;

    // 12. Principal Due
    principalDue: number;

    // 13. Interest Due
    interestDue: number;

    // 14. Total Due (Clamped)
    totalDue: number;

    // 15. Monthly Due — current scheduled installment total_due (earliest unpaid)
    monthlyDue: number;

    // 16. Arrears — cumulative unpaid from all past partial/unpaid installments
    arrears: number;
}
