import { format } from 'date-fns'
import { toDecimal, toNumber } from './financialMath'
import type Decimal from 'decimal.js'

/**
 * Statement row structure for UI display
 */
export interface StatementRow {
    date: string
    createdAt: Date
    txId: string
    description: string
    debit: number | null
    credit: number | null
    runningBalance: number
    allocation?: {
        principal: number
        interest: number
        penalty: number
        fees: number
    }
    isVoided?: boolean
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
    isReversed?: boolean
    reversedAt?: Date
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

        const type = tx.type.toUpperCase()
        let displayDescription = tx.description;

        // Check isReversed from mapped property (from getLoanStatement)
        const isReversed = (tx as any).isReversed;
        let isVoided = !!isReversed;

        if (isVoided) {
            displayDescription = `[VOID] ${displayDescription}`
        }

        // Determine Direction (Debit vs Credit)
        let isDebit = false;
        // REVERSAL is typically a Debit (Reversing a Credit/Repayment)
        if (['DISBURSEMENT', 'CHARGE', 'PENALTY', 'INTEREST', 'FEE', 'REVERSAL'].includes(type)) {
            isDebit = true;
            debit = toNumber(txAmount)
        } else if (['REPAYMENT', 'WAIVER', 'PAYMENT'].includes(type)) {
            isDebit = false;
            credit = toNumber(txAmount)

            // Format Description for Repayments
            if (type === 'REPAYMENT' && !isVoided) {
                const parts = [];
                if (tx.penaltyAmount && tx.penaltyAmount > 0) parts.push(`Penalty Paid: ${formatCurrency(tx.penaltyAmount)}`);
                if (tx.feeAmount && tx.feeAmount > 0) parts.push(`Fees Paid: ${formatCurrency(tx.feeAmount)}`);
                if (tx.interestAmount && tx.interestAmount > 0) parts.push(`Interest Paid: ${formatCurrency(tx.interestAmount)}`);
                if (tx.principalAmount && tx.principalAmount > 0) parts.push(`Principal Paid: ${formatCurrency(tx.principalAmount)}`);

                if (parts.length > 0) displayDescription = parts.join(', ');
            }
        } else {
            // Unknown type fallback
            // Assume Debit or just log warning? 
            // Logic in existing code:
            displayDescription = `UNKNOWN: ${type} - ${tx.description}`;
        }

        // --- REVERSAL HANDLING ---
        // We follow strict accounting: Original Tx + Reversal Tx = 0 Net Effect.
        // We do NOT void the original transaction's amount, so we see history.
        // We ensure REVERSAL type is treated as the opposite of what it reverses.
        // Assumption: Typically reversing Repayments (Credit) -> So Reversal is Debit.

        let effectiveAmount = toDecimal(0);

        if (isDebit) {
            effectiveAmount = txAmount; // Increases balance (Positive)
        } else {
            effectiveAmount = txAmount.negated(); // Decreases balance (Negative)
        }

        runningBalance = runningBalance.plus(effectiveAmount);


        rows.push({
            date: format(new Date(tx.createdAt), 'dd-MMM'),
            createdAt: new Date(tx.createdAt),
            txId: tx.id,
            description: displayDescription,
            debit,
            credit,
            runningBalance: toNumber(runningBalance),
            allocation: {
                principal: tx.principalAmount || 0,
                interest: tx.interestAmount || 0,
                penalty: tx.penaltyAmount || 0,
                fees: tx.feeAmount || 0
            },
            isVoided
        })
    }

    // Return rows in the order they were calculated (Oldest -> Newest) as per user request
    return rows
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-KE', { style: 'decimal', minimumFractionDigits: 2 }).format(amount);
}
