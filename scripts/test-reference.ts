import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const adminEmail = 'admin@capitalcrew.com';
    const admin = await prisma.user.findFirst({ where: { email: adminEmail }, include: { member: true } });
    if (!admin || !admin.member) throw new Error('Admin member not found');
    const memberId = admin.member.id;

    const contribs = await prisma.contributionTransaction.findMany({
        where: { memberId },
        take: 3
    });
    console.log('ContributionTransactions:', contribs.map(c => ({ id: c.id, type: c.type, amount: Number(c.amount) })));

    const ledgerTxs1 = await prisma.ledgerTransaction.findMany({
        where: { referenceId: memberId },
        include: { ledgerEntries: { include: { ledgerAccount: true } } },
        take: 2
    });
    console.log('\nLedgerTransactions with referenceId = memberId:', ledgerTxs1.length);
    if (ledgerTxs1.length > 0) {
        console.log('Sample entry accounts for memberId ref:', ledgerTxs1[0].ledgerEntries.map(e => ({ account: e.ledgerAccount.code, dr: Number(e.debitAmount), cr: Number(e.creditAmount) })));
    }

    if (contribs.length > 0) {
        const contribIds = contribs.map(c => c.id);
        const ledgerTxs2 = await prisma.ledgerTransaction.findMany({
            where: { referenceId: { in: contribIds } },
            include: { ledgerEntries: { include: { ledgerAccount: true } } },
            take: 2
        });
        console.log('\nLedgerTransactions with referenceId = contribution.id:', ledgerTxs2.length);
        if (ledgerTxs2.length > 0) {
            console.log('Sample referenceType:', ledgerTxs2[0].referenceType);
            console.log('Sample entry accounts for contrib ref:', ledgerTxs2[0].ledgerEntries.map(e => ({ account: e.ledgerAccount.code, dr: Number(e.debitAmount), cr: Number(e.creditAmount) })));
        }
    }
}
main().catch(console.error).finally(() => prisma.$disconnect())
