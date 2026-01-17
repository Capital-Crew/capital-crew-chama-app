
import { Decimal } from 'decimal.js';

// Configure Decimal precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export interface LoanBalances {
    penalty: number;
    fees: number;
    interest: number;
    principal: number;
}

export interface RepaymentDistribution {
    paidPenalty: number;
    paidFees: number;
    paidInterest: number;
    paidPrincipal: number;
    remainingOverpayment: number;
}

/**
 * Distributes a repayment amount across loan components in a strict waterfall order:
 * 1. Penalties
 * 2. Fees
 * 3. Interest
 * 4. Principal
 * 5. Excess (Return/Overpayment)
 */
export function distributeRepayment(
    paymentAmount: number,
    balances: LoanBalances
): RepaymentDistribution {
    let remaining = new Decimal(paymentAmount);

    const result = {
        paidPenalty: new Decimal(0),
        paidFees: new Decimal(0),
        paidInterest: new Decimal(0),
        paidPrincipal: new Decimal(0),
        remainingOverpayment: new Decimal(0)
    };

    // 1. Pay Penalties
    if (remaining.gt(0) && balances.penalty > 0) {
        const toPay = Decimal.min(remaining, new Decimal(balances.penalty));
        result.paidPenalty = toPay;
        remaining = remaining.minus(toPay);
    }

    // 2. Pay Fees
    if (remaining.gt(0) && balances.fees > 0) {
        const toPay = Decimal.min(remaining, new Decimal(balances.fees));
        result.paidFees = toPay;
        remaining = remaining.minus(toPay);
    }

    // 3. Pay Interest
    if (remaining.gt(0) && balances.interest > 0) {
        const toPay = Decimal.min(remaining, new Decimal(balances.interest));
        result.paidInterest = toPay;
        remaining = remaining.minus(toPay);
    }

    // 4. Pay Principal
    if (remaining.gt(0) && balances.principal > 0) {
        const toPay = Decimal.min(remaining, new Decimal(balances.principal));
        result.paidPrincipal = toPay;
        remaining = remaining.minus(toPay);
    }

    // 5. Calculate Overpayment
    if (remaining.gt(0)) {
        result.remainingOverpayment = remaining;
    }

    return {
        paidPenalty: result.paidPenalty.toNumber(),
        paidFees: result.paidFees.toNumber(),
        paidInterest: result.paidInterest.toNumber(),
        paidPrincipal: result.paidPrincipal.toNumber(),
        remainingOverpayment: result.remainingOverpayment.toNumber()
    };
}
