import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const newPassword = 'Password12345';
    const hash = await bcrypt.hash(newPassword, 10);

    const result = await prisma.user.update({
        where: { email: 'admin@capitalcrew.co.ke' },
        data: {
            passwordHash: hash,
            failedLoginAttempts: 0,
            lockoutUntil: null,
        },
        select: { id: true, email: true, name: true }
    });

    console.log('Admin password reset successfully:', result);

    // Verify the new hash works
    const verify = await bcrypt.compare(newPassword, hash);
    console.log('Verification:', verify);
}

main().catch(console.error).finally(() => prisma.$disconnect());
