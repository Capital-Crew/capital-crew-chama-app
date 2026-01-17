import { Loan, LoanProduct } from '@prisma/client';

import { MemberLoanTableRow, LoanCategory } from '@/types/loan-table';

// Helper type for the input loan with relations
type LoanWithRelations = Loan & {
    loanProduct: LoanProduct;
    repaymentSchedule: any; // Typed as any usually to handle JSON field, but we treat it as RepaymentScheduleItem[]
};

/**
 * Robustly converts any value to a number.
 * Handles undefined, null, strings ("NaN"), Prisma Decimals, and standard numbers.
 * Defaults to 0 if invalid.
 */
function toSafeNumber(val: any): number {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;

    // Handle Prisma Decimal or objects with conversion methods
    if (typeof val === 'object') {
        if ('toNumber' in val && typeof val.toNumber === 'function') {
            const res = val.toNumber();
            return isNaN(res) ? 0 : res;
        }
        if ('toString' in val && typeof val.toString === 'function') {
            const str = val.toString();
            const parsed = parseFloat(str);
            return isNaN(parsed) ? 0 : parsed;
        }
    }

    // Handle strings
    const num = Number(val);
    return isNaN(num) ? 0 : num;
}

export function mapLoanToTableRow(loan: LoanWithRelations): MemberLoanTableRow {
    // 0. Initial Data Extraction
    const schedules = (loan.repaymentSchedule as any[]) || [];
    const today = new Date();

    // 1. Calculate Balances & Source of Truth
    // REFACTOR: Calculate real-time balance from schedule, but fallback to current_balance if schedule missing
    let offsetBalance = 0;
    if (schedules.length > 0) {
        offsetBalance = schedules.reduce((sum, s) => {
            const pDue = toSafeNumber(s.principalDue);
            const pPaid = toSafeNumber(s.principalPaid);
            const iDue = toSafeNumber(s.interestDue);
            const iPaid = toSafeNumber(s.interestPaid);
            return sum + (pDue - pPaid) + (iDue - iPaid);
        }, 0);
    } else {
        // Fallback for new loans or missing schedules
        offsetBalance = toSafeNumber(loan.current_balance);
    }

    const penalties = toSafeNumber(loan.penalties);
    // Assuming 'otherCharges' might come from somewhere else in future, but 0 for now as per instructions
    const otherCharges = 0;

    // Total Outstanding = Schedule Balance + Penalties + Other Charges
    const outstandingBalance = Math.max(0, offsetBalance + penalties + otherCharges);

    // 2. Schedule Analysis
    // Filter for items that are strictly in the past (< today) and NOT fully paid
    const overdueSchedules = schedules.filter(s =>
        new Date(s.dueDate) < today && s.status !== 'PAID'
    );

    // Find the current month's installment (Due >= Today)
    const currentSchedule = schedules.find(s =>
        new Date(s.dueDate) >= today && s.status !== 'PAID'
    );

    // 3. Arrears Calculation (Columns 7, 8)
    const principalInArrears = overdueSchedules.reduce((sum, s) => sum + (toSafeNumber(s.principalDue) - toSafeNumber(s.principalPaid)), 0);
    const interestInArrears = overdueSchedules.reduce((sum, s) => sum + (toSafeNumber(s.interestDue) - toSafeNumber(s.interestPaid)), 0);

    // 4. Period in Arrears (Column 5)
    let periodInArrears = 0;

    if (overdueSchedules.length > 0) {
        // Find strictly oldest due date
        const sorted = [...overdueSchedules].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        const oldestUnpaidDate = new Date(sorted[0].dueDate);
        const diffTime = Math.abs(today.getTime() - oldestUnpaidDate.getTime());
        // User requested 'Number' validation. Usually days.
        periodInArrears = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // 5. Category Logic (Column 4)
    let category: LoanCategory = 'Performing';

    if (outstandingBalance <= 0) {
        // If balance is 0, it's Closed regardless of history
        category = 'Closed';
    } else if (periodInArrears > 0) {
        // Strict rule per user request: "If daysArrears > 0: Defaulted"
        category = 'Defaulted';
    } else {
        category = 'Performing';
    }

    // 6. Current Dues (Columns 12, 13)
    const principalDue = currentSchedule ? (toSafeNumber(currentSchedule.principalDue) - toSafeNumber(currentSchedule.principalPaid)) : 0;
    const interestDue = currentSchedule ? (toSafeNumber(currentSchedule.interestDue) - toSafeNumber(currentSchedule.interestPaid)) : 0;

    // 7. Aggregates (Column 11)
    const totalArrears = principalInArrears + interestInArrears + penalties + otherCharges;

    // 8. Total Due Logic (Column 14) - The Clamp Rule
    const calculatedTotalDue = totalArrears + principalDue + interestDue;

    // Ghost Due Prevention: Due cannot exceed what is actually owed on the loan globally
    let finalTotalDue = Math.min(calculatedTotalDue, outstandingBalance);

    // Edge Case: If balance is 0, Total Due MUST be 0
    if (outstandingBalance <= 0) {
        finalTotalDue = 0;
    }

    return {
        id: loan.id,
        loanNumber: loan.loanApplicationNumber,
        memberId: loan.memberId,
        memberName: (loan as any).member?.name,
        memberNumber: (loan as any).member?.memberNumber,
        status: loan.status,
        date: loan.disbursementDate || loan.applicationDate,

        productName: loan.loanProduct.name,
        approvedAmount: toSafeNumber(loan.amount),
        category,
        periodInArrears,
        totalLoanBalance: outstandingBalance,
        principalInArrears,
        interestInArrears,
        penaltyCharged: penalties,
        otherCharges,
        totalArrears,
        principalDue,
        interestDue,
        totalDue: finalTotalDue
    };
}
