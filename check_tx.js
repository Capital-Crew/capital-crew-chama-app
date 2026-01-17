
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTransactions() {
    try {
        const transactions = await prisma.transaction.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        console.log("Recent Transactions:");
        transactions.forEach(t => {
            console.log(`- ID: ${t.id}`);
            console.log(`  Phone: ${t.phoneNumber}`);
            console.log(`  Amount: ${t.amount}`);
            console.log(`  Status: ${t.status}`);
            console.log(`  CheckoutReqID: ${t.checkoutRequestId}`);
            console.log(`  MemberID Link: ${t.memberId || 'N/A'}`);
            console.log(`  Created: ${t.createdAt}`);
            console.log("---------------------------------------------------");
        });
    } catch (error) {
        console.error("Error fetching transactions:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkTransactions();
