import { Decimal } from 'decimal.js';
import { addMonths } from 'date-fns';
import { toDecimal, toNumber } from '@/lib/financialMath';

// Configure Decimal for precise calculations
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export type RepaymentMode = 'AT_MATURITY' | 'COUPON' | 'EMI_FLAT' | 'EMI_REDUCING';
export type PaymentType = 'DIVIDEND' | 'DIVIDEND_STUB' | 'PRINCIPAL' | 'PRINCIPAL_AND_DIVIDEND' | 'EMI' | 'EMI_STUB';

export interface ScheduleEvent {
    eventNumber: number;
    paymentType: PaymentType;
    dueDate: Date;
    openingBalance: number;
    closingBalance: number;
    principalComponent: number;
    interestComponent: number;
    groupAmount: number;
    isStubPeriod: boolean;
    stubPeriodMonths?: number;
    periodLabel?: string;
}

export interface ScheduleInput {
    principal: number;
    annualInterestRate: number; // e.g. 12 for 12%
    tenorMonths: number;
    paymentIntervalMonths: number;
    repaymentMode: RepaymentMode;
    closureDate: Date;
}

export class CLNRepaymentService {
    /**
     * Generate the group-level payment schedule
     */
    static generateSchedule(input: ScheduleInput): ScheduleEvent[] {
        const { repaymentMode } = input;

        switch (repaymentMode) {
            case 'AT_MATURITY':
                return this.calculateAtMaturity(input);
            case 'COUPON':
                return this.calculateCoupon(input);
            case 'EMI_FLAT':
                return this.calculateEMIFlat(input);
            case 'EMI_REDUCING':
                return this.calculateEMIReducing(input);
            default:
                throw new Error(`Unsupported repayment mode: ${repaymentMode}`);
        }
    }

    private static calculateAtMaturity(input: ScheduleInput): ScheduleEvent[] {
        const P = new Decimal(input.principal);
        const r_monthly = new Decimal(input.annualInterestRate).dividedBy(100).dividedBy(12);
        const tenor = input.tenorMonths;

        const interest = P.times(r_monthly).times(tenor);
        const total = P.plus(interest);

        return [{
            eventNumber: 1,
            paymentType: 'PRINCIPAL_AND_DIVIDEND',
            dueDate: addMonths(input.closureDate, tenor),
            openingBalance: toNumber(P),
            closingBalance: 0,
            principalComponent: toNumber(P),
            interestComponent: toNumber(interest),
            groupAmount: toNumber(total),
            isStubPeriod: false,
            periodLabel: `Month ${tenor}`
        }];
    }

    private static calculateCoupon(input: ScheduleInput): ScheduleEvent[] {
        const P = new Decimal(input.principal);
        const r_monthly = new Decimal(input.annualInterestRate).dividedBy(100).dividedBy(12);
        const k = input.paymentIntervalMonths;
        const tenor = input.tenorMonths;

        const fullPeriods = Math.floor(tenor / k);
        const stubMonths = tenor % k;
        const events: ScheduleEvent[] = [];

        // 1. Full period events
        for (let i = 1; i <= fullPeriods; i++) {
            const interest = P.times(r_monthly).times(k);
            events.push({
                eventNumber: i,
                paymentType: 'DIVIDEND',
                dueDate: addMonths(input.closureDate, i * k),
                openingBalance: toNumber(P),
                closingBalance: toNumber(P),
                principalComponent: 0,
                interestComponent: toNumber(interest),
                groupAmount: toNumber(interest),
                isStubPeriod: false,
                periodLabel: `Interval ${i}`
            });
        }

        // 2. Stub event
        if (stubMonths > 0) {
            const interest = P.times(r_monthly).times(stubMonths);
            events.push({
                eventNumber: events.length + 1,
                paymentType: 'DIVIDEND_STUB',
                dueDate: addMonths(input.closureDate, tenor),
                openingBalance: toNumber(P),
                closingBalance: toNumber(P),
                principalComponent: 0,
                interestComponent: toNumber(interest),
                groupAmount: toNumber(interest),
                isStubPeriod: true,
                stubPeriodMonths: stubMonths,
                periodLabel: 'Stub Period'
            });
        }

        // 3. Final Maturity Event (Principal)
        events.push({
            eventNumber: events.length + 1,
            paymentType: 'PRINCIPAL',
            dueDate: addMonths(input.closureDate, tenor),
            openingBalance: toNumber(P),
            closingBalance: 0,
            principalComponent: toNumber(P),
            interestComponent: 0,
            groupAmount: toNumber(P),
            isStubPeriod: false,
            periodLabel: 'Maturity'
        });

        return events;
    }

