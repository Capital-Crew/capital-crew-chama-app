/**
 * Audit Logging for Financial Calculations
 * 
 * Provides utilities to log all financial calculations with full precision
 * for audit trails and regulatory compliance.
 */

import Decimal from 'decimal.js-light'

export interface CalculationAuditLog {
    operation: string
    inputs: Record<string, string | number>
    output: string
    formula?: string
    timestamp: string
    userId?: string
    context?: Record<string, any>
}

/**
 * Log a financial calculation for audit purposes
 * @param operation - Name of the operation (e.g., 'EMI_CALCULATION', 'INTEREST_ACCRUAL')
 * @param inputs - Input values with full precision
 * @param output - Output value with full precision
 * @param options - Additional context
 */
export function logCalculation(
    operation: string,
    inputs: Record<string, Decimal | string | number>,
    output: Decimal | string,
    options?: {
        formula?: string
        userId?: string
        context?: Record<string, any>
    }
): CalculationAuditLog {
    // Convert all Decimal inputs to strings with full precision
    const inputsStr: Record<string, string | number> = {}
    for (const [key, value] of Object.entries(inputs)) {
        if (value instanceof Decimal) {
            inputsStr[key] = value.toString()
        } else {
            inputsStr[key] = value
        }
    }

    // Convert output to string with full precision
    const outputStr = output instanceof Decimal ? output.toString() : String(output)

    const log: CalculationAuditLog = {
        operation,
        inputs: inputsStr,
        output: outputStr,
        formula: options?.formula,
        timestamp: new Date().toISOString(),
        userId: options?.userId,
        context: options?.context
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
    }

    // In production, this would be sent to a logging service
    // TODO: Integrate with your logging infrastructure (e.g., Winston, Pino, CloudWatch)

    return log
}

/**
 * Log an EMI calculation
 */
export function logEMICalculation(
    principal: Decimal,
    annualRate: Decimal,
    installments: number,
    emi: Decimal,
    userId?: string
) {
    return logCalculation(
        'EMI_CALCULATION',
        { principal, annualRate, installments },
        emi,
        {
            formula: 'EMI = P × [r(1+r)^n] / [(1+r)^n - 1]',
            userId
        }
    )
}

/**
 * Log an interest accrual calculation
 */
export function logInterestAccrual(
    principal: Decimal,
    rate: Decimal,
    days: number,
    interest: Decimal,
    loanId: string,
    userId?: string
) {
    return logCalculation(
        'INTEREST_ACCRUAL',
        { principal, rate, days },
        interest,
        {
            formula: 'Interest = (Principal × Rate × Days) / 365',
            userId,
            context: { loanId }
        }
    )
}

/**
 * Log a fee calculation
 */
export function logFeeCalculation(
    amount: Decimal,
    feePercent: Decimal,
    fee: Decimal,
    feeType: string,
    userId?: string
) {
    return logCalculation(
        'FEE_CALCULATION',
        { amount, feePercent },
        fee,
        {
            formula: 'Fee = Amount × (Percentage / 100)',
            userId,
            context: { feeType }
        }
    )
}

/**
 * Log a payment split calculation
 */
export function logPaymentSplit(
    payment: Decimal,
    principal: Decimal,
    interest: Decimal,
    loanId: string,
    userId?: string
) {
    return logCalculation(
        'PAYMENT_SPLIT',
        { payment, principalPortion: principal, interestPortion: interest },
        payment,
        {
            formula: 'Payment = Principal Portion + Interest Portion',
            userId,
            context: { loanId }
        }
    )
}

/**
 * Log a balance update
 */
export function logBalanceUpdate(
    oldBalance: Decimal,
    transaction: Decimal,
    newBalance: Decimal,
    transactionType: string,
    entityId: string,
    userId?: string
) {
    return logCalculation(
        'BALANCE_UPDATE',
        { oldBalance, transaction, newBalance },
        newBalance,
        {
            userId,
            context: { transactionType, entityId }
        }
    )
}

/**
 * Log a rounding operation
 */
export function logRounding(
    originalValue: Decimal,
    roundedValue: Decimal,
    decimalPlaces: number,
    roundingMode: string,
    context?: Record<string, any>
) {
    return logCalculation(
        'ROUNDING',
        { originalValue, decimalPlaces, roundingMode },
        roundedValue,
        {
            context
        }
    )
}

/**
 * Create a batch audit log for multiple calculations
 */
export class CalculationAuditBatch {
    private logs: CalculationAuditLog[] = []
    private batchId: string
    private userId?: string

    constructor(batchName: string, userId?: string) {
        this.batchId = `${batchName}_${Date.now()}`
        this.userId = userId
    }

    /**
     * Add a calculation to the batch
     */
    add(
        operation: string,
        inputs: Record<string, Decimal | string | number>,
        output: Decimal | string,
        options?: {
            formula?: string
            context?: Record<string, any>
        }
    ) {
        const log = logCalculation(operation, inputs, output, {
            ...options,
            userId: this.userId,
            context: {
                ...options?.context,
                batchId: this.batchId
            }
        })
        this.logs.push(log)
    }

    /**
     * Get all logs in the batch
     */
    getLogs(): CalculationAuditLog[] {
        return this.logs
    }

    /**
     * Flush the batch (send to logging service)
     */
    async flush() {
        // In production, send to logging service
        if (process.env.NODE_ENV === 'development') {
                totalCalculations: this.logs.length,
                logs: this.logs
            })
        }

        // TODO: Send to logging service
        // await loggingService.sendBatch(this.logs)

        // Clear the batch
        this.logs = []
    }
}

/**
 * Example usage:
 * 
 * ```typescript
 * import { logEMICalculation, CalculationAuditBatch } from '@/lib/decimal/audit'
 * 
 * // Single calculation
 * logEMICalculation(principal, rate, installments, emi, userId)
 * 
 * // Batch calculations
 * const batch = new CalculationAuditBatch('LOAN_DISBURSEMENT', userId)
 * batch.add('EMI_CALCULATION', { principal, rate, installments }, emi)
 * batch.add('FEE_CALCULATION', { amount, feePercent }, fee)
 * await batch.flush()
 * ```
 */
