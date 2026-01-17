import {
    Loan, Income, IncomeCategory, LoanProduct, RepaymentScheduleItem, RepaymentStatus, NotificationType, LoanStatus,
    RepaymentFrequencyType, InterestType, AmortizationType
} from './types';
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
    }).format(amount);
};

export const formatDate = (dateString: string | Date): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export const calculateOutstandingBalance = (loan: Loan, incomes: Income[]): number => {
    const totalPaidForLoan = incomes
        .filter(i => i.loanId === loan.id)
        .reduce((sum, income) => {
            if (income.category !== IncomeCategory.MONTHLY_CONTRIBUTION && income.category !== IncomeCategory.NON_LOAN_PENALTY) {
                return sum + income.amount;
            }
            return sum;
        }, 0);

    // Use penalties if exist, or 0.
    const totalRepayable = loan.repaymentSchedule.reduce((sum, item) => sum + item.total, 0) + (loan.penalties || 0);

    return Math.max(0, totalRepayable - totalPaidForLoan);
};

export const calculateAllOutstandingBalances = (memberId: string, loans: Loan[], incomes: Income[]): number => {
    return loans
        .filter(l => l.memberId === memberId && (l.status === LoanStatus.ACTIVE || l.status === LoanStatus.OVERDUE))
        .reduce((sum, loan) => sum + calculateOutstandingBalance(loan, incomes), 0);
};

export const calculateOutstandingPrincipal = (loan: Loan, incomes: Income[]): number => {
    const totalPaidForRepayment = incomes
        .filter(i => i.loanId === loan.id && i.category === IncomeCategory.LOAN_REPAYMENT)
        .reduce((sum, income) => sum + (income.principalAmount || 0), 0);

    return Math.max(0, loan.amount - totalPaidForRepayment);
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
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `LN-${year}${month}-`;

    const sequence = loans.filter(l => l.loanApplicationNumber.startsWith(prefix)).length + 1;
    return `${prefix}${sequence.toString().padStart(3, '0')}`;
};

export const calculateTotalContributions = (memberId: string, incomes: Income[]): number => {
    return incomes
        .filter(i => i.memberId === memberId && i.category === IncomeCategory.MONTHLY_CONTRIBUTION)
        .reduce((sum, income) => sum + income.amount, 0);
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
    const principal = loan.amount || product.principal;
    const n = product.numberOfRepayments;
    const periodicRate = product.interestRatePerPeriod / 100;
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
            return `Dear ${memberName}, your application ${loan.loanApplicationNumber} for ${formatCurrency(loan.amount)} has been received.`;
        case NotificationType.LOAN_APPROVED:
            return `Congratulations ${memberName}! Your loan ${loan.loanApplicationNumber} for ${formatCurrency(loan.amount)} has been approved.`;
        case NotificationType.LOAN_REJECTED:
            return `Dear ${memberName}, we regret to inform you that your application ${loan.loanApplicationNumber} has been rejected.`;
        case NotificationType.LOAN_CLEARED:
            return `Congratulations ${memberName}! Your loan ${loan.loanApplicationNumber} has been fully paid.`;
        default:
            return `Update regarding your account.`;
    }
};
