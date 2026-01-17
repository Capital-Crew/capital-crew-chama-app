import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { AccountingEngine } from '@/lib/accounting/AccountingEngine';
import { getSystemMappingsDict } from '@/app/actions/system-accounting';
import { WalletService } from '@/lib/services/WalletService';

// Helper to verify IntaSend signature
function verifySignature(req: Request, body: string) {
    const signature = req.headers.get('x-intasend-signature');
    const secret = process.env.INTASEND_SECRET_KEY;

    if (!signature || !secret) return false;

    const hmac = crypto.createHmac('sha256', secret);
    const calculatedSignature = hmac.update(body).digest('hex');

    return signature === calculatedSignature;
}

export async function POST(req: Request) {
    try {
        const bodyText = await req.text();

        // 1. Verify Signature
        if (!verifySignature(req, bodyText)) {
            console.error('IntaSend Webhook Signature Verification Failed');
            return NextResponse.json({ error: 'Invalid Signature' }, { status: 401 });
        }

        const payload = JSON.parse(bodyText);
        const { challenge, api_ref, state, metadata, invoice_id, value, account } = payload;

        // 2. Handle "Challenge"
        if (challenge) {
            return NextResponse.json({ challenge });
        }

        console.log(`Webhook Received: [${payload.event_type || 'UNKNOWN'}] Status: [${state}] Ref: [${api_ref}]`);

        // Get System Mappings for Accounting
        const mappings = await getSystemMappingsDict();

        // CASE A: INCOMING COLLECTION (STK PUSH SUCCESS)
        if (payload.event_type === 'charge.success' || (payload.event_type === 'collection.received' && state === 'COMPLETE')) {
            if (metadata?.transactionType === 'DEPOSIT') {
                console.log('✅ processing DEPOSIT success');

                // 1. Ensure Wallet Exists & Get Account
                // Assuming memberNumber is reliable, otherwise need better lookup
                const targetWallet = await prisma.wallet.findFirst({
                    where: { member: { memberNumber: metadata.memberNumber } },
                    include: { member: true }
                });

                if (!targetWallet) {
                    console.error(`Wallet not found for Member: ${metadata.memberNumber}`);
                    return NextResponse.json({ success: true });
                }

                /*
                // 2. Idempotency Check
                const existingTx = await prisma.mpesaTransaction.findFirst({
                    where: { accountReference: api_ref }
                });

                if (existingTx && existingTx.status === 'COMPLETED') {
                    console.log('Duplicate webhook for completed transaction');
                    return NextResponse.json({ success: true });
                }
                */

                /* MpesaTransaction Removed
                // 3. Create/Update MpesaTransaction
                const mpesaTx = await prisma.mpesaTransaction.upsert({
                    where: { accountReference: api_ref },
                    update: {
                        status: 'COMPLETED',
                        mpesaReceiptNumber: payload.provider_ref || invoice_id,
                        resultDescription: 'Payment Received',
                        rawCallbackData: payload
                    },
                    create: {
                        accountReference: api_ref,
                        amount: value || payload.amount,
                        phoneNumber: account || payload.phone_number || 'Unknown',
                        paybillNumber: 'INTASEND',
                        transactionDate: new Date(),
                        type: 'C2B',
                        status: 'COMPLETED',
                        mpesaReceiptNumber: payload.provider_ref || invoice_id,
                        rawCallbackData: payload
                    }
                });

                // 4. Post Journal Entry (Credit Wallet, Debit Cash/Bank)
                if (!existingTx?.isPosted) {
                    await AccountingEngine.postJournalEntry({
                        transactionDate: new Date(),
                        referenceType: 'CASH_DEPOSIT',
                        referenceId: mpesaTx.id,
                        description: `M-Pesa Deposit - ${targetWallet.member.name}`,
                        lines: [
                            {
                                accountCode: mappings.EVENT_CASH_DEPOSIT, // Asset (DR)
                                debitAmount: parseFloat(value || payload.amount),
                                creditAmount: 0,
                                description: `Deposit via M-Pesa ${mpesaTx.mpesaReceiptNumber}`
                            },
                            {
                                accountId: targetWallet.glAccountId, // Liability (CR)
                                debitAmount: 0,
                                creditAmount: parseFloat(value || payload.amount),
                                description: 'Wallet Credit'
                            }
                        ],
                        createdBy: 'SYSTEM',
                        createdByName: 'IntaSend Webhook'
                    });

                    await prisma.mpesaTransaction.update({
                        where: { id: mpesaTx.id },
                        data: { isPosted: true }
                    });
                }
                */
            }
        }

        /* MpesaTransaction Removed
        // CASE B: OUTGOING DISBURSEMENT SUCCESS
        if (payload.event_type === 'payout.success' || (state === 'COMPLETE' && metadata?.transactionType === 'WITHDRAWAL')) {
            console.log('✅ processing WITHDRAWAL success');

            await prisma.mpesaTransaction.updateMany({
                where: { accountReference: api_ref },
                data: {
                    status: 'COMPLETED',
                    mpesaReceiptNumber: payload.provider_ref,
                    rawCallbackData: payload,
                    updatedAt: new Date()
                }
            });
        }

        // CASE C: OUTGOING DISBURSEMENT FAILURE
        if (payload.event_type === 'payout.failed' || (state === 'FAILED' && metadata?.transactionType === 'WITHDRAWAL')) {
            console.log('❌ processing WITHDRAWAL failure');

            const tx = await prisma.mpesaTransaction.findFirst({
                where: { accountReference: api_ref }
            });

            if (tx && tx.status !== 'FAILED') {
                // Mark as Failed
                await prisma.mpesaTransaction.update({
                    where: { id: tx.id },
                    data: {
                        status: 'FAILED',
                        rawCallbackData: payload,
                        resultDescription: payload.reason || 'Payout Failed'
                    }
                });
                // REVERSE THE DEDUCTION
                // Note: Reversal logic depended on 'tx' variable which is now commented out.
                // If you need manual reversal, you'll have to rely on logs.
                
                // const targetWallet = await prisma.wallet.findFirst({
                //    where: { member: { memberNumber: metadata.memberNumber } },
                //    include: { member: true }
                // });

                // if (targetWallet) {
                //   // ... (Reversal Logic Omitted due to missing 'tx') ...
                // }
                
            }
        }
        */

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Webhook Handler Failed' }, { status: 500 });
    }
}
