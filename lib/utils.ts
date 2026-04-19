import {
    Loan, Revenue, RevenueCategory, LoanProduct, RepaymentScheduleItem, RepaymentStatus, NotificationType, LoanStatus,
    RepaymentFrequencyType, InterestType, AmortizationType
} from './types';
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}


/**
 * Format currency with strict truncation (no rounding)
 * 
 * @deprecated Use formatCurrency from @/lib/currency for new code
 * This function is kept for backward compatibility but now uses truncation
 */
export const formatCurrency = (amount: number): string => {
    // Truncate to 2 decimals using Math.floor
    const truncated = Math.floor(amount * 100) / 100;

    // Format with thousand separators
    const parts = truncated.toString().split('.');
    const integerPart = parseInt(parts[0]).toLocaleString('en-KE');
    const decimalPart = (parts[1] || '').padEnd(2, '0').slice(0, 2);

    return `KES ${integerPart}.${decimalPart}`;
};


export const formatDate = (dateString: string | Date): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export const calculateOutstandingBalance = (loan: Loan, revenues: Revenue[]): number => {
    const totalPaidForLoan = revenues
        .filter(i => i.loanId === loan.id)
        .reduce((sum, revenue) => {
            if (revenue.category !== RevenueCategory.MONTHLY_CONTRIBUTION && revenue.category !== RevenueCategory.NON_LOAN_PENALTY) {
                return sum + Number(revenue.amount);
            }
            return sum;
        }, 0);

    // Use penalties if exist, or 0. (Cast to any for legacy support after column removal)
    const totalRepayable = (loan.repaymentSchedule as any[]).reduce((sum, item) => sum + item.total, 0) + Number((loan as any).penalties || 0);

    return Math.max(0, totalRepayable - totalPaidForLoan);
};

export const calculateAllOutstandingBalances = (memberId: string, loans: Loan[], revenues: Revenue[]): number => {
    return loans
        .filter(l => l.memberId === memberId && (l.status === LoanStatus.ACTIVE || l.status === LoanStatus.OVERDUE))
        .reduce((sum, loan) => sum + calculateOutstandingBalance(loan, revenues), 0);
};

export const calculateOutstandingPrincipal = (loan: Loan, revenues: Revenue[]): number => {
    const totalPaidForRepayment = revenues
        .filter(i => i.loanId === loan.id && i.category === RevenueCategory.LOAN_REPAYMENT)
        .reduce((sum, revenue) => sum + Number(revenue.principalAmount || 0), 0);

    return Math.max(0, Number(loan.amount) - totalPaidForRepayment);
};

export const addFrequencyOffset = (date: Date, every: number, type: RepaymentFrequencyType): Date => {
    const d = new Date(date);
    if (type === RepaymentFrequencyType.DAYS) {
        d.setDate(d.getDate() + every);
    } else if (type === RepaymentFrequencyType.WEEKS) {
        d.setDate(d.getDate() + (every * 7));
    } else if (type === RepaymentFrequencyType.MONTHS) {
        const originalDate = d.getDate();
        d.setMonth(d.getMonth() + every);
        if (d.getDate() !== originalDate) {
            d.setDate(0);
        }
    }
    return d;
};

export const generateLoanApplicationNumber = (loans: Loan[]): string => {
    return "";
};

export const getNextLoanNumber = (lastLoanNumber: string | null | undefined): string => {
    // Handle null/undefined case
    if (!lastLoanNumber) {
        return 'LN001';
    }

    // Handle old format (LN-YYYYMM-XXX) - start fresh with new format
    if (lastLoanNumber.includes('-')) {
        return 'LN001';
    }

    // Handle new format (LNXXX)
    if (!lastLoanNumber.startsWith('LN')) {
        return 'LN001';
    }

    try {
        // Extract numeric part (remove 'LN' prefix)
        const numberPart = lastLoanNumber.substring(2);
        const number = parseInt(numberPart, 10);

        // Validate parsed number
        if (isNaN(number) || number < 0) {
            return 'LN001';
        }

        // Check for overflow (max 999 with 3 digits)
        if (number >= 999) {
        }

        const nextNumber = number + 1;
        // Pad with zeros to maintain 3-digit format
        return `LN${nextNumber.toString().padStart(3, '0')}`;
    } catch (error) {
        return 'LN001';
    }
};

export const calculateTotalContributions = (memberId: string, revenues: Revenue[]): number => {
    return revenues
        .filter(i => i.memberId === memberId && i.category === RevenueCategory.MONTHLY_CONTRIBUTION)
        .reduce((sum, revenue) => sum + Number(revenue.amount), 0);
};

export const calculateLoanLimit = (totalContributions: number, multiplier: number): number => {
    return totalContributions * multiplier;
};

