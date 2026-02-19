import { db as prisma } from '@/lib/db'
import { Decimal } from 'decimal.js'
import { toDecimal, toNumber } from '../financialMath'
import { AccountType, ReferenceType, Prisma, SystemAccountType, PrismaClient } from '@prisma/client'

type DbClient = Prisma.TransactionClient | PrismaClient

// COMPATIBILITY MODE for Phase 1
// We map old logic to new tables:
// Account -> LedgerAccount
// JournalEntry -> LedgerTransaction
// JournalLine -> LedgerEntry


// Configure Decimal for precise calculations
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP })

export interface JournalLineInput {
    accountCode?: string
    accountId?: string
    debitAmount: number
    creditAmount: number
    description?: string
}

export interface JournalEntryInput {
    transactionDate: Date
    referenceType: ReferenceType
    referenceId: string
    description: string
    notes?: string
    externalReferenceId?: string
    lines: JournalLineInput[]
    createdBy: string
    createdByName: string
}

/**
 * Core Accounting Engine
 * Handles all double-entry posting, validation, and balance queries
 */
export class AccountingEngine {
    /**
     * Post a journal entry with strict double-entry validation
     */
    /**
     * Post a journal entry with strict double-entry validation
     * Supports external transaction client for atomicity
     */
    /**
     * Post a journal entry with strict double-entry validation
     * Supports external transaction client for atomicity
     */
    static async postJournalEntry(
        input: JournalEntryInput,
        externalTx?: DbClient
    ): Promise<any> {
        // Validate balance
        if (!this.validateBalance(input.lines)) {
            throw new Error('Journal entry is not balanced! Debits must equal credits.')
        }

        // Helper to run logic inside transaction
        const runInTransaction = async (tx: DbClient) => {
            // Calculate totals
            const totals = this.calculateTotals(input.lines)

            // Resolve account IDs from codes or use provided IDs
            const linesWithAccountIds = await Promise.all(
                input.lines.map(async (line) => {
                    let accountId = line.accountId

                    if (!accountId) {
                        if (!line.accountCode) {
                            throw new Error('Either accountCode or accountId must be provided for each journal line')
                        }
                        const account = await tx.ledgerAccount.findUnique({
                            where: { code: line.accountCode }
                        })
                        if (!account) {
                            throw new Error(`Account ${line.accountCode} not found`)
                        }
                        accountId = account.id
                    }

                    // For caching update
                    const accountForType = await tx.ledgerAccount.findUnique({ where: { id: accountId } })

                    return {
                        accountId: accountId,
                        debitAmount: line.debitAmount,
                        creditAmount: line.creditAmount,
                        description: line.description || input.description,
                        accountType: accountForType?.type // Pass type for balance update
                    }
                })
            )

            // Create journal entry with lines
            const journalEntry = await tx.ledgerTransaction.create({
                data: {
                    transactionDate: input.transactionDate,
                    referenceType: input.referenceType,
                    referenceId: input.referenceId,
                    externalReferenceId: input.externalReferenceId,
                    description: input.description,
                    notes: input.notes,
                    totalAmount: new Prisma.Decimal(totals.totalDebit),
                    createdBy: input.createdBy,
                    createdByName: input.createdByName,
                    ledgerEntries: {
                        create: linesWithAccountIds.map(l => ({
                            ledgerAccountId: l.accountId,
                            debitAmount: new Prisma.Decimal(l.debitAmount),
                            creditAmount: new Prisma.Decimal(l.creditAmount),
                            description: l.description
                        }))
                    }
                },
                include: {
                    ledgerEntries: {
                        include: {
                            ledgerAccount: true
                        }
                    }
                }
            })

            // UPDATE CACHED BALANCES
            // We iterate safely to update the `balance` column on LedgerAccount
            for (const line of linesWithAccountIds) {
                // Determine net impact based on account type
                // ASSETS/EXPENSES: Debit increases (+), Credit decreases (-)
                // LIABILITY/EQUITY/REVENUE: Credit increases (+), Debit decreases (-)

                let netChange = new Prisma.Decimal(0)
                const debit = new Prisma.Decimal(line.debitAmount)
                const credit = new Prisma.Decimal(line.creditAmount)

                const type = line.accountType

                if (type === 'ASSET' || type === 'EXPENSE') {
                    netChange = debit.minus(credit)
                } else {
                    netChange = credit.minus(debit)
                }

                await tx.ledgerAccount.update({
                    where: { id: line.accountId },
                    data: {
                        balance: {
                            increment: netChange
                        }
                    }
                })
            }

            return journalEntry
        }

        // If external transaction provided, use it. Otherwise create new one.
        if (externalTx) {
            return await runInTransaction(externalTx)
        } else {
            return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                return await runInTransaction(tx)
            }, {
                maxWait: 5000,
                timeout: 20000
            })
        }
    }

    /**
     * Reverse an existing journal entry
     */
    static async reverseJournalEntry(
        entryId: string,
        reason: string,
        reversedBy: string,
        reversedByName: string,
        externalTx?: DbClient
    ): Promise<any> {
        const runInTransaction = async (tx: DbClient) => {
            // Get original entry
            const originalEntry = await tx.ledgerTransaction.findUnique({
                where: { id: entryId },
                include: {
                    ledgerEntries: {
                        include: {
                            ledgerAccount: true
                        }
                    }
                }
            })

            if (!originalEntry) {
                throw new Error('Journal entry not found')
            }

            if (originalEntry.isReversed) {
                throw new Error('This journal entry has already been reversed')
            }

            // Create reversal entry (swap debits and credits)
            const reversalLines = originalEntry.ledgerEntries.map((line: any) => ({
                accountId: line.ledgerAccountId,
                debitAmount: Number(line.creditAmount),  // Swap
                creditAmount: Number(line.debitAmount),  // Swap
                description: `Reversal: ${line.description || ''}`
            }))

            const reversalEntry = await this.postJournalEntry({
                transactionDate: new Date(),
                referenceType: 'REVERSAL',
                referenceId: originalEntry.referenceId,
                description: `REVERSAL: ${originalEntry.description}`,
                notes: `Reversal reason: ${reason}`,
                lines: reversalLines,
                createdBy: reversedBy,
                createdByName: reversedByName
            }, tx) // Pass tx!

            // Mark original as reversed
            // Mark original as reversed
            await tx.ledgerTransaction.update({
                where: { id: entryId },
                data: {
                    isReversed: true,
                    reversedBy: reversalEntry.id
                }
            })

            // Link reversal to original
            // Link reversal to original
            await tx.ledgerTransaction.update({
                where: { id: reversalEntry.id },
                data: {
                    reversalOf: entryId
                }
            })

            return reversalEntry
        }

        if (externalTx) {
            return await runInTransaction(externalTx)
        } else {
            return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                return await runInTransaction(tx)
            }, {
                maxWait: 5000,
                timeout: 20000
            })
        }
    }

    /**
     * Get account balance at a specific point in time
     */
    static async getAccountBalance(
        accountCode: string,
        referenceId?: string | string[],
        asOfDate?: Date,
        tx?: DbClient
    ): Promise<number> {
        // Use provided transaction or default prisma client
        const client = tx ?? prisma
        const account = await client.ledgerAccount.findUnique({
            where: { code: accountCode }
        })

        if (!account) {
            throw new Error(`Account ${accountCode} not found`)
        }

        // OPTIMIZATION: Use cached balance if no filters are applied
        if (!referenceId && !asOfDate) {
            return toNumber(account.balance)
        }

        const lines = await client.ledgerEntry.findMany({
            where: {
                ledgerAccountId: account.id,
                ...(referenceId && {
                    ledgerTransaction: {
                        referenceId: Array.isArray(referenceId) ? { in: referenceId } : referenceId
                    }
                }),
                ...(asOfDate && {
                    ledgerTransaction: {
                        transactionDate: { lte: asOfDate }
                    }
                }),
                /* ledgerTransaction: {
                    isReversed: false  // Exclude reversed entries
                } */
            },
            include: {
                ledgerTransaction: true
            }
        })

        let balance = toDecimal(0)

        for (const line of lines) {
            // Asset/Expense: Debit increases, Credit decreases
            // Liability/Equity/Income: Credit increases, Debit decreases
            if (['ASSET', 'EXPENSE'].includes(account.type)) {
                balance = balance.plus(line.debitAmount).minus(line.creditAmount)
            } else {
                balance = balance.plus(line.creditAmount).minus(line.debitAmount)
            }
        }

        return toNumber(balance)
    }

    /**
     * Validate that debits equal credits
     */
    private static validateBalance(lines: JournalLineInput[]): boolean {
        let totalDebits = toDecimal(0)
        let totalCredits = toDecimal(0)

        for (const line of lines) {
            totalDebits = totalDebits.plus(line.debitAmount)
            totalCredits = totalCredits.plus(line.creditAmount)
        }

        // Allow tiny rounding difference (0.01)
        const difference = totalDebits.minus(totalCredits).abs()
        return difference.lte(0.01)
    }

    /**
     * Calculate totals for validation
     */
    private static calculateTotals(lines: JournalLineInput[]) {
        let totalDebit = 0
        let totalCredit = 0

        for (const line of lines) {
            totalDebit += line.debitAmount
            totalCredit += line.creditAmount
        }

        return { totalDebit, totalCredit }
    }

    /**
     * Generate sequential entry number
     */
    private static async generateEntryNumber(tx: DbClient): Promise<string> {
        const count = await tx.ledgerTransaction.count()
        return `JE-${(count + 1).toString().padStart(6, '0')}`
    }
}

