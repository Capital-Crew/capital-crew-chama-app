# Financial Calculations Guide

## Overview

This document describes the financial calculation system used in Capital Crew SACCO. All monetary calculations use `decimal.js-light` to ensure precision and eliminate floating-point errors.

## Precision Standards

### Monetary Amounts
- **Database Type**: `Decimal(19, 4)`
- **Total Digits**: 19
- **Decimal Places**: 4
- **Storage Precision**: 4 decimal places
- **Display Precision**: 2 decimal places
- **Use For**: Loan amounts, balances, fees, payments, contributions

**Example:**
```typescript
import { MoneyDecimal } from '@/lib/decimal/config'

const amount = new MoneyDecimal("1234.5678")
const stored = amount.toDecimalPlaces(4) // 1234.5678
const displayed = amount.toFixed(2)      // "1234.57"
```

### Interest Rates
- **Database Type**: `Decimal(10, 6)`
- **Total Digits**: 10
- **Decimal Places**: 6
- **Use For**: Annual rates, monthly rates, penalty rates

**Example:**
```typescript
import { RateDecimal } from '@/lib/decimal/config'

const annualRate = new RateDecimal("12.5")     // 12.5% annual
const monthlyRate = annualRate.dividedBy(12)   // 1.041667% monthly
```

### Percentages
- **Database Type**: `Decimal(5, 2)`
- **Total Digits**: 5
- **Decimal Places**: 2
- **Use For**: Fee percentages, processing fees, insurance fees

**Example:**
```typescript
import { PercentDecimal } from '@/lib/decimal/config'

const feePercent = new PercentDecimal("2.5")  // 2.5%
```

## Rounding Rules

### Storage Rounding
- **Rule**: Round to 4 decimal places using ROUND_HALF_UP
- **When**: Before saving to database
- **Example**: 1234.56789 → 1234.5679

### Display Rounding
- **Rule**: Round to 2 decimal places using ROUND_HALF_UP
- **When**: Showing values to users
- **Example**: 1234.567 → 1234.57

### Intermediate Calculations
- **Rule**: NEVER round during intermediate steps
- **Reason**: Prevents accumulated rounding errors
- **Only Round**: At the final step before storage or display

## Financial Formulas

### Equal Monthly Installment (EMI)

**Formula:**
```
EMI = P × [r(1+r)^n] / [(1+r)^n - 1]
```

Where:
- P = Principal amount
- r = Monthly interest rate (annual rate / 12)
- n = Number of installments

**Implementation:**
```typescript
import { calculateEMI } from '@/lib/decimal/formulas'

const emi = calculateEMI(
  "10000",  // Principal
  "0.12",   // Annual rate (12%)
  12        // 12 months
)
// Result: ~888.49
```

### Simple Interest

**Formula:**
```
Interest = Principal × Rate × Time
```

**Implementation:**
```typescript
import { calculateSimpleInterest } from '@/lib/decimal/formulas'

const interest = calculateSimpleInterest(
  "10000",  // Principal
  "0.12",   // Rate (12%)
  "1"       // Time (1 year)
)
// Result: 1200
```

### Daily Interest

**Formula:**
```
Daily Interest = (Principal × Annual Rate × Days) / 365
```

**Implementation:**
```typescript
import { calculateDailyInterest } from '@/lib/decimal/formulas'

const interest = calculateDailyInterest(
  "10000",  // Principal
  "0.12",   // Annual rate
  30        // Days
)
// Result: ~98.63
```

### Percentage Fee

**Formula:**
```
Fee = Amount × (Percentage / 100)
```

**Implementation:**
```typescript
import { calculatePercentageFee } from '@/lib/decimal/formulas'

const fee = calculatePercentageFee(
  "1000",  // Amount
  "2.5"    // Percentage (2.5%)
)
// Result: 25
```

## Best Practices

### ✅ DO

1. **Always use strings for input:**
   ```typescript
   const amount = new MoneyDecimal("1234.56")  // ✅ Good
   ```

2. **Use decimal operations:**
   ```typescript
   const total = amount.plus(fee)  // ✅ Good
   ```

3. **Round only at final step:**
   ```typescript
   const result = calculation.toDecimalPlaces(4)  // ✅ Good
   ```

4. **Use API string serialization:**
   ```typescript
   return { amount: value.toFixed(4) }  // ✅ Good
   ```

### ❌ DON'T

1. **Don't use numbers directly:**
   ```typescript
   const amount = new MoneyDecimal(1234.56)  // ❌ Bad (floating-point)
   ```

2. **Don't use native operators:**
   ```typescript
   const total = amount + fee  // ❌ Bad
   ```

3. **Don't round intermediates:**
   ```typescript
   const step1 = value.toFixed(2)  // ❌ Bad (loses precision)
   const step2 = new Decimal(step1).times(2)
   ```

4. **Don't use .toNumber():**
   ```typescript
   const num = value.toNumber()  // ❌ Bad (loses precision)
   ```

## Common Patterns

### Loan Repayment Calculation

```typescript
import { calculateEMI, splitPayment } from '@/lib/decimal/formulas'

// Calculate EMI
const emi = calculateEMI(principal, annualRate, installments)

// For each payment, split into principal and interest
const payment = splitPayment(
  emi,              // Payment amount
  currentBalance,   // Current loan balance
  interestDue       // Interest due this period
)

console.log(payment.principal)  // Principal portion
console.log(payment.interest)   // Interest portion
```

### Fee Calculation

```typescript
import { calculatePercentageFee, calculateAmountWithFee } from '@/lib/decimal/formulas'

// Calculate fee only
const fee = calculatePercentageFee(amount, feePercent)

// Calculate total including fee
const total = calculateAmountWithFee(amount, feePercent)
```

### Balance Updates

```typescript
import { add, subtract } from '@/lib/decimal/operations'

// Add to balance
const newBalance = add(currentBalance, deposit)

// Subtract from balance
const newBalance = subtract(currentBalance, withdrawal)
```

## Testing

All decimal operations must be tested for:

1. **Basic Arithmetic**: 0.1 + 0.2 = 0.3 (not 0.30000000000000004)
2. **Edge Cases**: Zero, negative, very large/small numbers
3. **Rounding Boundaries**: Values ending in .5, .005, etc.
4. **Precision Preservation**: Multiple operations don't accumulate errors

See `__tests__/decimal/decimal-operations.test.ts` for examples.

## Audit Logging

All financial calculations should be logged with:
- Input values (with full precision)
- Calculation method/formula used
- Output values (with full precision)
- Timestamp
- User/system context

**Example:**
```typescript
console.log({
  operation: 'EMI_CALCULATION',
  inputs: { principal, rate, installments },
  output: emi.toString(),
  timestamp: new Date().toISOString()
})
```

## Migration Guide

### Converting Existing Code

**Before (Float):**
```typescript
const total = amount + fee
const rounded = Math.round(total * 100) / 100
```

**After (Decimal):**
```typescript
import { add, roundForDisplay } from '@/lib/decimal/operations'

const total = add(amount, fee)
const rounded = roundForDisplay(total)
```

### API Changes

**Before:**
```typescript
// Accept number
async function createLoan(amount: number) {
  // ...
}
```

**After:**
```typescript
// Accept string
async function createLoan(amount: string) {
  const amountDecimal = new MoneyDecimal(amount)
  // ...
}
```

## References

- [decimal.js Documentation](https://mikemcl.github.io/decimal.js-light/)
- Prisma Decimal Type
- IEEE 754 Floating Point Standard (what we're avoiding)
