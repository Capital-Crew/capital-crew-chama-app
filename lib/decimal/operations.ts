/**
 * Decimal Operations - Safe arithmetic and comparison operations
 * 
 * This module provides wrapper functions for decimal arithmetic and comparisons
 * to ensure all financial calculations use decimal.js methods instead of
 * native JavaScript operators.
 */

import { Decimal, MoneyDecimal, RateDecimal, PercentDecimal, PRECISION } from './config'

// ============================================================================
// ARITHMETIC OPERATIONS
// ============================================================================

/**
 * Add two decimal values
 * @param a First value (string or Decimal)
 * @param b Second value (string or Decimal)
 * @returns Sum as Decimal
 * 
 * @example
 * add("0.1", "0.2") // Returns Decimal("0.3")
 */
export function add(a: Decimal.Value, b: Decimal.Value): Decimal {
    return new Decimal(a).plus(b)
}

/**
 * Subtract two decimal values
 * @param a Minuend (string or Decimal)
 * @param b Subtrahend (string or Decimal)
 * @returns Difference as Decimal
 */
export function subtract(a: Decimal.Value, b: Decimal.Value): Decimal {
    return new Decimal(a).minus(b)
}

/**
 * Multiply two decimal values
 * @param a First value (string or Decimal)
 * @param b Second value (string or Decimal)
 * @returns Product as Decimal
 */
export function multiply(a: Decimal.Value, b: Decimal.Value): Decimal {
    return new Decimal(a).times(b)
}

/**
 * Divide two decimal values
 * @param a Dividend (string or Decimal)
 * @param b Divisor (string or Decimal)
 * @returns Quotient as Decimal
 * @throws Error if divisor is zero
 */
export function divide(a: Decimal.Value, b: Decimal.Value): Decimal {
    const divisor = new Decimal(b)
    if (divisor.isZero()) {
        throw new Error('Division by zero')
    }
    return new Decimal(a).dividedBy(divisor)
}

/**
 * Calculate percentage of a value
 * @param value Base value
 * @param percent Percentage (e.g., "2.5" for 2.5%)
 * @returns Calculated percentage amount
 * 
 * @example
 * percentOf("1000", "2.5") // Returns Decimal("25")
 */
export function percentOf(value: Decimal.Value, percent: Decimal.Value): Decimal {
    return new Decimal(value).times(new Decimal(percent).dividedBy(100))
}

// ============================================================================
// COMPARISON OPERATIONS
// ============================================================================

/**
 * Check if two values are equal
 * @param a First value
 * @param b Second value
 * @returns true if equal
 */
export function equals(a: Decimal.Value, b: Decimal.Value): boolean {
    return new Decimal(a).equals(b)
}

/**
 * Check if a > b
 */
export function greaterThan(a: Decimal.Value, b: Decimal.Value): boolean {
    return new Decimal(a).greaterThan(b)
}

/**
 * Check if a >= b
 */
export function greaterThanOrEqual(a: Decimal.Value, b: Decimal.Value): boolean {
    return new Decimal(a).greaterThanOrEqualTo(b)
}

/**
 * Check if a < b
 */
export function lessThan(a: Decimal.Value, b: Decimal.Value): boolean {
    return new Decimal(a).lessThan(b)
}

/**
 * Check if a <= b
 */
export function lessThanOrEqual(a: Decimal.Value, b: Decimal.Value): boolean {
    return new Decimal(a).lessThanOrEqualTo(b)
}

/**
 * Compare two values
 * @returns -1 if a < b, 0 if a == b, 1 if a > b
 */
export function compare(a: Decimal.Value, b: Decimal.Value): -1 | 0 | 1 {
    return new Decimal(a).comparedTo(b)
}

/**
 * Get the minimum of multiple values
 */
export function min(...values: Decimal.Value[]): Decimal {
    if (values.length === 0) throw new Error('min requires at least one value')
    return Decimal.min(...values)
}

/**
 * Get the maximum of multiple values
 */
export function max(...values: Decimal.Value[]): Decimal {
    if (values.length === 0) throw new Error('max requires at least one value')
    return Decimal.max(...values)
}

// ============================================================================
// ROUNDING OPERATIONS
// ============================================================================

/**
 * Round a monetary value for storage (4 decimal places)
 * @param value Value to round
 * @returns Rounded Decimal
 */
export function roundForStorage(value: Decimal.Value): Decimal {
    return new MoneyDecimal(value).toDecimalPlaces(PRECISION.MONEY.scale)
}

/**
 * Round a monetary value for display (2 decimal places)
 * @param value Value to round
 * @returns Rounded string
 */
export function roundForDisplay(value: Decimal.Value): string {
    return new MoneyDecimal(value).toFixed(PRECISION.DISPLAY.money)
}

/**
 * Round a rate for storage (6 decimal places)
 */
export function roundRateForStorage(value: Decimal.Value): Decimal {
    return new RateDecimal(value).toDecimalPlaces(PRECISION.RATE.scale)
}

/**
 * Round a rate for display (4 decimal places)
 */
export function roundRateForDisplay(value: Decimal.Value): string {
    return new RateDecimal(value).toFixed(PRECISION.DISPLAY.rate)
}

/**
 * Round a percentage for storage (2 decimal places)
 */
export function roundPercentForStorage(value: Decimal.Value): Decimal {
    return new PercentDecimal(value).toDecimalPlaces(PRECISION.PERCENT.scale)
}

/**
 * Round a percentage for display (2 decimal places)
 */
export function roundPercentForDisplay(value: Decimal.Value): string {
    return new PercentDecimal(value).toFixed(PRECISION.DISPLAY.percent)
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a value is zero
 */
export function isZero(value: Decimal.Value): boolean {
    return new Decimal(value).isZero()
}

/**
 * Check if a value is positive
 */
export function isPositive(value: Decimal.Value): boolean {
    return new Decimal(value).isPositive()
}

/**
 * Check if a value is negative
 */
export function isNegative(value: Decimal.Value): boolean {
    return new Decimal(value).isNegative()
}

/**
 * Get absolute value
 */
export function abs(value: Decimal.Value): Decimal {
    return new Decimal(value).abs()
}

/**
 * Negate a value
 */
export function negate(value: Decimal.Value): Decimal {
    return new Decimal(value).negated()
}

/**
 * Sum an array of values
 */
export function sum(values: Decimal.Value[]): Decimal {
    return values.reduce((acc, val) => acc.plus(val), new Decimal(0))
}
