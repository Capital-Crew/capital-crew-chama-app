
async function main() {
    const payload = {
        Body: {
            stkCallback: {
                MerchantRequestID: "9801-44708703-1",
                CheckoutRequestID: "ws_CO_14012026043212u1p6ho",
                ResultCode: 0,
                ResultDesc: "The service request is processed successfully.",
                CallbackMetadata: {
                    Item: [
                        { Name: "Amount", Value: 5000.00 },
                        { Name: "MpesaReceiptNumber", Value: "LHT1234567" },
                        { Name: "TransactionDate", Value: 20260114043212 },
                        { Name: "PhoneNumber", Value: 254779689673 }
                    ]
                }
            }
        }
    };

    try {
        console.log('Sending callback to http://localhost:3000/api/mpesa/callback...');
        const response = await fetch('http://localhost:3000/api/mpesa/callback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log(`Status: ${response.status}`);
        const text = await response.text();
        console.log(`Response: ${text}`);
    } catch (error) {
        console.error('Error triggering callback:', error);
    }
}

main();