// Helper to get system mapping code
async function getSystemCode(type: SystemAccountType, tx?: DbClient): Promise<string> {
    const client = tx ?? prisma

    try {
        const mapping = await client.systemAccountingMapping.findUnique({
            where: { type },
            include: { account: true }
        })

        if (mapping) return mapping.account.code

        // If no mapping found, throw error to force user configuration
        throw new Error(`System accounting mapping not configured for ${type}. Please configure in Accounts → Ledger Config.`)
    } catch (error: any) {
        // Re-throw to surface configuration issues
        if (error instanceof Error && error.message.includes('not configured')) {
            throw error
        }
        // For other errors, provide helpful message
        throw new Error(`Failed to get system account code for ${type}: ${error}`)
    }
}

// Member wallet balance
export async function getMemberWalletBalance(memberId: string, tx?: DbClient): Promise<number> {
    const client = tx ?? prisma

    // 1. Find Member's Unique Wallet
    const wallet = await client.wallet.findUnique({
        where: { memberId },
        include: { glAccount: true }
    })

    if (!wallet || !wallet.glAccount) {
        return 0
    }

    // 2. Get Balance of the Unique Account (No reference ID filtering needed)
    return await AccountingEngine.getAccountBalance(wallet.glAccount.code, undefined, undefined, tx)
}

