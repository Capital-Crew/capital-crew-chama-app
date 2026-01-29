/**
 * Migration Examples - Converting from Rounding to Truncation
 * 
 * This file shows before/after examples for migrating to the truncation policy
 */

import { formatMoney, formatCurrency, truncateToDecimals, CurrencyDisplay } from '@/lib/currency';

// ============================================
// EXAMPLE 1: Basic Number Formatting
// ============================================

// ❌ BEFORE (Rounds up)
const oldWay1 = (100.999).toFixed(2); // "101.00" - WRONG!

// ✅ AFTER (Truncates)
const newWay1 = formatMoney(100.999); // "100.99" - CORRECT!

// ============================================
// EXAMPLE 2: Currency Display in Components
// ============================================

// ❌ BEFORE (Rounds up)
function OldComponent({ amount }: { amount: number }) {
    return <span>KES {amount.toFixed(2)}</span>; // WRONG!
}

// ✅ AFTER (Truncates)
function NewComponent({ amount }: { amount: number }) {
    return <CurrencyDisplay amount={amount} />; // CORRECT!
}

// ============================================
// EXAMPLE 3: Fee Calculations
// ============================================

// ❌ BEFORE (Rounds up)
function calculateOldProcessingFee(loanAmount: number, feePercent: number) {
    const fee = (loanAmount * feePercent) / 100;
    return parseFloat(fee.toFixed(2)); // WRONG! Rounds 2500.999 to 2501.00
}

// ✅ AFTER (Truncates)
import { calculatePercentage } from '@/lib/currency';

function calculateNewProcessingFee(loanAmount: number, feePercent: number) {
    return calculatePercentage(loanAmount, feePercent); // CORRECT! Truncates to 2500.99
}

// ============================================
// EXAMPLE 4: Total Deductions
// ============================================

// ❌ BEFORE (Accumulates rounding errors)
function calculateOldTotalDeductions(
    processingFee: number,
    insuranceFee: number,
    shareCapital: number
) {
    const total = processingFee + insuranceFee + shareCapital;
    return parseFloat(total.toFixed(2)); // WRONG!
}

// ✅ AFTER (Precise truncation)
import { addMoney } from '@/lib/currency';

function calculateNewTotalDeductions(
    processingFee: number,
    insuranceFee: number,
    shareCapital: number
) {
    return addMoney(addMoney(processingFee, insuranceFee), shareCapital); // CORRECT!
}

// ============================================
// EXAMPLE 5: Displaying in Tables
// ============================================

// ❌ BEFORE
function OldLoanTable({ loans }: { loans: any[] }) {
    return (
        <table>
            {loans.map(loan => (
                <tr key={loan.id}>
                    <td>{loan.amount.toLocaleString()}</td> {/* MAY ROUND! */}
                </tr>
            ))}
        </table>
    );
}

// ✅ AFTER
function NewLoanTable({ loans }: { loans: any[] }) {
    return (
        <table>
            {loans.map(loan => (
                <tr key={loan.id}>
                    <td><CurrencyDisplay amount={loan.amount} /></td> {/* CORRECT! */}
                </tr>
            ))}
        </table>
    );
}

// ============================================
// EXAMPLE 6: Form Inputs
// ============================================

// ❌ BEFORE
function OldAmountInput({ value, onChange }: any) {
    return (
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
        />
    );
}

// ✅ AFTER
import { CurrencyInput } from '@/components/ui/CurrencyDisplay';

function NewAmountInput({ value, onChange }: any) {
    return (
        <CurrencyInput
            value={value}
            onChange={onChange} // Automatically truncates on blur
        />
    );
}

// ============================================
// EXAMPLE 7: Prisma Decimal Conversion
// ============================================

// ❌ BEFORE
async function getOldLoanAmount(loanId: string) {
    const loan = await prisma.loan.findUnique({ where: { id: loanId } });
    return Number(loan.amount); // May have precision issues
}

// ✅ AFTER
import { decimalToNumber } from '@/lib/currency';

async function getNewLoanAmount(loanId: string) {
    const loan = await prisma.loan.findUnique({ where: { id: loanId } });
    return decimalToNumber(loan.amount); // Truncated to 2 decimals
}

// ============================================
// EXAMPLE 8: API Responses
// ============================================

// ❌ BEFORE
export async function oldGetLoanDetails(loanId: string) {
    const loan = await prisma.loan.findUnique({ where: { id: loanId } });

    return {
        amount: Number(loan.amount).toFixed(2), // WRONG! Returns string
        processingFee: Number(loan.processingFee).toFixed(2)
    };
}

// ✅ AFTER
export async function newGetLoanDetails(loanId: string) {
    const loan = await prisma.loan.findUnique({ where: { id: loanId } });

    return {
        amount: truncateToDecimals(loan.amount, 2), // CORRECT! Returns number
        processingFee: truncateToDecimals(loan.processingFee, 2)
    };
}

// ============================================
// REAL-WORLD SCENARIO: Loan Application
// ============================================

// ❌ BEFORE (Multiple rounding errors)
function oldCalculateLoanDeductions(requestedAmount: number) {
    const processingFee = parseFloat(((requestedAmount * 2) / 100).toFixed(2));
    const insuranceFee = parseFloat(((requestedAmount * 1) / 100).toFixed(2));
    const shareCapital = 500;

    const totalDeductions = parseFloat((processingFee + insuranceFee + shareCapital).toFixed(2));
    const netDisbursement = parseFloat((requestedAmount - totalDeductions).toFixed(2));

    return { processingFee, insuranceFee, shareCapital, totalDeductions, netDisbursement };
}

// ✅ AFTER (Precise truncation throughout)
function newCalculateLoanDeductions(requestedAmount: number) {
    const processingFee = calculatePercentage(requestedAmount, 2);
    const insuranceFee = calculatePercentage(requestedAmount, 1);
    const shareCapital = 500;

    const totalDeductions = addMoney(addMoney(processingFee, insuranceFee), shareCapital);
    const netDisbursement = subtractMoney(requestedAmount, totalDeductions);

    return { processingFee, insuranceFee, shareCapital, totalDeductions, netDisbursement };
}

// Test the difference
console.log('OLD WAY:', oldCalculateLoanDeductions(100000.999));
// Possible output: { processingFee: 2000.02, insuranceFee: 1000.01, ... } - ROUNDED!

console.log('NEW WAY:', newCalculateLoanDeductions(100000.999));
// Output: { processingFee: 2000.01, insuranceFee: 1000.00, ... } - TRUNCATED!
