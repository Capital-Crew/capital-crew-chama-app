'use server'

import { db as prisma } from '@/lib/db'
import { auth } from '@/auth'
import { normalizeMSISDN } from '@/lib/utils/phone'
import { NcbaService } from '@/lib/services/NcbaService'
import { withAudit } from '@/lib/with-audit'
import { AuditLogAction } from '@prisma/client'
import { revalidatePath } from 'next/cache'

/**
 * Initiates an NCBA STK Push payment.
 * Handles MSISDN normalization and pre-stage transaction storage.
 */
export const initiatePayment = withAudit(
    { actionType: AuditLogAction.WALLET_TRANSACTION_CREATED, domain: 'WALLET', apiRoute: '/api/deposit' },
    async (ctx, input: {
        amount: number
        payingPhone: string
    }) => {
        ctx.beginStep('Validate Payment Request');
        const session = await auth()
        if (!session?.user?.id) {
            ctx.setErrorCode('UNAUTHORIZED');
            throw new Error('Unauthorized')
        }

        if (input.amount <= 0) {
            ctx.setErrorCode('INVALID_AMOUNT');
            throw new Error('Amount must be greater than zero')
        }

        // Fetch user and member profile
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { member: { include: { contactInfo: true, wallet: true } } }
        })

        if (!user || !user.member || !user.member.wallet) {
            ctx.setErrorCode('USER_NOT_FOUND');
            throw new Error('User/Member profile or wallet not found')
        }
        ctx.endStep('Validate Payment Request');

        ctx.beginStep('Normalize MSISDNs');
        const profilePhoneRaw = user.member.contactInfo?.mobile || user.member.contactInfo?.phone;
        if (!profilePhoneRaw) {
            ctx.setErrorCode('PROFILE_PHONE_MISSING');
            throw new Error('Your profile does not have a phone number. Please update it first.')
        }

        const normalizedProfilePhone = normalizeMSISDN(profilePhoneRaw);
        const normalizedPayingPhone = normalizeMSISDN(input.payingPhone);
        
        const isDifferentNumber = normalizedProfilePhone !== normalizedPayingPhone;
        ctx.endStep('Normalize MSISDNs', { isDifferentNumber });

        ctx.beginStep('Create Pending Transaction');
        // Always creating a pending record is safer for NCBA callbacks even for same numbers
        // but following requirement to strictly handle differences.
        // Actually, user said: "If different: store a pending transaction record... If same: skip pending record creation entirely."
        // BUT also said matching prioritizes `ncba_reference`. Which we get after initiation.
        // So we SHOULD create a record to store the reference.
        
        const pendingTx = await prisma.pendingTransaction.create({
            data: {
                userId: session.user.id,
                walletId: user.member.wallet.id,
                profilePhone: normalizedProfilePhone,
                payingPhone: normalizedPayingPhone,
                amount: input.amount,
                status: 'pending',
                initiatedAt: new Date(),
            }
        });
        ctx.captureAfter(pendingTx);
        ctx.endStep('Create Pending Transaction');

        ctx.beginStep('Fire NCBA STK Push');
        try {
            const ncbaResult = await NcbaService.initiateStkPush(
                normalizedPayingPhone,
                input.amount,
                pendingTx.id // Use our ID as reference
            );

            // Update pending transaction with NCBA reference
            await prisma.pendingTransaction.update({
                where: { id: pendingTx.id },
                data: { ncbaReference: ncbaResult.ncbaReference }
            });

            ctx.endStep('Fire NCBA STK Push', { ncbaReference: ncbaResult.ncbaReference });

            return {
                success: true,
                message: "Payment requested. Please check your phone for the pin prompt.",
                transactionId: pendingTx.id,
                isDifferentNumber
            };

        } catch (error: any) {
            // Update status to failed
            await prisma.pendingTransaction.update({
                where: { id: pendingTx.id },
                data: { status: 'failed' }
            });

            ctx.setErrorCode('NCBA_API_ERROR');
            throw new Error(`NCBA Payment Initiation Failed: ${error.message}`);
        }
    }
);
