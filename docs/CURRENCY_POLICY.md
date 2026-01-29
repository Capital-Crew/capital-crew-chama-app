# Currency Handling Policy - "No Rounding Up"

## 🚨 Critical Rule

**ALL monetary values MUST be TRUNCATED (floored) to 2 decimal places. NEVER rounded.**

### Examples

| Input | ❌ Wrong (Rounded) | ✅ Correct (Truncated) |
|-------|-------------------|----------------------|
| 100.999 | 101.00 | 100.99 |
| 100.566 | 100.57 | 100.56 |
| 100.001 | 100.00 | 100.00 |

## 📋 Implementation Guide

### 1. Use the Currency Utility

```typescript
import { formatMoney, truncateToDecimals, formatCurrency } from '@/lib/currency';

// ✅ CORRECT
const formatted = formatMoney(100.999); // "100.99"
const truncated = truncateToDecimals(100.999, 2); // 100.99
const withSymbol = formatCurrency(100.999); // "KES 100.99"

// ❌ WRONG - NEVER DO THIS
const wrong = (100.999).toFixed(2); // "101.00" - ROUNDS UP!
const alsoWrong = Math.round(100.999 * 100) / 100; // 101 - ROUNDS UP!
```

### 2. Use the CurrencyDisplay Component

```tsx
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';

// ✅ CORRECT
<CurrencyDisplay amount={100.999} /> // Displays: KES 100.99

// ❌ WRONG - NEVER DO THIS
<span>{amount.toFixed(2)}</span> // ROUNDS UP!
<span>{amount.toLocaleString()}</span> // MAY ROUND UP!
```

### 3. Database Schema

All monetary fields MUST use `Decimal` type:

```prisma
model Loan {
  amount              Decimal  @db.Decimal(65, 30)
  processingFee       Decimal  @db.Decimal(65, 30)
  insuranceFee        Decimal  @db.Decimal(65, 30)
  // NEVER use Float or Int for money!
}
```

## 🚫 Banned Methods

The following methods are **FORBIDDEN** for monetary values:

1. **`.toFixed()`** - Rounds at 0.5
2. **`Math.round()`** - Rounds at 0.5
3. **`Math.ceil()`** - Always rounds up
4. **`Number.toLocaleString()`** - May round (use with caution)

## ✅ Approved Methods

1. **`formatMoney()`** - From `@/lib/currency`
2. **`truncateToDecimals()`** - From `@/lib/currency`
3. **`<CurrencyDisplay />`** - Component from `@/components/ui/CurrencyDisplay`
4. **`Math.floor()`** - For manual truncation only

## 🔧 Utility Functions

### Basic Formatting

```typescript
import { formatMoney, formatCurrency } from '@/lib/currency';

formatMoney(1234.567); // "1,234.56"
formatCurrency(1234.567); // "KES 1,234.56"
```

### Calculations

```typescript
import { addMoney, subtractMoney, multiplyMoney, calculatePercentage } from '@/lib/currency';

addMoney(100.999, 50.555); // 151.55 (truncated)
subtractMoney(100.999, 50.555); // 50.44 (truncated)
multiplyMoney(100.999, 2); // 201.99 (truncated)
calculatePercentage(1000, 2.5); // 25.00 (2.5% of 1000)
```

### Prisma Decimal Conversion

```typescript
import { decimalToNumber, numberToDecimal } from '@/lib/currency';

const loan = await prisma.loan.findUnique({ where: { id } });
const amount = decimalToNumber(loan.amount); // Truncated number
const newAmount = numberToDecimal(1234.567); // Truncated Decimal
```

## 🧪 Testing

Always test edge cases:

```typescript
describe('Currency Truncation', () => {
  it('should truncate, not round', () => {
    expect(truncateToDecimals(100.999, 2)).toBe(100.99);
    expect(truncateToDecimals(100.566, 2)).toBe(100.56);
    expect(truncateToDecimals(100.001, 2)).toBe(100.00);
  });
});
```

## 📝 Migration Checklist

When refactoring existing code:

- [ ] Replace all `.toFixed()` with `formatMoney()`
- [ ] Replace all `Math.round()` with `truncateToDecimals()`
- [ ] Replace inline formatting with `<CurrencyDisplay />`
- [ ] Verify database schema uses `Decimal` type
- [ ] Add tests for truncation behavior
- [ ] Enable ESLint rules from `.eslintrc-currency-rules.json`

## 🎯 Why This Matters

Financial systems must be **deterministic** and **predictable**. Rounding introduces:

1. **Inconsistency** - Different libraries round differently
2. **Accumulation errors** - Small rounding errors compound
3. **Audit failures** - Rounded values don't match source data
4. **Legal issues** - Financial regulations require exact calculations

**Truncation ensures consistency across the entire system.**
