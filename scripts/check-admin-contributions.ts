import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const admin = await prisma.user.findFirst({ where: { email: 'admin@capitalcrew.com' }, include: { member: true } });
    if (!admin || !admin.member) throw new Error('Admin member not found');
    const memberId = admin.member.id;

    // Find all ContributionTransactions for admin
    const contribs = await prisma.contributionTransaction.findMany({
        where: { memberId },
    });
    console.log(`Found ${contribs.length} ContributionTransactions`);
    for (const c of contribs) {
        console.log(` - KES ${Number(c.amount)} at ${c.date.toISOString()} [ledgerTxId: ${c.ledgerTransactionId}]`);
    }

    // Get the account code for CONTRIBUTIONS
    const mapping = await prisma.systemAccountingMapping.findUnique({
        where: { type: 'CONTRIBUTIONS' },
        include: { account: true }
    });
    const contribAccountCode = mapping?.account.code;
    console.log(`CONTRIBUTIONS account code: ${contribAccountCode}`);

    // Find all ledger entries for this member in the CONTRIBUTIONS account
    // Try to find ANY ledger entry linking to member or member's wallet or something
    const allMemberTxs = await prisma.ledgerTransaction.findMany({
        where: { referenceId: memberId },
        include: { ledgerEntries: { include: { ledgerAccount: true } } }
    });
    console.log(`Found ${allMemberTxs.length} LedgerTransactions with referenceId = memberId`);
    for (const tx of allMemberTxs) {
        console.log(` - Tx ${tx.id} [${tx.referenceType}] ${tx.description}`);
        for (const e of tx.ledgerEntries) {
            console.log(`     ${e.ledgerAccount.code} Dr: ${Number(e.debitAmount)} Cr: ${Number(e.creditAmount)}`);
        }
    }
}
main().catch(console.error).finally(() => prisma.$disconnect())
