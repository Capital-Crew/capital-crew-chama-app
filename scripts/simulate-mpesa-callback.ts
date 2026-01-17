
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function simulateCallback() {
    try {
        // 1. Find the latest PENDING transaction OR Create one
        let transaction = await prisma.transaction.findFirst({
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'desc' }
        });

        if (!transaction) {
            console.log("No PENDING transactions found. Creating a dummy one...");
            const member = await prisma.member.findFirst({ include: { contactInfo: true } });
            if (!member) {
                console.error("No members found in DB to assign transaction to.");
                return;
            }

            const tempId = `TEST_${Date.now()}`;
            transaction = await prisma.transaction.create({
                data: {
                    phoneNumber: member.contactInfo?.mobile || "254700000000",
                    amount: 100,
                    status: 'PENDING',
                    checkoutRequestId: tempId,
                    memberId: member.id
                }
            });
            console.log(`Created Dummy Transaction: ${transaction.id}`);
        }

        console.log(`Found Pending Transaction: ${transaction.id}`);
        console.log(`CheckoutRequestID: ${transaction.checkoutRequestId}`);
        console.log(`Amount: ${transaction.amount}`);

        // 2. Construct Payload
        const receiptNumber = `MPESA${Math.floor(Math.random() * 1000000000)}`;
        const payload = {
            Body: {
                stkCallback: {
                    MerchantRequestID: "SimulatedMerchantID",
                    CheckoutRequestID: transaction.checkoutRequestId,
                    ResultCode: 0,
                    ResultDesc: "The service request is processed successfully.",
                    CallbackMetadata: {
                        Item: [
                            { Name: "Amount", Value: Number(transaction.amount) },
                            { Name: "MpesaReceiptNumber", Value: receiptNumber },
                            { Name: "TransactionDate", Value: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14) },
                            { Name: "PhoneNumber", Value: transaction.phoneNumber }
                        ]
                    }
                }
            }
        };

        // 3. Send Request to Local API
        const port = process.env.PORT || 3000;
        const url = `http://localhost:${port}/api/mpesa/callback`;

        console.log(`Sending callback to ${url}...`);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log("Response:", response.status, data);

        if (response.ok) {
            console.log("\n✅ Simulation Successful!");
            console.log(`Transaction ${transaction.id} should now be COMPLETED.`);
            console.log(`Receipt: ${receiptNumber}`);
        } else {
            console.error("\n❌ Simulation Failed.");
        }

    } catch (error) {
        console.error("Error simulating callback:", error);
    } finally {
        await prisma.$disconnect();
    }
}

simulateCallback();
