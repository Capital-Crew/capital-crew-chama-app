import { Decimal } from 'decimal.js-light';

/**
 * Decimal Utility Module
 * 
 * Centralized configuration for decimal.js-light with mandated precision settings:
 * - 20 digits precision
 * - ROUND_HALF_UP rounding mode
 * 
 * Use these utilities for all financial calculations to ensure consistency.
 */

// Configure Decimal.js with required settings
Decimal.set({
    precision: 20,
    rounding: Decimal.ROUND_HALF_UP
});

/**
 * Create a Decimal instance from a number or string
 * Returns Decimal(0) for null/undefined values
 */
export function toDecimal(value: number | string | Decimal | null | undefined): Decimal {
    if (value === null || value === undefined) {
        return new Decimal(0);
    }
    return new Decimal(value);
}

/**
 * Convert Decimal to number (for database storage or display)
 */
export function toNumber(value: Decimal): number {
    return value.toNumber();
}

/**
 * Add two decimal values
 */
export function add(a: number | string | Decimal, b: number | string | Decimal): Decimal {
    return toDecimal(a).plus(toDecimal(b));
}

/**
 * Subtract two decimal values
 */
export function subtract(a: number | string | Decimal, b: number | string | Decimal): Decimal {
    return toDecimal(a).minus(toDecimal(b));
}

/**
 * Multiply two decimal values
 */
export function multiply(a: number | string | Decimal, b: number | string | Decimal): Decimal {
    return toDecimal(a).times(toDecimal(b));
}

/**
 * Divide two decimal values
 */
export function divide(a: number | string | Decimal, b: number | string | Decimal): Decimal {
    return toDecimal(a).dividedBy(toDecimal(b));
}

/**
 * Format a decimal value as currency (KES)
 * Handles null/undefined values by returning "0.00"
 */
export function formatCurrency(value: number | string | Decimal | null | undefined): string {
    if (value === null || value === undefined) {
        return '0.00';
    }

    const num = typeof value === 'number' ? value : toNumber(toDecimal(value));
    return new Intl.NumberFormat('en-KE', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
}

/**
 * Check if a value is zero (within epsilon tolerance)
 */
export function isZero(value: number | string | Decimal, epsilon: number = 0.01): boolean {
    return toDecimal(value).abs().lessThan(epsilon);
}

/**
 * Get the minimum of two decimal values
 */
export function min(a: number | string | Decimal, b: number | string | Decimal): Decimal {
    const da = toDecimal(a);
    const db = toDecimal(b);
    return da.lessThan(db) ? da : db;
}

/**
 * Get the maximum of two decimal values
 */
export function max(a: number | string | Decimal, b: number | string | Decimal): Decimal {
    const da = toDecimal(a);
    const db = toDecimal(b);
    return da.greaterThan(db) ? da : db;
}

// Re-export Decimal class for direct usage
export { Decimal };
