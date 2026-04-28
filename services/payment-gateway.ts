import { AppError, ErrorCodes } from '@/lib/errors';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { WaterfallAllocation } from '@/lib/strategies/waterfall-allocation';
import { AccountingEngine } from '@/lib/accounting/AccountingEngine';

/**
 * Payment Gateway Service
 * 
 * Central "Financial Router" for the SACCO that moves money from a member's
 * Wallet to various destinations (Loans, Contributions, Fees) safely and atomically.
 * 
 * All operations are wrapped in database transactions to ensure atomicity.
 */

export type DestinationType = 'LOAN_REPAYMENT' | 'CONTRIBUTION';

export type PaymentGatewayInput = {
    walletId: string;           // Source wallet (member's savings account)
    destinationType: DestinationType;
    destinationId: string;      // Loan ID or Share Account ID (memberId for contributions)
    amount: number;
    userId: string;             // For audit trail
    userName?: string;          // For audit trail
    description?: string;       // Optional description
};

export type PaymentGatewayResult = {
    success: boolean;
    transactionId: string;
    allocation?: {
        penalty: number;
        interest: number;
        principal: number;
        overpayment?: number;
    };
    newWalletBalance: number;
    newDestinationBalance?: number;
    message: string;
    journalEntryNumber?: string;
};


export type DbClient = Prisma.TransactionClient | PrismaClient;

// ========================================
// BALANCE HELPERS (Authoritative Ledger Queries)
// ========================================

/**
 * Member wallet balance
 */
export async function getMemberWalletBalance(memberId: string, tx?: DbClient): Promise<number> {
    const client = tx || db;
    const wallet = await client.wallet.findUnique({
        where: { memberId },
        include: { glAccount: true }
    });
    if (!wallet || !wallet.glAccount) return 0;
    return AccountingEngine.getAccountBalance(wallet.glAccount.code, undefined, undefined, tx);
}

/**
 * Member Contribution Balance (Total Non-Withdrawable)
 */
export async function getMemberContributionBalance(memberId: string, tx?: DbClient): Promise<number> {
    const client = tx || db;
    try {
        const mapping = await client.systemAccountingMapping.findUnique({
            where: { type: 'CONTRIBUTIONS' },
            include: { account: true }
        });
        if (!mapping) return 0;
        return await AccountingEngine.getAccountBalance(mapping.account.code, memberId, undefined, tx);
    } catch (e) {
        return 0;
    }
}

/**
 * Strict Ledger Balance for Loan (Principal + Interest + Penalties)
 */
export async function getLoanOutstandingBalance(loanId: string, tx?: DbClient): Promise<number> {
    const { getLoanOutstandingBalance: getBalance } = await import('@/lib/accounting/AccountingEngine');
    return getBalance(loanId, tx);
}

