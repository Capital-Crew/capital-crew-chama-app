
import { db } from '../lib/db';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('Checking Notification Configurations...');
    const configs = await db.notificationConfig.findMany();

    if (configs.length === 0) {
        console.log('❌ No notification configurations found in the database.');
    } else {
        console.log('✅ Found configurations:');
        configs.forEach(config => {
            console.log(`\nEvent: ${config.event}`);
            console.log(`Active: ${config.isActive}`);
            console.log(`Emails: ${config.emails.join(', ')}`);
        });
    }
}

main().catch(console.error);
