import { Loan, LoanProduct } from '@prisma/client';

import { MemberLoanTableRow, LoanCategory } from '@/types/loan-table';

// Helper type for the input loan with relations
type LoanWithRelations = Loan & {
    loanProduct: LoanProduct;
    repaymentSchedule: any; // Legacy JSON field on the Loan model
    // Real, normalised installment records from the RepaymentInstallment table
    repaymentInstallments?: Array<{
        installmentNumber: number;
        dueDate: Date | string;
        principalDue: any;
        interestDue: any;
        principalPaid: any;
        interestPaid: any;
        isFullyPaid: boolean;
    }>;
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

export function mapLoanToTableRow(loan: LoanWithRelations, penaltyBalance: number = 0): MemberLoanTableRow {
    const today = new Date();

    // ─── NORMALISE INSTALLMENTS FROM DB ─────────────────────────────────────
    // The DB model has split paid fields. We normalise to a common shape here
    // so the rest of the computation is clean and matches the spec exactly.
    type NormalisedInstallment = {
        installmentNumber: number;
        dueDate: Date;
        totalDue: number;
        amountPaid: number;
        status: 'PAID' | 'PARTIAL' | 'UNPAID' | 'UPCOMING';
    };

    let installments: NormalisedInstallment[] = [];

    if (loan.repaymentInstallments && loan.repaymentInstallments.length > 0) {
        installments = loan.repaymentInstallments.map(s => {
            const totalDue = toSafeNumber(s.principalDue) + toSafeNumber(s.interestDue);
            const amountPaid = toSafeNumber(s.principalPaid) + toSafeNumber(s.interestPaid);
            const dueDate = new Date(s.dueDate);

            let status: NormalisedInstallment['status'];
            if (s.isFullyPaid || amountPaid >= totalDue) {
                status = 'PAID';
            } else if (dueDate > today) {
                // Future installment with no or partial payment
                status = amountPaid > 0 ? 'PARTIAL' : 'UPCOMING';
            } else {
                // Past installment not fully paid
                status = amountPaid > 0 ? 'PARTIAL' : 'UNPAID';
            }

            return {
                installmentNumber: s.installmentNumber,
                dueDate,
                totalDue,
                amountPaid,
                status,
            };
        });
    }

    // ─── MONTHLY DUE (Spec §3) ─────────────────────────────────────────────────
    // Earliest installment where total_outstanding > 0 — its total_due is the Monthly Due.
    const sortedByInstallment = [...installments].sort(
        (a, b) => a.installmentNumber - b.installmentNumber
    );
    const currentInstallment = sortedByInstallment.find(s => (s.totalDue - s.amountPaid) > 0);
    const monthlyDue = currentInstallment ? currentInstallment.totalDue : 0;

    // ─── ARREARS (Spec §4) ────────────────────────────────────────────────────
    // SUM(total_outstanding) for all installments where due_date < today AND total_outstanding > 0.
    const arrears = Math.max(
        0,
        installments.reduce((sum, s) => {
            const outstanding = Math.max(0, s.totalDue - s.amountPaid);
            if (s.dueDate < today && outstanding > 0) {
                return sum + outstanding;
            }
            return sum;
        }, 0)
    );

    // ─── LEGACY BALANCE CALCULATION (retained for existing split-column display) ───
    // Use the normalised installments if the JSON repaymentSchedule field is absent
    const schedules = (loan.repaymentSchedule as any[]) || [];
    const legacyList = schedules.length > 0 ? schedules : installments;
    const normaliseStatus = (s: string) => (s || '').toUpperCase();

    let offsetBalance = 0;
    if (legacyList.length > 0) {
        offsetBalance = legacyList.reduce((sum: number, s: any) => {
            const pDue = toSafeNumber(s.principalDue);
            const pPaid = toSafeNumber(s.principalPaid ?? 0);
            const iDue = toSafeNumber(s.interestDue);
            const iPaid = toSafeNumber(s.interestPaid ?? 0);
            return sum + (pDue - pPaid) + (iDue - iPaid);
        }, 0);
    } else {
        offsetBalance = 0; // current_balance column removed from DB
    }

    const penalties = penaltyBalance;
    const otherCharges = 0;
    const outstandingBalance = Math.max(0, offsetBalance + penalties + otherCharges);

    // ─── LEGACY OVERDUE ANALYSIS (for existing split-column table) ───────────────
    const overdueSchedules = legacyList.filter((s: any) =>
        new Date(s.dueDate) < today && normaliseStatus(s.status ?? (s.isFullyPaid ? 'PAID' : 'UNPAID')) !== 'PAID'
    );
    const currentSchedule = legacyList.find((s: any) =>
        new Date(s.dueDate) >= today && normaliseStatus(s.status ?? (s.isFullyPaid ? 'PAID' : 'UNPAID')) !== 'PAID'
    );

    // 3. Legacy Arrears Calculation (split columns 7, 8 — kept for existing table display)
    const principalInArrears = overdueSchedules.reduce((sum, s) => sum + (toSafeNumber(s.principalDue) - toSafeNumber(s.principalPaid ?? s.amountPaid ?? 0)), 0);
    const interestInArrears = overdueSchedules.reduce((sum, s) => sum + (toSafeNumber(s.interestDue) - toSafeNumber(s.interestPaid ?? 0)), 0);

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
    const principalDue = currentSchedule ? (toSafeNumber(currentSchedule.principalDue) - toSafeNumber(currentSchedule.principalPaid ?? 0)) : 0;
    const interestDue = currentSchedule ? (toSafeNumber(currentSchedule.interestDue) - toSafeNumber(currentSchedule.interestPaid ?? 0)) : 0;

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
        date: loan.disbursementDate ?? loan.applicationDate ?? undefined,

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
        totalDue: finalTotalDue,
        monthlyDue,
        arrears
    };
}
