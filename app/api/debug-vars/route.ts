import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    const dbUrl = process.env.DATABASE_URL || '';

    const checks = {
        authSecretSet: !!process.env.AUTH_SECRET,
        authSecretLength: process.env.AUTH_SECRET?.length || 0,
        databaseUrlSet: !!process.env.DATABASE_URL,
        databaseUrlLength: dbUrl.length,
        databaseUrlFirst20: dbUrl.substring(0, 20) + '...',
        databaseUrlStartsWithPostgres: dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://'),
        databaseUrlHasQuotes: dbUrl.includes("'") || dbUrl.includes('"'),
        databaseUrlInvalidPrefix: dbUrl.startsWith("psql '") || false,
        databaseUrlInvalidSuffix: dbUrl.endsWith("'") || false,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV || 'not-vercel',
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
