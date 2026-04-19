import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('Cleaning up orphan record with reference: SC200D00D');
    
    const tx = await prisma.ledgerTransaction.findUnique({
        where: { externalReferenceId: 'SC200D00D' }
    });

    if (tx) {
        console.log(`Found orphan LedgerTransaction: ${tx.id}`);
        
        // LedgerTransaction has a Cascade delete relation with LedgerEntry, so this should be clean
        await prisma.ledgerTransaction.delete({
            where: { id: tx.id }
        });
        
        console.log('Orphan record deleted successfully.');
    } else {
        console.log('No orphan record found with that reference.');
    }
}

main()
    .catch(e => {
        console.error('Error during cleanup:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
