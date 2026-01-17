import { format } from 'date-fns'
import { toDecimal, toNumber } from './financialMath'
import type Decimal from 'decimal.js'

/**
 * Statement row structure for UI display
 */
export interface StatementRow {
    date: string
    txId: string
    description: string
    debit: number | null
    credit: number | null
    runningBalance: number
}


/**
 * Wallet transaction type from Prisma
 */
interface WalletTransaction {
    id: string
    type: string  // DISBURSEMENT, REPAYMENT, CHARGE, DEPOSIT, WITHDRAWAL, etc.
    amount: number
    description: string
    createdAt: Date
    principalAmount?: number
    interestAmount?: number
    penaltyAmount?: number
    feeAmount?: number
}

// ... existing helper functions ...

/**
 * Process raw transactions into statement rows with running balance
 * 
 * Running Balance Logic:
 * - Starts at 0
 * - DEBIT (Disbursement, Charge): Increases balance (money owed by member)
 * - CREDIT (Repayment): Decreases balance (money paid by member)
 */
export function processTransactions(transactions: WalletTransaction[]): StatementRow[] {
    const rows: StatementRow[] = []
    let runningBalance: Decimal = toDecimal(0)

    // Ensure transactions are sorted chronologically (Oldest First)
    const sortedTransactions = [...transactions].sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )

    for (const tx of sortedTransactions) {
        const txAmount = toDecimal(tx.amount)
        let debit: number | null = null
        let credit: number | null = null

        // STRICT Split Logic
        // Normalize type to upstream logic (types coming from getLoanStatement)
        const type = tx.type.toUpperCase()

        let displayDescription = tx.description;

        if (['DISBURSEMENT', 'CHARGE', 'PENALTY', 'INTEREST', 'FEE'].includes(type)) {
            // DEBIT SIDE (Increases Balance)
            debit = toNumber(txAmount)
            runningBalance = runningBalance.plus(txAmount)
        } else if (['REPAYMENT', 'WAIVER', 'PAYMENT'].includes(type)) {
            // CREDIT SIDE (Decreases Balance)
            credit = toNumber(txAmount)
            runningBalance = runningBalance.minus(txAmount)

            // Format Description for Repayments (Waterfall Breakdown)
            if (type === 'REPAYMENT') {
                const parts = [];
                if (tx.penaltyAmount && tx.penaltyAmount > 0) parts.push(`Penalty Paid: ${formatCurrency(tx.penaltyAmount)}`);
                if (tx.feeAmount && tx.feeAmount > 0) parts.push(`Fees Paid: ${formatCurrency(tx.feeAmount)}`);
                if (tx.interestAmount && tx.interestAmount > 0) parts.push(`Interest Paid: ${formatCurrency(tx.interestAmount)}`);
                if (tx.principalAmount && tx.principalAmount > 0) parts.push(`Principal Paid: ${formatCurrency(tx.principalAmount)}`);

                if (parts.length > 0) {
                    displayDescription = parts.join(', ');
                }
            }
        } else {
            // Unknown type - Log but display to ensure balance integrity if validation passed
            console.warn(`Unknown transaction type encountered: ${type} for tx ${tx.id}`);
            // Default to neutral or display as is?
            // If we don't know the sign, we can't update running balance correctly. 
            // BEST EFFORT: Infer from amount sign if stored signed? No, amount is unsigned in DB usually.
            // Safe fallback: Show as Info, 0 effect, but flag it
            displayDescription = `UNKNOWN TYPE: ${type} - ${tx.description}`;
            // Intentionally do NOT change balance to avoid corrupting it if we guess wrong.
            // Better to show a gap in math than a wrong balance.
        }

        rows.push({
            date: format(new Date(tx.createdAt), 'dd-MMM'), // User requested '01-Jan' format style
            txId: tx.id, // Keep ID but maybe format in View
            description: displayDescription,
            debit,
            credit,
            runningBalance: toNumber(runningBalance)
        })
    }

    // Return rows in the order they were calculated (Oldest -> Newest) as per user request
    return rows
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', { style: 'decimal', minimumFractionDigits: 2 }).format(amount);
}
