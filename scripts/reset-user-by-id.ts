
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function resetPassword() {
    const targetUserId = 'cmkt8hke10009tmjo9rmr1xp1';
    const newPassword = 'CapitalCrew@2024';

    console.log(`🔍 Searching for user with ID: ${targetUserId}`);

    const user = await prisma.user.findUnique({
        where: { id: targetUserId }
    });

    if (!user) {
        console.error('❌ User not found!');
        return;
    }

    console.log(`✅ User found: ${user.name} (${user.email})`);
    console.log(`🔒 Resetting password to: ${newPassword}`);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: targetUserId },
        data: {
            passwordHash: hashedPassword,
            failedLoginAttempts: 0,
            lockoutUntil: null
        }
    });

    console.log('✅ Password reset successfully.');
    console.log('✅ Account unlocked.');
    console.log(`👉 Please login with: ${user.email} / ${newPassword}`);
}

resetPassword()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
