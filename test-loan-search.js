
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testSearch(query) {
    console.log(`\nTesting search with query: "${query}"`);

    // Reproduce logic from actions file
    const rawQuery = query.trim();
    const orConditions = [];

    // 1. Text Search
    if (rawQuery.length >= 2) {
        orConditions.push({ loanApplicationNumber: { contains: rawQuery, mode: 'insensitive' } });
        orConditions.push({ member: { name: { contains: rawQuery, mode: 'insensitive' } } });
    }

    // 2. Smart ID Generation
    const numericPart = rawQuery.replace(/\D/g, '');
    if (numericPart.length > 0) {
        const numericValue = parseInt(numericPart, 10);
        if (!isNaN(numericValue)) {
            orConditions.push({ member: { memberNumber: numericValue } });
        }

        const paddedNumber = numericPart.padStart(3, '0');
        const canonicalId = `LN${paddedNumber}`;

        console.log(`Smart Logic Generated:`);
        console.log(`- Numeric Part: ${numericPart}`);
        console.log(`- Padded Number: ${paddedNumber}`);
        console.log(`- Canonical ID: ${canonicalId}`);

        orConditions.push({ loanApplicationNumber: { equals: canonicalId, mode: 'insensitive' } });
        orConditions.push({ loanApplicationNumber: { contains: paddedNumber, mode: 'insensitive' } });
    }

    // Run Query
    try {
        const loans = await prisma.loan.findMany({
            where: { OR: orConditions },
            select: {
                id: true,
                loanApplicationNumber: true,
                member: { select: { name: true, memberNumber: true } }
            },
            take: 5
        });

        console.log(`Results Found: ${loans.length}`);
        loans.forEach(l => console.log(`- ${l.loanApplicationNumber} (${l.member.name})`));

    } catch (e) {
        console.error("Query Error:", e);
    }
}

async function main() {
    try {
        // Test Cases
        await testSearch("5");
        await testSearch("LN 5");
        await testSearch("005");
        await testSearch("LN-005");
        await testSearch("LN005"); // Explicit check

        // Debug: Dump actual loan numbers to see format
        console.log("\n--- DB SAMPLE ---");
        const sample = await prisma.loan.findMany({ take: 5, select: { loanApplicationNumber: true } });
        console.log(sample.map(l => l.loanApplicationNumber));

    } finally {
        await prisma.$disconnect();
    }
}

main();
