// lib/fines/calculateContributionFine.ts

export type FineBreakdown = {
  contributionId:   string
  dueDate:          Date
  calculationDate:  Date
  daysPastDue:      number
  scheduledAmount:  number
  flatFee:          number
  dailyRatePercent: number
  dailyPenalty:     number   // amount × (dailyRate/100) × daysPastDue
  totalFine:        number   // flatFee + dailyPenalty
  totalDue:         number   // (scheduledAmount - amountPaid) + totalFine
}

type CalculateFineInput = {
  contributionId:   string
  dueDate:          Date
  scheduledAmount:  number
  amountPaid:       number
  status:           string
  flatFeeApplied:   number
  dailyRateApplied: number
  fineEnabled:      boolean
  calculationDate?: Date
}

export function calculateContributionFine(
  input: CalculateFineInput
): FineBreakdown {
  const calcDate = startOfDayUTC(input.calculationDate ?? new Date())
  const due      = startOfDayUTC(input.dueDate)

  // Calculate difference in calendar days
  const diffTime = calcDate.getTime() - due.getTime()
  const daysPastDue = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)))

  if (
    !input.fineEnabled ||
    daysPastDue === 0  ||
    input.status === 'PAID' ||
    input.scheduledAmount <= input.amountPaid
  ) {
    return zeroFine(input, calcDate)
  }

  // Flat fee is charged once if at least 1 day late
  const flatFee      = input.flatFeeApplied
  
  // Daily penalty = Principal * (Rate/100) * Days
  const dailyPenalty = input.scheduledAmount * (input.dailyRateApplied / 100) * daysPastDue
  
  const totalFine    = flatFee + dailyPenalty
  const outstanding  = Math.max(0, input.scheduledAmount - input.amountPaid)

  return {
    contributionId:   input.contributionId,
    dueDate:          input.dueDate,
    calculationDate:  calcDate,
    daysPastDue,
    scheduledAmount:  input.scheduledAmount,
    flatFee:          round2(flatFee),
    dailyRatePercent: input.dailyRateApplied,
    dailyPenalty:     round2(dailyPenalty),
    totalFine:        round2(totalFine),
    totalDue:         round2(outstanding + totalFine),
  }
}

function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function zeroFine(input: CalculateFineInput, calcDate: Date): FineBreakdown {
  return {
    contributionId:   input.contributionId,
    dueDate:          input.dueDate,
    calculationDate:  calcDate,
    daysPastDue:      0,
    scheduledAmount:  input.scheduledAmount,
    flatFee:          0,
    dailyRatePercent: 0,
    dailyPenalty:     0,
    totalFine:        0,
    totalDue:         Math.max(0, input.scheduledAmount - input.amountPaid),
  }
}
