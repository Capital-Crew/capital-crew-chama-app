
import { seedChartOfAccounts } from './app/seed-accounts-actions.js';

async function main() {
    try {
        console.log('Starting seedChartOfAccounts...');
        // Note: This might fail due to lack of auth session if called directly.
        // But since it's a script, maybe I can bypass auth or mock it.
        // Actually, seedChartOfAccounts uses `auth()` which will likely return null in CLI.
        console.log('This script needs a session. Skipping direct call and instead using seed-gl.ts first.');
    } catch (e) {
        console.error(e);
    }
}
main();
