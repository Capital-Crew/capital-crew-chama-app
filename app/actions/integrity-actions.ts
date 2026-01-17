'use server'

import { SafetyNet } from '@/lib/accounting/SafetyNet'
import { auth } from '@/auth'

export async function checkSystemIntegrity() {
    const session = await auth()
    // Authorization Check (Admins only)
    if (!session?.user || !['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN'].includes((session.user as any).role)) {
        throw new Error('Unauthorized')
    }

    const ledgerIntegrity = await SafetyNet.checkLedgerIntegrity()
    const mismatchedAccounts = await SafetyNet.validateAccountBalances()

    // Serialize BigInt for client
    return {
        isBalanced: ledgerIntegrity.isBalanced,
        totalDebit: ledgerIntegrity.totalDebit.toString(),
        totalCredit: ledgerIntegrity.totalCredit.toString(),
        difference: ledgerIntegrity.difference.toString(),
        mismatches: mismatchedAccounts.map(m => ({
            ...m,
            cachedBalance: m.cachedBalance.toString(),
            calculatedBalance: m.calculatedBalance.toString(),
            difference: m.difference.toString()
        }))
    }
}
