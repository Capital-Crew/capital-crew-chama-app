import * as dotenv from 'dotenv'
dotenv.config()

import { calculateLoanQualification } from './app/sacco-settings-actions'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const adminUser = await prisma.user.findFirst({ where: { email: 'admin@capitalcrew.com' }, include: { member: true } });
    if (!adminUser || !adminUser.member) {
        throw new Error("Admin not found");
    }

    console.log(`Testing Loan Qualification for: ${adminUser.member.name}`);

    // Call the core qualification function
    const q = await calculateLoanQualification(adminUser.member.id);

    console.log('Result:', JSON.stringify(q, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
