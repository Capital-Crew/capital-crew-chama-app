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
            throw new Error('Payment amount must be greater than zero');
        }

        // Fetch System Mappings (Cached/Optimized)
        // We do this outside the transaction to keep it short, assuming mappings don't change mid-flight.
        const { getSystemMappingsDict } = await import('@/app/actions/system-accounting');
        const mappings = await getSystemMappingsDict();
        const { PostingRules } = await import('@/lib/accounting/PostingRules');

        // Convert to Decimal for precise calculations
        const amountDecimal = new Prisma.Decimal(input.amount);

        // ========================================
        // ATOMIC TRANSACTION
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
                throw new Error('Wallet not found');
            }

            // 2. Verify sufficient balance
            const currentBalance = new Prisma.Decimal(wallet.glAccount.balance);
            if (currentBalance.lt(amountDecimal)) {
                throw new Error(
                    `Insufficient balance. Available: KES ${currentBalance.toFixed(2)}, Required: KES ${amountDecimal.toFixed(2)}`
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
                    throw new Error('Member not found');
                }

                // 2. Increment share contributions
                const currentShares = new Prisma.Decimal(member.shareContributions);
                const newShares = currentShares.add(amountDecimal);

                await tx.member.update({
                    where: { id: input.destinationId },
                    data: { shareContributions: newShares.toNumber() }
                });

                newDestinationBalance = newShares.toNumber();

                // 3. Create share transaction
                await tx.shareTransaction.create({
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
                const jeInput = PostingRules.shareContribution(
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
                    throw new Error('Loan not found');
                }

                if (!['ACTIVE', 'OVERDUE', 'DISBURSED'].includes(loan.status)) {
                    throw new Error(`Cannot repay loan with status: ${loan.status}`);
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
                            status: 'CLEARED',
                            outstandingBalance: new Prisma.Decimal(0)
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

            return {
                walletTransactionId: walletTransaction.id,
                newWalletBalance: newWalletBalance.toNumber(),
                allocation,
                journalEntryNumber,
                newDestinationBalance
            };
        });

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

