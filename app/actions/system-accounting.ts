"use server"

import prisma from "@/lib/prisma"
import { SystemAccountType } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { DEFAULT_MAPPINGS } from "@/lib/accounting/constants"

export async function getStrictGLAccounts() {
    try {
        // 1. Get all codes strictly mapped in the system currently
        // Note: SystemAccountingMapping still uses 'accountId' and 'account' relation
        const mappings = await prisma.systemAccountingMapping.findMany({
            include: { account: true }
        });
        const mappedIds = mappings.map((m: { accountId: string }) => m.accountId);

        // 2. Fetch Accounts matches:
        //    A) Is explicitly mapped in System Settings
        //    B) OR Has Journal Entries (History) - ensuring nothing successful is hidden
        //    C) OR Is one of the Core Defaults (fallback for clean UI)
        //    C) OR Is one of the 5 Core Ledgers explicitly requested
        const coreDefaults = ['1000', '1200', '2000', '3000', '4000', '6000'];

        const accounts = await prisma.ledgerAccount.findMany({
            where: {
                OR: [
                    { id: { in: mappedIds } },
                    { code: { in: coreDefaults } },
                    { ledgerEntries: { some: {} } } // Show any account with activity
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

        // Optimization: Use groupBy to aggregate balances in a single query
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

        // Create a lookup map for balances
        const balanceMap = new Map<string, number>();
        aggregations.forEach((agg: any) => {
            const debit = Number(agg._sum.debitAmount || 0);
            const credit = Number(agg._sum.creditAmount || 0);
            // In LedgerEntry, we group by ledgerAccountId
            balanceMap.set(agg.ledgerAccountId, debit - credit);
        });

        // Map results back to accounts
        const accountsWithBalance = accounts.map((account: any) => ({
            ...account,
            balance: balanceMap.get(account.id) || 0
        }));

        return accountsWithBalance;
    } catch (error) {
        console.error('Error fetching strict accounts:', error);
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
                type: true  // Added specifically for Ledger Config UI
            },
            orderBy: { code: 'asc' }
        });
        return accounts;
    } catch (error) {
        console.error('Error fetching accounts:', error);
        throw new Error('Failed to fetch accounts');
    }
}

// Default Mappings moved to @/lib/accounting/constants

export async function getSystemMappings() {
    const mappings = await prisma.systemAccountingMapping.findMany({
        include: { account: true }
    });

    // Serialize nested Decimal fields (account.balance)
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
        // @ts-ignore
        dict[m.type] = m.account.code;
    }

    // DO NOT fall back to hardcoded defaults
    // User MUST configure all mappings through the Ledger Config UI
    // This ensures the system uses only user-defined GL accounts

    return dict as Record<SystemAccountType, string>;
}

export async function initializeSystemMappings() {
    const existing = await prisma.systemAccountingMapping.count();
    if (existing > 0) return { success: true, message: "Mappings already initialized" };

    const ops = [];
    for (const [type, code] of Object.entries(DEFAULT_MAPPINGS)) {
        // Find account by code
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
    revalidatePath('/accounts');
    return { success: true, message: `Initialized ${ops.length} mappings` };
}

export async function updateSystemMapping(type: SystemAccountType, accountId: string) {
    try {
        await prisma.systemAccountingMapping.upsert({
            where: { type },
            update: { accountId },
            create: { type, accountId }
        });
        revalidatePath('/accounts');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
