import { db } from '@/lib/db';
import {
    Prisma,
    LedgerStatus,
    NormalBalance,
    AccountType,
    AccountingPeriodStatus,
    TransactionStatus,
    ReferenceType
} from '@prisma/client';
import { Decimal } from 'decimal.js';

export interface JournalEntryLine {
    ledgerAccountId: string;
    debitAmount: Decimal | number;
    creditAmount: Decimal | number;
    description?: string;
}

export class LedgerService {
    /**
     * Map AccountType to its standard starting digit for hierarchy validation
     */
    private static typeToStartingDigit: Record<AccountType, string> = {
        ASSET: '1',
        LIABILITY: '2',
        EQUITY: '3',
        REVENUE: '4',
        INCOME: '4',
        EXPENSE: '5'
    };

    /**
     * Validates that a ledger code follows hierarchical rules
     */
    static async validateLedgerCode(code: string, type: AccountType, parentId?: string | null) {
        // 1. Check starting digit
        const expectedDigit = this.typeToStartingDigit[type];
        if (!code.startsWith(expectedDigit)) {
            throw new Error(`Ledger code for ${type} must start with "${expectedDigit}"`);
        }

        // 2. Check if code is unique
        const existing = await db.ledgerAccount.findUnique({ where: { code } });
        if (existing) {
            throw new Error(`Ledger code "${code}" is already in use by "${existing.name}"`);
        }

        // 3. If parent provided, check if it exists and matches type
        if (parentId) {
            const parent = await db.ledgerAccount.findUnique({ where: { id: parentId } });
            if (!parent) throw new Error('Parent ledger not found');
            if (parent.type !== type && !(parent.type === 'INCOME' && type === 'REVENUE')) {
                throw new Error(`Child ledger type (${type}) must match parent type (${parent.type})`);
            }
            if (!code.startsWith(parent.code)) {
                throw new Error(`Child ledger code (${code}) must start with parent code (${parent.code})`);
            }
        }
    }

    /**
     * Post a balanced journal entry
     */
    static async postJournalEntry(params: {
        date: Date;
        referenceType: ReferenceType;
        referenceId: string;
        description: string;
        lines: JournalEntryLine[];
        createdBy: string;
        createdByName?: string;
        notes?: string;
        externalReferenceId?: string;
    }) {
        const { date, lines, createdBy, referenceType, referenceId, description } = params;

        // 1. Validate Balance (Total Debits === Total Credits)
        let totalDebit = new Decimal(0);
        let totalCredit = new Decimal(0);

        for (const line of lines) {
            totalDebit = totalDebit.plus(line.debitAmount);
            totalCredit = totalCredit.plus(line.creditAmount);
        }

        if (!totalDebit.equals(totalCredit)) {
            throw new Error(`Unbalanced entry: Total Debit (${totalDebit}) !== Total Credit (${totalCredit})`);
        }

        if (totalDebit.isZero()) {
            throw new Error('Transaction amount cannot be zero');
        }

        // 2. Check Accounting Period
        const period = await db.accountingPeriod.findFirst({
            where: {
                startDate: { lte: date },
                endDate: { gte: date }
            }
        });

        if (!period) {
            throw new Error(`No accounting period found for date ${date.toLocaleDateString()}`);
        }

        if (period.status === AccountingPeriodStatus.CLOSED) {
            throw new Error('Cannot post to a closed accounting period');
        }

        // 3. Validate Accounts (Active & Manual Entry Allowed if applicable)
        for (const line of lines) {
            const acc = await db.ledgerAccount.findUnique({ where: { id: line.ledgerAccountId } });
            if (!acc) throw new Error(`Ledger account ${line.ledgerAccountId} not found`);
            if (acc.status !== LedgerStatus.ACTIVE) {
                throw new Error(`Ledger account "${acc.name}" is not ACTIVE`);
            }
            // For manual entries directly via service (e.g. from UI), we might check isManualPostingAllowed
            // But system-generated ones (Loans, Welfare) usually bypass this or are marked isSystemAccount
        }

        // 4. Record Transaction & Entries in a single DB Transaction
        return await db.$transaction(async (tx) => {
            const transaction = await tx.ledgerTransaction.create({
                data: {
                    transactionDate: date,
                    referenceType,
                    referenceId,
                    description,
                    notes: params.notes,
                    totalAmount: totalDebit,
                    createdBy,
                    createdByName: params.createdByName,
                    externalReferenceId: params.externalReferenceId,
                    status: TransactionStatus.POSTED,
                    accountingPeriodId: period.id,
                    ledgerEntries: {
                        create: lines.map(line => ({
                            ledgerAccountId: line.ledgerAccountId,
                            debitAmount: line.debitAmount,
                            creditAmount: line.creditAmount,
                            description: line.description
                        }))
                    }
                }
            });

            // 5. Update Ledger Balances (Optional: Can be deferred to a background task or derived on the fly)
            // For now, we update them to keep current reporting working
            for (const line of lines) {
                const amount = new Decimal(line.debitAmount).minus(line.creditAmount);
                // Note: Logic depends on Normal Balance. 
                // For Assets/Expenses: Balance += (Debit - Credit)
                // For Liab/Equity/Income: Balance += (Credit - Debit)
                // We'll handle this in the update query or just store signed values.
                // Standard: Store balance as (Normal Increase - Normal Decrease)

                const acc = await tx.ledgerAccount.findUnique({ where: { id: line.ledgerAccountId } });
                const increment = acc?.normalBalance === NormalBalance.DEBIT ? amount : amount.negated();

                await tx.ledgerAccount.update({
                    where: { id: line.ledgerAccountId },
                    data: {
                        balance: { increment },
                        version: { increment: 1 }
                    }
                });
            }

            return transaction;
        });
    }

    /**
     * Calculate absolute balance from journal entries (Source of Truth)
     */
    static async getDerivedBalance(ledgerId: string, asOfDate: Date = new Date()) {
        const aggregations = await db.ledgerEntry.aggregate({
            where: {
                ledgerAccountId: ledgerId,
                ledgerTransaction: {
                    transactionDate: { lte: asOfDate },
                    status: TransactionStatus.POSTED,
                    isReversed: false
                }
            },
            _sum: {
                debitAmount: true,
                creditAmount: true
            }
        });

        const debits = new Decimal(aggregations._sum.debitAmount?.toString() || '0');
        const credits = new Decimal(aggregations._sum.creditAmount?.toString() || '0');

        const acc = await db.ledgerAccount.findUnique({ where: { id: ledgerId }, select: { normalBalance: true } });

        return acc?.normalBalance === NormalBalance.DEBIT
            ? debits.minus(credits)
            : credits.minus(debits);
    }
}
