'use server'

import { db as prisma } from '@/lib/db';
import { ProjectionService } from '@/lib/services/ProjectionService';
import { auth } from '@/auth';

/**
 * Rebuilds all member and loan projections. 
 * Use this to recover from "drift" or after massive data imports.
 */
export async function rebuildAllProjections() {
    const session = await auth();
    if (session?.user?.role !== 'SYSTEM_ADMIN') {
        throw new Error('Unauthorized');
    }

    console.info('[Projections] Starting full rebuild...');

    const members = await prisma.member.findMany({ select: { id: true } });
    const loans = await prisma.loan.findMany({ select: { id: true } });

    // We process in series to avoid overwhelming DB connections or memory
    for (const member of members) {
        await ProjectionService.syncMember(member.id);
    }

    for (const loan of loans) {
        await ProjectionService.syncLoan(loan.id);
    }

    console.info(`[Projections] Completed. Reprocessed ${members.length} members and ${loans.length} loans.`);
    
    return { 
        success: true, 
        message: `Successfully rebuilt ${members.length} member and ${loans.length} loan projections.` 
    };
}
