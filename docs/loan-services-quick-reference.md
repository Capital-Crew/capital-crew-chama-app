# Loan Services Quick Reference

## 🚀 Quick Start

### Process a Payment
```typescript
import { RepaymentProcessorService } from '@/lib/services/RepaymentProcessorService'

const result = await RepaymentProcessorService.processRepayment(
  loanId,
  1000,           // amount
  new Date(),     // date
  'Cash Payment'  // description
)

console.log(result.allocation)
// { penaltyAmount: 0, interestAmount: 200, principalAmount: 800, ... }
```

### Get Current Due Amount
```typescript
import { MonthlyDueService } from '@/lib/services/MonthlyDueService'

const due = await MonthlyDueService.getDueBreakdown(loanId)

console.log(`Total Due: ${due.totalDue}`)
console.log(`Arrears: ${due.arrears.total}`)
console.log(`Current: ${due.current.total}`)
```

### Get Loan Balance
```typescript
import { LoanBalanceService } from '@/lib/services/LoanBalanceService'

const balance = await LoanBalanceService.getLoanBalance(loanId)

console.log(`Outstanding: ${balance.totals.totalOutstanding}`)
console.log(`Principal: ${balance.principal.outstanding}`)
console.log(`Interest: ${balance.interest.outstanding}`)
```

### Update Loan Status
```typescript
import { LoanStateService } from '@/lib/services/LoanStateService'

const result = await LoanStateService.updateLoanStatus(loanId)

if (result.statusChanged) {
  console.log(`Status changed: ${result.previousStatus} → ${result.newStatus}`)
}
```

---

## 📡 API Endpoints

### Get Balance
```bash
GET /api/loans/[loanId]/balance
```

### Get Due Amounts
```bash
GET /api/loans/[loanId]/due?asOfDate=2026-01-05
```

### Process Payment
```bash
POST /api/loans/[loanId]/repayment
Content-Type: application/json

{
  "amount": 1000,
  "description": "Payment via M-PESA"
}
```

### Get Member Portfolio
```bash
GET /api/members/[memberId]/portfolio
```

---

## 🔧 Common Tasks

### Create Loan with Installments
```typescript
// 1. Create loan
const loan = await db.loan.create({ ... })

// 2. Generate installments
const installments = ScheduleGeneratorService.generate(
  loan.amount,
  loan.interestRate,
  12, // months
  'FLAT',
  loan.disbursementDate,
  loan.id
)

// 3. Save installments
await db.repaymentInstallment.createMany({
  data: installments.map(inst => ({ ...inst, loanId: loan.id }))
})

// 4. Activate loan
await LoanStateService.activateLoan(loan.id)
```

### Handle Overpayment
```typescript
// 1. Detect overpayment
const overpayment = await OverpaymentHandlerService.detectOverpayment(loanId)

if (overpayment.hasOverpayment) {
  // 2. Apply to future principal
  await OverpaymentHandlerService.applyToFuturePrincipal(
    loanId,
    overpayment.overpaymentAmount
  )
  
  // 3. Calculate savings
  const savings = await OverpaymentHandlerService.calculateInterestSavings(
    loanId,
    overpayment.overpaymentAmount
  )
  
  console.log(`Interest saved: ${savings.interestSavings}`)
}
```

### Correct a Payment Error
```typescript
// Option 1: Reverse transaction
await TransactionReplayService.reverseTransaction(transactionId)

// Option 2: Insert backdated payment
await TransactionReplayService.insertBackdatedPayment(
  loanId,
  1000,
  new Date('2025-12-15'),
  'Missed payment from December'
)
```

---

## 🐛 Troubleshooting

### Balance Doesn't Match
```typescript
// Rebuild state from transactions
await TransactionReplayService.replayTransactions(loanId)
```

### Loan Missing Installments
```bash
# Run migration script
npx tsx scripts/migrate-loan-installments.ts
```

### Status Not Updating
```typescript
// Manually trigger status update
await LoanStateService.updateLoanStatus(loanId)
```

---

## 📊 Monitoring

### Check System Health
```typescript
// Get portfolio summary
const portfolio = await LoanBalanceService.getMemberPortfolioBalance(memberId)

// Check for issues
if (portfolio.totalArrears > portfolio.totalOutstanding * 0.3) {
  console.warn('High arrears ratio!')
}
```

### Batch Update Statuses
```typescript
// Daily cron job
const updated = await LoanStateService.batchUpdateAllLoanStatuses()
console.log(`Updated ${updated} loan statuses`)
```

---

## 🔐 Best Practices

### DO ✅
- Always use `RepaymentProcessorService` for payments
- Call `LoanStateService.updateLoanStatus()` after payments
- Use `MonthlyDueService` for "what's due now" queries
- Run migration script before deploying
- Validate balances after major changes

### DON'T ❌
- Don't manually update `RepaymentInstallment` paid fields
- Don't delete transactions (reverse them instead)
- Don't calculate balances in UI components
- Don't skip status updates after payments
- Don't process payments for CLEARED loans

---

## 📚 Further Reading

- `walkthrough.md` - Complete implementation guide
- `integration_summary.md` - Deployment guide
- `integration_plan.md` - Integration strategy

---

**Need Help?** Check the troubleshooting section or contact the development team.
