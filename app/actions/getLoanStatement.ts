'use server'

import { db } from '@/lib/db'
import { serializeLoan } from '@/lib/serializers'

const prisma = db

/**
 * Fetch loan statement data including all transactions
 * Transactions are ordered chronologically for accurate balance tracking
 */
export async function getLoanStatement(loanId: string) {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: {
      member: {
        select: {
          id: true,
          name: true,
          memberNumber: true
        }
      },
      loanProduct: {
        select: {
          name: true,
          interestRatePerPeriod: true
        }
      }
    }
  })

  if (!loan) {
    throw new Error('Loan not found')
  }

  // Fetch LoanTransaction entries (Source of Truth for Loan Activity)
  // CRITICAL: Fetch ALL transactions, including reversed ones. Do NOT filter by isReversed.
  // We include the reversed transaction itself AND the reversal transaction.
  const loanTransactions = await prisma.loanTransaction.findMany({
    where: {
      loanId: loanId
    },
    orderBy: { postedAt: 'asc' }
  })

  // Pre-fetch original transactions for Reversals to know what they reversed
  // Creating a map for O(1) lookup
  const txMap = new Map(loanTransactions.map(t => [t.id, t]))

  let runningBalance = 0

  // Transform to Statement Transactions with Running Balance
  const statementTransactions = loanTransactions.map(tx => {
    let type = 'CHARGE'
    const amount = Number(tx.amount)
    let balanceChange = 0

    switch (tx.type) {
      case 'DISBURSEMENT':
        type = 'DISBURSEMENT'
        balanceChange = amount
        break
      case 'REPAYMENT':
        type = 'REPAYMENT'
        balanceChange = -amount
        break
      case 'INTEREST':
        type = 'INTEREST'
        balanceChange = amount
        break
      case 'PENALTY':
        type = 'PENALTY'
        balanceChange = amount
        break
      case 'WAIVER':
        type = 'WAIVER'
        balanceChange = -amount
        break
      case 'REVERSAL':
        type = 'REVERSAL'
        // Logic: The Opposite of the transaction it is reversing.
        // We look up the original transaction by referenceId
        const originalTx = tx.referenceId ? txMap.get(tx.referenceId) : null

        if (originalTx) {
          if (originalTx.type === 'REPAYMENT' || originalTx.type === 'WAIVER') {
            // Reversing a credit -> Debit (Increase Balance)
            balanceChange = amount
          } else if (originalTx.type === 'DISBURSEMENT' || originalTx.type === 'INTEREST' || originalTx.type === 'PENALTY') {
            // Reversing a debit -> Credit (Decrease Balance)
            balanceChange = -amount
          }
        } else {
          // Fallback if reference missing (shouldn't happen with new service)
          // Assume it reverses a Repayment (most common) -> Increase Balance
          balanceChange = amount
        }
        break
      default:
        type = 'CHARGE'
        balanceChange = amount
    }

    // Apply change to running balance
    runningBalance += balanceChange

    return {
      id: tx.id,
      type,
      amount: amount,
      description: tx.description || `${tx.type} Transaction`,
      createdAt: tx.postedAt,
      // Pass breakdown fields for statement formatting
      principalAmount: Number(tx.principalAmount || 0),
      interestAmount: Number(tx.interestAmount || 0),
      penaltyAmount: Number(tx.penaltyAmount || 0),
      feeAmount: Number(tx.feeAmount || 0),
      isReversed: tx.isReversed,
      reversedAt: tx.reversedAt,
      runningBalance: Number(runningBalance.toFixed(2)) // New Field
    }
  })

  return {
    ...serializeLoan(loan),
    loanProduct: loan.loanProduct ? {
      ...loan.loanProduct,
      interestRatePerPeriod: Number(loan.loanProduct.interestRatePerPeriod)
    } : null,
    walletTransactions: statementTransactions
  }
}
