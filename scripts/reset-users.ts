import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('🚀 Starting bulk user reset...');

        // 1. Password Reset Logic
        const defaultPassword = 'CapitalCrew@2024';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        console.log(`🔑 Resetting passwords to default: ${defaultPassword}`);
        console.log('🔒 Enforcing password change on next login...');

        const updateResult = await prisma.user.updateMany({
            data: {
                passwordHash: hashedPassword,
                mustChangePassword: true,
                failedLoginAttempts: 0,
                lockoutUntil: null,
            },
        });

        console.log(`✅ Successfully updated password and status for ${updateResult.count} users.`);

        // 2. Email Sanitization (Raw SQL)
        console.log('📧 Sanitizing emails to lowercase...');

        // Using $executeRawUnsafe or $executeRaw with template literal to handle table name if needed.
        // Assuming standard Prisma quoting, table "User" exists.
        const emailUpdateCount = await prisma.$executeRaw`UPDATE "User" SET email = LOWER(email)`;

        console.log(`✅ Sanitized emails. (Rows affected: ${emailUpdateCount})`);

        console.log('🎉 Reset complete!');

    } catch (error) {
        console.error('❌ Error executing reset script:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
