/**
 * Decimal.js Configuration for Financial Calculations
 * 
 * This module configures decimal.js-light for precise financial calculations,
 * eliminating floating-point errors and ensuring regulatory compliance.
 * 
 * @see https://mikemcl.github.io/decimal.js-light/
 */

import Decimal from 'decimal.js-light'


/**
 * Global Decimal configuration
 * - Precision: 20 significant digits (handles most financial calculations)
 * - Rounding: ROUND_HALF_UP (standard "round half up" for regulatory compliance)
 */
Decimal.set({
    precision: 20,
    rounding: Decimal.ROUND_HALF_UP,
    toExpNeg: -9e15,
    toExpPos: 9e15,
})


/**
 * MoneyDecimal - For monetary amounts (currency)
 * 
 * Configuration:
 * - Precision: 19 digits
 * - Rounding: ROUND_HALF_UP
 * - Use for: Loan amounts, balances, fees, payments
 * - Storage: Decimal(19, 4) in database
 * - Display: Round to 2 decimal places
 * 
 * @example
 * const amount = new MoneyDecimal("1234.5678")
 * const rounded = amount.toDecimalPlaces(2) // "1234.57"
 */
export const MoneyDecimal = Decimal;
export type MoneyDecimal = Decimal;

/**
 * RateDecimal - For interest rates and other rates
 * 
 * Configuration:
 * - Precision: 16 digits (higher accuracy for rate calculations)
 * - Rounding: ROUND_HALF_UP
 * - Use for: Interest rates, penalty rates, exchange rates
 * - Storage: Decimal(10, 6) in database
 * - Display: Round to 4-6 decimal places
 * 
 * @example
 * const rate = new RateDecimal("0.125") // 12.5%
 * const monthly = rate.dividedBy(12) // Monthly rate
 */
export const RateDecimal = Decimal;
export type RateDecimal = Decimal;

// Configure RateDecimal
// RateDecimal.set(RateDecimal.config())

/**
 * PercentDecimal - For percentage values
 * 
 * Configuration:
 * - Precision: 10 digits
 * - Rounding: ROUND_HALF_UP
 * - Use for: Processing fees, insurance percentages, tax rates
 * - Storage: Decimal(5, 2) in database
 * - Display: Round to 2 decimal places
 * 
 * @example
 * const fee = new PercentDecimal("2.5") // 2.5%
 * const amount = new MoneyDecimal("1000")
 * const feeAmount = amount.times(fee.dividedBy(100))
 */
export const PercentDecimal = Decimal;
export type PercentDecimal = Decimal;

// Configure PercentDecimal
// PercentDecimal.set(PercentDecimal.config())


/**
 * Precision constants for different financial data types
 */
export const PRECISION = {
    /** Monetary amounts: 19 total digits, 4 decimal places */
    MONEY: { total: 19, scale: 4 },

    /** Interest rates: 10 total digits, 6 decimal places */
    RATE: { total: 10, scale: 6 },

    /** Percentages: 5 total digits, 2 decimal places */
    PERCENT: { total: 5, scale: 2 },

    /** Display precision for user interface */
    DISPLAY: {
        money: 2,      // Show 2 decimal places for currency
        rate: 4,       // Show 4 decimal places for rates
        percent: 2,    // Show 2 decimal places for percentages
    },
} as const

/**
 * Rounding modes
 */
export const ROUNDING = {
    HALF_UP: Decimal.ROUND_HALF_UP,
    HALF_DOWN: Decimal.ROUND_HALF_DOWN,
    HALF_EVEN: Decimal.ROUND_HALF_EVEN,
    UP: Decimal.ROUND_UP,
    DOWN: Decimal.ROUND_DOWN,
    CEIL: Decimal.ROUND_CEIL,
    FLOOR: Decimal.ROUND_FLOOR,
} as const

// Export base Decimal for general use
export { Decimal }
export default Decimal
