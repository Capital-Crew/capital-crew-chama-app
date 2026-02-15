/**
 * Formats a number or string into Kenya Shillings (KES) currency format.
 * 
 * Safety: Returns "KES 0.00" for null, undefined, or invalid inputs.
 * Standard: Uses Intl.NumberFormat for consistent 'currency' styling.
 * Strictness: Always displays 2 decimal places.
 * 
 * @param amount - The value to format (number | string | null | undefined)
 * @returns Formatted currency string (e.g., "KES 1,500.00")
 */
export function formatCurrency(amount: number | string | null | undefined): string {
    // 1. Handle Null/Undefined/Empty immediately
    if (amount === null || amount === undefined || amount === '') {
        return "KES 0.00";
    }

    // 2. Convert to Number safety
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    // 3. Check for Invalid Number (NaN)
    if (isNaN(numericAmount)) {
        return "KES 0.00";
    }

    // 4. Format using Intl.NumberFormat
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(numericAmount);
}
