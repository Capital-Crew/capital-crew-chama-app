
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const entries = await prisma.ledgerEntry.findMany({
        where: { description: { contains: "LN002" } },
        include: { ledgerAccount: true, ledgerTransaction: true },
        orderBy: { ledgerTransaction: { transactionDate: "asc" } }
    });
    console.log(JSON.stringify(entries.map(e => ({
        eId: e.id,
        acc: e.ledgerAccount.code,
        dr: e.debitAmount,
        cr: e.creditAmount,
        desc: e.description
    })), null, 2));
}

main().finally(() => prisma.$disconnect());

