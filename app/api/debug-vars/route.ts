import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    const checks = {
        authSecretSet: !!process.env.AUTH_SECRET,
        databaseUrlSet: !!process.env.DATABASE_URL,
        databaseUrlInvalidPrefix: process.env.DATABASE_URL?.startsWith("psql '") || false,
        databaseUrlInvalidSuffix: process.env.DATABASE_URL?.endsWith("'") || false,
        dbConnection: "PENDING",
        userCount: -1,
        adminUserExists: false,
        error: null as any
    };

    try {
        const count = await prisma.user.count();
        checks.dbConnection = "SUCCESS";
        checks.userCount = count;

        const admin = await prisma.user.findUnique({
            where: { email: 'admin@capitalcrew.com' }
        });
        checks.adminUserExists = !!admin;

    } catch (error: any) {
        checks.dbConnection = "FAILED";
        checks.error = error.message;
    } finally {
        await prisma.$disconnect();
    }

    return NextResponse.json(checks);
}
