/**
 * Currency Utility - Strict "No Rounding Up" Policy
 * 
 * This module enforces TRUNCATION (floor) instead of rounding for all monetary values.
 * 
 * CRITICAL RULES:
 * 1. NEVER use .toFixed() - it rounds up at 0.5
 * 2. NEVER use Math.round() - it rounds up at 0.5
 * 3. ALWAYS use Math.floor() for truncation
 * 4. ALL monetary values must be truncated to 2 decimal places
 * 
 * Examples:
 * - 100.999 → 100.99 (NOT 101.00)
 * - 100.566 → 100.56 (NOT 100.57)
 * - 100.001 → 100.00 (NOT 100.00)
 */

import { Decimal } from 'decimal.js';

/**
 * Truncate a number to specified decimal places WITHOUT rounding
 * 
 * @param value - The number to truncate
 * @param decimals - Number of decimal places (default: 2)
 * @returns Truncated number
 * 
 * @example
 * truncateToDecimals(100.999, 2) // Returns 100.99
 * truncateToDecimals(100.566, 2) // Returns 100.56
 */
export function truncateToDecimals(value: number | string | Decimal, decimals: number = 2): number {
    // Handle null/undefined
    if (value === null || value === undefined || value === '') {
        return 0;
    }

    // Convert to number if string
    const numValue = typeof value === 'string' ? parseFloat(value) :
        value instanceof Decimal ? value.toNumber() :
            value;

    // Handle NaN
    if (isNaN(numValue)) {
        return 0;
    }

    // Truncate using Math.floor to avoid rounding
    // Multiply by 10^decimals, floor, then divide back
    const multiplier = Math.pow(10, decimals);
    return Math.floor(numValue * multiplier) / multiplier;
}

/**
 * Format a monetary value as a string with strict truncation
 * 
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 * 
 * @example
 * formatMoney(100.999) // Returns "100.99"
 * formatMoney(100.566, { decimals: 2 }) // Returns "100.56"
 * formatMoney(1234567.89, { includeSymbol: true }) // Returns "KES 1,234,567.89"
 */
export function formatMoney(
    amount: number | string | Decimal,
    options: {
        decimals?: number;
        includeSymbol?: boolean;
        symbol?: string;
        locale?: string;
    } = {}
): string {
    const {
        decimals = 2,
        includeSymbol = false,
        symbol = 'KES',
        locale = 'en-KE'
    } = options;

    // Truncate first (NEVER round)
    const truncated = truncateToDecimals(amount, decimals);

    // Convert to string with exact decimal places using string manipulation
    // This avoids any rounding that Intl.NumberFormat might do
    const parts = truncated.toString().split('.');
    const integerPart = parts[0];
    const decimalPart = (parts[1] || '').padEnd(decimals, '0').slice(0, decimals);

    // Format integer part with thousand separators
    const formattedInteger = parseInt(integerPart).toLocaleString(locale, {
        useGrouping: true,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });

    // Combine parts
    const formattedAmount = decimals > 0
        ? `${formattedInteger}.${decimalPart}`
        : formattedInteger;

    return includeSymbol ? `${symbol} ${formattedAmount}` : formattedAmount;
}

/**
 * Format currency with symbol (shorthand for formatMoney with includeSymbol: true)
 * 
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string with symbol
 * 
 * @example
 * formatCurrency(100.999) // Returns "KES 100.99"
 */
export function formatCurrency(amount: number | string | Decimal, decimals: number = 2): string {
    return formatMoney(amount, { decimals, includeSymbol: true });
}

/**
 * Parse a currency string to a truncated number
 * Removes currency symbols and thousand separators
 * 
 * @param value - Currency string to parse
 * @returns Truncated number
 * 
 * @example
 * parseCurrency("KES 1,234.56") // Returns 1234.56
 * parseCurrency("1,234.999") // Returns 1234.99
 */
export function parseCurrency(value: string): number {
    if (!value) return 0;

    // Remove currency symbols, spaces, and commas
    const cleaned = value.replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);

    return truncateToDecimals(parsed, 2);
}

/**
 * Add two monetary values with truncation (no rounding)
 * 
 * @param a - First value
 * @param b - Second value
 * @returns Sum, truncated to 2 decimals
 */
export function addMoney(a: number | string | Decimal, b: number | string | Decimal): number {
    const numA = typeof a === 'string' ? parseFloat(a) : a instanceof Decimal ? a.toNumber() : a;
    const numB = typeof b === 'string' ? parseFloat(b) : b instanceof Decimal ? b.toNumber() : b;

    return truncateToDecimals(numA + numB, 2);
}

/**
 * Subtract two monetary values with truncation (no rounding)
 * 
 * @param a - First value
 * @param b - Second value
 * @returns Difference, truncated to 2 decimals
 */
export function subtractMoney(a: number | string | Decimal, b: number | string | Decimal): number {
    const numA = typeof a === 'string' ? parseFloat(a) : a instanceof Decimal ? a.toNumber() : a;
    const numB = typeof b === 'string' ? parseFloat(b) : b instanceof Decimal ? b.toNumber() : b;

    return truncateToDecimals(numA - numB, 2);
}

/**
 * Multiply a monetary value by a number with truncation (no rounding)
 * 
 * @param amount - Monetary value
 * @param multiplier - Number to multiply by
 * @returns Product, truncated to 2 decimals
 */
export function multiplyMoney(amount: number | string | Decimal, multiplier: number): number {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) :
        amount instanceof Decimal ? amount.toNumber() :
            amount;

    return truncateToDecimals(numAmount * multiplier, 2);
}

/**
 * Calculate percentage of a monetary value with truncation (no rounding)
 * 
 * @param amount - Base amount
 * @param percentage - Percentage (e.g., 2.5 for 2.5%)
 * @returns Calculated amount, truncated to 2 decimals
 * 
 * @example
 * calculatePercentage(1000, 2.5) // Returns 25.00 (2.5% of 1000)
 */
export function calculatePercentage(amount: number | string | Decimal, percentage: number): number {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) :
        amount instanceof Decimal ? amount.toNumber() :
            amount;

    return truncateToDecimals((numAmount * percentage) / 100, 2);
}

/**
 * Convert Prisma Decimal to truncated number
 * 
 * @param decimal - Prisma Decimal value
 * @returns Truncated number
 */
export function decimalToNumber(decimal: Decimal | null | undefined): number {
    if (!decimal) return 0;
    return truncateToDecimals(decimal.toNumber(), 2);
}

/**
 * Convert number to Prisma Decimal with truncation
 * 
 * @param value - Number to convert
 * @returns Prisma Decimal
 */
export function numberToDecimal(value: number | string): Decimal {
    const truncated = truncateToDecimals(value, 2);
    return new Decimal(truncated);
}
