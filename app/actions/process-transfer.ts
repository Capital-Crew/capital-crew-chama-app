/**
 * Process Transfer Server Action
 * 
 * UI-facing server action for processing wallet transfers to loans or contributions.
 * Handles authentication, validation, and cache management.
 */

'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { PaymentGateway, type PaymentGatewayInput, type PaymentGatewayResult } from '@/services/payment-gateway';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// ========================================
// VALIDATION SCHEMA
// ========================================

const ProcessTransferSchema = z.object({
    walletId: z.string().min(1, 'Wallet ID is required'),
    destinationType: z.enum(['LOAN_REPAYMENT', 'CONTRIBUTION'] as const),
    destinationId: z.string().min(1, 'Destination ID is required'),
    amount: z.number().positive('Amount must be greater than zero'),
    description: z.string().optional()
});

type ProcessTransferInput = z.infer<typeof ProcessTransferSchema>;

// ========================================
// SERVER ACTION
// ========================================

export async function processTransfer(
    input: ProcessTransferInput
): Promise<PaymentGatewayResult> {
    try {
        // 1. Authenticate
        const session = await auth();
        if (!session?.user?.id) {
            throw new Error('Unauthorized. Please log in to continue.');
        }

        // 2. Validate input
        const validatedInput = ProcessTransferSchema.parse(input);

        // 3. Get user details for audit
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            include: { member: true }
        });

        if (!user) {
            throw new Error('User not found');
        }

        // 4. Verify wallet ownership (security check)
        const wallet = await db.wallet.findUnique({
            where: { id: validatedInput.walletId },
            include: { member: true }
        });

        if (!wallet) {
            throw new Error('Wallet not found');
        }

        // Only allow users to transfer from their own wallet (unless admin)
        if (wallet.memberId !== user.memberId && user.role !== 'CHAIRPERSON') {
            throw new Error('You can only transfer from your own wallet');
        }

        // 5. Process payment via gateway
        const gatewayInput: PaymentGatewayInput = {
            walletId: validatedInput.walletId,
            destinationType: validatedInput.destinationType,
            destinationId: validatedInput.destinationId,
            amount: validatedInput.amount,
            userId: session.user.id,
            userName: user.member?.name || user.name || 'System',
            description: validatedInput.description
        };

        const result = await PaymentGateway.processPayment(gatewayInput);

        // 6. Create audit log
        const auditDetails = validatedInput.destinationType === 'LOAN_REPAYMENT'
            ? `Loan repayment: KES ${validatedInput.amount.toLocaleString()} (P: ${result.allocation?.penalty || 0}, I: ${result.allocation?.interest || 0}, Pr: ${result.allocation?.principal || 0})`
            : `Share contribution: KES ${validatedInput.amount.toLocaleString()}`;

        await db.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'WALLET_TRANSACTION_CREATED',
                details: auditDetails
            }
        });

        // 7. Revalidate UI cache
        revalidatePath('/wallet');
        revalidatePath('/loans');
        revalidatePath('/dashboard');
        revalidatePath('/accounts');
        revalidatePath('/member/dashboard');

        return result;

    } catch (error) {
        // Handle errors gracefully
        console.error('Transfer processing error:', error);

        if (error instanceof z.ZodError) {
            throw new Error(`Validation error: ${error.issues[0].message}`);
        }

        if (error instanceof Error) {
            throw error;
        }

        throw new Error('An unexpected error occurred while processing the transfer');
    }
}

// ========================================
// HELPER ACTION: GET WALLET BALANCE
// ========================================

export async function getWalletBalance(walletId: string): Promise<number> {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    const wallet = await db.wallet.findUnique({
        where: { id: walletId },
        include: { glAccount: true }
    });

    if (!wallet) {
        throw new Error('Wallet not found');
    }

    return Number(wallet.glAccount.balance);
}

// ========================================
// HELPER ACTION: GET MEMBER WALLET
// ========================================

export async function getMemberWallet(memberId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    const wallet = await db.wallet.findUnique({
        where: { memberId },
        include: {
            glAccount: true,
            member: {
                select: {
                    name: true,
                    memberNumber: true
                }
            }
        }
    });

    if (!wallet) {
        throw new Error('Wallet not found');
    }

    return {
        id: wallet.id,
        balance: Number(wallet.glAccount.balance),
        memberId: wallet.memberId,
        memberName: wallet.member.name,
        memberNumber: wallet.member.memberNumber
    };
}