export async function getMemberContributionBalance(memberId: string, tx?: DbClient): Promise<number> {
    const code = await getSystemCode('CONTRIBUTIONS' as SystemAccountType, tx)
    // Get balance for this specific member's contributions
    // Contributions are credits to account 1200.
    // Since 1200 is now a LIABILITY (Member Fund), credits increase the balance (Positive).
    return await AccountingEngine.getAccountBalance(code, memberId, undefined, tx)
}

// Member Share Capital Balance
export async function getMemberShareBalance(memberId: string, tx?: DbClient): Promise<number> {
    // Use CONTRIBUTIONS as the system account type for share capital
    const code = await getSystemCode('CONTRIBUTIONS' as SystemAccountType, tx)
    return await AccountingEngine.getAccountBalance(code, memberId, undefined, tx)
}


// Strict Ledger Balance for Loan (Principal + Interest + Penalties)
// Sum of all Asset account lines linked to this loan
export async function getLoanOutstandingBalance(loanId: string, tx?: DbClient): Promise<number> {
    const client = tx ?? prisma

    // 1. Fetch Loan Application Number for descriptive matching
    const loan = await client.loan.findUnique({
        where: { id: loanId },
        select: { loanApplicationNumber: true }
    });

    if (!loan) return 0;

    // 2. Fetch entries by Reference ID (Strict Link)
    const refEntries = await client.ledgerEntry.findMany({
        where: {
            ledgerTransaction: {
                referenceId: loanId,
                // isReversed: false
            },
            ledgerAccount: { type: 'ASSET' }
        },
        include: { ledgerAccount: true }
    });

    // 3. Fetch entries by Keyword (Description Link)
    const keywordEntries = await client.ledgerEntry.findMany({
        where: {
            // ledgerTransaction: { isReversed: false },
            ledgerAccount: { type: 'ASSET' },
            description: { contains: loan.loanApplicationNumber }
        },
        include: { ledgerAccount: true }
    });

    // 4. Merge and Deduplicate
    const allEntriesMap = new Map<string, any>();
    refEntries.forEach(e => allEntriesMap.set(e.id, e));
    keywordEntries.forEach(e => allEntriesMap.set(e.id, e));

    const lines = Array.from(allEntriesMap.values());

    // 5. Intelligent Filtering for multi-loan transactions
    // If a line was picked up by Reference ID, but mentions a COMPLETELY DIFFERENT loan number, skip it for this loan.
    // Example: A transaction for LN010 has a line "Repayment - LN005". 
    // This line should NOT be counted for LN010's balance.
    const filteredLines = lines.filter(line => {
        const desc = line.description || "";
        // If it mentions ANOTHER loan and DOES NOT mention THIS loan, exclude it.
        if (desc.includes("LN") && !desc.includes(loan.loanApplicationNumber)) {
            return false;
        }
        return true;
    });


    let balance = toDecimal(0)

    for (const line of filteredLines) {
        // For Assets: Debit increases (Disbursement, Accrual), Credit decreases (Repayment)
        balance = balance.plus(line.debitAmount).minus(line.creditAmount)
    }

    return toNumber(balance)
}

