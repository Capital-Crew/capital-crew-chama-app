/**
 * Input Validation and Conversion for Decimal Values
 * 
 * This module provides validation and conversion utilities to ensure
 * all monetary inputs are properly validated before conversion to Decimal.
 */

import { Decimal, MoneyDecimal, RateDecimal, PercentDecimal } from './config'

// Type alias for Decimal values
type DecimalValue = number | string | Decimal

// ============================================================================
// VALIDATION REGEX PATTERNS
// ============================================================================

/**
 * Regex patterns for validating different types of financial inputs
 */
export const VALIDATION_PATTERNS = {
    /** Monetary amount: up to 15 digits before decimal, up to 4 after */
    MONEY: /^-?\d{1,15}(\.\d{1,4})?$/,

    /** Interest rate: up to 4 digits before decimal, up to 6 after (e.g., 99.999999%) */
    RATE: /^-?\d{1,4}(\.\d{1,6})?$/,

    /** Percentage: up to 3 digits before decimal, up to 2 after (e.g., 100.00%) */
    PERCENT: /^-?\d{1,3}(\.\d{1,2})?$/,

    /** General number: flexible pattern */
    NUMBER: /^-?\d+(\.\d+)?$/,
} as const

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate a monetary amount string
 * @param value String to validate
 * @returns true if valid
 * 
 * @example
 * isValidMoney("1234.56") // true
 * isValidMoney("1234.567890") // false (too many decimals)
 */
export function isValidMoney(value: string): boolean {
    return VALIDATION_PATTERNS.MONEY.test(value)
}

/**
 * Validate an interest rate string
 */
export function isValidRate(value: string): boolean {
    return VALIDATION_PATTERNS.RATE.test(value)
}

/**
 * Validate a percentage string
 */
export function isValidPercent(value: string): boolean {
    return VALIDATION_PATTERNS.PERCENT.test(value)
}

/**
 * Validate a general number string
 */
export function isValidNumber(value: string): boolean {
    return VALIDATION_PATTERNS.NUMBER.test(value)
}

// ============================================================================
// CONVERSION FUNCTIONS WITH VALIDATION
// ============================================================================

/**
 * Convert and validate a monetary amount
 * @param value String value to convert
 * @returns MoneyDecimal instance
 * @throws Error if invalid
 * 
 * @example
 * const amount = toMoney("1234.56")
 */
export function toMoney(value: string | number): MoneyDecimal {
    const strValue = String(value)

    if (!isValidMoney(strValue)) {
        throw new Error(`Invalid monetary amount: ${strValue}`)
    }

    return new MoneyDecimal(strValue)
}

/**
 * Convert and validate an interest rate
 */
export function toRate(value: string | number): RateDecimal {
    const strValue = String(value)

    if (!isValidRate(strValue)) {
        throw new Error(`Invalid rate: ${strValue}`)
    }

    return new RateDecimal(strValue)
}

/**
 * Convert and validate a percentage
 */
export function toPercent(value: string | number): PercentDecimal {
    const strValue = String(value)

    if (!isValidPercent(strValue)) {
        throw new Error(`Invalid percentage: ${strValue}`)
    }

    return new PercentDecimal(strValue)
}

/**
 * Safe conversion - returns null if invalid instead of throwing
 */
export function toMoneySafe(value: string | number): MoneyDecimal | null {
    try {
        return toMoney(value)
    } catch {
        return null
    }
}

/**
 * Safe rate conversion
 */
export function toRateSafe(value: string | number): RateDecimal | null {
    try {
        return toRate(value)
    } catch {
        return null
    }
}

/**
 * Safe percentage conversion
 */
export function toPercentSafe(value: string | number): PercentDecimal | null {
    try {
        return toPercent(value)
    } catch {
        return null
    }
}

// ============================================================================
// API SERIALIZATION HELPERS
// ============================================================================

/**
 * Convert Decimal to string for API response
 * @param value Decimal value
 * @param decimals Number of decimal places (default: 4 for storage)
 * @returns String representation
 * 
 * @example
 * toApiString(new MoneyDecimal("1234.5678")) // "1234.5678"
 * toApiString(new MoneyDecimal("1234.5678"), 2) // "1234.57"
 */
export function toApiString(value: Decimal, decimals: number = 4): string {
    return value.toFixed(decimals)
}

/**
 * Convert Decimal to display string (2 decimal places for money)
 */
export function toDisplayString(value: Decimal): string {
    return value.toFixed(2)
}

/**
 * Parse API string to Decimal
 * @param value String from API
 * @returns Decimal instance
 */
export function fromApiString(value: string): Decimal {
    if (!isValidNumber(value)) {
        throw new Error(`Invalid number from API: ${value}`)
    }
    return new Decimal(value)
}

// ============================================================================
// RANGE VALIDATION
// ============================================================================

/**
 * Validate that a value is within a range
 * @param value Value to check
 * @param min Minimum value (inclusive)
 * @param max Maximum value (inclusive)
 * @returns true if within range
 */
export function isInRange(
    value: DecimalValue,
    min: DecimalValue,
    max: DecimalValue
): boolean {
    const decimal = new Decimal(value)
    return decimal.greaterThanOrEqualTo(min) && decimal.lessThanOrEqualTo(max)
}

/**
 * Validate that a monetary amount is positive
 */
export function isPositiveAmount(value: DecimalValue): boolean {
    return new Decimal(value).isPositive()
}

/**
 * Validate that a monetary amount is non-negative (>= 0)
 */
export function isNonNegativeAmount(value: DecimalValue): boolean {
    return new Decimal(value).greaterThanOrEqualTo(0)
}

// ============================================================================
// SANITIZATION
// ============================================================================

/**
 * Sanitize user input by removing invalid characters
 * @param input Raw user input
 * @returns Sanitized string
 */
export function sanitizeNumericInput(input: string): string {
    // Remove all characters except digits, decimal point, and minus sign
    let sanitized = input.replace(/[^\d.-]/g, '')

    // Ensure only one decimal point
    const parts = sanitized.split('.')
    if (parts.length > 2) {
        sanitized = parts[0] + '.' + parts.slice(1).join('')
    }

    // Ensure minus sign only at the beginning
    if (sanitized.includes('-')) {
        const isNegative = sanitized.indexOf('-') === 0
        sanitized = sanitized.replace(/-/g, '')
        if (isNegative) sanitized = '-' + sanitized
    }

    return sanitized
}