/**
 * Deterministic Repayment Schedule Generator
 * Handles FLAT and DECLINING_BALANCE with different amortization strategies.
 */
export const generateRepaymentSchedule = (loan: Partial<Loan>, product: LoanProduct): RepaymentScheduleItem[] => {
    const schedule: RepaymentScheduleItem[] = [];
    const principal = Number(loan.amount || product.principal);
    const n = product.numberOfRepayments;
    const periodicRate = Number(product.interestRatePerPeriod) / 100;
    const startDate = new Date(loan.applicationDate || new Date().toISOString());

    if (product.interestType === InterestType.FLAT) {
        const totalInterest = principal * periodicRate * n;
        const installmentPrincipal = principal / n;
        const installmentInterest = totalInterest / n;
        const installmentTotal = installmentPrincipal + installmentInterest;

        let currentDate = new Date(startDate);
        for (let i = 1; i <= n; i++) {
            currentDate = addFrequencyOffset(currentDate, product.repaymentEvery, product.repaymentFrequencyType);
            schedule.push({
                dueDate: currentDate.toISOString(),
                principal: installmentPrincipal,
                interest: installmentInterest,
                total: installmentTotal,
                status: RepaymentStatus.PENDING,
            });
        }
    } else {
        // DECLINING_BALANCE
        let remainingPrincipal = principal;
        let currentDate = new Date(startDate);

        if (product.amortizationType === AmortizationType.EQUAL_INSTALLMENTS) {
            // Standard PMT formula: P = (r * PV) / (1 - (1 + r)^-n)
            const periodicTotal = (periodicRate * principal) / (1 - Math.pow(1 + periodicRate, -n));

            for (let i = 1; i <= n; i++) {
                currentDate = addFrequencyOffset(currentDate, product.repaymentEvery, product.repaymentFrequencyType);
                const interest = remainingPrincipal * periodicRate;
                const principalPart = periodicTotal - interest;

                schedule.push({
                    dueDate: currentDate.toISOString(),
                    principal: principalPart,
                    interest: interest,
                    total: periodicTotal,
                    status: RepaymentStatus.PENDING,
                });
                remainingPrincipal -= principalPart;
            }
        } else {
            // EQUAL_PRINCIPAL
            const installmentPrincipal = principal / n;
            for (let i = 1; i <= n; i++) {
                currentDate = addFrequencyOffset(currentDate, product.repaymentEvery, product.repaymentFrequencyType);
                const interest = remainingPrincipal * periodicRate;
                const installmentTotal = installmentPrincipal + interest;

                schedule.push({
                    dueDate: currentDate.toISOString(),
                    principal: installmentPrincipal,
                    interest: interest,
                    total: installmentTotal,
                    status: RepaymentStatus.PENDING,
                });
                remainingPrincipal -= installmentPrincipal;
            }
        }
    }
    return schedule;
};

export const calculateDaysOverdue = (loan: Loan): number => {
    if (loan.status !== LoanStatus.OVERDUE || !loan.repaymentSchedule.length) {
        return 0;
    }
    const today = new Date().getTime();
    const firstOverdueItem = loan.repaymentSchedule.find(item =>
        item.status === RepaymentStatus.OVERDUE || (item.status === RepaymentStatus.PENDING && new Date(item.dueDate).getTime() < today)
    );
    if (!firstOverdueItem) {
        return 0;
    }
    const diffTime = Math.abs(today - new Date(firstOverdueItem.dueDate).getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getNotificationMessage = (type: NotificationType, data: { memberName: string; loan: Loan }): string => {
    const { memberName, loan } = data;
    switch (type) {
        case NotificationType.APPLICATION_RECEIVED:
            return `Dear ${memberName}, your application ${loan.loanApplicationNumber} for ${formatCurrency(Number(loan.amount))} has been received.`;
        case NotificationType.LOAN_APPROVED:
            return `Congratulations ${memberName}! Your loan ${loan.loanApplicationNumber} for ${formatCurrency(Number(loan.amount))} has been approved.`;
        case NotificationType.LOAN_REJECTED:
            return `Dear ${memberName}, we regret to inform you that your application ${loan.loanApplicationNumber} has been rejected.`;
        case NotificationType.LOAN_CLEARED:
            return `Congratulations ${memberName}! Your loan ${loan.loanApplicationNumber} has been fully paid.`;
        case NotificationType.LOAN_DISBURSED:
            return `Dear ${memberName}, your loan ${loan.loanApplicationNumber} for ${formatCurrency(Number(loan.amount))} has been disbursed to your wallet.`;
        default:
            return `Update regarding your account.`;
    }
};

export const generateRandomPassword = (length: number = 10): string => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    return Array.from(array)
        .map(n => charset[n % charset.length])
        .join('');
};
