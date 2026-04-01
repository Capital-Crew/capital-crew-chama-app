/**
 * Normalizes Kenyan MSISDNs to the international format (2547XXXXXXXX or 2541XXXXXXXX).
 * 
 * Handles:
 * 07XXXXXXXX       -> 2547XXXXXXXX
 * 7XXXXXXXX        -> 2547XXXXXXXX
 * +2547XXXXXXXX    -> 2547XXXXXXXX
 * 2547XXXXXXXX     -> 2547XXXXXXXX
 * 01XXXXXXXX       -> 2541XXXXXXXX
 * +2541XXXXXXXX    -> 2541XXXXXXXX
 * 
 * @param phone The raw phone number input
 * @returns The normalized 12-digit string starting with 254
 * @throws Error if the number is invalid
 */
export function normalizeMSISDN(phone: string): string {
    // Strip all spaces, dashes, parentheses, plus signs
    let clean = phone.replace(/[\s\-\(\)\+]/g, '');

    // Convert leading 0 to 254
    if (clean.startsWith('0')) {
        clean = '254' + clean.substring(1);
    }

    // Add 254 if it starts with 7 or 1 (9 digits total)
    if ((clean.startsWith('7') || clean.startsWith('1')) && clean.length === 9) {
        clean = '254' + clean;
    }

    // Validate final length = 12 digits starting with 254
    const isValid = /^254(7|1)\d{8}$/.test(clean);

    if (!isValid) {
        throw new Error(`Invalid Kenyan phone number format: ${phone}. Expected 07XXXXXXXX, 01XXXXXXXX or 254XXXXXXXX`);
    }

    return clean;
}