// Get breakdown of loan balance (Principal vs Interest/Penalty) based on Ledger Accounts
export async function getLoanFinancials(loanId: string, tx?: DbClient) {
    const client = tx ?? prisma

    // Resolve System Codes
    // Use the Loan Portfolio account (mapped to Repayment Principal) for Principal lines
    const principalCode = await getSystemCode('EVENT_LOAN_REPAYMENT_PRINCIPAL' as SystemAccountType, tx)
    const interestCode = await getSystemCode('RECEIVABLE_LOAN_INTEREST' as SystemAccountType, tx)

    // Fetch all asset lines for this loan
    const lines = await client.ledgerEntry.findMany({
        where: {
            ledgerTransaction: {
                referenceId: loanId,
                // isReversed: false
            },
            ledgerAccount: {
                type: 'ASSET'
            }
        },
        include: { ledgerAccount: true }
    })

    let principal = toDecimal(0)
    let interest = toDecimal(0)

    for (const line of lines) {
        const amount = new Decimal(line.debitAmount).minus(line.creditAmount)

        if (line.ledgerAccount.code === principalCode) {
            principal = principal.plus(amount)
        } else if (line.ledgerAccount.code === interestCode) {
            interest = interest.plus(amount)
        }
    }

    return {
        principal: toNumber(principal),
        interest: toNumber(interest),
        total: toNumber(principal.plus(interest))
    }
}

// Helper to get just Principal Balance (Asset)
export async function getLoanPrincipalBalance(loanId: string, tx?: DbClient): Promise<number> {
    const financials = await getLoanFinancials(loanId, tx)
    return financials.principal
}

// Helper to get Interest Balance (Receivable)
export async function getLoanInterestBalance(loanId: string, tx?: DbClient): Promise<number> {
    const financials = await getLoanFinancials(loanId, tx)
    return financials.interest
}

// Helper to get Penalty Balance (Receivable)
// Helper to get Penalty Balance (Receivable)
export async function getLoanPenaltyBalance(loanId: string, tx?: DbClient): Promise<number> {
    const client = tx ?? prisma

    try {
        // Attempt to get system mapping for Penalty Receivable
        // If not mapped, it might throw, so we catch and return 0 or rely on Loan model if needed.
        // But AccountingEngine should drive this.
        const penaltyCode = await getSystemCode('RECEIVABLE_LOAN_PENALTY' as SystemAccountType, tx)

        // Penalties are Assets (Receivables)
        // Debit increases (Accrual), Credit decreases (Payment)
        return await AccountingEngine.getAccountBalance(penaltyCode, loanId, undefined, tx)
    } catch (e: any) {
        // If no mapping, assume not tracking penalties on ledger separately yet
        return 0
    }
}