export class PaymentGateway {
    /**
     * Process a payment from wallet to a destination
     * 
     * This is the main entry point for all wallet-based payments.
     * All operations are atomic - if any step fails, the entire transaction rolls back.
     */
    static async processPayment(input: PaymentGatewayInput): Promise<PaymentGatewayResult> {
        // Validate amount
        if (input.amount <= 0) {
            throw new AppError('Payment amount must be greater than zero', 400, ErrorCodes.INVALID_INPUT);
        }

        // Fetch System Mappings (Cached/Optimized)
        // We do this outside the transaction to keep it short, assuming mappings don't change mid-flight.
        const { getSystemMappingsDict } = await import('@/app/actions/system-accounting');
        const mappings = await getSystemMappingsDict();
        const { PostingRules } = await import('@/lib/accounting/PostingRules');

        // Convert to Decimal for precise calculations
        const amountDecimal = new Prisma.Decimal(input.amount);

        // ========================================
        // ATOMIC TRANSACTION WITH SERIALIZABLE ISOLATION
        // ========================================
        const result = await db.$transaction(async (tx) => {
            // ========================================
            // LEG 1: SOURCE DEDUCTION (DEBIT)
            // ========================================

            // 1. Fetch and verify wallet
            const wallet = await tx.wallet.findUnique({
                where: { id: input.walletId },
                include: { member: true, glAccount: true }
            });

            if (!wallet) {
                throw new AppError('Wallet not found', 404, ErrorCodes.RECORD_NOT_FOUND);
            }

            // 2. Verify sufficient balance
            const currentBalance = new Prisma.Decimal(wallet.glAccount.balance);
            if (currentBalance.lt(amountDecimal)) {
                throw new AppError(
                    `Insufficient balance. Available: KES ${currentBalance.toFixed(2)}, Required: KES ${amountDecimal.toFixed(2)}`,
                    422,
                    ErrorCodes.INSUFFICIENT_FUNDS
                );
            }

            // 3. Decrement wallet balance (Update Ledger Account)
            const newWalletBalance = currentBalance.minus(amountDecimal);
            await tx.ledgerAccount.update({
                where: { id: wallet.glAccountId },
                data: { balance: newWalletBalance }
            });

            // 4. Create wallet transaction (WITHDRAWAL)
            const walletTransaction = await tx.walletTransaction.create({
                data: {
                    walletId: input.walletId,
                    type: 'WITHDRAWAL',
                    amount: input.amount,
                    description: input.description || `Transfer to ${input.destinationType}`,
                    balanceAfter: newWalletBalance.toNumber(),
                    immutable: true
                }
            });

            // ========================================
            // LEG 2: DESTINATION APPLICATION (CREDIT)
            // ========================================

            let allocation: { penalty: number; interest: number; principal: number; overpayment?: number } | undefined;
            let journalEntryNumber: string | undefined;
            let newDestinationBalance: number | undefined;

            if (input.destinationType === 'CONTRIBUTION') {
                // --- CONTRIBUTION FLOW ---

                // 1. Fetch member
                const member = await tx.member.findUnique({
                    where: { id: input.destinationId }
                });

                if (!member) {
                    throw new AppError('Member not found', 404, ErrorCodes.RECORD_NOT_FOUND);
                }

                // 2. Projections will be updated below after accounting commit
                newDestinationBalance = (await getMemberContributionBalance(input.destinationId, tx)) + input.amount;

                // 3. Create contribution transaction
                await tx.contributionTransaction.create({
                    data: {
                        memberId: input.destinationId,
                        type: 'CONTRIBUTION',
                        amount: input.amount,
                        description: 'Contribution via Wallet',
                        createdBy: input.userId,
                        creatorName: input.userName || 'System'
                    }
                });

                // 4. Post to accounting ledger via PostingRules
                const jeInput = PostingRules.contributionPayment(
                    input.destinationId,
                    member.name,
                    input.amount,
                    mappings,
                    new Date(),
                    input.userId,
                    input.userName || 'System'
                );

                // Override description if custom one provided
                if (input.description) jeInput.notes = input.description;

                const journalEntry = await AccountingEngine.postJournalEntry(jeInput, tx);
                journalEntryNumber = journalEntry.entryNumber;

            } else if (input.destinationType === 'LOAN_REPAYMENT') {
                // --- LOAN REPAYMENT FLOW ---

                // 1. Verify loan exists and is active
                const loan = await tx.loan.findUnique({
                    where: { id: input.destinationId },
                    include: { member: true }
                });

                if (!loan) {
                    throw new AppError('Loan not found', 404, ErrorCodes.RECORD_NOT_FOUND);
                }

                if (!['ACTIVE', 'OVERDUE', 'DISBURSED'].includes(loan.status)) {
                    throw new AppError(`Cannot repay loan with status: ${loan.status}`, 422, ErrorCodes.INVALID_STATUS);
                }

                // 2. Apply waterfall allocation
                allocation = await WaterfallAllocation.allocate(
                    input.destinationId,
                    input.amount,
                    tx
                );

                // 3. Post to accounting ledger via PostingRules
                const jeInput = PostingRules.loanRepayment(
                    {
                        id: loan.id,
                        loanApplicationNumber: loan.loanApplicationNumber,
                        memberId: loan.memberId
                    },
                    {
                        penalty: allocation.penalty,
                        interest: allocation.interest,
                        principal: allocation.principal
                    },
                    mappings,
                    new Date(),
                    input.userId,
                    input.userName || 'System'
                );

                if (input.description) jeInput.notes = input.description;

                const journalEntry = await AccountingEngine.postJournalEntry(jeInput, tx);
                journalEntryNumber = journalEntry.entryNumber;

                // 4. Check if loan is fully paid and update status to CLEARED
                const { LoanBalanceService } = await import('@/services/loan-balance');
                const updatedBalance = await LoanBalanceService.updateLoanBalance(loan.id, tx);

                // If balance is exactly zero, mark loan as CLEARED
                if (updatedBalance.eq(0)) {
                    await tx.loan.update({
                        where: { id: loan.id },
                        data: {
                            status: 'CLEARED'
                        }
                    });

                    // Log clearance event
                    await tx.loanJourneyEvent.create({
                        data: {
                            loanId: loan.id,
                            eventType: 'LOAN_CLEARED',
                            description: `Loan fully repaid and cleared. Final payment: KES ${input.amount.toLocaleString()}`,
                            actorId: input.userId,
                            actorName: input.userName || 'System'
                        }
                    });
                }

                newDestinationBalance = updatedBalance.toNumber();
            }

            // 5. UPDATE PROJECTIONS (Synchronous Consistency)
            // This runs at the end of the transaction for both paths
            const { ProjectionService } = await import('@/lib/services/ProjectionService');
            try {
                if (input.destinationType === 'CONTRIBUTION') {
                    await ProjectionService.syncMember(input.destinationId, tx);
                } else if (input.destinationType === 'LOAN_REPAYMENT') {
                    await ProjectionService.syncLoan(input.destinationId, tx);
                }
                // Always sync member profile if wallet changed
                await ProjectionService.syncMember(wallet.memberId, tx);
            } catch (e) {
                // Log projection drift to avoid rolling back a successfully committed payment
                console.error('PROJECTION_DRIFT: Failed to sync projections during PaymentGateway transaction', e);
            }

            return {
                walletTransactionId: walletTransaction.id,
                newWalletBalance: newWalletBalance.toNumber(),
                allocation,
                journalEntryNumber,
                newDestinationBalance
            };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

        // ========================================
        // RETURN RESULT
        // ========================================

        const message = input.destinationType === 'CONTRIBUTION'
            ? `Successfully contributed KES ${input.amount.toLocaleString()} to share capital`
            : `Successfully repaid KES ${input.amount.toLocaleString()} to loan`;

        return {
            success: true,
            transactionId: result.walletTransactionId,
            allocation: result.allocation,
            newWalletBalance: result.newWalletBalance,
            newDestinationBalance: result.newDestinationBalance,
            message,
            journalEntryNumber: result.journalEntryNumber
        };
    }
}

