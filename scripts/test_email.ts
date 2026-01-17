
import { EmailService } from '../lib/services/EmailService';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

async function main() {
    const recipient = process.argv[2];

    if (!recipient) {
        console.error('\nUsage: npx tsx scripts/test_email.ts <recipient_email>');
        console.error('Example: npx tsx scripts/test_email.ts user@example.com\n');
        process.exit(1);
    }

    console.log(`\n📧 Attempting to send test email...`);
    console.log(`To: ${recipient}`);
    console.log(`SMTP Host: ${process.env.SMTP_HOST || 'Not set (using default/fallback)'}`);
    console.log(`SMTP User: ${process.env.SMTP_USER || 'Not set'}`);

    try {
        const success = await EmailService.sendEmail(
            recipient,
            'Test Email from Capital Crew',
            `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h1 style="color: #00c2e0;">It Works! 🎉</h1>
                <p>This is a test email to verify the <strong>Capital Crew</strong> notification system configuration.</p>
                <p>If you are reading this, your SMTP settings are correct.</p>
                <br />
                <p style="font-size: 12px; color: #888;">Sent from Capital Crew System</p>
            </div>
            `
        );

        if (success) {
            console.log('\n✅ Email sent successfully!');
        } else {
            console.error('\n❌ Failed to send email. Check error logs above for details.');
        }
    } catch (error) {
        console.error('\n❌ An unexpected error occurred:', error);
    }
}

main().catch(console.error);
