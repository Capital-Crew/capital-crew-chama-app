# Global Idempotency System - Usage Examples

## Overview

The idempotency system prevents duplicate transactions caused by:
- Double-clicks on submit buttons
- Network retries
- Browser back/forward navigation
- Slow server responses

## Components

1. **Database**: `IdempotencyRecord` model tracks all idempotent requests
2. **Backend**: `withIdempotency()` wrapper protects server actions
3. **Frontend**: `useIdempotency()` hook generates unique keys

---

## Example 1: Basic Server Action

### Server Action (with idempotency)

```typescript
// app/actions/loan-actions.ts
'use server';

import { withIdempotency } from '@/lib/idempotency';
import { prisma } from '@/lib/prisma';

export async function createLoanApplication(
    data: LoanApplicationData,
    idempotencyKey: string
) {
    return withIdempotency({
        key: idempotencyKey,
        path: 'createLoanApplication',
        businessLogic: async () => {
            // Your actual business logic here
            const loan = await prisma.loan.create({
                data: {
                    ...data,
                    status: 'DRAFT'
                }
            });

            return {
                success: true,
                loanId: loan.id
            };
        }
    });
}
```

### Frontend Component

```typescript
// components/LoanApplicationForm.tsx
'use client';

import { useIdempotency } from '@/hooks/useIdempotency';
import { createLoanApplication } from '@/app/actions/loan-actions';
import { useState } from 'react';

export function LoanApplicationForm() {
    const { idempotencyKey, refreshKey } = useIdempotency();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true);
        
        try {
            const result = await createLoanApplication(
                {
                    amount: parseFloat(formData.get('amount') as string),
                    productId: formData.get('productId') as string,
                    // ... other fields
                },
                idempotencyKey // Pass the key to the server action
            );

            if (result.success) {
                toast.success('Loan application submitted!');
                refreshKey(); // Generate new key for next submission
                // Reset form or redirect
            }
        } catch (error: any) {
            if (error.name === 'RequestInProgressError') {
                toast.error('Request is already being processed. Please wait.');
            } else {
                toast.error('Failed to submit application');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form action={handleSubmit}>
            {/* Form fields */}
            <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
        </form>
    );
}
```

---

## Example 2: Expense Submission

```typescript
// app/actions/expense-actions.ts
'use server';

import { withIdempotency } from '@/lib/idempotency';

export async function submitExpense(
    expenseData: ExpenseData,
    idempotencyKey: string
) {
    return withIdempotency({
        key: idempotencyKey,
        path: 'submitExpense',
        businessLogic: async () => {
            // Create expense record
            const expense = await prisma.expense.create({
                data: expenseData
            });

            // Send notification
            await sendExpenseNotification(expense.id);

            return {
                success: true,
                expenseId: expense.id,
                message: 'Expense submitted successfully'
            };
        }
    });
}
```

---

## Example 3: Payment Processing

```typescript
// app/actions/payment-actions.ts
'use server';

import { withIdempotency } from '@/lib/idempotency';

export async function processPayment(
    paymentData: PaymentData,
    idempotencyKey: string
) {
    return withIdempotency({
        key: idempotencyKey,
        path: 'processPayment',
        businessLogic: async () => {
            // Critical: This will only execute once even if called multiple times
            const payment = await prisma.payment.create({
                data: paymentData
            });

            // Update wallet balance
            await updateWalletBalance(paymentData.userId, paymentData.amount);

            // Create journal entries
            await createJournalEntries(payment.id);

            return {
                success: true,
                paymentId: payment.id,
                newBalance: await getWalletBalance(paymentData.userId)
            };
        }
    });
}
```

---

## Error Handling

### RequestInProgressError

When a request is already being processed:

```typescript
try {
    const result = await createLoanApplication(data, idempotencyKey);
} catch (error: any) {
    if (error.name === 'RequestInProgressError') {
        // Show user-friendly message
        toast.info('Your request is being processed. Please wait...');
        
        // Optionally: Poll for completion
        setTimeout(() => checkRequestStatus(idempotencyKey), 2000);
    } else {
        // Handle other errors
        toast.error('An error occurred');
    }
}
```

---

## Cleanup (Optional)

Run periodically to prevent table bloat:

```typescript
// app/api/cron/cleanup-idempotency/route.ts
import { cleanupIdempotencyRecords } from '@/lib/idempotency';
import { NextResponse } from 'next/server';

export async function GET() {
    // Delete records older than 7 days
    const deletedCount = await cleanupIdempotencyRecords(7);
    
    return NextResponse.json({
        success: true,
        deletedCount
    });
}
```

---

## Best Practices

1. **Always pass idempotency key** to server actions that modify data
2. **Refresh key after success** to prepare for next submission
3. **Don't refresh on error** - let user retry with same key
4. **Use descriptive path names** for better tracking and debugging
5. **Handle RequestInProgressError** gracefully in UI
6. **Set up cleanup cron job** to prevent database bloat

---

## Testing

### Test Duplicate Submission

```typescript
// Simulate double-click
const key = crypto.randomUUID();

// Both calls will use same key
const [result1, result2] = await Promise.all([
    createLoanApplication(data, key),
    createLoanApplication(data, key)
]);

// result1 and result2 will be identical (cached response)
// Only one loan will be created in database
```

### Test Network Retry

```typescript
// Simulate network retry with same key
const key = crypto.randomUUID();

try {
    await createLoanApplication(data, key);
} catch (error) {
    // Network error - retry with SAME key
    const result = await createLoanApplication(data, key);
    // Will return cached response if first attempt succeeded
}
```
