
// Mock IntaSend Response for testing when API is down
export const mockIntaSendCollection = async (payload: any) => {
    console.log('⚠️ USING MOCK INTASEND COLLECTION', payload);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
    return {
        invoice: {
            invoice_id: `MOCK-INV-${Date.now()}`,
            state: 'PENDING',
            provider: 'MPESA',
            charges: payload.amount,
            net_amount: payload.amount,
            currency: 'KES',
            account: payload.phone_number,
            api_ref: payload.api_ref,
        },
        url: 'https://sandbox.intasend.com/checkout/mock-url',
        signature: 'mock-signature'
    };
};

export const mockIntaSendPayout = async (payload: any) => {
    console.log('⚠️ USING MOCK INTASEND PAYOUT', payload);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
        status: 'Processing',
        message: 'Payment request acknowledged',
        request_id: `MOCK-REQ-${Date.now()}`,
        tracking_id: `MOCK-TRK-${Date.now()}`
    };
};
