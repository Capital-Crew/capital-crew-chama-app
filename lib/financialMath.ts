import Decimal from 'decimal.js'

// Configure Decimal.js for financial calculations
Decimal.set({
    precision: 20,
    rounding: Decimal.ROUND_HALF_UP
})

/**
 * Convert a value to Decimal for precise calculations
 */
export function toDecimal(value: number | string | Decimal): Decimal {
    return new Decimal(value)
}

/**
 * Convert Decimal back to number for UI rendering
 */
export function toNumber(decimal: Decimal): number {
    return decimal.toNumber()
}

/**
 * Format amount as currency (KES)
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount)
}