    private static calculateEMIFlat(input: ScheduleInput): ScheduleEvent[] {
        const P = new Decimal(input.principal);
        const r_monthly = new Decimal(input.annualInterestRate).dividedBy(100).dividedBy(12);
        const k = input.paymentIntervalMonths;
        const tenor = input.tenorMonths;

        const fullPeriods = Math.floor(tenor / k);
        const stubMonths = tenor % k;
        const events: ScheduleEvent[] = [];

        const perPeriodInterest = P.times(r_monthly).times(k);
        const perPeriodPrincipal = P.times(k).dividedBy(tenor);

        let currentBalance = P;

        for (let i = 1; i <= fullPeriods; i++) {
            const openingBal = currentBalance;
            currentBalance = currentBalance.minus(perPeriodPrincipal);
            
            events.push({
                eventNumber: i,
                paymentType: 'EMI',
                dueDate: addMonths(input.closureDate, i * k),
                openingBalance: toNumber(openingBal),
                closingBalance: toNumber(currentBalance),
                principalComponent: toNumber(perPeriodPrincipal),
                interestComponent: toNumber(perPeriodInterest),
                groupAmount: toNumber(perPeriodInterest.plus(perPeriodPrincipal)),
                isStubPeriod: false,
                periodLabel: `Interval ${i}`
            });
        }

        if (stubMonths > 0) {
            const interest = P.times(r_monthly).times(stubMonths);
            const principal = currentBalance; // Take remaining

            events.push({
                eventNumber: events.length + 1,
                paymentType: 'EMI_STUB',
                dueDate: addMonths(input.closureDate, tenor),
                openingBalance: toNumber(currentBalance),
                closingBalance: 0,
                principalComponent: toNumber(principal),
                interestComponent: toNumber(interest),
                groupAmount: toNumber(interest.plus(principal)),
                isStubPeriod: true,
                stubPeriodMonths: stubMonths,
                periodLabel: 'Stub Period'
            });
        }

        return events;
    }

    private static calculateEMIReducing(input: ScheduleInput): ScheduleEvent[] {
        const P = new Decimal(input.principal);
        const r_monthly = new Decimal(input.annualInterestRate).dividedBy(100).dividedBy(12);
        const k = input.paymentIntervalMonths;
        const tenor = input.tenorMonths;

        const fullPeriods = Math.floor(tenor / k);
        const stubMonths = tenor % k;
        
        // Effective rate per period: r_period = (1 + r_monthly)^k - 1
        const r_period = new Decimal(1).plus(r_monthly).pow(k).minus(1);
        
        // EMI formula for n full periods
        // EMI = P * r_period * (1 + r_period)^n / ((1 + r_period)^n - 1)
        const n = fullPeriods;
        const numerator = P.times(r_period).times(new Decimal(1).plus(r_period).pow(n));
        const denominator = new Decimal(1).plus(r_period).pow(n).minus(1);
        const EMI = numerator.dividedBy(denominator);

        const events: ScheduleEvent[] = [];
        let currentBalance = P;

        for (let t = 1; t <= n; t++) {
            const openingBal = currentBalance;
            const interest = currentBalance.times(r_period);
            const principal = EMI.minus(interest);
            currentBalance = currentBalance.minus(principal);

            events.push({
                eventNumber: t,
                paymentType: 'EMI',
                dueDate: addMonths(input.closureDate, t * k),
                openingBalance: toNumber(openingBal),
                closingBalance: toNumber(currentBalance),
                principalComponent: toNumber(principal),
                interestComponent: toNumber(interest),
                groupAmount: toNumber(EMI),
                isStubPeriod: false,
                periodLabel: `Interval ${t}`
            });
        }

        if (stubMonths > 0) {
            const r_stub = new Decimal(1).plus(r_monthly).pow(stubMonths).minus(1);
            const openingBal = currentBalance;
            const interest = currentBalance.times(r_stub);
            const principal = currentBalance;
            const total = interest.plus(principal);

            events.push({
                eventNumber: events.length + 1,
                paymentType: 'EMI_STUB',
                dueDate: addMonths(input.closureDate, tenor),
                openingBalance: toNumber(openingBal),
                closingBalance: 0,
                principalComponent: toNumber(principal),
                interestComponent: toNumber(interest),
                groupAmount: toNumber(total),
                isStubPeriod: true,
                stubPeriodMonths: stubMonths,
                periodLabel: 'Stub Period'
            });
        }

        return events;
    }

