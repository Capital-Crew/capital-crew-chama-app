import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'admin@capitalcrew.co.ke' },
        select: { passwordHash: true }
    });

    if (!user) {
        console.log('Admin user not found!');
        return;
    }

    const passwords = [
        'Password12345',
        'password12345',
        'Admin12345',
        'admin12345',
        'Password123',
        'Admin123',
        'admin',
        'password',
        '12345',
    ];

    for (const p of passwords) {
        const match = await bcrypt.compare(p, user.passwordHash);
        console.log(`"${p}" -> ${match}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
