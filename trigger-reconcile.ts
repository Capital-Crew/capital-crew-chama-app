
/**
 * Manual Trigger for Reconciliation
 * Run this locally to simulate the Cron Job.
 */

async function triggerReconcile() {
    // 1. Set the Secret Key (Must match env)
    // NOTE: In local dev, we might not have headers passed easily to a function call if we were calling direct function,
    // but here we are simulating an HTTP call or just running a script that calls the API URL.

    // Easier approach for local verify: Use fetch to call localhost
    const CRON_SECRET = process.env.CRON_SECRET || "MY_TEST_SECRET";
    const APP_URL = "http://localhost:3000"; // Assuming default nextjs port

    console.log(`Triggering Reconciliation at ${APP_URL}/api/cron/reconcile...`);
    console.log(`Secret: ${CRON_SECRET.substring(0, 3)}...`);

    try {
        const response = await fetch(`${APP_URL}/api/cron/reconcile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${CRON_SECRET}`
            },
            cache: 'no-store'
        });

        console.log(`Status: ${response.status}`);
        const data = await response.json();
        console.log("Result:", JSON.stringify(data, null, 2));

    } catch (error) {
        console.error("Failed to trigger reconciliation:", error);
    }
}

triggerReconcile();
