"use server"

import { db as prisma } from "@/lib/db"
import { SystemAccountType, AuditLogAction } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { DEFAULT_MAPPINGS } from "@/lib/accounting/constants"
import { withAudit } from "@/lib/with-audit"

export async function getStrictGLAccounts() {
    try {
        const mappings = await prisma.systemAccountingMapping.findMany({
            include: { account: true }
        });
        const mappedIds = mappings.map((m: { accountId: string }) => m.accountId);

        const coreDefaults = ['1000', '1200', '2000', '3000', '4000', '6000'];

        const accounts = await prisma.ledgerAccount.findMany({
            where: {
                OR: [
                    { id: { in: mappedIds } },
                    { code: { in: coreDefaults } },
                    { ledgerEntries: { some: {} } }
                ]
            },
            include: {
                _count: {
                    select: { ledgerEntries: true }
                }
            },
            orderBy: { code: 'asc' }
        });

        const accountIds = accounts.map((a: { id: string }) => a.id);

        const aggregations = await prisma.ledgerEntry.groupBy({
            by: ['ledgerAccountId'],
            where: {
                ledgerAccountId: { in: accountIds }
            },
            _sum: {
                debitAmount: true,
                creditAmount: true
            }
        });

        const balanceMap = new Map<string, number>();
        aggregations.forEach((agg: any) => {
            const debit = Number(agg._sum.debitAmount || 0);
            const credit = Number(agg._sum.creditAmount || 0);
            balanceMap.set(agg.ledgerAccountId, debit - credit);
        });

        const accountsWithBalance = accounts.map((account: any) => ({
            ...account,
            balance: balanceMap.get(account.id) || 0
        }));

        return accountsWithBalance;
    } catch (error) {
        throw new Error('Failed to fetch strict accounts');
    }
}

export async function getAllAccounts() {
    try {
        const accounts = await prisma.ledgerAccount.findMany({
            select: {
                id: true,
                code: true,
                name: true,
                type: true
            },
            orderBy: { code: 'asc' }
        });
        return accounts;
    } catch (error) {
        throw new Error('Failed to fetch accounts');
    }
}

export async function getSystemMappings() {
    const mappings = await prisma.systemAccountingMapping.findMany({
        include: { account: true }
    });

    return mappings.map((mapping: any) => ({
        ...mapping,
        account: {
            ...mapping.account,
            balance: Number(mapping.account.balance)
        }
    }));
}

export async function getSystemMappingsDict() {
    const mappings = await getSystemMappings();
    const dict: Partial<Record<SystemAccountType, string>> = {};
    for (const m of mappings) {
        dict[m.type as SystemAccountType] = m.account.code;
    }
    return dict as Record<SystemAccountType, string>;
}

export const initializeSystemMappings = withAudit(
    { actionType: AuditLogAction.SETTINGS_UPDATED, domain: 'FINANCE', apiRoute: '/api/settings/accounting/init' },
    async (ctx) => {
        ctx.beginStep('Check Existing Mappings');
        const existing = await prisma.systemAccountingMapping.count();
        if (existing > 0) {
            ctx.setErrorCode('ALREADY_INITIALIZED');
            return { success: true, message: "Mappings already initialized" };
        }
        ctx.endStep('Check Existing Mappings');

        try {
            ctx.beginStep('Execute Transaction');
            const ops = [];
            for (const [type, code] of Object.entries(DEFAULT_MAPPINGS)) {
                const account = await prisma.ledgerAccount.findUnique({ where: { code } });
                if (account) {
                    ops.push(prisma.systemAccountingMapping.create({
                        data: {
                            type: type as SystemAccountType,
                            accountId: account.id
                        }
                    }));
                }
            }

            await prisma.$transaction(ops);
            ctx.endStep('Execute Transaction', { initializedCount: ops.length });

            const newMappings = await prisma.systemAccountingMapping.findMany();
            ctx.captureAfter(newMappings);

            revalidatePath('/accounts');
            return { success: true, message: `Initialized ${ops.length} mappings` };
        } catch (error) {
            ctx.setErrorCode('INIT_FAILED');
            throw error;
        }
    }
);

export const updateSystemMapping = withAudit(
    { actionType: AuditLogAction.SETTINGS_UPDATED, domain: 'FINANCE', apiRoute: '/api/settings/accounting/update' },
    async (ctx, type: SystemAccountType, accountId: string) => {
        ctx.beginStep('Capture Initial State');
        const existing = await prisma.systemAccountingMapping.findUnique({ where: { type } });
        if (existing) ctx.captureBefore('SystemAccountingMapping', type, existing);

        try {
            ctx.beginStep('Update Database');
            const updated = await prisma.systemAccountingMapping.upsert({
                where: { type },
                update: { accountId },
                create: { type, accountId }
            });
            ctx.captureAfter(updated);
            ctx.endStep('Update Database');

            revalidatePath('/accounts');
            return { success: true };
        } catch (e: any) {
            ctx.setErrorCode('UPDATE_FAILED');
            return { success: false, error: e.message };
        }
    }
);
