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
  // Fetch LoanTransaction entries (Source of Truth for Loan Activity)
  // CRITICAL: Fetch ALL transactions, including reversed ones. Do NOT filter by isReversed.
  const loanTransactions = await prisma.loanTransaction.findMany({
    where: {
      loanId: loanId
    },
    orderBy: { postedAt: 'asc' }
  })

  // Transform to Statement Transactions
  const statementTransactions = loanTransactions.map(tx => {
    let type = 'CHARGE'

    switch (tx.type) {
      case 'DISBURSEMENT':
        type = 'DISBURSEMENT'
        break
      case 'REPAYMENT':
        type = 'REPAYMENT'
        break
      case 'INTEREST':
        type = 'INTEREST'
        break
      case 'PENALTY':
        type = 'PENALTY'
        break
      case 'WAIVER':
        type = 'WAIVER'
        break
      default:
        type = 'CHARGE'
    }

    return {
      id: tx.id,
      type,
      amount: Number(tx.amount),
      description: tx.description || `${tx.type} Transaction`,
      createdAt: tx.postedAt,
      // Pass breakdown fields for statement formatting
      principalAmount: Number(tx.principalAmount || 0),
      interestAmount: Number(tx.interestAmount || 0),
      penaltyAmount: Number(tx.penaltyAmount || 0),
      feeAmount: Number(tx.feeAmount || 0),
      isReversed: tx.isReversed,
      reversedAt: tx.reversedAt
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
