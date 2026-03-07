import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { CollectionService } from '@/lib/services/CollectionService';

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
            return NextResponse.json({ error: 'Invalid Signature' }, { status: 401 });
        }

        const payload = JSON.parse(bodyText);
        const { challenge, api_ref, state, metadata, invoice_id, value, account } = payload;

        // 2. Handle "Challenge"
        if (challenge) {
            return NextResponse.json({ challenge });
        }


        // CASE A: INCOMING COLLECTION (STK PUSH SUCCESS)
        if (payload.event_type === 'charge.success' || (payload.event_type === 'collection.received' && state === 'COMPLETE')) {
            if (metadata?.transactionType === 'DEPOSIT') {

                try {
                    await CollectionService.processIntasendDeposit({
                        memberNumber: Number(metadata.memberNumber),
                        amount: Number(value || payload.amount),
                        providerRef: payload.provider_ref || invoice_id,
                        checkoutRequestId: invoice_id,
                        phoneNumber: account || payload.phone_number || 'Unknown'
                    });
                } catch (error: any) {
                    // Still return success to IntaSend as the payment was received
                }
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: 'Webhook Handler Failed' }, { status: 500 });
    }
}
