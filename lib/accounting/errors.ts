/**
 * Custom error for insufficient balance scenarios
 */
export class InsufficientBalanceError extends Error {
    constructor(
        public accountCode: string,
        public accountName: string,
        public required: number,
        public available: number
    ) {
        super(
            `Insufficient balance in ${accountName} (${accountCode}): ` +
            `Required KES ${required.toLocaleString()}, ` +
            `Available KES ${available.toLocaleString()}`
        )
        this.name = 'InsufficientBalanceError'
    }
}

/**
 * Custom error for overdraft prevention
 */
export class OverdraftPreventionError extends Error {
    constructor(
        public accountCode: string,
        public accountName: string,
        public attemptedDebit: number,
        public currentBalance: number
    ) {
        super(
            `Overdraft prevented on ${accountName} (${accountCode}): ` +
            `Cannot debit KES ${attemptedDebit.toLocaleString()} ` +
            `from balance of KES ${currentBalance.toLocaleString()}`
        )
        this.name = 'OverdraftPreventionError'
    }
}
