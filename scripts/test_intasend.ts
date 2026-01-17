import dotenv from 'dotenv';
dotenv.config();

import IntaSend from 'intasend-node';

async function testIntaSend() {
    console.log('🚀 Starting IntaSend Connectivity Test...');

    const publishableKey = process.env.INTASEND_PUBLISHABLE_KEY;
    const secretKey = process.env.INTASEND_SECRET_KEY;
    const isTest = process.env.INTASEND_IS_TEST === 'true';

    console.log(`Environment: ${isTest ? 'TEST' : 'LIVE'}`);
    console.log(`Publishable Key Present: ${!!publishableKey}`);
    console.log(`Secret Key Present: ${!!secretKey}`);

    if (!publishableKey || !secretKey) {
        console.error('❌ Missing API Keys in .env file');
        return;
    }

    const intasend = new IntaSend(publishableKey, secretKey, isTest);

    try {
        // Allow passing phone number as argument: npx tsx scripts/test_intasend.ts 2547...
        const PHONE_NUMBER = process.argv[2] || '254712345678';
        const AMOUNT = 10;
        const REF = `TEST-${Date.now()}`;

        console.log(`\nAttempting Sample STK Push to ${PHONE_NUMBER} for KES ${AMOUNT}...`);
        if (PHONE_NUMBER === '254712345678') {
            console.log('⚠️  Using dummy number. Pass a real number like: npx tsx scripts/test_intasend.ts 254700000000');
        }

        const payload = {
            first_name: 'Test',
            last_name: 'User',
            email: 'test@example.com',
            host: 'https://capital-crew.vercel.app', // Must be a valid URL structure
            amount: AMOUNT,
            phone_number: PHONE_NUMBER,
            api_ref: REF,
        };

        console.log('Sending Payload:', JSON.stringify(payload, null, 2));

        // @ts-ignore
        const response = await intasend.collection().charge(payload);

        console.log('\n✅ IntaSend Response Received:');
        console.log(JSON.stringify(response, null, 2));

        if (response.invoice) {
            console.log('\n🎉 SUCCESS: Connection established and Invoice created.');
            console.log(`Invoice ID: ${response.invoice.invoice_id}`);
            console.log(`State: ${response.invoice.state}`);
        } else {
            console.log('\n⚠️ Response received but no invoice details found. Check output above.');
        }

    } catch (error: any) {
        console.error('\n❌ IntaSend Test Failed:');
        console.error(error.message || error);

        if (Buffer.isBuffer(error)) {
            console.error('Decoded Error Buffer:', error.toString());
        } else if (error.body && Buffer.isBuffer(error.body)) {
            console.error('Decoded Error Body:', error.body.toString());
        }

        if (error.response) {
            console.log('Response Status:', error.response.status);
            console.log('Response Headers:', error.response.headers);
            // Check if data is buffer
            if (Buffer.isBuffer(error.response.data)) {
                console.error('Response Data (Decoded):', error.response.data.toString());
            } else {
                console.error('Response Data:', error.response.data);
            }
        }
    }
}

testIntaSend();