    /**
     * Allocate residual cents using Largest Remainder Method
     * 1. Calculate each subscriber's exact share (unrounded)
     * 2. Round each to 2 decimal places using ROUND_HALF_UP
     * 3. Calculate residual = totalGroupAmount - sum(rounded amounts)
     * 4. Sort subscribers by amount (desc) then by subscribedAt (asc)
     * 5. Distribute residual (±0.01 increments) to sorted subscribers
     */
    static allocateResiduals(
        totalGroupAmount: number,
        subscribers: { id: string, sharePct: number, amount: number, subscribedAt: Date }[]
    ): { subscriberId: string, amount: number, isResidualRecipient: boolean, residualAmount: number }[] {
        const total = new Decimal(totalGroupAmount);
        let sumRounded = new Decimal(0);
        
        // 1 & 2. Calculate rounded portions
        const results = subscribers.map(sub => {
            const exact = total.times(new Decimal(sub.sharePct).dividedBy(100));
            const rounded = exact.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
            sumRounded = sumRounded.plus(rounded);
            
            return {
                subscriberId: sub.id,
                amount: rounded,
                isResidualRecipient: false,
                residualAmount: new Decimal(0),
                originalAmount: sub.amount, // for sorting ties
                subscribedAt: sub.subscribedAt // for sorting ties
            };
        });

        // 3. Calculate residual
        let residual = total.minus(sumRounded);
        
        if (residual.isZero()) return results.map(r => ({
            subscriberId: r.subscriberId,
            amount: r.amount.toNumber(),
            isResidualRecipient: r.isResidualRecipient,
            residualAmount: r.residualAmount.toNumber()
        }));

        // 4. Sort for distribution
        // Primary: Subscription Amount (desc)
        // Secondary: earliest subscribedAt (asc)
        const sorted = [...results].sort((a, b) => {
            if (b.originalAmount !== a.originalAmount) return b.originalAmount - a.originalAmount;
            return a.subscribedAt.getTime() - b.subscribedAt.getTime();
        });

        // 5. Distribute residual
        const increment = residual.isPositive() ? new Decimal(0.01) : new Decimal(-0.01);
        let remainingSteps = residual.abs().dividedBy(0.01).round().toNumber();

        for (let i = 0; i < remainingSteps; i++) {
            const index = i % sorted.length;
            sorted[index].amount = sorted[index].amount.plus(increment);
            sorted[index].residualAmount = sorted[index].residualAmount.plus(increment);
            sorted[index].isResidualRecipient = true;
        }

        return results.map(r => ({
            subscriberId: r.subscriberId,
            amount: r.amount.toNumber(),
            isResidualRecipient: r.isResidualRecipient,
            residualAmount: r.residualAmount.toNumber()
        }));
    }
}
