
import { GET } from './app/api/cron/reconcile/route'
import { NextRequest } from 'next/server'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function main() {
    console.log("--- Manual Reconciliation Trigger (Direct Handler) ---");

    // Ensure Secret is set for the handler check
    if (!process.env.CRON_SECRET) {
        throw new Error("CRON_SECRET not found in environment. Please set it in .env.local");
    }

    // Mock Request with correct Auth Header
    const req = new NextRequest('http://localhost/api/cron/reconcile', {
        headers: {
            'Authorization': `Bearer ${process.env.CRON_SECRET}`
        }
    });

    try {
        console.log("Executing Reconciliation Logic...");
        const response = await GET(req);
        const data = await response.json();

        console.log("--- Execution Result ---");
        console.log(JSON.stringify(data, null, 2));

    } catch (error) {
        console.error("Execution Failed:", error);
    }
}

main();