// Helper to get Fee Balance (Receivable)
export async function getLoanFeeBalance(loanId: string, tx?: DbClient): Promise<number> {
    const client = tx ?? prisma

    try {
        const feeCode = await getSystemCode('RECEIVABLE_LOAN_FEES' as SystemAccountType, tx)
        // Fees are Assets (Receivables)
        return await AccountingEngine.getAccountBalance(feeCode, loanId, undefined, tx)
    } catch (e: any) {
        // If no mapping, return 0 (or fallback to legacy behavior if strictly needed, but we want to migrate)
        return 0
    }
}

// ========================================
// PRODUCT-LEVEL ACCOUNTING MAPPING
// ========================================

type LoanEventType = 'INTEREST_ACCRUAL' | 'PENALTY_APPLIED'

export const AccountingService = {
    /**
     * Post a loan-related event with dynamic GL account resolution
     */
    async postLoanEvent(
        loanId: string,
        eventType: LoanEventType,
        amount: number,
        tx: Prisma.TransactionClient
    ) {
        // 1. Fetch Loan & Product
        const loan = await tx.loan.findUnique({
            where: { id: loanId },
            include: { loanProduct: true }
        })

        if (!loan) throw new Error(`Loan ${loanId} not found`)

        // 2. Resolve Mappings based on Event Type
        // We need 2 accounts: DEBIT and CREDIT
        let debitType: 'INTEREST_RECEIVABLE' | 'PENALTY_RECEIVABLE' | 'LOAN_PORTFOLIO'
        let creditType: 'INTEREST_INCOME' | 'PENALTY_INCOME'

        switch (eventType) {
            case 'INTEREST_ACCRUAL':
                debitType = 'INTEREST_RECEIVABLE' // Asset
                creditType = 'INTEREST_INCOME'    // Income
                break
            case 'PENALTY_APPLIED':
                debitType = 'PENALTY_RECEIVABLE' // Asset (Or Portfolio if capitalized)
                creditType = 'PENALTY_INCOME'    // Income
                break
            default:
                throw new Error(`Unsupported loan event type: ${eventType}`)
        }

        // 3. Query Mappings
        if (!loan.loanProductId) {
            throw new Error(`Loan ${loanId} is not linked to a product. Cannot resolve accounting mappings.`)
        }

        const mappings = await tx.productAccountingMapping.findMany({
            where: {
                productId: loan.loanProductId,
                accountType: { in: [debitType, creditType] } as any
            },
            include: { account: true }
        })

        const debitMap = mappings.find(m => m.accountType === debitType)
        const creditMap = mappings.find(m => m.accountType === creditType)

        // 4. Validate Configuration
        if (!debitMap || !debitMap.account) {
            throw new Error(`Accounting configuration missing for Product ${loan.loanProduct?.name || 'Unknown'}: No ${debitType} account mapped.`)
        }
        if (!creditMap || !creditMap.account) {
            throw new Error(`Accounting configuration missing for Product ${loan.loanProduct?.name || 'Unknown'}: No ${creditType} account mapped.`)
        }

        console.log(`posting ${eventType} for ${amount}. DR: ${(debitMap as any).account.name} | CR: ${(creditMap as any).account.name}`)

        // 5. Post Journal Entry
        return await AccountingEngine.postJournalEntry({
            transactionDate: new Date(),
            referenceType: eventType === 'INTEREST_ACCRUAL' ? 'LOAN_INTEREST_ACCRUAL' : 'LOAN_PENALTY_ACCRUAL',
            referenceId: loan.id, // Or specific schedule item ID if passed? For now Loan ID.
            description: `${eventType === 'INTEREST_ACCRUAL' ? 'Interest Accrual' : 'Penalty Applied'} - ${loan.loanApplicationNumber}`,
            createdBy: 'SYSTEM',
            createdByName: 'System',
            lines: [
                {
                    accountCode: (debitMap as any).account.code,
                    debitAmount: amount,
                    creditAmount: 0,
                    description: `${eventType} Receivable`
                },
                {
                    accountCode: (creditMap as any).account.code,
                    debitAmount: 0,
                    creditAmount: amount,
                    description: `${eventType} Income`
                }
            ]
        }, tx)
    }
}
