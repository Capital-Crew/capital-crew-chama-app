import { differenceInDays } from 'date-fns';

/**
 * Loan status categorization logic.
 * Defaulted if arrears > 90 days.
 */

export type LoanCategory = 'Performing' | 'Defaulted' | 'Closed' | 'N/A';

export function determineLoanCategory(
    status: string,
    oldestUnpaidInstallmentDate: Date | null | undefined
): LoanCategory {
    // 1. Check basic status
    if (status === 'CLOSED' || status === 'PENDING_APPROVAL' || status === 'REJECTED') {
        return status === 'CLOSED' ? 'Closed' : 'N/A';
    }

    // 2. If Active, check arrears
    if (status === 'ACTIVE' || status === 'DISBURSED' || status === 'OVERDUE') {
        if (!oldestUnpaidInstallmentDate) {
            return 'Performing'; // No missed payments yet
        }

        const today = new Date();
        const daysInArrears = differenceInDays(today, new Date(oldestUnpaidInstallmentDate));

        if (daysInArrears > 90) {
            return 'Defaulted';
        }

        return 'Performing';
    }

    return 'N/A';
}

export function getBadgesStyles(category: LoanCategory): string {
    switch (category) {
        case 'Performing':
            return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case 'Defaulted':
            return 'bg-red-100 text-red-700 border-red-200';
        case 'Closed':
            return 'bg-gray-100 text-gray-700 border-gray-200';
        default:
            return 'bg-gray-50 text-gray-500 border-gray-100';
    }
}
