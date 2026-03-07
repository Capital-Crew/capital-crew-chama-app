# Incomplete Code & Placeholders Audit

## SUMMARY
- **Total incomplete blocks found:** 1756
- **Files affected:** 291 files

### Count by Severity
- 🔴 CRITICAL: 60
- 🟠 HIGH: 119
- 🟡 MEDIUM: 1
- 🟢 LOW: 1576

### Top 3 Most Dangerous Items to Fix Before Production
1. **Math.random in Business Logic** in `C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/admin-actions.ts` (Line 36)
   - *Impact*: Insecure random number generation used in potentially sensitive logic (IDs, crypto)
2. **Hardcoded Placeholder** in `C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/forgot-password/page.tsx` (Line 62)
   - *Impact*: Production system will use dummy configuration, potentially causing data leaks or systemic failures
3. **Hardcoded Placeholder** in `C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/repayment-actions.ts` (Line 95)
   - *Impact*: Production system will use dummy configuration, potentially causing data leaks or systemic failures

## DETAILED FINDINGS

### 🔴 CRITICAL Findings

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/admin-actions.ts
LINE: 36
TYPE: Math.random in Business Logic
CODE: `tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));`
IMPACT: Insecure random number generation used in potentially sensitive logic (IDs, crypto)
FIX: Use crypto.randomBytes() or crypto.randomUUID()

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/forgot-password/page.tsx
LINE: 62
TYPE: Hardcoded Placeholder
CODE: `className="w-full bg-slate-50 border-none rounded-xl px-5 py-4 text-sm font-blac...`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/repayment-actions.ts
LINE: 95
TYPE: Hardcoded Placeholder
CODE: `ledgerAccountId: 'mock-cash-id',`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/repayment-actions.ts
LINE: 102
TYPE: Hardcoded Placeholder
CODE: `ledgerAccountId: 'mock-loan-id',`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/reset-password/page.tsx
LINE: 81
TYPE: Hardcoded Placeholder
CODE: `className="w-full bg-slate-50 border-none rounded-xl px-5 py-4 text-sm font-blac...`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/reset-password/page.tsx
LINE: 95
TYPE: Hardcoded Placeholder
CODE: `className="w-full bg-slate-50 border-none rounded-xl px-5 py-4 text-sm font-blac...`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/admin/UserRightsTable.tsx
LINE: 323
TYPE: Hardcoded Placeholder
CODE: `<div className="avatar placeholder">`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/auth/ChangePasswordForm.tsx
LINE: 89
TYPE: Hardcoded Placeholder
CODE: `className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-40...`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/auth/ChangePasswordForm.tsx
LINE: 107
TYPE: Hardcoded Placeholder
CODE: `className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-40...`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/auth/ChangePasswordForm.tsx
LINE: 125
TYPE: Hardcoded Placeholder
CODE: `className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-40...`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/DepositForm.tsx
LINE: 178
TYPE: Hardcoded Placeholder
CODE: `<Input type="number" placeholder="100" {...field} disabled={isLoading || status ...`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/member/MemberManagementMaster.tsx
LINE: 69
TYPE: Hardcoded Placeholder
CODE: `className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-3.5 text-xs ...`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/member/MembersList.tsx
LINE: 34
TYPE: Hardcoded Placeholder
CODE: `className="w-full bg-slate-100 border-none rounded-xl pl-10 pr-4 py-3 text-sm fo...`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/member/MembersModule.tsx
LINE: 196
TYPE: Hardcoded Placeholder
CODE: `<input name="name" required className="w-full bg-slate-50 border-none rounded-xl...`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/member/MembersModule.tsx
LINE: 200
TYPE: Hardcoded Placeholder
CODE: `<input name="contact" required className="w-full bg-slate-50 border-none rounded...`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/member/MembersModule.tsx
LINE: 204
TYPE: Hardcoded Placeholder
CODE: `<input name="email" type="email" required className="w-full bg-slate-50 border-n...`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/products/wizard/Step1General.tsx
LINE: 17
TYPE: Hardcoded Placeholder
CODE: `<Input id="name" placeholder="e.g. Development Loan" {...register("name")} />`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/products/wizard/Step1General.tsx
LINE: 24
TYPE: Hardcoded Placeholder
CODE: `<Input id="shortCode" placeholder="e.g. DL01" {...register("shortCode")} />`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/products/wizard/WizardUI.tsx
LINE: 41
TYPE: Hardcoded Placeholder
CODE: `"flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 tex...`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/SystemAdminModule.tsx
LINE: 668
TYPE: Hardcoded Placeholder
CODE: `<input name="name" required placeholder="e.g. Emergency Loan" className="w-full ...`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/SystemAdminModule.tsx
LINE: 672
TYPE: Hardcoded Placeholder
CODE: `<input name="principal" required type="number" placeholder="50000" className="w-...`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/SystemAdminModule.tsx
LINE: 677
TYPE: Hardcoded Placeholder
CODE: `<input name="interestRatePerPeriod" required type="number" step="0.01" placehold...`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/SystemAdminModule.tsx
LINE: 712
TYPE: Hardcoded Placeholder
CODE: `<input name="name" required placeholder="e.g. Emergency Loan" className="w-full ...`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/SystemAdminModule.tsx
LINE: 716
TYPE: Hardcoded Placeholder
CODE: `<input name="principal" required type="number" placeholder="50000" className="w-...`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/SystemAdminModule.tsx
LINE: 721
TYPE: Hardcoded Placeholder
CODE: `<input name="interestRatePerPeriod" required type="number" step="0.01" placehold...`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/ui/command.tsx
LINE: 33
TYPE: Hardcoded Placeholder
CODE: `"flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholde...`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/ui/input.tsx
LINE: 13
TYPE: Hardcoded Placeholder
CODE: `"flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 md:py-2...`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/ui/select.tsx
LINE: 20
TYPE: Hardcoded Placeholder
CODE: `"flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md borde...`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/ui/textarea.tsx
LINE: 13
TYPE: Hardcoded Placeholder
CODE: `"flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 ...`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/wallet/WalletOperations.tsx
LINE: 404
TYPE: Hardcoded Placeholder
CODE: `className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focu...`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/wallet/WalletOperations.tsx
LINE: 409
TYPE: Hardcoded Placeholder
CODE: `className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focu...`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/wallet/WalletOperations.tsx
LINE: 435
TYPE: Hardcoded Placeholder
CODE: `className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focu...`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/wallet/WalletOperations.tsx
LINE: 440
TYPE: Hardcoded Placeholder
CODE: `className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focu...`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/wallet/WalletOperations.tsx
LINE: 576
TYPE: Hardcoded Placeholder
CODE: `className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focu...`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/wallet/WalletOperations.tsx
LINE: 584
TYPE: Hardcoded Placeholder
CODE: `className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focu...`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/hooks/useIdempotency.ts
LINE: 57
TYPE: Math.random in Business Logic
CODE: `const r = (Math.random() * 16) | 0;`
IMPACT: Insecure random number generation used in potentially sensitive logic (IDs, crypto)
FIX: Use crypto.randomBytes() or crypto.randomUUID()

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/mock/intasend.ts
LINE: 4
TYPE: Hardcoded Placeholder
CODE: `console.log('⚠️ USING MOCK INTASEND COLLECTION', payload);`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/mock/intasend.ts
LINE: 17
TYPE: Hardcoded Placeholder
CODE: `url: 'https://sandbox.intasend.com/checkout/mock-url',`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/mock/intasend.ts
LINE: 18
TYPE: Hardcoded Placeholder
CODE: `signature: 'mock-signature'`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/mock/intasend.ts
LINE: 23
TYPE: Hardcoded Placeholder
CODE: `console.log('⚠️ USING MOCK INTASEND PAYOUT', payload);`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/mpesa-status.ts
LINE: 33
TYPE: Hardcoded Placeholder
CODE: `console.warn("⚠️ Missing M-Pesa Envs. Defaulting to MOCK SUCCESS for dev/testing...`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/mpesa-status.ts
LINE: 93
TYPE: Hardcoded Placeholder
CODE: `console.warn("⚠️ MOCK MODE DETECTED: Simulating Success Response for Local Dev."...`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/utils.ts
LINE: 256
TYPE: Math.random in Business Logic
CODE: `retVal += charset.charAt(Math.floor(Math.random() * n));`
IMPACT: Insecure random number generation used in potentially sensitive logic (IDs, crypto)
FIX: Use crypto.randomBytes() or crypto.randomUUID()

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed.ts
LINE: 69
TYPE: Hardcoded Placeholder
CODE: `contact: 'alice@example.com'`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed.ts
LINE: 77
TYPE: Hardcoded Placeholder
CODE: `contact: 'bob@example.com'`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed.ts
LINE: 85
TYPE: Hardcoded Placeholder
CODE: `contact: 'charlie@example.com'`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug_registration.ts
LINE: 17
TYPE: Math.random in Business Logic
CODE: `memberNumber: Math.floor(Math.random() * 1000000),`
IMPACT: Insecure random number generation used in potentially sensitive logic (IDs, crypto)
FIX: Use crypto.randomBytes() or crypto.randomUUID()

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug_registration.ts
LINE: 34
TYPE: Math.random in Business Logic
CODE: `accountRef: `WAL-${Math.floor(Math.random() * 1000)}`,`
IMPACT: Insecure random number generation used in potentially sensitive logic (IDs, crypto)
FIX: Use crypto.randomBytes() or crypto.randomUUID()

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug_registration.ts
LINE: 57
TYPE: Math.random in Business Logic
CODE: `data: { memberNumber: Math.floor(Math.random() * 1000000), name: "Debug Member 2...`
IMPACT: Insecure random number generation used in potentially sensitive logic (IDs, crypto)
FIX: Use crypto.randomBytes() or crypto.randomUUID()

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug_registration.ts
LINE: 63
TYPE: Math.random in Business Logic
CODE: `accountRef: `WAL-${Math.floor(Math.random() * 1000)}`,`
IMPACT: Insecure random number generation used in potentially sensitive logic (IDs, crypto)
FIX: Use crypto.randomBytes() or crypto.randomUUID()

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simulate-mpesa-callback.ts
LINE: 15
TYPE: Hardcoded Placeholder
CODE: `console.log("No PENDING transactions found. Creating a dummy one...");`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simulate-mpesa-callback.ts
LINE: 40
TYPE: Math.random in Business Logic
CODE: `const receiptNumber = `MPESA${Math.floor(Math.random() * 1000000000)}`;`
IMPACT: Insecure random number generation used in potentially sensitive logic (IDs, crypto)
FIX: Use crypto.randomBytes() or crypto.randomUUID()

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_email.ts
LINE: 13
TYPE: Hardcoded Placeholder
CODE: `console.error('Example: npx tsx scripts/test_email.ts user@example.com\n');`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_intasend.ts
LINE: 32
TYPE: Hardcoded Placeholder
CODE: `console.log('⚠️  Using dummy number. Pass a real number like: npx tsx scripts/te...`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_intasend.ts
LINE: 38
TYPE: Hardcoded Placeholder
CODE: `email: 'test@example.com',`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_registration.ts
LINE: 19
TYPE: Math.random in Business Logic
CODE: `const walletIdA = `WAL-TEST-${Math.floor(Math.random() * 10000)}``
IMPACT: Insecure random number generation used in potentially sensitive logic (IDs, crypto)
FIX: Use crypto.randomBytes() or crypto.randomUUID()

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_registration.ts
LINE: 20
TYPE: Math.random in Business Logic
CODE: `const memberNumA = Math.floor(Math.random() * 100000)`
IMPACT: Insecure random number generation used in potentially sensitive logic (IDs, crypto)
FIX: Use crypto.randomBytes() or crypto.randomUUID()

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_registration.ts
LINE: 51
TYPE: Math.random in Business Logic
CODE: `const walletIdB = `WAL-TEST-${Math.floor(Math.random() * 10000)}``
IMPACT: Insecure random number generation used in potentially sensitive logic (IDs, crypto)
FIX: Use crypto.randomBytes() or crypto.randomUUID()

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-full-reversal-flow.ts
LINE: 25
TYPE: Hardcoded Placeholder
CODE: `console.log("No installments found. Creating dummy installment for testing...")`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-loan-balance.ts
LINE: 27
TYPE: Hardcoded Placeholder
CODE: `if (!member) throw new Error('No members found to attach dummy loan');`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

### 🟠 HIGH Findings

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/(protected)/layout.tsx
LINE: 38
TYPE: Stubbed Function
CODE: `}, {} as Record<string, boolean>);`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions.ts
LINE: 146
TYPE: Stubbed Function
CODE: `let userPermissions = {}`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions.ts
LINE: 243
TYPE: Stubbed Function
CODE: `const feeExemptions = feeExemptionsStr ? JSON.parse(feeExemptionsStr) : {}`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions.ts
LINE: 361
TYPE: Stubbed Function
CODE: `const exemptions = feeExemptions || {}`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions.ts
LINE: 377
TYPE: Stubbed Function
CODE: `...(loanId ? { id: { not: loanId } } : {})`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions.ts
LINE: 382
TYPE: Stubbed Function
CODE: `const exemptions = (existingApplication.feeExemptions as any) || {}`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/accounting-actions.ts
LINE: 230
TYPE: Stubbed Function
CODE: `const where: any = {}`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/accounting-actions.ts
LINE: 233
TYPE: Stubbed Function
CODE: `where.transactionDate = {}`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/accounting-actions.ts
LINE: 320
TYPE: Stubbed Function
CODE: `if (!session?.user) return null`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/audit.ts
LINE: 36
TYPE: Stubbed Function
CODE: `filters: AuditLogFilter = {}`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/audit.ts
LINE: 50
TYPE: Stubbed Function
CODE: `startDate ? { timestamp: { gte: new Date(startDate) } } : {},`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/audit.ts
LINE: 51
TYPE: Stubbed Function
CODE: `endDate ? { timestamp: { lte: new Date(endDate) } } : {},`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/audit.ts
LINE: 52
TYPE: Stubbed Function
CODE: `action ? { action: action } : {},`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/audit.ts
LINE: 57
TYPE: Stubbed Function
CODE: `} : {},`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/audit.ts
LINE: 64
TYPE: Stubbed Function
CODE: `} : {}`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/audit.ts
LINE: 157
TYPE: Stubbed Function
CODE: `startDate ? { timestamp: { gte: new Date(startDate) } } : {},`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/audit.ts
LINE: 158
TYPE: Stubbed Function
CODE: `endDate ? { timestamp: { lte: new Date(endDate) } } : {},`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/audit.ts
LINE: 159
TYPE: Stubbed Function
CODE: `action ? { action: action } : {},`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/audit.ts
LINE: 164
TYPE: Stubbed Function
CODE: `} : {},`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/audit.ts
LINE: 170
TYPE: Stubbed Function
CODE: `} : {}`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/contribution-engine.ts
LINE: 7
TYPE: Stubbed Function
CODE: `if (!memberId) return null`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/get-member-stats.ts
LINE: 37
TYPE: Stubbed Function
CODE: `if (!member) return null`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/get-members.ts
LINE: 34
TYPE: Stubbed Function
CODE: `? {} // No filter`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/loan-application-actions.ts
LINE: 147
TYPE: Stubbed Function
CODE: `updateData = safeData.feeExemptions ? { feeExemptions: safeData.feeExemptions } ...`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/loan.ts
LINE: 120
TYPE: Stubbed Function
CODE: `if (!loan) return null`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/member-dashboard-actions.ts
LINE: 77
TYPE: Stubbed Function
CODE: `if (!member) return null`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/member-dashboard-actions.ts
LINE: 141
TYPE: Stubbed Function
CODE: `return null`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/portfolio-report-actions.ts
LINE: 35
TYPE: Stubbed Function
CODE: `const where: Prisma.LoanWhereInput = {}`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/rbac-actions.ts
LINE: 25
TYPE: Stubbed Function
CODE: `const permissions = await db.rolePermission.findMany({});`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/system-accounting.ts
LINE: 29
TYPE: Stubbed Function
CODE: `{ ledgerEntries: { some: {} } } // Show any account with activity`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/system-accounting.ts
LINE: 113
TYPE: Stubbed Function
CODE: `const dict: Partial<Record<SystemAccountType, string>> = {};`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/user-permissions.ts
LINE: 208
TYPE: Stubbed Function
CODE: `permissions: { ...defaultPermissions, ...(user.permissions as any || {}) }`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/api/admin/system-health/route.ts
LINE: 17
TYPE: Stubbed Function
CODE: `some: {}`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/api/admin/system-health/route.ts
LINE: 25
TYPE: Stubbed Function
CODE: `none: {}`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/api/loans/[id]/route.ts
LINE: 73
TYPE: Stubbed Function
CODE: `const perms = (user?.permissions as any) || {}`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/api/loans/route.ts
LINE: 229
TYPE: Stubbed Function
CODE: `const where: any = {}`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/api/reports/export/route.ts
LINE: 23
TYPE: Stubbed Function
CODE: `const where: Prisma.LoanWhereInput = {}`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/api/transactions/route.ts
LINE: 11
TYPE: Stubbed Function
CODE: `const whereClause: any = {};`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/loan-approval-actions.ts
LINE: 39
TYPE: Stubbed Function
CODE: `const currentExemptions = (loan.feeExemptions as any) || {}`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/loan-draft-actions.ts
LINE: 62
TYPE: Stubbed Function
CODE: `return null`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/loan-draft-actions.ts
LINE: 80
TYPE: Stubbed Function
CODE: `return null`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/loan-exemption-actions.ts
LINE: 80
TYPE: Stubbed Function
CODE: `return loan?.feeExemptions as LoanExemptions || {}`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/loan-exemption-actions.ts
LINE: 83
TYPE: Stubbed Function
CODE: `return {}`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/loan-schedule-actions.ts
LINE: 44
TYPE: Stubbed Function
CODE: `return null`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/loan-schedule-actions.ts
LINE: 63
TYPE: Stubbed Function
CODE: `return null`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/loan-schedule-actions.ts
LINE: 85
TYPE: Stubbed Function
CODE: `return null`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/sacco-settings-actions.ts
LINE: 169
TYPE: Stubbed Function
CODE: `if (!s) return null`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/welfare-requisition-actions.ts
LINE: 106
TYPE: Stubbed Function
CODE: `const where: any = {}`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/welfare-types-actions.ts
LINE: 136
TYPE: Stubbed Function
CODE: `const where = includeInactive ? {} : { isActive: true }`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/admin/NotificationSettings.tsx
LINE: 27
TYPE: Stubbed Function
CODE: `const [newEmail, setNewEmail] = useState<Record<string, string>>({})`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/admin/PermissionsMatrix.tsx
LINE: 31
TYPE: Stubbed Function
CODE: `const [loading, setLoading] = useState<Record<string, boolean>>({});`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/admin/UserRightsTable.tsx
LINE: 198
TYPE: Stubbed Function
CODE: `setCurrentPerms({ ...defaultPermissions, ...(user.permissions || {}) })`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/admin/UserRightsTable.tsx
LINE: 317
TYPE: Stubbed Function
CODE: `const activePermsCount = Object.values(user.permissions || {}).filter(Boolean).l...`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/approval/ApprovalHistoryDrawer.tsx
LINE: 28
TYPE: Stubbed Function
CODE: `if (!isOpen) return null`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/approval/DelegationPanel.tsx
LINE: 107
TYPE: Stubbed Function
CODE: `if (!isOpen) return null`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/approvals/MemberDetailsCard.tsx
LINE: 56
TYPE: Stubbed Function
CODE: `if (!isOpen) return null`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/loan/AutoSaveIndicator.tsx
LINE: 11
TYPE: Stubbed Function
CODE: `if (status === 'idle' && !lastSaved) return null`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/loan/AutoSaveIndicator.tsx
LINE: 52
TYPE: Stubbed Function
CODE: `return null`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/loan/LoanApplicationForm.tsx
LINE: 75
TYPE: Stubbed Function
CODE: `const [feeExemptions, setFeeExemptions] = useState<any>((initialData?.feeExempti...`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/loan/LoanExemptionsSection.tsx
LINE: 23
TYPE: Stubbed Function
CODE: `exemptions = {},`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/LoanAppraisalCard.tsx
LINE: 227
TYPE: Stubbed Function
CODE: `if (!isOpen) return null`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/loans/DraftsList.tsx
LINE: 28
TYPE: Stubbed Function
CODE: `if (!drafts || drafts.length === 0) return null`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/loans/RepaymentModal.tsx
LINE: 69
TYPE: Stubbed Function
CODE: `if (!isOpen) return null`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/products/wizard/WizardUI.tsx
LINE: 35
TYPE: Stubbed Function
CODE: `export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> ...`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/providers/RBACProvider.tsx
LINE: 11
TYPE: Stubbed Function
CODE: `permissions: {},`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/reports/filter-modal.tsx
LINE: 88
TYPE: Stubbed Function
CODE: `const filters: FilterOptions = {}`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/reports/preview-modal.tsx
LINE: 59
TYPE: Stubbed Function
CODE: `if (badges.length === 0) return null`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/reports/preview-modal.tsx
LINE: 76
TYPE: Stubbed Function
CODE: `const summary = rawData?.summary || {}`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/reports/ReportsDashboard.tsx
LINE: 113
TYPE: Stubbed Function
CODE: `const [appliedFilters, setAppliedFilters] = useState<FilterOptions>({})`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/settings/theme-toggle.tsx
LINE: 20
TYPE: Stubbed Function
CODE: `return null`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/ui/badge.tsx
LINE: 27
TYPE: Stubbed Function
CODE: `VariantProps<typeof badgeVariants> { }`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/ui/form.tsx
LINE: 26
TYPE: Stubbed Function
CODE: `{} as FormFieldContextValue`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/ui/form.tsx
LINE: 70
TYPE: Stubbed Function
CODE: `{} as FormItemContextValue`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/ui/form.tsx
LINE: 151
TYPE: Stubbed Function
CODE: `return null`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/ui/global-notification.tsx
LINE: 25
TYPE: Stubbed Function
CODE: `if (!notification) return null`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/ui/input.tsx
LINE: 5
TYPE: Stubbed Function
CODE: `extends React.InputHTMLAttributes<HTMLInputElement> { }`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/ui/sheet.tsx
LINE: 54
TYPE: Stubbed Function
CODE: `VariantProps<typeof sheetVariants> { }`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/ui/textarea.tsx
LINE: 6
TYPE: Stubbed Function
CODE: `extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { }`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/WalletDashboard.tsx
LINE: 134
TYPE: Stubbed Function
CODE: `if (!walletData) return null`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/welfare/WelfareRequisitionForm.tsx
LINE: 56
TYPE: Stubbed Function
CODE: `const [customData, setCustomData] = useState<Record<string, any>>({})`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/welfare/WelfareRequisitionForm.tsx
LINE: 73
TYPE: Stubbed Function
CODE: `setCustomData({})`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/welfare/WelfareRequisitionForm.tsx
LINE: 129
TYPE: Stubbed Function
CODE: `setCustomData({})`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/audit-service.ts
LINE: 26
TYPE: Stubbed Function
CODE: `}: GetAuditLogsParams = {}): Promise<GetAuditLogsResponse> {`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/audit-service.ts
LINE: 43
TYPE: Stubbed Function
CODE: `const where: Prisma.AuditLogWhereInput = {};`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/currency.ts
LINE: 72
TYPE: Stubbed Function
CODE: `} = {}`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/decimal/audit.ts
LINE: 38
TYPE: Stubbed Function
CODE: `const inputsStr: Record<string, string | number> = {}`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/decimal/validation.ts
LINE: 128
TYPE: Stubbed Function
CODE: `return null`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/decimal/validation.ts
LINE: 139
TYPE: Stubbed Function
CODE: `return null`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/decimal/validation.ts
LINE: 150
TYPE: Stubbed Function
CODE: `return null`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/safe-serialization.ts
LINE: 22
TYPE: Stubbed Function
CODE: `const newObj: any = {};`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/serialization.ts
LINE: 44
TYPE: Stubbed Function
CODE: `const serialized: any = {};`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/services/ExpenseService.ts
LINE: 272
TYPE: Stubbed Function
CODE: `if (!mappedCode) return null`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/services/TransactionReversalService.ts
LINE: 347
TYPE: Empty Catch Block
CODE: `} catch (e) { console.warn('Cache revalidation failed', e) }`
IMPACT: Errors are silently swallowed, making production debugging almost impossible
FIX: Add proper error handling, toast notification, or re-throw the error

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/services/TransactionReversalService.ts
LINE: 354
TYPE: Empty Catch Block
CODE: `} catch (e) { console.warn('Cache revalidation failed', e) }`
IMPACT: Errors are silently swallowed, making production debugging almost impossible
FIX: Add proper error handling, toast notification, or re-throw the error

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/types.ts
LINE: 129
TYPE: Stubbed Function
CODE: `export interface Member extends PrismaMember { }`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/types.ts
LINE: 130
TYPE: Stubbed Function
CODE: `export interface Notification extends PrismaNotification { }`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/types.ts
LINE: 131
TYPE: Stubbed Function
CODE: `export interface AuditLog extends PrismaAuditLog { }`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/types.ts
LINE: 132
TYPE: Stubbed Function
CODE: `export interface Expense extends PrismaExpense { }`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/types.ts
LINE: 133
TYPE: Stubbed Function
CODE: `export interface Income extends PrismaIncome { }`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/types.ts
LINE: 134
TYPE: Stubbed Function
CODE: `export interface ChargeTemplate extends PrismaChargeTemplate { }`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/add-ledger-module.ts
LINE: 10
TYPE: Stubbed Function
CODE: `update: {},`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-balances.ts
LINE: 13
TYPE: Empty Catch Block
CODE: `} catch (e: any) { console.log("Account 1100 not found or error", e.message); }`
IMPACT: Errors are silently swallowed, making production debugging almost impossible
FIX: Add proper error handling, toast notification, or re-throw the error

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-balances.ts
LINE: 19
TYPE: Empty Catch Block
CODE: `} catch (e: any) { console.log("Account 1200 not found or error", e.message); }`
IMPACT: Errors are silently swallowed, making production debugging almost impossible
FIX: Add proper error handling, toast notification, or re-throw the error

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-balances.ts
LINE: 25
TYPE: Empty Catch Block
CODE: `} catch (e: any) { console.log("Account 3000 not found or error", e.message); }`
IMPACT: Errors are silently swallowed, making production debugging almost impossible
FIX: Add proper error handling, toast notification, or re-throw the error

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-import.ts
LINE: 22
TYPE: Stubbed Function
CODE: `console.log('Result Keys:', Object.keys(result || {}))`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-member-filter.ts
LINE: 14
TYPE: Stubbed Function
CODE: `}, {} as Record<string, number>)`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-missing-reversals.ts
LINE: 64
TYPE: Stubbed Function
CODE: `} catch (e) { }`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-missing-reversals.ts
LINE: 64
TYPE: Empty Catch Block
CODE: `} catch (e) { }`
IMPACT: Errors are silently swallowed, making production debugging almost impossible
FIX: Add proper error handling, toast notification, or re-throw the error

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-system-mappings.ts
LINE: 22
TYPE: Stubbed Function
CODE: `update: {}, // Don't overwrite if exists`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/force-enable-ledger.ts
LINE: 51
TYPE: Stubbed Function
CODE: `const currentPerms = (user.permissions as any) || {};`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-installments.ts
LINE: 23
TYPE: Stubbed Function
CODE: `none: {}`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/repair-loan-transactions.ts
LINE: 112
TYPE: Stubbed Function
CODE: `transactions: { none: {} }`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simulate-statement-reversal.ts
LINE: 29
TYPE: Stubbed Function
CODE: `console.log('Statement Keys:', Object.keys(statement || {}))`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-mappings.ts
LINE: 22
TYPE: Stubbed Function
CODE: `update: {},`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-balances.ts
LINE: 24
TYPE: Stubbed Function
CODE: `some: {}`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-ledger-integrity.ts
LINE: 136
TYPE: Stubbed Function
CODE: `}, {} as Record<string, ValidationIssue[]>)`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-ledger-integrity.ts
LINE: 15
TYPE: Stubbed Function
CODE: `children: { some: {} }`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-loan-balance.ts
LINE: 45
TYPE: Stubbed Function
CODE: `feeExemptions: {}`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-reversal.ts
LINE: 19
TYPE: Stubbed Function
CODE: `repaymentInstallments: { some: {} },`
IMPACT: Feature silently fails to perform its intended action or returns empty data
FIX: Implement the actual function logic

---

### 🟡 MEDIUM Findings

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/error.tsx
LINE: 113
TYPE: Incomplete UI State
CODE: `href="/"`
IMPACT: User clicks a button/link and nothing happens, leading to frustration
FIX: Wire up the correct event handler or route

---

### 🟢 LOW Findings

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/(protected)/loans/[id]/page.tsx
LINE: 43
TYPE: Incomplete Marker
CODE: `glCode: '1000-00', // Placeholder until strictly mapped`
IMPACT: Lingering technical debt or incomplete feature
FIX: Implement the missing logic or remove the comment if already done

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/(protected)/loans/application/[loanId]/page.tsx
LINE: 48
TYPE: Commented-Out Code
CODE: `// But for now, this page is for EDITING.`
IMPACT: Dead code bloats the codebase and causes confusion
FIX: Remove the commented out code or restore it if needed

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/(protected)/loans/apply/page.tsx
LINE: 37
TYPE: Console Statement Left In
CODE: `console.log('=== LOAN APPLICATION DEBUG ===')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/(protected)/loans/apply/page.tsx
LINE: 38
TYPE: Console Statement Left In
CODE: `console.log('Session User ID:', session.user.id)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/(protected)/loans/apply/page.tsx
LINE: 39
TYPE: Console Statement Left In
CODE: `console.log('Session User Email:', session.user.email)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/(protected)/loans/apply/page.tsx
LINE: 40
TYPE: Console Statement Left In
CODE: `console.log('Session User Name:', session.user.name)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/(protected)/loans/apply/page.tsx
LINE: 41
TYPE: Console Statement Left In
CODE: `console.log('Database User:', {`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/(protected)/loans/apply/page.tsx
LINE: 47
TYPE: Console Statement Left In
CODE: `console.log('Linked Member:', {`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/(protected)/loans/apply/page.tsx
LINE: 52
TYPE: Console Statement Left In
CODE: `console.log('currentMemberId being passed to form:', currentMemberId)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/(protected)/loans/apply/page.tsx
LINE: 53
TYPE: Console Statement Left In
CODE: `console.log('===========================')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/(protected)/loans/draft/page.tsx
LINE: 41
TYPE: Console Statement Left In
CODE: `console.warn(`Draft memberId mismatch: draft has ${draftMemberId}, user has ${cu...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/(protected)/meetings/report/new/page.tsx
LINE: 38
TYPE: Commented-Out Code
CODE: `// but for now we'll fetch all apologies for pending meetings.`
IMPACT: Dead code bloats the codebase and causes confusion
FIX: Remove the commented out code or restore it if needed

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions.ts
LINE: 81
TYPE: Commented-Out Code
CODE: `// Or I can add the import here if it's close? It's at line 4?`
IMPACT: Dead code bloats the codebase and causes confusion
FIX: Remove the commented out code or restore it if needed

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions.ts
LINE: 291
TYPE: Commented-Out Code
CODE: `// Actually, the variables 'amount', 'loanProductId', 'memberId', 'installments' are const.`
IMPACT: Dead code bloats the codebase and causes confusion
FIX: Remove the commented out code or restore it if needed

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/admin-actions.ts
LINE: 53
TYPE: Incomplete Marker
CODE: `// TODO: Deliver tempPassword via nodemailer email to user.email when SMTP is co...`
IMPACT: Lingering technical debt or incomplete feature
FIX: Implement the missing logic or remove the comment if already done

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/audit.ts
LINE: 94
TYPE: Incomplete Marker
CODE: `} // Placeholder - fetched separately`
IMPACT: Lingering technical debt or incomplete feature
FIX: Implement the missing logic or remove the comment if already done

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/loan-product.ts
LINE: 44
TYPE: Console Statement Left In
CODE: `console.log("Attempting to create Product via RAW SQL...");`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/loan-product.ts
LINE: 74
TYPE: Console Statement Left In
CODE: `console.log("Product Created via SQL:", id);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/loan-product.ts
LINE: 79
TYPE: Console Statement Left In
CODE: `console.log(`Creating Mapping SQL: ${type} -> ${accountId}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/loan-product.ts
LINE: 153
TYPE: Console Statement Left In
CODE: `console.log("Attempting to UPDATE Product via RAW SQL:", id);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/loan-product.ts
LINE: 182
TYPE: Console Statement Left In
CODE: `console.log("Product Updated via SQL");`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/loan-product.ts
LINE: 188
TYPE: Console Statement Left In
CODE: `console.log("Deleting old mappings...");`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/loan-product.ts
LINE: 240
TYPE: Console Statement Left In
CODE: `console.log(`Toggling Product ${productId} to isActive=${isActive}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/member-dashboard-actions.ts
LINE: 271
TYPE: Console Statement Left In
CODE: `console.log(`[Cache] Generating schedule for loan ${loan.id}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/member-dashboard-actions.ts
LINE: 697
TYPE: Console Statement Left In
CODE: `console.log(`[getMemberFullDetail] Member ${memberId} has ${member?.nextOfKin?.l...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/actions/rbac-maintenance.ts
LINE: 8
TYPE: Console Statement Left In
CODE: `console.log('Cleared RBAC cache')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/api/cron/reconcile/route.ts
LINE: 19
TYPE: Console Statement Left In
CODE: `console.log("Starting Reconciliation Cron Job...");`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/api/cron/reconcile/route.ts
LINE: 39
TYPE: Console Statement Left In
CODE: `console.log(`Found ${stuckTransactions.length} stuck transactions.`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/api/cron/reconcile/route.ts
LINE: 56
TYPE: Console Statement Left In
CODE: `console.log(`FIXED: Transaction ${tx.id} marked COMPLETED.`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/api/cron/reconcile/route.ts
LINE: 59
TYPE: Console Statement Left In
CODE: `console.log(`UPDATED: Transaction ${tx.id} marked FAILED.`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/api/cron/reconcile/route.ts
LINE: 84
TYPE: Console Statement Left In
CODE: `console.log(`EXPIRED: Marked ${expiredTransactions.count} old pending transactio...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/api/loans/[id]/cancel/route.ts
LINE: 83
TYPE: Console Statement Left In
CODE: `console.warn('ApprovalRequest update failed or model missing', e)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/api/loans/[id]/route.ts
LINE: 15
TYPE: Console Statement Left In
CODE: `console.log(`API Loan GET: Headers Cookie: ${request.headers.get('cookie')?.subs...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/api/loans/[id]/route.ts
LINE: 17
TYPE: Console Statement Left In
CODE: `console.log(`API Loan GET: Session user: ${session?.user?.email}, ID: ${session?...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/api/loans/[id]/route.ts
LINE: 22
TYPE: Console Statement Left In
CODE: `console.log('API Loan GET: Unauthorized - No Session User')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/api/loans/[id]/route.ts
LINE: 121
TYPE: Console Statement Left In
CODE: `console.warn('Failed to refresh member balance on loan fetch', e)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/api/loans/route.ts
LINE: 38
TYPE: Console Statement Left In
CODE: `console.log(`[API] POST /loans received for memberId: ${memberId}, amount: ${req...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/api/members/[memberId]/active-loans/route.ts
LINE: 11
TYPE: Console Statement Left In
CODE: `console.log('[Active Loans API] Session check:', { hasUser: !!session?.user, req...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/api/members/[memberId]/active-loans/route.ts
LINE: 14
TYPE: Console Statement Left In
CODE: `console.log('[Active Loans API] 401 Unauthorized - No session')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/api/mpesa/callback/route.ts
LINE: 22
TYPE: Console Statement Left In
CODE: `console.warn(`Blocked unauthorized M-Pesa callback attempt from IP: ${clientIp}`...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/api/mpesa/callback/route.ts
LINE: 38
TYPE: Console Statement Left In
CODE: `console.log("M-Pesa Callback Received:", { CheckoutRequestID, ResultCode, Result...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/api/mpesa/callback/route.ts
LINE: 46
TYPE: Console Statement Left In
CODE: `console.warn(`Transaction not found for CheckoutRequestID: ${CheckoutRequestID}`...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/api/mpesa/callback/route.ts
LINE: 78
TYPE: Console Statement Left In
CODE: `console.log(`Financial posting completed for transaction ${transaction.id}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/api/wallet/[memberId]/route.ts
LINE: 13
TYPE: Console Statement Left In
CODE: `console.log('[Wallet API] Request for memberId:', memberId)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/api/wallet/[memberId]/route.ts
LINE: 30
TYPE: Console Statement Left In
CODE: `console.log('[Wallet API] Success:', walletInfo)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/api/webhooks/intasend/route.ts
LINE: 36
TYPE: Console Statement Left In
CODE: `console.log(`Webhook Received: [${payload.event_type || 'UNKNOWN'}] Status: [${s...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/api/webhooks/intasend/route.ts
LINE: 41
TYPE: Console Statement Left In
CODE: `console.log('✅ Processing DEPOSIT collection via CollectionService');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/dashboard-actions.ts
LINE: 212
TYPE: Commented-Out Code
CODE: `// Original code: `const monthName = d.toLocaleString('default', { month: 'short' });``
IMPACT: Dead code bloats the codebase and causes confusion
FIX: Remove the commented out code or restore it if needed

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/engine-health-actions.ts
LINE: 196
TYPE: Console Statement Left In
CODE: `console.log(`Found ${loansNeedingInit.length} loans needing interest date initia...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/engine-health-actions.ts
LINE: 197
TYPE: Console Statement Left In
CODE: `console.log(`Total active loans: ${allActiveLoans.length}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/error.tsx
LINE: 21
TYPE: Incomplete Marker
CODE: `// TODO: Send to monitoring service (Sentry, LogRocket, etc.)`
IMPACT: Lingering technical debt or incomplete feature
FIX: Implement the missing logic or remove the comment if already done

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/error.tsx
LINE: 35
TYPE: Console Statement Left In
CODE: `console.log('Digest:', error.digest)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/loan-approval-actions.ts
LINE: 62
TYPE: Console Statement Left In
CODE: `console.log('submitLoanApproval - Session:', JSON.stringify(session, null, 2))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/loan-approval-actions.ts
LINE: 668
TYPE: Console Statement Left In
CODE: `console.log(`Auto-seeding missing GL Account: ${code}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/repayment-actions.ts
LINE: 81
TYPE: Incomplete Marker
CODE: `// TODO: Refactor to use AccountingEngine.postJournalEntry like other files`
IMPACT: Lingering technical debt or incomplete feature
FIX: Implement the missing logic or remove the comment if already done

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/repayment-actions.ts
LINE: 133
TYPE: Commented-Out Code
CODE: `// If I return the { success: false } object, the transaction commits (creates nothing, updates nothing).`
IMPACT: Dead code bloats the codebase and causes confusion
FIX: Remove the commented out code or restore it if needed

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/sacco-settings-actions.ts
LINE: 216
TYPE: Console Statement Left In
CODE: `console.log(`[calculateLoanQualification] Fetching member: ${memberId}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/sacco-settings-actions.ts
LINE: 251
TYPE: Console Statement Left In
CODE: `console.log('[calculateLoanQualification] Debug:', {`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/sacco-settings-actions.ts
LINE: 287
TYPE: Console Statement Left In
CODE: `console.log('[calculateLoanQualification] Selected loans for offset:', selectedL...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/sacco-settings-actions.ts
LINE: 315
TYPE: Console Statement Left In
CODE: `console.log(`[calculateLoanQualification] Loan ${loan.loanApplicationNumber}: Ou...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/sacco-settings-actions.ts
LINE: 320
TYPE: Console Statement Left In
CODE: `console.log(`[calculateLoanQualification] Loan ${loan.loanApplicationNumber}: Us...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/sacco-settings-actions.ts
LINE: 330
TYPE: Console Statement Left In
CODE: `console.log('[calculateLoanQualification] Fees:', {`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/sacco-settings-actions.ts
LINE: 385
TYPE: Console Statement Left In
CODE: `console.log('[calculateLoanQualification] Final calculation:', {`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/sacco-settings-actions.ts
LINE: 416
TYPE: Console Statement Left In
CODE: `console.log('[getMemberActiveLoans] Fetching for member:', memberId);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/sacco-settings-actions.ts
LINE: 435
TYPE: Console Statement Left In
CODE: `console.log(`[getMemberActiveLoans] Found ${loans.length} active loans`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/wallet-actions.ts
LINE: 126
TYPE: Console Statement Left In
CODE: `console.warn('Ledger error:', memberId, error)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/wallet-actions.ts
LINE: 132
TYPE: Incomplete Marker
CODE: `const lockedAmount = 0 // TODO: Implement locking mechanism`
IMPACT: Lingering technical debt or incomplete feature
FIX: Implement the missing logic or remove the comment if already done

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/wallet-add-funds-actions.ts
LINE: 537
TYPE: Console Statement Left In
CODE: `console.log(`[DEBUG] Fallback triggered for Loan ${loan.loanApplicationNumber} (...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/wallet-add-funds-actions.ts
LINE: 538
TYPE: Console Statement Left In
CODE: `console.log(`[DEBUG] Reason: outstanding=${outstanding}, transactions=${loan._co...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/app/wallet-add-funds-actions.ts
LINE: 542
TYPE: Console Statement Left In
CODE: `console.log(`[DEBUG] Ledger Balance used for ${loan.loanApplicationNumber}: ${ou...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/admin/LoanSystemMonitoring.tsx
LINE: 161
TYPE: Incomplete Marker
CODE: `{/* TODO: Implement Alert component`
IMPACT: Lingering technical debt or incomplete feature
FIX: Implement the missing logic or remove the comment if already done

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/admin/LoanSystemMonitoring.tsx
LINE: 172
TYPE: Incomplete Marker
CODE: `{/* TODO: Implement Alert component`
IMPACT: Lingering technical debt or incomplete feature
FIX: Implement the missing logic or remove the comment if already done

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/DashboardView.tsx
LINE: 107
TYPE: Incomplete Marker
CODE: `subtitle="+12% vs last year" // Placeholder trend`
IMPACT: Lingering technical debt or incomplete feature
FIX: Implement the missing logic or remove the comment if already done

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/examples/ToastDemo.tsx
LINE: 35
TYPE: Console Statement Left In
CODE: `onClick: () => console.log("Navigate to wallet")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/loan/LoanApplicationForm.tsx
LINE: 197
TYPE: Console Statement Left In
CODE: `console.log('Submission already in progress, ignoring...');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/LoanOffsetSelector.tsx
LINE: 46
TYPE: Console Statement Left In
CODE: `console.log('Raw loan data from server:', data)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/LoanOffsetSelector.tsx
LINE: 56
TYPE: Console Statement Left In
CODE: `console.log('Adapted loan:', adapted)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/member/legacy-dashboard/MemberStatsGrid.tsx
LINE: 52
TYPE: Incomplete Marker
CODE: `{/* Placeholder for future expansion or "Arrears" if implemented */}`
IMPACT: Lingering technical debt or incomplete feature
FIX: Implement the missing logic or remove the comment if already done

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/member/MembersModule.tsx
LINE: 36
TYPE: Console Statement Left In
CODE: `console.log(`[MembersModule] Selecting member: ${id}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/member/MembersModule.tsx
LINE: 38
TYPE: Console Statement Left In
CODE: `console.log(`[MembersModule] Member ${id} already selected`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/member/MembersModule.tsx
LINE: 46
TYPE: Console Statement Left In
CODE: `console.log(`[MembersModule] Fetching details for ${id}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/member/MembersModule.tsx
LINE: 48
TYPE: Console Statement Left In
CODE: `console.log(`[MembersModule] Received details for ${id}:`, detail ? 'Success' : ...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/products/LoanProductWizard.tsx
LINE: 86
TYPE: Console Statement Left In
CODE: `console.log("Updating Product:", productId);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/products/LoanProductWizard.tsx
LINE: 89
TYPE: Console Statement Left In
CODE: `console.log("Creating New Product");`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/wallet/AddFundsModule.tsx
LINE: 66
TYPE: Console Statement Left In
CODE: `console.log('[AddFundsModule] Fetching loans for member:', memberId)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/wallet/AddFundsModule.tsx
LINE: 68
TYPE: Console Statement Left In
CODE: `console.log('[AddFundsModule] Received loans:', loans)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/wallet/WalletOperations.tsx
LINE: 120
TYPE: Console Statement Left In
CODE: `console.log('Fresh balance:', fresh)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/components/wallet/WalletOperations.tsx
LINE: 124
TYPE: Console Statement Left In
CODE: `console.log('Updating stale balance:', loan.outstandingBalance, '->', fresh.outs...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/hooks/useInactivityLogout.ts
LINE: 21
TYPE: Console Statement Left In
CODE: `console.log('[InactivityLogout] User idle for too long. Logging out...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/accounting/AccountingEngine.ts
LINE: 341
TYPE: Console Statement Left In
CODE: `console.log('Lines:', JSON.stringify(lines, null, 2));`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/accounting/AccountingEngine.ts
LINE: 474
TYPE: Commented-Out Code
CODE: `// Example: A transaction for LN010 has a line "Repayment - LN005".`
IMPACT: Dead code bloats the codebase and causes confusion
FIX: Remove the commented out code or restore it if needed

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/accounting/AccountingEngine.ts
LINE: 653
TYPE: Console Statement Left In
CODE: `console.log(`posting ${eventType} for ${amount}. DR: ${(debitMap as any).account...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/decimal/audit.ts
LINE: 62
TYPE: Console Statement Left In
CODE: `console.log('[FINANCIAL_CALC]', JSON.stringify(log, null, 2))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/decimal/audit.ts
LINE: 66
TYPE: Incomplete Marker
CODE: `// TODO: Integrate with your logging infrastructure (e.g., Winston, Pino, CloudW...`
IMPACT: Lingering technical debt or incomplete feature
FIX: Implement the missing logic or remove the comment if already done

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/decimal/audit.ts
LINE: 250
TYPE: Console Statement Left In
CODE: `console.log(`[BATCH_${this.batchId}]`, {`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/decimal/audit.ts
LINE: 256
TYPE: Incomplete Marker
CODE: `// TODO: Send to logging service`
IMPACT: Lingering technical debt or incomplete feature
FIX: Implement the missing logic or remove the comment if already done

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/events/register-handlers.ts
LINE: 75
TYPE: Console Statement Left In
CODE: `console.log('✅ Event handlers registered')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/logger.ts
LINE: 39
TYPE: Console Statement Left In
CODE: `console.warn(this.format('warn', message, data));`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/mock/intasend.ts
LINE: 4
TYPE: Console Statement Left In
CODE: `console.log('⚠️ USING MOCK INTASEND COLLECTION', payload);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/mock/intasend.ts
LINE: 23
TYPE: Console Statement Left In
CODE: `console.log('⚠️ USING MOCK INTASEND PAYOUT', payload);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/mpesa-status.ts
LINE: 33
TYPE: Console Statement Left In
CODE: `console.warn("⚠️ Missing M-Pesa Envs. Defaulting to MOCK SUCCESS for dev/testing...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/mpesa-status.ts
LINE: 40
TYPE: Console Statement Left In
CODE: `console.log(`Checking status for ${checkoutRequestId}...`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/mpesa-status.ts
LINE: 68
TYPE: Console Statement Left In
CODE: `console.log("M-Pesa Query Response:", JSON.stringify(data, null, 2));`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/mpesa-status.ts
LINE: 93
TYPE: Console Statement Left In
CODE: `console.warn("⚠️ MOCK MODE DETECTED: Simulating Success Response for Local Dev."...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/mpesa.ts
LINE: 25
TYPE: Console Statement Left In
CODE: `console.log(`Connecting to M-Pesa at: ${BASE_URL}`); // Debug log`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/mpesa.ts
LINE: 83
TYPE: Console Statement Left In
CODE: `console.log("Sending STK Push Payload:", JSON.stringify({ ...payload, Password: ...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/services/AccountingService.ts
LINE: 70
TYPE: Incomplete Marker
CODE: `const loanLossProvisions = new Decimal(0) // Placeholder`
IMPACT: Lingering technical debt or incomplete feature
FIX: Implement the missing logic or remove the comment if already done

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/services/AccountingService.ts
LINE: 117
TYPE: Incomplete Marker
CODE: `const loanLossProvisions = new Decimal(0) // Placeholder`
IMPACT: Lingering technical debt or incomplete feature
FIX: Implement the missing logic or remove the comment if already done

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/services/contributions-service.ts
LINE: 26
TYPE: Console Statement Left In
CODE: `console.warn(`[ContributionsService] monthlyRate is ${monthlyRate}. Defaulting t...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/services/EmailService.ts
LINE: 32
TYPE: Console Statement Left In
CODE: `console.warn('SMTP Credentials not found. Email not sent:', subject)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/services/EmailService.ts
LINE: 44
TYPE: Console Statement Left In
CODE: `console.log('Message sent: %s', info.messageId)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/services/EmailService.ts
LINE: 76
TYPE: Console Statement Left In
CODE: `console.log('No recipients configured for LOAN_SUBMISSION')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/services/EmailService.ts
LINE: 113
TYPE: Console Statement Left In
CODE: `console.log(`Sending Loan Approval Email to: ${recipients.join(', ')}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/services/LoanScheduleCache.ts
LINE: 139
TYPE: Console Statement Left In
CODE: `console.log(`[Cache] Hit for Loan ${loanId}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/services/LoanScheduleCache.ts
LINE: 143
TYPE: Console Statement Left In
CODE: `console.log(`[Cache] Miss for Loan ${loanId}. Generating...`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/services/LoanStateService.ts
LINE: 148
TYPE: Incomplete Marker
CODE: `// TODO: Create accounting entries for write-off`
IMPACT: Lingering technical debt or incomplete feature
FIX: Implement the missing logic or remove the comment if already done

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/services/OverpaymentHandlerService.ts
LINE: 130
TYPE: Incomplete Marker
CODE: `// TODO: Implement credit balance tracking or early closure logic`
IMPACT: Lingering technical debt or incomplete feature
FIX: Implement the missing logic or remove the comment if already done

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/services/OverpaymentHandlerService.ts
LINE: 131
TYPE: Console Statement Left In
CODE: `console.warn(`Loan ${loanId} has excess overpayment: ${remainingOverpayment}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/services/RepaymentProcessorService.ts
LINE: 160
TYPE: Incomplete Marker
CODE: `// TODO: Phase 4 - Implement TransactionReplayService integration`
IMPACT: Lingering technical debt or incomplete feature
FIX: Implement the missing logic or remove the comment if already done

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/services/RepaymentService.ts
LINE: 2
TYPE: Commented-Out Code
CODE: `// import { LoanTransactionType } from '@prisma/client' // Removed`
IMPACT: Dead code bloats the codebase and causes confusion
FIX: Remove the commented out code or restore it if needed

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/services/RepaymentService.ts
LINE: 64
TYPE: Commented-Out Code
CODE: `// The Action used `getSystemMappingsDict`. Let's use that for consistency.`
IMPACT: Dead code bloats the codebase and causes confusion
FIX: Remove the commented out code or restore it if needed

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/services/TransactionReplayService.ts
LINE: 56
TYPE: Console Statement Left In
CODE: `console.warn(`No installments found for loan ${loanId} during replay.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/services/TransactionReversalService.ts
LINE: 139
TYPE: Console Statement Left In
CODE: `console.log(`[Reversal] Found linked Loan ${walletTx.relatedLoanId} for WalletTx...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/services/TransactionReversalService.ts
LINE: 154
TYPE: Console Statement Left In
CODE: `console.log(`[Reversal] Cascade Search: LoanId=${walletTx.relatedLoanId}, Amount...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/services/TransactionReversalService.ts
LINE: 183
TYPE: Console Statement Left In
CODE: `console.warn('Cache revalidation failed (likely script environment)', e)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/services/TransactionReversalService.ts
LINE: 273
TYPE: Incomplete Marker
CODE: `'System Admin', // Todo: fetch name`
IMPACT: Lingering technical debt or incomplete feature
FIX: Implement the missing logic or remove the comment if already done

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/services/TransactionReversalService.ts
LINE: 277
TYPE: Console Statement Left In
CODE: `console.warn(`No GL Entry found for ${type} ${refId}. Skipping GL Reversal.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/services/TransactionReversalService.ts
LINE: 347
TYPE: Console Statement Left In
CODE: `} catch (e) { console.warn('Cache revalidation failed', e) }`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/services/TransactionReversalService.ts
LINE: 354
TYPE: Console Statement Left In
CODE: `} catch (e) { console.warn('Cache revalidation failed', e) }`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/statementProcessor.ts
LINE: 102
TYPE: Console Statement Left In
CODE: `console.warn(`Unknown transaction type: ${type}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/utils.ts
LINE: 107
TYPE: Console Statement Left In
CODE: `console.warn(`Unexpected loan number format: ${lastLoanNumber}. Starting from LN...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/utils.ts
LINE: 118
TYPE: Console Statement Left In
CODE: `console.warn(`Invalid loan number: ${lastLoanNumber}. Starting from LN001`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/lib/utils.ts
LINE: 124
TYPE: Console Statement Left In
CODE: `console.warn(`Loan number approaching maximum (${number}). Consider expanding fo...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/fix-password.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('🔧 Fixing user password...\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/fix-password.ts
LINE: 14
TYPE: Console Statement Left In
CODE: `console.log('❌ User not found!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/fix-password.ts
LINE: 18
TYPE: Console Statement Left In
CODE: `console.log('Found user:', user.email)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/fix-password.ts
LINE: 19
TYPE: Console Statement Left In
CODE: `console.log('Current password hash:', user.passwordHash ? 'EXISTS' : 'NULL/UNDEF...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/fix-password.ts
LINE: 20
TYPE: Console Statement Left In
CODE: `console.log('')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/fix-password.ts
LINE: 31
TYPE: Console Statement Left In
CODE: `console.log('✅ Password updated successfully!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/fix-password.ts
LINE: 32
TYPE: Console Statement Left In
CODE: `console.log('')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/fix-password.ts
LINE: 33
TYPE: Console Statement Left In
CODE: `console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/fix-password.ts
LINE: 34
TYPE: Console Statement Left In
CODE: `console.log('🎉 Login Credentials Ready!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/fix-password.ts
LINE: 35
TYPE: Console Statement Left In
CODE: `console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/fix-password.ts
LINE: 36
TYPE: Console Statement Left In
CODE: `console.log('📧 Email:    admin@capitalcrew.com')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/fix-password.ts
LINE: 37
TYPE: Console Statement Left In
CODE: `console.log('🔑 Password: Admin123!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/fix-password.ts
LINE: 38
TYPE: Console Statement Left In
CODE: `console.log('👤 Role:     CHAIRPERSON')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/fix-password.ts
LINE: 39
TYPE: Console Statement Left In
CODE: `console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/fix-password.ts
LINE: 40
TYPE: Console Statement Left In
CODE: `console.log('')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/fix-password.ts
LINE: 41
TYPE: Console Statement Left In
CODE: `console.log('🌐 Try logging in at: http://localhost:3000/login')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-accounts.ts
LINE: 20
TYPE: Console Statement Left In
CODE: `console.warn(`⚠️ Parent account ${parentCode} not found for ${code}. Skipping pa...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-accounts.ts
LINE: 44
TYPE: Console Statement Left In
CODE: `console.log(`  ✓ ${code} - ${name}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-accounts.ts
LINE: 49
TYPE: Console Statement Left In
CODE: `console.log('🌱 Seeding Detailed Chart of Accounts...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-accounts.ts
LINE: 62
TYPE: Console Statement Left In
CODE: `console.log('\n--- Seeding Roots ---')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-accounts.ts
LINE: 95
TYPE: Console Statement Left In
CODE: `console.log('\n--- Seeding Parents ---')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-accounts.ts
LINE: 172
TYPE: Console Statement Left In
CODE: `console.log('\n--- Seeding Children ---')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-accounts.ts
LINE: 177
TYPE: Console Statement Left In
CODE: `console.log('✅ Detailed Chart of Accounts seeded successfully!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-expense-categories.ts
LINE: 142
TYPE: Console Statement Left In
CODE: `console.log('🌱 Seeding Expense Categories...\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-expense-categories.ts
LINE: 166
TYPE: Console Statement Left In
CODE: `console.log(`  📁 ${group.name}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-expense-categories.ts
LINE: 189
TYPE: Console Statement Left In
CODE: `console.log(`     └─ ${sub.name}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-expense-categories.ts
LINE: 193
TYPE: Console Statement Left In
CODE: `console.log(`\n✅ Done! Seeded ${groupCount} groups and ${subCount} sub-categorie...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-gl.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log('🌱 Seeding GL Accounts...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-gl.ts
LINE: 49
TYPE: Console Statement Left In
CODE: `console.log(`✓ Account ${account.code} already exists`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-gl.ts
LINE: 55
TYPE: Console Statement Left In
CODE: `console.log(`✓ Created account ${account.code} - ${account.name}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-gl.ts
LINE: 59
TYPE: Console Statement Left In
CODE: `console.log('✅ GL Accounts seeded successfully!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-mappings.ts
LINE: 9
TYPE: Console Statement Left In
CODE: `console.log('🔗 Seeding Ledger Mappings...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-mappings.ts
LINE: 58
TYPE: Console Statement Left In
CODE: `console.log(`  ✓ Mapped ${map.type} -> ${account.name} (${account.code})`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-mappings.ts
LINE: 61
TYPE: Console Statement Left In
CODE: `console.log('✅ Ledger Mappings seeded successfully!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-user.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('🌱 Seeding test user...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-user.ts
LINE: 15
TYPE: Console Statement Left In
CODE: `console.log('✅ Test user already exists')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-user.ts
LINE: 16
TYPE: Console Statement Left In
CODE: `console.log('📧 Email: admin@capitalcrew.com')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-user.ts
LINE: 17
TYPE: Console Statement Left In
CODE: `console.log('🔑 Password: Admin123!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-user.ts
LINE: 48
TYPE: Console Statement Left In
CODE: `console.log('✅ Created member:', member.name, `(#${member.memberNumber})`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-user.ts
LINE: 64
TYPE: Console Statement Left In
CODE: `console.log('✅ Created user account')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-user.ts
LINE: 65
TYPE: Console Statement Left In
CODE: `console.log('')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-user.ts
LINE: 66
TYPE: Console Statement Left In
CODE: `console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-user.ts
LINE: 67
TYPE: Console Statement Left In
CODE: `console.log('🎉 Test User Created Successfully!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-user.ts
LINE: 68
TYPE: Console Statement Left In
CODE: `console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-user.ts
LINE: 69
TYPE: Console Statement Left In
CODE: `console.log('📧 Email:    admin@capitalcrew.com')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-user.ts
LINE: 70
TYPE: Console Statement Left In
CODE: `console.log('🔑 Password: Admin123!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-user.ts
LINE: 71
TYPE: Console Statement Left In
CODE: `console.log('👤 Role:     CHAIRPERSON')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-user.ts
LINE: 72
TYPE: Console Statement Left In
CODE: `console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-user.ts
LINE: 73
TYPE: Console Statement Left In
CODE: `console.log('')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed-user.ts
LINE: 74
TYPE: Console Statement Left In
CODE: `console.log('You can now login with these credentials!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed.ts
LINE: 9
TYPE: Console Statement Left In
CODE: `console.log('Seeding database...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed.ts
LINE: 129
TYPE: Console Statement Left In
CODE: `console.log('✅ Database seeded successfully!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed.ts
LINE: 130
TYPE: Console Statement Left In
CODE: `console.log('\n📧 Admin Credentials:')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed.ts
LINE: 131
TYPE: Console Statement Left In
CODE: `console.log('   Email: admin@capitalcrew.com')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed.ts
LINE: 132
TYPE: Console Statement Left In
CODE: `console.log('   Password: Admin123!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed.ts
LINE: 133
TYPE: Console Statement Left In
CODE: `console.log('\n⚠️  Please change this password after first login!\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/prisma/seed.ts
LINE: 134
TYPE: Console Statement Left In
CODE: `console.log({ product1, member1, adminUser })`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/add-ledger-module.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log('Seeding Ledger Management module...');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/add-ledger-module.ts
LINE: 18
TYPE: Console Statement Left In
CODE: `console.log('Ledger Management module seeded:', ledgerModule);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/apply-ledger-constraints.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log('🔒 Applying Ledger Integrity Constraints...\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/apply-ledger-constraints.ts
LINE: 23
TYPE: Console Statement Left In
CODE: `console.log('⚠️  To enforce constraints permanently, add this to schema.prisma:'...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/apply-ledger-constraints.ts
LINE: 24
TYPE: Console Statement Left In
CODE: `console.log(``
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/apply-ledger-constraints.ts
LINE: 31
TYPE: Console Statement Left In
CODE: `console.log('\n✅ Data is clean. You can now safely make `referenceId` required i...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/archive_others.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('Archiving non-core ledgers...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/archive_others.ts
LINE: 22
TYPE: Console Statement Left In
CODE: `console.log(`Deactivated ${result.count} accounts.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/archive_others.ts
LINE: 34
TYPE: Console Statement Left In
CODE: `console.log('Core 5 accounts are active.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/audit-all-loans.ts
LINE: 8
TYPE: Console Statement Left In
CODE: `console.log('--- GLOBAL LOAN BALANCE AUDIT ---');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/audit-all-loans.ts
LINE: 16
TYPE: Console Statement Left In
CODE: `console.log(`Mismatch [${loan.loanApplicationNumber}]: Table ${loan.outstandingB...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/audit-all-loans.ts
LINE: 18
TYPE: Console Statement Left In
CODE: `console.log(`Match [${loan.loanApplicationNumber}]: ${ledgerBal}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/audit-system-accounts.ts
LINE: 22
TYPE: Console Statement Left In
CODE: `console.log('🔍 Starting System Account Configuration Audit...\n');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/audit-system-accounts.ts
LINE: 59
TYPE: Console Statement Left In
CODE: `console.log(`${statusIcon} [${type}]`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/audit-system-accounts.ts
LINE: 60
TYPE: Console Statement Left In
CODE: `console.log(`   Method: ${method}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/audit-system-accounts.ts
LINE: 61
TYPE: Console Statement Left In
CODE: `console.log(`   Account: ${account.code} - ${account.name}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/audit-system-accounts.ts
LINE: 62
TYPE: Console Statement Left In
CODE: `console.log(`   Type: ${account.type} (Expected: ${expectedType})`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/audit-system-accounts.ts
LINE: 65
TYPE: Console Statement Left In
CODE: `console.log(`   ACTION REQUIRED: Account Type mismatch! This may cause negative ...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/audit-system-accounts.ts
LINE: 67
TYPE: Console Statement Left In
CODE: `console.log('---');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-expenses.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('🔄 Backfilling requestedAmount...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-expenses.ts
LINE: 14
TYPE: Console Statement Left In
CODE: `console.log(`✅ Updated ${count} expenses.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-loan-disbursements.ts
LINE: 15
TYPE: Console Statement Left In
CODE: `console.log(`🔧 Backfill Disbursements (${dryRun ? 'DRY RUN' : 'LIVE MODE'})\n`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-loan-disbursements.ts
LINE: 32
TYPE: Console Statement Left In
CODE: `console.log(`📋 Found ${loansNeedingBackfill.length} disbursed loans\n`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-loan-disbursements.ts
LINE: 35
TYPE: Console Statement Left In
CODE: `console.log(`🔨 ${loansToFix.length} loans need backfill\n`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-loan-disbursements.ts
LINE: 38
TYPE: Console Statement Left In
CODE: `console.log('✅ No backfill needed!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-loan-disbursements.ts
LINE: 47
TYPE: Console Statement Left In
CODE: `console.log(`Processing ${loan.loanApplicationNumber}...`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-loan-disbursements.ts
LINE: 106
TYPE: Console Statement Left In
CODE: `console.log(`  ✅ Backfilled successfully`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-loan-disbursements.ts
LINE: 114
TYPE: Console Statement Left In
CODE: `console.log(`  📝 [DRY RUN] Would backfill`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-loan-disbursements.ts
LINE: 128
TYPE: Console Statement Left In
CODE: `console.log('\n' + '='.repeat(80))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-loan-disbursements.ts
LINE: 129
TYPE: Console Statement Left In
CODE: `console.log('📊 BACKFILL SUMMARY')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-loan-disbursements.ts
LINE: 130
TYPE: Console Statement Left In
CODE: `console.log('='.repeat(80))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-loan-disbursements.ts
LINE: 131
TYPE: Console Statement Left In
CODE: `console.log(`\nTotal Processed: ${loansToFix.length}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-loan-disbursements.ts
LINE: 132
TYPE: Console Statement Left In
CODE: `console.log(`✅ Successful: ${results.filter(r => r.action === 'CREATED_LEDGER_EN...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-loan-disbursements.ts
LINE: 133
TYPE: Console Statement Left In
CODE: `console.log(`❌ Failed: ${results.filter(r => r.action === 'SKIPPED').length}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-loan-disbursements.ts
LINE: 136
TYPE: Console Statement Left In
CODE: `console.log('\n⚠️  This was a DRY RUN. No changes were made.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-loan-disbursements.ts
LINE: 137
TYPE: Console Statement Left In
CODE: `console.log('To apply changes, run: npx tsx scripts/backfill-loan-disbursements....`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-loan-disbursements.ts
LINE: 150
TYPE: Console Statement Left In
CODE: `console.log('\n✅ Backfill complete')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-monthly-tracker.ts
LINE: 14
TYPE: Console Statement Left In
CODE: `console.log('🔄 Starting MonthlyTracker backfill...\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-monthly-tracker.ts
LINE: 20
TYPE: Console Statement Left In
CODE: `console.log(`📋 Monthly contribution requirement: KES ${monthlyDue.toLocaleStrin...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-monthly-tracker.ts
LINE: 36
TYPE: Console Statement Left In
CODE: `console.log(`👥 Found ${members.length} total members\n`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-monthly-tracker.ts
LINE: 39
TYPE: Console Statement Left In
CODE: `console.log('⚠️  No members found in database. Exiting.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-monthly-tracker.ts
LINE: 62
TYPE: Console Statement Left In
CODE: `console.log(`⏭️  Skipping ${member.name} (#${member.memberNumber}) - Already has...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-monthly-tracker.ts
LINE: 71
TYPE: Console Statement Left In
CODE: `console.log(`\n✅ Processing ${member.name} (#${member.memberNumber})`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-monthly-tracker.ts
LINE: 72
TYPE: Console Statement Left In
CODE: `console.log(`   Total contributions: KES ${totalContributions.toLocaleString()}`...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-monthly-tracker.ts
LINE: 73
TYPE: Console Statement Left In
CODE: `console.log(`   Months fully paid: ${monthsPaid}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-monthly-tracker.ts
LINE: 74
TYPE: Console Statement Left In
CODE: `console.log(`   Remaining amount: KES ${remainingAmount.toLocaleString()}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-monthly-tracker.ts
LINE: 120
TYPE: Console Statement Left In
CODE: `console.log(`   ✅ Created ${trackerRecords.length} tracker records`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-monthly-tracker.ts
LINE: 126
TYPE: Console Statement Left In
CODE: `console.log(`      - ${format(record.month, 'MMM yyyy')}: ${record.status} (Paid...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-monthly-tracker.ts
LINE: 131
TYPE: Console Statement Left In
CODE: `console.log('\n' + '='.repeat(60))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-monthly-tracker.ts
LINE: 132
TYPE: Console Statement Left In
CODE: `console.log('📊 Backfill Summary:')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-monthly-tracker.ts
LINE: 133
TYPE: Console Statement Left In
CODE: `console.log('='.repeat(60))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-monthly-tracker.ts
LINE: 134
TYPE: Console Statement Left In
CODE: `console.log(`✅ Members processed: ${processedCount}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-monthly-tracker.ts
LINE: 135
TYPE: Console Statement Left In
CODE: `console.log(`⏭️  Members skipped: ${skippedCount}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-monthly-tracker.ts
LINE: 136
TYPE: Console Statement Left In
CODE: `console.log(`📝 Tracker records created: ${createdRecords}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-monthly-tracker.ts
LINE: 137
TYPE: Console Statement Left In
CODE: `console.log('='.repeat(60))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-monthly-tracker.ts
LINE: 138
TYPE: Console Statement Left In
CODE: `console.log('\n✨ MonthlyTracker backfill complete!\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/backfill-monthly-tracker.ts
LINE: 144
TYPE: Console Statement Left In
CODE: `console.log('✅ Script completed successfully')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/bulk-migrate-1200-to-1310.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log('--- BULK MIGRATION: 1200 -> 1310 ---');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/bulk-migrate-1200-to-1310.ts
LINE: 29
TYPE: Console Statement Left In
CODE: `console.log(`Found ${entries.length} entries to migrate.`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/bulk-migrate-1200-to-1310.ts
LINE: 32
TYPE: Console Statement Left In
CODE: `console.log(`  Migrating entry ${e.id}: ${e.description || 'No desc'}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/bulk-migrate-1200-to-1310.ts
LINE: 40
TYPE: Console Statement Left In
CODE: `console.log('Syncing all loan balances...');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/bulk-migrate-1200-to-1310.ts
LINE: 50
TYPE: Console Statement Left In
CODE: `console.log(`  ${loan.loanApplicationNumber}: ${bal}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/bulk-migrate-1200-to-1310.ts
LINE: 53
TYPE: Console Statement Left In
CODE: `console.log('--- BULK MIGRATION COMPLETE ---');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check_admin_users.js
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log("Checking Users and Roles...")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check_admin_users.js
LINE: 12
TYPE: Console Statement Left In
CODE: `console.table(users)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check_balance.ts
LINE: 19
TYPE: Console Statement Left In
CODE: `console.log(`Member: ${member.name}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check_balance.ts
LINE: 20
TYPE: Console Statement Left In
CODE: `console.log(`Wallet Balance (Ledger): ${balance}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check_balance.ts
LINE: 22
TYPE: Console Statement Left In
CODE: `console.log("Member not found (ID: cmk5dyz5l0000tmeg8aqhxu9n)")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check_client.js
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('✅ SystemModule exists on client');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check_client.js
LINE: 10
TYPE: Console Statement Left In
CODE: `console.log(`📊 SystemModules count: ${count}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check_client.js
LINE: 19
TYPE: Console Statement Left In
CODE: `console.log('✅ RolePermission exists on client');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check_client.js
LINE: 22
TYPE: Console Statement Left In
CODE: `console.log(`📊 RolePermissions count: ${count}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check_ledger_values.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('🔍 Checking Raw Database Values...');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check_ledger_values.ts
LINE: 14
TYPE: Console Statement Left In
CODE: `console.log('\n--- Ledger Accounts ---');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check_ledger_values.ts
LINE: 16
TYPE: Console Statement Left In
CODE: `console.log(`${acc.code} ${acc.name}: ${acc.balance.toString()}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check_ledger_values.ts
LINE: 25
TYPE: Console Statement Left In
CODE: `console.log('\n--- Ledger Entries (First 5) ---');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check_ledger_values.ts
LINE: 27
TYPE: Console Statement Left In
CODE: `console.log(`Dr: ${entry.debitAmount.toString()} | Cr: ${entry.creditAmount.toSt...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-accs.ts
LINE: 9
TYPE: Console Statement Left In
CODE: `console.log(JSON.stringify(accs, null, 2));`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-admin.js
LINE: 10
TYPE: Console Statement Left In
CODE: `console.log('Admin User:', JSON.stringify(user, null, 2))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-balances.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log("--- Checking Account Balances ---");`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-balances.ts
LINE: 12
TYPE: Console Statement Left In
CODE: `console.log(`Account 1100 (Loan Portfolio): KES ${bal1100.toLocaleString()}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-balances.ts
LINE: 13
TYPE: Console Statement Left In
CODE: `} catch (e: any) { console.log("Account 1100 not found or error", e.message); }`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-balances.ts
LINE: 18
TYPE: Console Statement Left In
CODE: `console.log(`Account 1200 (Receivables/Old Contrib): KES ${bal1200.toLocaleStrin...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-balances.ts
LINE: 19
TYPE: Console Statement Left In
CODE: `} catch (e: any) { console.log("Account 1200 not found or error", e.message); }`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-balances.ts
LINE: 24
TYPE: Console Statement Left In
CODE: `console.log(`Account 3000 (Contributions Equity): KES ${bal3000.toLocaleString()...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-balances.ts
LINE: 25
TYPE: Console Statement Left In
CODE: `} catch (e: any) { console.log("Account 3000 not found or error", e.message); }`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-balances.ts
LINE: 33
TYPE: Console Statement Left In
CODE: `console.log(`\nMapping 'EVENT_LOAN_DISBURSEMENT' -> [${mapping.account.code}] ${...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-balances.ts
LINE: 35
TYPE: Console Statement Left In
CODE: `console.log("\nMapping 'EVENT_LOAN_DISBURSEMENT' -> NOT SET");`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-client.ts
LINE: 3
TYPE: Console Statement Left In
CODE: `console.log('SystemAccountType keys:', Object.keys(SystemAccountType))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-client.ts
LINE: 4
TYPE: Console Statement Left In
CODE: `console.log('INCOME_REFINANCE_FEE exists:', 'INCOME_REFINANCE_FEE' in SystemAcco...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-config.ts
LINE: 5
TYPE: Console Statement Left In
CODE: `console.log('🔍 Checking Account 1200 Configuration...');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-config.ts
LINE: 11
TYPE: Console Statement Left In
CODE: `console.log('❌ Account 1200 not found!');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-config.ts
LINE: 13
TYPE: Console Statement Left In
CODE: `console.log('✅ Account 1200 found:', account);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-config.ts
LINE: 19
TYPE: Console Statement Left In
CODE: `console.log('Start Mapping:', mapping);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-contributions-mismatch.ts
LINE: 5
TYPE: Console Statement Left In
CODE: `console.log("Checking for Contributions Mismatches...")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-contributions-mismatch.ts
LINE: 17
TYPE: Console Statement Left In
CODE: `console.log(`Found ${members.length} members.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-contributions-mismatch.ts
LINE: 18
TYPE: Console Statement Left In
CODE: `console.log("---------------------------------------------------")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-contributions-mismatch.ts
LINE: 19
TYPE: Console Statement Left In
CODE: `console.log("Member | Current (Col) | Ledger (1200) | Diff | Status")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-contributions-mismatch.ts
LINE: 20
TYPE: Console Statement Left In
CODE: `console.log("---------------------------------------------------")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-contributions-mismatch.ts
LINE: 45
TYPE: Console Statement Left In
CODE: `console.log(`${m.memberNumber} | ${legacyVal.toFixed(2).padStart(10)} | ${ledger...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-contributions-mismatch.ts
LINE: 58
TYPE: Console Statement Left In
CODE: `console.log(`    > Detail: Found ${entries.length} entries for ${m.memberNumber}...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-contributions-mismatch.ts
LINE: 60
TYPE: Console Statement Left In
CODE: `console.log(`      - ${e.ledgerTransaction.transactionDate.toISOString().split('...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-contributions-mismatch.ts
LINE: 63
TYPE: Console Statement Left In
CODE: `console.log(`    > Detail: No ledger entries found.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-contributions-mismatch.ts
LINE: 67
TYPE: Console Statement Left In
CODE: `// console.log(`${m.memberNumber} | ${legacyVal} | ${ledgerRaw} | OK`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-contributions-mismatch.ts
LINE: 71
TYPE: Console Statement Left In
CODE: `console.log("---------------------------------------------------")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-contributions-mismatch.ts
LINE: 72
TYPE: Console Statement Left In
CODE: `console.log(`Total Mismatches: ${mismatchCount}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-db.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('System Modules in DB:', JSON.stringify(modules, null, 2))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-db.ts
LINE: 11
TYPE: Console Statement Left In
CODE: `console.log('REPORTS_HUB Permissions in DB:', JSON.stringify(permissions, null, ...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-members.ts
LINE: 19
TYPE: Console Statement Left In
CODE: `console.log(`Active Members Count: ${activeMembers}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-members.ts
LINE: 20
TYPE: Console Statement Left In
CODE: `console.log('Sample Members:', allMembers.slice(0, 10))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-notification-config.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('Checking Notification Configurations...');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-notification-config.ts
LINE: 11
TYPE: Console Statement Left In
CODE: `console.log('❌ No notification configurations found in the database.');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-notification-config.ts
LINE: 13
TYPE: Console Statement Left In
CODE: `console.log('✅ Found configurations:');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-notification-config.ts
LINE: 15
TYPE: Console Statement Left In
CODE: `console.log(`\nEvent: ${config.event}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-notification-config.ts
LINE: 16
TYPE: Console Statement Left In
CODE: `console.log(`Active: ${config.isActive}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-notification-config.ts
LINE: 17
TYPE: Console Statement Left In
CODE: `console.log(`Emails: ${config.emails.join(', ')}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-portfolio.ts
LINE: 15
TYPE: Console Statement Left In
CODE: `console.log(`--- Ledger Account 1310 (Portfolio) Entries ---`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-portfolio.ts
LINE: 21
TYPE: Console Statement Left In
CODE: `console.log(`[${e.ledgerTransaction.transactionDate.toISOString().split('T')[0]}...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-status.ts
LINE: 11
TYPE: Console Statement Left In
CODE: `console.log('Current Expense Statuses:', result)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-system-modules.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('System Modules Count:', modules.length);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-system-modules.ts
LINE: 8
TYPE: Console Statement Left In
CODE: `console.log('Modules:', JSON.stringify(modules, null, 2));`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/check-system-modules.ts
LINE: 11
TYPE: Console Statement Left In
CODE: `console.log('Permissions Count:', permissions.length);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/clean-empty-drafts.ts
LINE: 8
TYPE: Console Statement Left In
CODE: `console.log('🧹 Cleaning empty draft loans...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/clean-empty-drafts.ts
LINE: 24
TYPE: Console Statement Left In
CODE: `console.log(`Found ${emptyDrafts.length} empty drafts:`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/clean-empty-drafts.ts
LINE: 26
TYPE: Console Statement Left In
CODE: `console.log(`  - ${draft.loanApplicationNumber} (created: ${draft.createdAt})`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/clean-empty-drafts.ts
LINE: 30
TYPE: Console Statement Left In
CODE: `console.log('✅ No empty drafts to clean')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/clean-empty-drafts.ts
LINE: 43
TYPE: Console Statement Left In
CODE: `console.log(`✅ Deleted ${result.count} empty drafts`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/clean-empty-drafts.ts
LINE: 48
TYPE: Console Statement Left In
CODE: `console.log('✅ Done')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/cleanup_test_data.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log('🧹 Cleaning up test data...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/cleanup_test_data.ts
LINE: 11
TYPE: Console Statement Left In
CODE: `console.log(`Deleted ${wCount} test wallets.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/cleanup_test_data.ts
LINE: 17
TYPE: Console Statement Left In
CODE: `console.log(`Deleted ${mCount} test members.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/cleanup-double-interest.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log('🧹 Cleaning up double interest backfills...\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/cleanup-double-interest.ts
LINE: 17
TYPE: Console Statement Left In
CODE: `console.log(`Found ${backfills.length} backfills`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/cleanup-double-interest.ts
LINE: 23
TYPE: Console Statement Left In
CODE: `console.log(`Checking Loan ${loanId}...`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/cleanup-double-interest.ts
LINE: 36
TYPE: Console Statement Left In
CODE: `console.log(`  Found Original Ledger TX: ${original.id} (${original.description}...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/cleanup-double-interest.ts
LINE: 37
TYPE: Console Statement Left In
CODE: `console.log(`  Backfill ID: ${bf.id}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/cleanup-double-interest.ts
LINE: 45
TYPE: Console Statement Left In
CODE: `console.log(`  Relinking LoanTX ${loanTx.id} to Original...`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/cleanup-double-interest.ts
LINE: 53
TYPE: Console Statement Left In
CODE: `console.log(`  Deleting Backfill Ledger Entry...`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/cleanup-double-interest.ts
LINE: 60
TYPE: Console Statement Left In
CODE: `console.log('  ✅ Cleaned up')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/cleanup-double-interest.ts
LINE: 62
TYPE: Console Statement Left In
CODE: `console.log('  ⚠️ No original found. Backfill might be legitimate.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/cleanup-mappings.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('🧹 Cleaning up legacy mappings...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/cleanup-mappings.ts
LINE: 21
TYPE: Console Statement Left In
CODE: `console.log(`✓ Deleted ${result.count} legacy mappings for INCOME_LOAN_APPLICATI...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/cleanup-mappings.ts
LINE: 23
TYPE: Console Statement Left In
CODE: `console.warn('Could not standard delete, trying raw cleanup if needed but usuall...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/cleanup-mappings.ts
LINE: 27
TYPE: Console Statement Left In
CODE: `console.log('✅ Cleanup complete!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/clear-cache-note.js
LINE: 9
TYPE: Console Statement Left In
CODE: `console.log("To clear the cache, please restart your development server.");`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/compare-dashboard-ledger.ts
LINE: 14
TYPE: Console Statement Left In
CODE: `console.log('LN005 not found');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/compare-dashboard-ledger.ts
LINE: 19
TYPE: Console Statement Left In
CODE: `console.log(`Analyzing Member: ${loan.member.name} (${memberId})`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/compare-dashboard-ledger.ts
LINE: 21
TYPE: Console Statement Left In
CODE: `console.log('\n--- Dashboard Perspective ---');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/compare-dashboard-ledger.ts
LINE: 24
TYPE: Console Statement Left In
CODE: `console.log(`Loan: ${p.loanNumber}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/compare-dashboard-ledger.ts
LINE: 25
TYPE: Console Statement Left In
CODE: `console.log(`  Total Balance: ${p.totalLoanBalance}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/compare-dashboard-ledger.ts
LINE: 26
TYPE: Console Statement Left In
CODE: `console.log(`  Principal:     ${p.principalBalance}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/compare-dashboard-ledger.ts
LINE: 27
TYPE: Console Statement Left In
CODE: `console.log(`  Interest:      ${p.interestBalance}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/compare-dashboard-ledger.ts
LINE: 28
TYPE: Console Statement Left In
CODE: `console.log(`  Arrears:       ${p.arrears}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/compare-dashboard-ledger.ts
LINE: 31
TYPE: Console Statement Left In
CODE: `console.log('\n--- Model Field Perspective ---');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/compare-dashboard-ledger.ts
LINE: 36
TYPE: Console Statement Left In
CODE: `console.log(`Loan ${loanRec?.loanApplicationNumber}: outstandingBalance = ${loan...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/create-admin.js
LINE: 20
TYPE: Console Statement Left In
CODE: `console.log('❌ Admin user already exists with email:', adminEmail)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/create-admin.js
LINE: 36
TYPE: Console Statement Left In
CODE: `console.log('✅ Member created:', member.memberNumber)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/create-admin.js
LINE: 49
TYPE: Console Statement Left In
CODE: `console.log('✅ Admin user created successfully!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/create-admin.js
LINE: 50
TYPE: Console Statement Left In
CODE: `console.log('\n📧 Email:', adminEmail)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/create-admin.js
LINE: 51
TYPE: Console Statement Left In
CODE: `console.log('🔑 Password:', adminPassword)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/create-admin.js
LINE: 52
TYPE: Console Statement Left In
CODE: `console.log('👤 Role:', user.role)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/create-admin.js
LINE: 53
TYPE: Console Statement Left In
CODE: `console.log('🔢 Member Number:', member.memberNumber)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/create-admin.js
LINE: 54
TYPE: Console Statement Left In
CODE: `console.log('\n⚠️  Please change the password after first login!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/create-missing-approval-requests.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log('=== CREATING MISSING APPROVAL REQUESTS ===\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/create-missing-approval-requests.ts
LINE: 27
TYPE: Console Statement Left In
CODE: `console.log(`Found ${pendingLoans.length} loans with PENDING_APPROVAL status\n`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/create-missing-approval-requests.ts
LINE: 40
TYPE: Console Statement Left In
CODE: `console.log(`✓ ${loan.loanApplicationNumber} - Already has approval request`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/create-missing-approval-requests.ts
LINE: 60
TYPE: Console Statement Left In
CODE: `console.log(`✅ Created approval request for ${loan.loanApplicationNumber}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/create-missing-approval-requests.ts
LINE: 61
TYPE: Console Statement Left In
CODE: `console.log(`   Request ID: ${approvalRequest.id}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/create-missing-approval-requests.ts
LINE: 62
TYPE: Console Statement Left In
CODE: `console.log(`   Amount: KES ${loan.amount}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/create-missing-approval-requests.ts
LINE: 63
TYPE: Console Statement Left In
CODE: `console.log(`   Member: ${loan.member.name}\n`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/create-missing-approval-requests.ts
LINE: 69
TYPE: Console Statement Left In
CODE: `console.log('\n=== DONE ===')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/create-separate-admin.js
LINE: 17
TYPE: Console Statement Left In
CODE: `console.log('❌ Admin account already exists with email:', adminEmail)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/create-separate-admin.js
LINE: 18
TYPE: Console Statement Left In
CODE: `console.log('💡 Use the upgrade script to change role if needed')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/create-separate-admin.js
LINE: 29
TYPE: Console Statement Left In
CODE: `console.log('📋 Creating new admin account...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/create-separate-admin.js
LINE: 30
TYPE: Console Statement Left In
CODE: `console.log('   Member Number:', newMemberNumber)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/create-separate-admin.js
LINE: 42
TYPE: Console Statement Left In
CODE: `console.log('✅ Member created:', member.name, '#' + member.memberNumber)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/create-separate-admin.js
LINE: 76
TYPE: Console Statement Left In
CODE: `console.log('\n✅ Admin account created successfully!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/create-separate-admin.js
LINE: 77
TYPE: Console Statement Left In
CODE: `console.log('\n📧 Email:', adminEmail)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/create-separate-admin.js
LINE: 78
TYPE: Console Statement Left In
CODE: `console.log('🔑 Password:', adminPassword)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/create-separate-admin.js
LINE: 79
TYPE: Console Statement Left In
CODE: `console.log('👤 Role:', adminUser.role)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/create-separate-admin.js
LINE: 80
TYPE: Console Statement Left In
CODE: `console.log('🔢 Member Number:', member.memberNumber)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/create-separate-admin.js
LINE: 81
TYPE: Console Statement Left In
CODE: `console.log('💰 Wallet: Created with balance 0')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/create-separate-admin.js
LINE: 82
TYPE: Console Statement Left In
CODE: `console.log('\n⚠️  IMPORTANT: Change the password after first login!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/create-separate-admin.js
LINE: 83
TYPE: Console Statement Left In
CODE: `console.log('⚠️  Store these credentials securely!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/create-separate-admin.js
LINE: 88
TYPE: Console Statement Left In
CODE: `console.log('💡 This might be a duplicate. Check existing users with: node scrip...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug_loans.ts
LINE: 15
TYPE: Console Statement Left In
CODE: `console.log('----- LOAN DEBUG REPORT -----');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug_loans.ts
LINE: 16
TYPE: Console Statement Left In
CODE: `console.log(`Total Loans Found: ${loans.length}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug_loans.ts
LINE: 19
TYPE: Console Statement Left In
CODE: `console.log('No loans found in the database.');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug_loans.ts
LINE: 23
TYPE: Console Statement Left In
CODE: `console.log(`Loan #${l.loanApplicationNumber}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug_loans.ts
LINE: 24
TYPE: Console Statement Left In
CODE: `console.log(`  - ID: ${l.id}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug_loans.ts
LINE: 25
TYPE: Console Statement Left In
CODE: `console.log(`  - Member: ${l.member.name} (${l.member.id})`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug_loans.ts
LINE: 26
TYPE: Console Statement Left In
CODE: `console.log(`  - Status: ${l.status}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug_loans.ts
LINE: 27
TYPE: Console Statement Left In
CODE: `console.log(`  - Amount: ${l.amount}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug_loans.ts
LINE: 28
TYPE: Console Statement Left In
CODE: `console.log('-----------------------------');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug_product_accounts.js
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log("Fetching all accounts...")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug_product_accounts.js
LINE: 18
TYPE: Console Statement Left In
CODE: `console.log(`Found ${accounts.length} accounts:`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug_product_accounts.js
LINE: 20
TYPE: Console Statement Left In
CODE: `console.log(`[${acc.code}] ${acc.name} (${acc.type})`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug_registration.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('🐞 Debugging Registration...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug_registration.ts
LINE: 12
TYPE: Console Statement Left In
CODE: `console.log('1. Creating Member Only...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug_registration.ts
LINE: 22
TYPE: Console Statement Left In
CODE: `console.log('   ✅ Member created:', member.id)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug_registration.ts
LINE: 29
TYPE: Console Statement Left In
CODE: `console.log('2. Creating Shared Wallet...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug_registration.ts
LINE: 39
TYPE: Console Statement Left In
CODE: `console.log('   ✅ Wallet 1 created')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug_registration.ts
LINE: 44
TYPE: Commented-Out Code
CODE: `// But I can create 2 wallets for DIFFERENT members linked to SAME glAccount.`
IMPACT: Dead code bloats the codebase and causes confusion
FIX: Remove the commented out code or restore it if needed

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug_registration.ts
LINE: 54
TYPE: Console Statement Left In
CODE: `console.log('3. Testing 2 Wallets, Same GL Account...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug_registration.ts
LINE: 68
TYPE: Console Statement Left In
CODE: `console.log('   ✅ Wallet 2 created (Shared GL works!)')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-account-type.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('--- DEBUG ACCOUNT TYPE ---')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-account-type.ts
LINE: 15
TYPE: Console Statement Left In
CODE: `console.log('No mapping found for CONTRIBUTIONS')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-account-type.ts
LINE: 19
TYPE: Console Statement Left In
CODE: `console.log(`Mapping found for CONTRIBUTIONS -> Account Code: ${mapping.account....`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-account-type.ts
LINE: 20
TYPE: Console Statement Left In
CODE: `console.log(`Account ID: ${mapping.account.id}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-account-type.ts
LINE: 21
TYPE: Console Statement Left In
CODE: `console.log(`Account Name: ${mapping.account.name}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-account-type.ts
LINE: 22
TYPE: Console Statement Left In
CODE: `console.log(`Account Type: ${mapping.account.type}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-balance-diff.ts
LINE: 9
TYPE: Console Statement Left In
CODE: `console.log(`--- Debugging Balance for ${loanNumber} ---`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-balance-diff.ts
LINE: 16
TYPE: Console Statement Left In
CODE: `console.log('Loan not found');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-balance-diff.ts
LINE: 22
TYPE: Console Statement Left In
CODE: `console.log(`Ledger Balance (getLoanOutstandingBalance):  ${ledgerBalance}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-balance-diff.ts
LINE: 23
TYPE: Console Statement Left In
CODE: `console.log(`Model Field (Stored):                       ${loan.outstandingBalan...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-balance-diff.ts
LINE: 25
TYPE: Console Statement Left In
CODE: `console.log('\n--- Ledger Entry Audit (ASSET accounts linked to Loan ID) ---');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-balance-diff.ts
LINE: 37
TYPE: Console Statement Left In
CODE: `console.log(`[${e.ledgerTransaction.transactionDate.toISOString().split('T')[0]}...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-balance-diff.ts
LINE: 40
TYPE: Console Statement Left In
CODE: `console.log('\n--- Searching Ledger Entries by Keyword "LN005" regardless of ref...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-balance-diff.ts
LINE: 52
TYPE: Console Statement Left In
CODE: `console.log(`[${e.ledgerTransaction.transactionDate.toISOString().split('T')[0]}...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-balance-diff.ts
LINE: 59
TYPE: Console Statement Left In
CODE: `console.log(`Statement Balance (Calc):     ${item?.totalLoanBalance}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-balance-diff.ts
LINE: 60
TYPE: Console Statement Left In
CODE: `console.log(`Statement Arrears:            ${item?.arrears}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-borrowing-power.ts
LINE: 8
TYPE: Console Statement Left In
CODE: `console.log('Debugging Borrowing Power...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-borrowing-power.ts
LINE: 14
TYPE: Console Statement Left In
CODE: `console.log(`Member: ${sysAdmin.name} (${sysAdmin.id})`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-borrowing-power.ts
LINE: 19
TYPE: Console Statement Left In
CODE: `console.log('Snapshot Result:')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-borrowing-power.ts
LINE: 20
TYPE: Console Statement Left In
CODE: `console.log(JSON.stringify(snapshot, null, 2))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-cached-balance.ts
LINE: 10
TYPE: Console Statement Left In
CODE: `console.log(`Account 1200 Cached Balance: ${account.balance}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-cached-balance.ts
LINE: 11
TYPE: Console Statement Left In
CODE: `console.log(`Account Type: ${account.type}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-comparison.ts
LINE: 9
TYPE: Console Statement Left In
CODE: `console.log('--- DEBUG COMPARISON ---')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-comparison.ts
LINE: 14
TYPE: Console Statement Left In
CODE: `console.log(`Member: ${sysAdmin.name} (${sysAdmin.id})`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-comparison.ts
LINE: 19
TYPE: Console Statement Left In
CODE: `console.log(`[Direct] getMemberContributionBalance: ${balance}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-comparison.ts
LINE: 27
TYPE: Console Statement Left In
CODE: `console.log(`[Wrapper] calculateBorrowingPower shareCapital: ${snapshot.shareCap...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-comparison.ts
LINE: 36
TYPE: Console Statement Left In
CODE: `console.log(`\n--- Raw Entries for Account ${mappings.account.code} ---`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-comparison.ts
LINE: 52
TYPE: Console Statement Left In
CODE: `console.log(`[${e.ledgerTransaction.transactionDate.toISOString().substring(0, 1...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-comparison.ts
LINE: 53
TYPE: Console Statement Left In
CODE: `console.log(`   RefType: ${e.ledgerTransaction.referenceType}, Reversal: ${e.led...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-comparison.ts
LINE: 55
TYPE: Console Statement Left In
CODE: `console.log(`Final Net Calculation: ${net}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-contributions.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('Investigating Contribution Balance...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-contributions.ts
LINE: 21
TYPE: Console Statement Left In
CODE: `console.log(`Checking Member: ${member.name} (${member.id})`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-contributions.ts
LINE: 27
TYPE: Console Statement Left In
CODE: `console.log(`Account 1200 Type: ${account.type}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-contributions.ts
LINE: 39
TYPE: Console Statement Left In
CODE: `console.log(`Found ${entries.length} entries for Account 1200 globally.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-contributions.ts
LINE: 43
TYPE: Console Statement Left In
CODE: `console.log('Sample Entry:', JSON.stringify(entries[0], null, 2))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-contributions.ts
LINE: 58
TYPE: Console Statement Left In
CODE: `console.log(`Calculated Global Contribution Balance (Equity Rules): ${balance}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-current-status.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log("🔍 Debugging Member Status...")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-current-status.ts
LINE: 20
TYPE: Console Statement Left In
CODE: `console.log("❌ No member found.")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-current-status.ts
LINE: 24
TYPE: Console Statement Left In
CODE: `console.log(`👤 Analyzing Member: ${targetMember.name} (${targetMember.id})`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-current-status.ts
LINE: 25
TYPE: Console Statement Left In
CODE: `console.log(`💰 Share Contributions: ${targetMember.shareContributions}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-current-status.ts
LINE: 31
TYPE: Console Statement Left In
CODE: `console.log(`Checking Tracker for: ${start.toISOString()}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-current-status.ts
LINE: 44
TYPE: Console Statement Left In
CODE: `console.log("✅ Tracker Found:")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-current-status.ts
LINE: 45
TYPE: Console Statement Left In
CODE: `console.log(tracker)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-current-status.ts
LINE: 47
TYPE: Console Statement Left In
CODE: `console.log("❌ No MonthlyTracker found for current month.")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-current-status.ts
LINE: 48
TYPE: Console Statement Left In
CODE: `console.log("   -> Outcome: Code defaults to 'PENDING' with full amount due (200...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-current-status.ts
LINE: 57
TYPE: Console Statement Left In
CODE: `console.log("Recent ContributionTransactions:", recentTx)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-dashboard-stats.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log("--- Fetching Dashboard Stats ---")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-dashboard-stats.ts
LINE: 23
TYPE: Console Statement Left In
CODE: `console.log("Stats Result:", JSON.stringify(stats, null, 2))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-dashboard-stats.ts
LINE: 33
TYPE: Console Statement Left In
CODE: `console.log("\n--- Manual Verification Logic (Bypassing Auth) ---")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-dashboard-stats.ts
LINE: 36
TYPE: Console Statement Left In
CODE: `console.log(`Found ${memberIds.length} members`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-dashboard-stats.ts
LINE: 50
TYPE: Console Statement Left In
CODE: `console.log(`System maps CONTRIBUTIONS to Account Code: ${code} (${mapping.accou...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-dashboard-stats.ts
LINE: 68
TYPE: Console Statement Left In
CODE: `console.log(`Manual Aggregation Result:`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-dashboard-stats.ts
LINE: 69
TYPE: Console Statement Left In
CODE: `console.log(`- Debits: ${debit}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-dashboard-stats.ts
LINE: 70
TYPE: Console Statement Left In
CODE: `console.log(`- Credits: ${credit}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-dashboard-stats.ts
LINE: 71
TYPE: Console Statement Left In
CODE: `console.log(`- Total Balance (Credit Normal): ${balance}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-engine-calc.ts
LINE: 8
TYPE: Console Statement Left In
CODE: `console.log('Verifying AccountingEngine Calculation...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-engine-calc.ts
LINE: 14
TYPE: Console Statement Left In
CODE: `console.log(`Member: ${sysAdmin.name}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-engine-calc.ts
LINE: 19
TYPE: Console Statement Left In
CODE: `console.log(`Engine.getMemberContributionBalance: ${balance}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-engine-calc.ts
LINE: 27
TYPE: Console Statement Left In
CODE: `console.log(`AccountingEngine.getAccountBalance('1200'): ${bal}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ids.ts
LINE: 10
TYPE: Console Statement Left In
CODE: `console.log(`Investigating ID: ${targetId}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ids.ts
LINE: 13
TYPE: Console Statement Left In
CODE: `if (member) console.log('✅ Found as MEMBER:', member.name)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ids.ts
LINE: 14
TYPE: Console Statement Left In
CODE: `else console.log('❌ Not a Member')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ids.ts
LINE: 17
TYPE: Console Statement Left In
CODE: `if (wallet) console.log('✅ Found as WALLET:', wallet.walletNumber)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ids.ts
LINE: 18
TYPE: Console Statement Left In
CODE: `else console.log('❌ Not a Wallet')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ids.ts
LINE: 21
TYPE: Console Statement Left In
CODE: `if (user) console.log('✅ Found as USER:', user.email)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ids.ts
LINE: 22
TYPE: Console Statement Left In
CODE: `else console.log('❌ Not a User')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ids.ts
LINE: 25
TYPE: Console Statement Left In
CODE: `if (shareTx) console.log('✅ Found as SHARE TRANSACTION')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ids.ts
LINE: 26
TYPE: Console Statement Left In
CODE: `else console.log('❌ Not a Share Transaction')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ids.ts
LINE: 29
TYPE: Console Statement Left In
CODE: `if (loan) console.log('✅ Found as LOAN')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ids.ts
LINE: 30
TYPE: Console Statement Left In
CODE: `else console.log('❌ Not a Loan')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-import.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log('--- Debug Import ---')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-import.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('Function Source (FULL):\n', getLoanStatement.toString())`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-import.ts
LINE: 15
TYPE: Console Statement Left In
CODE: `console.log('Loan LN015 not found')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-import.ts
LINE: 19
TYPE: Console Statement Left In
CODE: `console.log('Running function with ID:', loan.id)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-import.ts
LINE: 22
TYPE: Console Statement Left In
CODE: `console.log('Result Keys:', Object.keys(result || {}))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-import.ts
LINE: 24
TYPE: Console Statement Left In
CODE: `console.log('Error running function:', e)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ledger-transaction.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log('🔍 Debugging LN017 Ledger Links...\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ledger-transaction.ts
LINE: 18
TYPE: Console Statement Left In
CODE: `console.log('No linked repayment found')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ledger-transaction.ts
LINE: 22
TYPE: Console Statement Left In
CODE: `console.log(`Repayment TX: ${repaymentTx.id}, Amount: ${repaymentTx.amount}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ledger-transaction.ts
LINE: 23
TYPE: Console Statement Left In
CODE: `console.log(`Linked Ledger TX: ${repaymentTx.referenceId}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ledger-transaction.ts
LINE: 36
TYPE: Console Statement Left In
CODE: `console.log('Ledger Transaction not found')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ledger-transaction.ts
LINE: 40
TYPE: Console Statement Left In
CODE: `console.log(`\nLedger Transaction: ${ledgerTx.description}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ledger-transaction.ts
LINE: 41
TYPE: Console Statement Left In
CODE: `console.log(`Reference ID: ${ledgerTx.referenceId}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ledger-transaction.ts
LINE: 43
TYPE: Console Statement Left In
CODE: `console.log('\nLINES:')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ledger-transaction.ts
LINE: 47
TYPE: Console Statement Left In
CODE: `console.log(`- [${line.ledgerAccount.code}] ${line.ledgerAccount.name} (${line.l...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ledger-transaction.ts
LINE: 48
TYPE: Console Statement Left In
CODE: `console.log(`  DR: ${line.debitAmount} | CR: ${line.creditAmount}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ledger-transaction.ts
LINE: 49
TYPE: Console Statement Left In
CODE: `console.log(`  Desc: ${line.description}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ledger-transaction.ts
LINE: 53
TYPE: Console Statement Left In
CODE: `console.log(`  => Asset Impact: ${Number(line.debitAmount) - Number(line.creditA...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ledger-transaction.ts
LINE: 57
TYPE: Console Statement Left In
CODE: `console.log(`\nTotal Asset Impact from this TX: ${assetSum}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ln015.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log(`--- Investigating Loan ${loanAppNum} ---`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ln015.ts
LINE: 18
TYPE: Console Statement Left In
CODE: `console.log('Loan not found')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ln015.ts
LINE: 22
TYPE: Console Statement Left In
CODE: `console.log(`Loan ID: ${loan.id}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ln015.ts
LINE: 23
TYPE: Console Statement Left In
CODE: `console.log(`Status: ${loan.status}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ln015.ts
LINE: 24
TYPE: Console Statement Left In
CODE: `console.log(`Cached Outstanding Balance: ${loan.outstandingBalance}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ln015.ts
LINE: 25
TYPE: Console Statement Left In
CODE: `console.log(`Legacy Current Balance: ${loan.current_balance}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ln015.ts
LINE: 27
TYPE: Console Statement Left In
CODE: `console.log('\n--- Transactions ---')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ln015.ts
LINE: 28
TYPE: Console Statement Left In
CODE: `console.table(loan.transactions.map(t => ({`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ln017-simple.ts
LINE: 11
TYPE: Console Statement Left In
CODE: `console.log('Loan not found')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ln017-simple.ts
LINE: 20
TYPE: Console Statement Left In
CODE: `console.log('No repayment found')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ln017-simple.ts
LINE: 24
TYPE: Console Statement Left In
CODE: `console.log(`Repayment Ref: ${tx.referenceId}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ln017-simple.ts
LINE: 31
TYPE: Console Statement Left In
CODE: `console.log(`Ledger TX Ref: ${ltx?.referenceId}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-ln017-simple.ts
LINE: 34
TYPE: Console Statement Left In
CODE: `console.log(`Line: ${l.description} | ${l.ledgerAccount.type} | DR: ${l.debitAmo...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-202601-002.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log(`Searching for loan ${loanNumber}...`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-202601-002.ts
LINE: 17
TYPE: Console Statement Left In
CODE: `console.log(`Found Loan ID: ${loan.id}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-202601-002.ts
LINE: 18
TYPE: Console Statement Left In
CODE: `console.log(`Stored current_balance: ${loan.current_balance}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-202601-002.ts
LINE: 37
TYPE: Console Statement Left In
CODE: `console.log(`\n--- JOURNAL LINES (All Accounts) ---`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-202601-002.ts
LINE: 38
TYPE: Console Statement Left In
CODE: `console.table(lines.map(l => ({`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-202601-002.ts
LINE: 62
TYPE: Console Statement Left In
CODE: `console.log(`\n--- ASSET BALANCE CALCULATION ---`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-202601-002.ts
LINE: 63
TYPE: Console Statement Left In
CODE: `console.table(assetDetails);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-202601-002.ts
LINE: 64
TYPE: Console Statement Left In
CODE: `console.log(`\nTOTAL CALCULATED ASSET BALANCE: ${assetBalance}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-bal-calc.ts
LINE: 12
TYPE: Console Statement Left In
CODE: `console.log(`--- Debugging getLoanOutstandingBalance("${loanNumber}") ---`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-bal-calc.ts
LINE: 40
TYPE: Console Statement Left In
CODE: `console.log(`Found ${lines.length} lines.`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-bal-calc.ts
LINE: 45
TYPE: Console Statement Left In
CODE: `console.log(`  [${line.ledgerAccount.code}] DR: ${line.debitAmount} | CR: ${line...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-bal-calc.ts
LINE: 48
TYPE: Console Statement Left In
CODE: `console.log(`Final Calculated Balance: ${balance}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-calc.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log(`Fetching portfolio for member: ${memberId}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-calc.ts
LINE: 11
TYPE: Console Statement Left In
CODE: `console.log(`Found ${portfolio.length} loans.`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-calc.ts
LINE: 14
TYPE: Console Statement Left In
CODE: `console.log(`\n--- Loan ${loan.loanNumber} ---`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-calc.ts
LINE: 15
TYPE: Console Statement Left In
CODE: `console.log(`Balance: ${loan.totalLoanBalance}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-calc.ts
LINE: 16
TYPE: Console Statement Left In
CODE: `console.log(`Arrears: ${loan.arrears}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-calc.ts
LINE: 17
TYPE: Console Statement Left In
CODE: `console.log(`Expected: ${loan.expectedAmount}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-calc.ts
LINE: 37
TYPE: Console Statement Left In
CODE: `console.log(`JSON Schedule Length: ${schedJSON.length}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-calc.ts
LINE: 38
TYPE: Console Statement Left In
CODE: `console.log(`Pql Relation Length: ${schedRelation.length}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-calc.ts
LINE: 43
TYPE: Console Statement Left In
CODE: `console.log('Sample Item:', JSON.stringify(sched[0], null, 2));`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-calc.ts
LINE: 45
TYPE: Console Statement Left In
CODE: `console.log('Schedule is EMPTY (Both JSON and Relation).');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-calc.ts
LINE: 56
TYPE: Console Statement Left In
CODE: `console.log(`Overdue Items Count (Calc): ${overdueItems.length}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-calc.ts
LINE: 62
TYPE: Console Statement Left In
CODE: `console.log(`Current Installment Found: ${!!currentInstallment}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-calc.ts
LINE: 64
TYPE: Console Statement Left In
CODE: `console.log('Current Installment Date:', currentInstallment.dueDate || currentIn...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 9
TYPE: Console Statement Left In
CODE: `console.log('🔍 Investigating Loan LN013 Interest Issue\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 10
TYPE: Console Statement Left In
CODE: `console.log('='.repeat(60))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 26
TYPE: Console Statement Left In
CODE: `console.log('❌ Loan LN013 not found')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 30
TYPE: Console Statement Left In
CODE: `console.log('\n📋 LOAN DETAILS')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 31
TYPE: Console Statement Left In
CODE: `console.log('='.repeat(60))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 32
TYPE: Console Statement Left In
CODE: `console.log(`Loan Number: ${loan.loanApplicationNumber}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 33
TYPE: Console Statement Left In
CODE: `console.log(`Product: ${loan.loanProduct?.name || 'N/A'}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 34
TYPE: Console Statement Left In
CODE: `console.log(`Principal: KES ${Number(loan.amount).toLocaleString()}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 35
TYPE: Console Statement Left In
CODE: `console.log(`Interest Rate: ${Number(loan.interestRate)}%`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 36
TYPE: Console Statement Left In
CODE: `console.log(`Duration: ${loan.durationMonths} months`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 37
TYPE: Console Statement Left In
CODE: `console.log(`Interest Type: ${loan.interestType}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 38
TYPE: Console Statement Left In
CODE: `console.log(`Disbursement Date: ${loan.disbursementDate}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 39
TYPE: Console Statement Left In
CODE: `console.log(`Status: ${loan.status}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 41
TYPE: Console Statement Left In
CODE: `console.log('\n📊 LOAN PRODUCT DETAILS')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 42
TYPE: Console Statement Left In
CODE: `console.log('='.repeat(60))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 44
TYPE: Console Statement Left In
CODE: `console.log(`Product Name: ${loan.loanProduct.name}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 45
TYPE: Console Statement Left In
CODE: `console.log(`Product Interest Rate: ${Number(loan.loanProduct.interestRate)}%`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 46
TYPE: Console Statement Left In
CODE: `console.log(`Product Interest Type: ${loan.loanProduct.interestType}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 47
TYPE: Console Statement Left In
CODE: `console.log(`Product Max Duration: ${loan.loanProduct.maxDuration} months`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 50
TYPE: Console Statement Left In
CODE: `console.log('\n🔢 REPAYMENT INSTALLMENTS FROM DATABASE')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 51
TYPE: Console Statement Left In
CODE: `console.log('='.repeat(60))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 53
TYPE: Console Statement Left In
CODE: `console.log(`Total Installments: ${loan.repaymentInstallments.length}\n`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 57
TYPE: Console Statement Left In
CODE: `console.log(`Month ${inst.installmentNumber}:`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 58
TYPE: Console Statement Left In
CODE: `console.log(`  Due Date: ${inst.dueDate.toISOString().split('T')[0]}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 59
TYPE: Console Statement Left In
CODE: `console.log(`  Principal Due: KES ${Number(inst.principalDue).toLocaleString()}`...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 60
TYPE: Console Statement Left In
CODE: `console.log(`  Interest Due: KES ${Number(inst.interestDue).toLocaleString()}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 61
TYPE: Console Statement Left In
CODE: `console.log(`  Total: KES ${(Number(inst.principalDue) + Number(inst.interestDue...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 62
TYPE: Console Statement Left In
CODE: `console.log('')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 64
TYPE: Console Statement Left In
CODE: `console.log('  ...\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 72
TYPE: Console Statement Left In
CODE: `console.log('TOTALS:')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 73
TYPE: Console Statement Left In
CODE: `console.log(`  Total Principal: KES ${totalPrincipal.toLocaleString()}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 74
TYPE: Console Statement Left In
CODE: `console.log(`  Total Interest: KES ${totalInterest.toLocaleString()}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 75
TYPE: Console Statement Left In
CODE: `console.log(`  Total Payable: KES ${(totalPrincipal + totalInterest).toLocaleStr...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 77
TYPE: Console Statement Left In
CODE: `console.log('⚠️  No repayment installments found in database')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 80
TYPE: Console Statement Left In
CODE: `console.log('\n🧮 RECALCULATED SCHEDULE (Using Loan Calculator)')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 81
TYPE: Console Statement Left In
CODE: `console.log('='.repeat(60))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 91
TYPE: Console Statement Left In
CODE: `console.log(`Monthly Payment: KES ${recalculated.summary.monthlyPaymentAmount.to...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 92
TYPE: Console Statement Left In
CODE: `console.log(`Total Interest: KES ${recalculated.summary.totalInterest.toLocaleSt...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 93
TYPE: Console Statement Left In
CODE: `console.log(`Total Payable: KES ${recalculated.summary.totalPayable.toLocaleStri...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 95
TYPE: Console Statement Left In
CODE: `console.log('First 3 months:')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 97
TYPE: Console Statement Left In
CODE: `console.log(`Month ${item.monthNo}:`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 98
TYPE: Console Statement Left In
CODE: `console.log(`  Principal: KES ${item.principalPayment.toLocaleString()}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 99
TYPE: Console Statement Left In
CODE: `console.log(`  Interest: KES ${item.interestPayment.toLocaleString()}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 100
TYPE: Console Statement Left In
CODE: `console.log(`  Total: KES ${item.totalPayment.toLocaleString()}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 101
TYPE: Console Statement Left In
CODE: `console.log('')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 104
TYPE: Console Statement Left In
CODE: `console.log('\n🔍 DIAGNOSIS')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 105
TYPE: Console Statement Left In
CODE: `console.log('='.repeat(60))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 108
TYPE: Console Statement Left In
CODE: `console.log('❌ ISSUE FOUND: Loan interest rate is 0%')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 109
TYPE: Console Statement Left In
CODE: `console.log('   This is why the schedule shows zero interest.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 110
TYPE: Console Statement Left In
CODE: `console.log('   The loan product has an interest rate, but the loan itself does ...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 112
TYPE: Console Statement Left In
CODE: `console.log('❌ ISSUE FOUND: Loan has interest rate but installments show zero in...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 113
TYPE: Console Statement Left In
CODE: `console.log('   The schedule needs to be regenerated.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 115
TYPE: Console Statement Left In
CODE: `console.log('⚠️  Calculator also returns zero interest')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 116
TYPE: Console Statement Left In
CODE: `console.log('   Check if interest type or rate is correct.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 118
TYPE: Console Statement Left In
CODE: `console.log('✅ Loan data appears correct')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 119
TYPE: Console Statement Left In
CODE: `console.log('   Interest should be showing in the schedule.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 122
TYPE: Console Statement Left In
CODE: `console.log('\n' + '='.repeat(60))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-loan-ln013.ts
LINE: 127
TYPE: Console Statement Left In
CODE: `console.log('\n✅ Debug complete')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-member-cache.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('Checking for Members with Negative Cache...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-member-cache.ts
LINE: 20
TYPE: Console Statement Left In
CODE: `console.log(`Found ${members.length} members with negative shareContributions.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-member-cache.ts
LINE: 22
TYPE: Console Statement Left In
CODE: `console.table(members)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-member-cache.ts
LINE: 35
TYPE: Console Statement Left In
CODE: `console.log('No Contribution Mapping found.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-member-cache.ts
LINE: 39
TYPE: Console Statement Left In
CODE: `console.log('\nVerifying Cache vs Ledger:')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-member-cache.ts
LINE: 52
TYPE: Console Statement Left In
CODE: `console.log(`Member: ${m.name}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-member-cache.ts
LINE: 53
TYPE: Console Statement Left In
CODE: `console.log(`  Cache: ${m.shareContributions}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-member-cache.ts
LINE: 54
TYPE: Console Statement Left In
CODE: `console.log(`  Ledger: ${ledgerBal}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-member-cache.ts
LINE: 57
TYPE: Console Statement Left In
CODE: `console.log('  -> MISMATCH DETECTED')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-member-filter.ts
LINE: 16
TYPE: Console Statement Left In
CODE: `console.log('Member Status Distribution:', statusCounts)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-member-filter.ts
LINE: 17
TYPE: Console Statement Left In
CODE: `console.log('Total Members:', members.length)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-member-filter.ts
LINE: 26
TYPE: Console Statement Left In
CODE: `console.log('Total Users:', users.length)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-member-filter.ts
LINE: 27
TYPE: Console Statement Left In
CODE: `console.log('Users with memberId:', users.filter(u => u.memberId).length)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-member-stats.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log("Searching for admin@capitalcrew.com...")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-member-stats.ts
LINE: 30
TYPE: Console Statement Left In
CODE: `console.log("Member not found, listing all members:")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-member-stats.ts
LINE: 32
TYPE: Console Statement Left In
CODE: `members.forEach(m => console.log(`- ${m.name} (${m.id})`))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-member-stats.ts
LINE: 36
TYPE: Console Statement Left In
CODE: `console.log(`Found Target Member: ${member.name} (${member.id})`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-member-stats.ts
LINE: 41
TYPE: Console Statement Left In
CODE: `console.log("--- Fetching Stats ---")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-member-stats.ts
LINE: 49
TYPE: Console Statement Left In
CODE: `console.log("Stats Result:")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-member-stats.ts
LINE: 50
TYPE: Console Statement Left In
CODE: `console.log(JSON.stringify(result.stats, null, 2))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-member-stats.ts
LINE: 53
TYPE: Console Statement Left In
CODE: `console.log(`\nChecking Specific Fields:`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-member-stats.ts
LINE: 54
TYPE: Console Statement Left In
CODE: `console.log(`- Member Savings (Wallet): ${result.stats.memberSavings}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-member-stats.ts
LINE: 55
TYPE: Console Statement Left In
CODE: `console.log(`- Contributions (Asset 1200): ${result.stats.contributions}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-member-stats.ts
LINE: 56
TYPE: Console Statement Left In
CODE: `console.log(`- Original Wallet field: ${result.stats.currentAccountBalance}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-negative-snapshots.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('Checking for Stale Negative Data...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-negative-snapshots.ts
LINE: 23
TYPE: Console Statement Left In
CODE: `console.log(`Found ${loans.length} loans with negative member shares snapshot.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-negative-snapshots.ts
LINE: 25
TYPE: Console Statement Left In
CODE: `console.table(loans)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-negative-snapshots.ts
LINE: 33
TYPE: Console Statement Left In
CODE: `console.log('Sample Member:', member)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-passwords.ts
LINE: 12
TYPE: Console Statement Left In
CODE: `console.log('🔍 Password Authentication Diagnostic Tool')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-passwords.ts
LINE: 13
TYPE: Console Statement Left In
CODE: `console.log('='.repeat(50))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-passwords.ts
LINE: 28
TYPE: Console Statement Left In
CODE: `console.log(`\n📋 Found ${users.length} users in database:\n`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-passwords.ts
LINE: 31
TYPE: Console Statement Left In
CODE: `console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-passwords.ts
LINE: 32
TYPE: Console Statement Left In
CODE: `console.log(`📧 Email: ${user.email}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-passwords.ts
LINE: 33
TYPE: Console Statement Left In
CODE: `console.log(`👤 Name: ${user.name}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-passwords.ts
LINE: 34
TYPE: Console Statement Left In
CODE: `console.log(`🔒 Hash Length: ${user.passwordHash?.length || 0} chars`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-passwords.ts
LINE: 35
TYPE: Console Statement Left In
CODE: `console.log(`🔐 Hash Preview: ${user.passwordHash?.substring(0, 20)}...`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-passwords.ts
LINE: 39
TYPE: Console Statement Left In
CODE: `console.log(`✅ Valid bcrypt format: ${isValidBcryptFormat}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-passwords.ts
LINE: 43
TYPE: Console Statement Left In
CODE: `console.log(`⚠️  LOCKED OUT until: ${user.lockoutUntil}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-passwords.ts
LINE: 46
TYPE: Console Statement Left In
CODE: `console.log(`⚠️  Failed attempts: ${user.failedLoginAttempts}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-passwords.ts
LINE: 51
TYPE: Console Statement Left In
CODE: `console.log(`\n🧪 Testing passwords:`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-passwords.ts
LINE: 57
TYPE: Console Statement Left In
CODE: `console.log(`   ✅ "${testPwd}" MATCHES!`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-passwords.ts
LINE: 60
TYPE: Console Statement Left In
CODE: `console.log(`   ❌ Error testing "${testPwd}": ${err}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-passwords.ts
LINE: 63
TYPE: Console Statement Left In
CODE: `console.log('')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-passwords.ts
LINE: 67
TYPE: Console Statement Left In
CODE: `console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-passwords.ts
LINE: 68
TYPE: Console Statement Left In
CODE: `console.log('🔧 Verifying bcrypt library functionality:')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-passwords.ts
LINE: 74
TYPE: Console Statement Left In
CODE: `console.log(`   Hash created: ${hash.substring(0, 20)}...`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-passwords.ts
LINE: 75
TYPE: Console Statement Left In
CODE: `console.log(`   Verification: ${verification ? '✅ Working' : '❌ BROKEN'}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-passwords.ts
LINE: 78
TYPE: Console Statement Left In
CODE: `console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-passwords.ts
LINE: 79
TYPE: Console Statement Left In
CODE: `console.log('🔑 Fresh hash for "Admin123!" (if you need to reset):')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-passwords.ts
LINE: 81
TYPE: Console Statement Left In
CODE: `console.log(`   ${freshAdminHash}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-passwords.ts
LINE: 83
TYPE: Console Statement Left In
CODE: `console.log('\n✅ Diagnostic complete!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-reversal-link.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log(`Searching for transaction with ID containing: ${searchTerm}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-reversal-link.ts
LINE: 20
TYPE: Console Statement Left In
CODE: `console.log('--- Found Wallet Transaction ---')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-reversal-link.ts
LINE: 21
TYPE: Console Statement Left In
CODE: `console.log(walletTx)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-reversal-link.ts
LINE: 24
TYPE: Console Statement Left In
CODE: `console.log(`Linked to Loan: ${walletTx.relatedLoanId}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-reversal-link.ts
LINE: 34
TYPE: Console Statement Left In
CODE: `console.log('--- Corresponding Loan Transaction Candidates ---')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-reversal-link.ts
LINE: 40
TYPE: Console Statement Left In
CODE: `console.table(candidates.map(c => ({`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-reversal-link.ts
LINE: 62
TYPE: Console Statement Left In
CODE: `console.log('--- Found Loan Transaction ---')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-reversal-link.ts
LINE: 63
TYPE: Console Statement Left In
CODE: `console.log(loanTx)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-reversal-link.ts
LINE: 67
TYPE: Console Statement Left In
CODE: `console.log('Transaction not found in Wallet or Loan tables.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-search.ts
LINE: 8
TYPE: Console Statement Left In
CODE: `console.log(`--- Debugging searchLoans("${ln}") ---`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-search.ts
LINE: 10
TYPE: Console Statement Left In
CODE: `console.log('Search Results:', JSON.stringify(results, null, 2));`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-search.ts
LINE: 12
TYPE: Console Statement Left In
CODE: `console.log('\n--- Raw DB Check (Loan Table) ---');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-search.ts
LINE: 22
TYPE: Console Statement Left In
CODE: `console.log('Raw DB Loans:', JSON.stringify(loans, null, 2));`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-sysadmin-entries.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('Inspecting Detailed entries for System Admin...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-sysadmin-entries.ts
LINE: 14
TYPE: Console Statement Left In
CODE: `console.log(`Member: ${sysAdmin.name} (${sysAdmin.id})`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-sysadmin-entries.ts
LINE: 34
TYPE: Console Statement Left In
CODE: `console.log(`Found ${entries.length} entries.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-sysadmin-entries.ts
LINE: 36
TYPE: Console Statement Left In
CODE: `console.log(`[${e.ledgerTransaction.transactionDate.toISOString()}] ${e.descript...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-sysadmin-entries.ts
LINE: 37
TYPE: Console Statement Left In
CODE: `console.log(`   DR: ${e.debitAmount} | CR: ${e.creditAmount}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/debug-sysadmin-entries.ts
LINE: 38
TYPE: Console Statement Left In
CODE: `console.log(`   RefType: ${e.ledgerTransaction.referenceType}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/decouple-offset.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log(`--- Decoupling Offset for ${loanNumber} ---`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/decouple-offset.ts
LINE: 23
TYPE: Console Statement Left In
CODE: `console.log(`Found ${entries.length} candidate entries.`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/decouple-offset.ts
LINE: 34
TYPE: Console Statement Left In
CODE: `console.log(`Processing group from Transaction ${oldTxId} (${oldTx.description})...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/decouple-offset.ts
LINE: 53
TYPE: Console Statement Left In
CODE: `console.log(`  Moving entry ${e.id} (${e.description}) to new transaction ${newT...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/deep-inspect-ln008.ts
LINE: 9
TYPE: Console Statement Left In
CODE: `console.log('--- LN008 Raw Data ---');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/deep-inspect-ln008.ts
LINE: 10
TYPE: Console Statement Left In
CODE: `console.log(JSON.stringify(ln008, null, 2));`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/deep-inspect-ln008.ts
LINE: 12
TYPE: Console Statement Left In
CODE: `console.log('\n--- Account Types Check ---');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/deep-inspect-ln008.ts
LINE: 16
TYPE: Console Statement Left In
CODE: `console.log(JSON.stringify(accs, null, 2));`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/deep-inspect-ln008.ts
LINE: 18
TYPE: Console Statement Left In
CODE: `console.log('\n--- All Ledger Entries for LN008 (Description matches) ---');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/deep-inspect-ln008.ts
LINE: 29
TYPE: Console Statement Left In
CODE: `console.log(`[${e.ledgerTransaction.transactionDate.toISOString().split('T')[0]}...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/deep-repair.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log('--- STARTING DEEP REPAIR ---');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/deep-repair.ts
LINE: 20
TYPE: Console Statement Left In
CODE: `console.log(`Found ${txs.length} ledger transactions to relink to LN005.`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/deep-repair.ts
LINE: 27
TYPE: Console Statement Left In
CODE: `console.log(`  Relinked Tx ${tx.id} (${tx.description}) to ${ln005.loanApplicati...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/deep-repair.ts
LINE: 40
TYPE: Console Statement Left In
CODE: `console.log(`Found ${subTxs.length} sub-ledger repayments.`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/deep-repair.ts
LINE: 53
TYPE: Console Statement Left In
CODE: `console.log(`  Adjusted sub-ledger amount to 10019.35`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/deep-repair.ts
LINE: 64
TYPE: Console Statement Left In
CODE: `console.log(`New Table Balance for LN005: ${newBalance}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/deep-repair.ts
LINE: 66
TYPE: Console Statement Left In
CODE: `console.log('--- REPAIR COMPLETE ---');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/deep-sync-loans.ts
LINE: 8
TYPE: Console Statement Left In
CODE: `console.log('--- STARTING DEEP LOAN SYNC ---');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/deep-sync-loans.ts
LINE: 15
TYPE: Console Statement Left In
CODE: `console.log(`Syncing ${loan.loanApplicationNumber} (${loan.id})...`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/deep-sync-loans.ts
LINE: 19
TYPE: Console Statement Left In
CODE: `console.log(`  Generating missing installments...`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/deep-sync-loans.ts
LINE: 32
TYPE: Console Statement Left In
CODE: `console.log(`  Calculated Balance: ${totalOutstanding}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/deep-sync-loans.ts
LINE: 48
TYPE: Console Statement Left In
CODE: `console.log('--- DEEP SYNC COMPLETE ---');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/delete_unused_ledgers.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('Attempting to delete unused ledgers...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/delete_unused_ledgers.ts
LINE: 20
TYPE: Console Statement Left In
CODE: `console.log(`Found ${candidates.length} candidates for deletion.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/delete_unused_ledgers.ts
LINE: 31
TYPE: Console Statement Left In
CODE: `console.log(`✅ Deleted ${acc.name} (${acc.code})`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/delete_unused_ledgers.ts
LINE: 35
TYPE: Console Statement Left In
CODE: `console.log(`⚠️  Skipped ${acc.name} (${acc.code}) - Used in transactions or set...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/delete_unused_ledgers.ts
LINE: 40
TYPE: Console Statement Left In
CODE: `console.log('\nSummary:')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/delete_unused_ledgers.ts
LINE: 41
TYPE: Console Statement Left In
CODE: `console.log(`Deleted: ${deletedCount}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/delete_unused_ledgers.ts
LINE: 42
TYPE: Console Statement Left In
CODE: `console.log(`Kept (Archived): ${skippedCount}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/delete_unused_ledgers.ts
LINE: 43
TYPE: Console Statement Left In
CODE: `console.log('Core 5 Accounts are untouched.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log('=== APPROVALS DIAGNOSIS ===\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 10
TYPE: Console Statement Left In
CODE: `console.log(`📊 Total Approval Requests: ${totalRequests}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 17
TYPE: Console Statement Left In
CODE: `console.log(`⏳ Pending Approval Requests: ${pendingRequests.length}\n`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 20
TYPE: Console Statement Left In
CODE: `console.log('📋 Pending Requests Details:\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 22
TYPE: Console Statement Left In
CODE: `console.log(`${index + 1}. ${req.type} - ${req.requesterName}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 23
TYPE: Console Statement Left In
CODE: `console.log(`   ID: ${req.id}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 24
TYPE: Console Statement Left In
CODE: `console.log(`   Reference: ${req.referenceTable} (${req.referenceId})`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 25
TYPE: Console Statement Left In
CODE: `console.log(`   Amount: ${req.amount ? `KES ${req.amount}` : 'N/A'}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 26
TYPE: Console Statement Left In
CODE: `console.log(`   Required Permission: ${req.requiredPermission}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 27
TYPE: Console Statement Left In
CODE: `console.log(`   Description: ${req.description}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 28
TYPE: Console Statement Left In
CODE: `console.log(`   Created: ${req.createdAt}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 29
TYPE: Console Statement Left In
CODE: `console.log('')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 49
TYPE: Console Statement Left In
CODE: `console.log(`🏦 Loans with PENDING_APPROVAL status: ${pendingLoans.length}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 52
TYPE: Console Statement Left In
CODE: `console.log('\n📋 Pending Loans:\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 54
TYPE: Console Statement Left In
CODE: `console.log(`${index + 1}. ${loan.loanApplicationNumber} - ${loan.member.name}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 55
TYPE: Console Statement Left In
CODE: `console.log(`   Amount: KES ${loan.amount}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 56
TYPE: Console Statement Left In
CODE: `console.log(`   Status: ${loan.status}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 57
TYPE: Console Statement Left In
CODE: `console.log('')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 62
TYPE: Console Statement Left In
CODE: `console.log('\n🔍 Checking if ApprovalRequests exist for pending loans...\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 73
TYPE: Console Statement Left In
CODE: `console.log(`✅ ${loan.loanApplicationNumber} - Has approval request (${approvalR...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 75
TYPE: Console Statement Left In
CODE: `console.log(`❌ ${loan.loanApplicationNumber} - MISSING approval request!`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 76
TYPE: Console Statement Left In
CODE: `console.log(`   → Need to create ApprovalRequest for loan ID: ${loan.id}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 91
TYPE: Console Statement Left In
CODE: `console.log(`\n👥 Members with PENDING_APPROVAL status: ${pendingMembers.length}...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 94
TYPE: Console Statement Left In
CODE: `console.log('\n📋 Pending Members:\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 96
TYPE: Console Statement Left In
CODE: `console.log(`${index + 1}. ${member.name} (${member.memberNumber})`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 97
TYPE: Console Statement Left In
CODE: `console.log(`   Email: ${member.email}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 98
TYPE: Console Statement Left In
CODE: `console.log(`   Status: ${member.status}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 99
TYPE: Console Statement Left In
CODE: `console.log('')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 103
TYPE: Console Statement Left In
CODE: `console.log('🔍 Checking if ApprovalRequests exist for pending members...\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 114
TYPE: Console Statement Left In
CODE: `console.log(`✅ ${member.name} - Has approval request (${approvalRequest.id})`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 116
TYPE: Console Statement Left In
CODE: `console.log(`❌ ${member.name} - MISSING approval request!`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 117
TYPE: Console Statement Left In
CODE: `console.log(`   → Need to create ApprovalRequest for member ID: ${member.id}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 123
TYPE: Console Statement Left In
CODE: `console.log('\n=== SUMMARY ===')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 124
TYPE: Console Statement Left In
CODE: `console.log(`Total ApprovalRequests in DB: ${totalRequests}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 125
TYPE: Console Statement Left In
CODE: `console.log(`Pending ApprovalRequests: ${pendingRequests.length}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 126
TYPE: Console Statement Left In
CODE: `console.log(`Loans awaiting approval: ${pendingLoans.length}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 127
TYPE: Console Statement Left In
CODE: `console.log(`Members awaiting approval: ${pendingMembers.length}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 130
TYPE: Console Statement Left In
CODE: `console.log('\n⚠️  ISSUE DETECTED:')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 131
TYPE: Console Statement Left In
CODE: `console.log('There are loans/members with PENDING_APPROVAL status,')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 132
TYPE: Console Statement Left In
CODE: `console.log('but no corresponding ApprovalRequest records exist!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-approvals.ts
LINE: 133
TYPE: Console Statement Left In
CODE: `console.log('\nThis means the approval workflow was not triggered properly.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-user-member-links.ts
LINE: 11
TYPE: Console Statement Left In
CODE: `console.log('=== User-Member Link Diagnosis ===\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-user-member-links.ts
LINE: 23
TYPE: Console Statement Left In
CODE: `console.log('All Users and Their Linked Members:\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-user-member-links.ts
LINE: 24
TYPE: Console Statement Left In
CODE: `console.log('┌──────────────────────────────────────────────────────────────────...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-user-member-links.ts
LINE: 25
TYPE: Console Statement Left In
CODE: `console.log('│ Email                    │ User Name          │ Member Name      ...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-user-member-links.ts
LINE: 26
TYPE: Console Statement Left In
CODE: `console.log('├──────────────────────────────────────────────────────────────────...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-user-member-links.ts
LINE: 34
TYPE: Console Statement Left In
CODE: `console.log(`│ ${email} │ ${userName} │ ${memberName} │ #${memberNum.padEnd(6)} ...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-user-member-links.ts
LINE: 36
TYPE: Console Statement Left In
CODE: `console.log('└──────────────────────────────────────────────────────────────────...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-user-member-links.ts
LINE: 43
TYPE: Console Statement Left In
CODE: `console.log('⚠️  WARNING: Multiple users linked to the same member profile!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-user-member-links.ts
LINE: 44
TYPE: Console Statement Left In
CODE: `console.log('Member IDs with duplicates:', [...new Set(duplicates)])`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-user-member-links.ts
LINE: 45
TYPE: Console Statement Left In
CODE: `console.log('')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-user-member-links.ts
LINE: 51
TYPE: Console Statement Left In
CODE: `console.log('⚠️  Users without member profiles:')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-user-member-links.ts
LINE: 53
TYPE: Console Statement Left In
CODE: `console.log(`   - ${u.email} (${u.name})`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-user-member-links.ts
LINE: 55
TYPE: Console Statement Left In
CODE: `console.log('')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-user-member-links.ts
LINE: 65
TYPE: Console Statement Left In
CODE: `console.log('\nAll Members in Database:\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-user-member-links.ts
LINE: 66
TYPE: Console Statement Left In
CODE: `console.log('┌────────────────────────────────────────────────┐')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-user-member-links.ts
LINE: 67
TYPE: Console Statement Left In
CODE: `console.log('│ Member #  │ Name                    │ Has User? │')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-user-member-links.ts
LINE: 68
TYPE: Console Statement Left In
CODE: `console.log('├────────────────────────────────────────────────┤')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-user-member-links.ts
LINE: 75
TYPE: Console Statement Left In
CODE: `console.log(`│ ${memberNum} │ ${name} │ ${hasUser.padEnd(9)} │`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-user-member-links.ts
LINE: 77
TYPE: Console Statement Left In
CODE: `console.log('└────────────────────────────────────────────────┘\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/diagnose-user-member-links.ts
LINE: 79
TYPE: Console Statement Left In
CODE: `console.log('=== Diagnosis Complete ===')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/end-of-month.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log("🚀 Starting End-of-Month Contribution Processing...")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/end-of-month.ts
LINE: 13
TYPE: Console Statement Left In
CODE: `console.log(`Config: Monthly Due: ${monthlyDue}, Penalty: ${penaltyAmount}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/end-of-month.ts
LINE: 20
TYPE: Console Statement Left In
CODE: `console.log(`Processing ${members.length} members...`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/end-of-month.ts
LINE: 52
TYPE: Console Statement Left In
CODE: `console.log(`Member ${member.memberNumber} (${member.name}): Shortfall ${shortfa...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/end-of-month.ts
LINE: 69
TYPE: Console Statement Left In
CODE: `console.log("✅ End-of-Month Processing Complete.")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/enforce_5_ledgers.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('Enforcing Strict 5 Ledger System...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/enforce_5_ledgers.ts
LINE: 27
TYPE: Console Statement Left In
CODE: `console.log(`Upserted ${acc.name} (${acc.code}) -> ${upserted.id}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/enforce_5_ledgers.ts
LINE: 80
TYPE: Console Statement Left In
CODE: `console.log(`Mapped ${type} -> ${code}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/enforce_5_ledgers.ts
LINE: 87
TYPE: Console Statement Left In
CODE: `console.log('Done.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/ensure-admin-wallet.js
LINE: 13
TYPE: Console Statement Left In
CODE: `console.log('❌ Admin member not found')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/ensure-admin-wallet.js
LINE: 17
TYPE: Console Statement Left In
CODE: `console.log('✅ Admin member found:', admin.name)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/ensure-admin-wallet.js
LINE: 20
TYPE: Console Statement Left In
CODE: `console.log('✅ Wallet already exists')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/ensure-admin-wallet.js
LINE: 21
TYPE: Console Statement Left In
CODE: `console.log('   Balance:', admin.wallet.balance)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/ensure-admin-wallet.js
LINE: 23
TYPE: Console Statement Left In
CODE: `console.log('⚠️  No wallet found - creating one...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/ensure-admin-wallet.js
LINE: 32
TYPE: Console Statement Left In
CODE: `console.log('✅ Wallet created successfully!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/ensure-admin-wallet.js
LINE: 33
TYPE: Console Statement Left In
CODE: `console.log('   Wallet ID:', wallet.id)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/ensure-admin-wallet.js
LINE: 34
TYPE: Console Statement Left In
CODE: `console.log('   Balance:', wallet.balance)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/final-reconcile.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log('--- FINAL RECONCILIATION ---');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/final-reconcile.ts
LINE: 21
TYPE: Console Statement Left In
CODE: `console.log('Fixing LN005: Adding 19.35 interest debt...');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/final-reconcile.ts
LINE: 54
TYPE: Console Statement Left In
CODE: `console.log('Syncing outstandingBalance fields...');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/final-reconcile.ts
LINE: 59
TYPE: Console Statement Left In
CODE: `console.log('--- RECONCILE COMPLETE ---');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/find-by-amount.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log(`--- Searching Ledger Entries for Amount: ${amount} ---`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/find-by-amount.ts
LINE: 18
TYPE: Console Statement Left In
CODE: `console.log(`ID: ${e.id} | Account: ${e.ledgerAccount.code} | DR: ${e.debitAmoun...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/find-orphan-entries.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log(`--- Searching all Ledger Entries for: ${loanNumber} ---`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/find-orphan-entries.ts
LINE: 21
TYPE: Console Statement Left In
CODE: `console.log(`ID: ${e.id.padEnd(25)} | Account: ${e.ledgerAccount.code} (${e.ledg...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix_decimal_data.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('🚀 Starting Data Correction: Cents -> Decimals');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix_decimal_data.ts
LINE: 8
TYPE: Console Statement Left In
CODE: `console.log('This script divides accounting figures by 100 to fix the magnitude ...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix_decimal_data.ts
LINE: 12
TYPE: Console Statement Left In
CODE: `console.log('... Updating LedgerEntry (debitAmount, creditAmount)');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix_decimal_data.ts
LINE: 18
TYPE: Console Statement Left In
CODE: `console.log(`✅ Updated ${entriesUpdate} ledger entries.`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix_decimal_data.ts
LINE: 21
TYPE: Console Statement Left In
CODE: `console.log('... Updating LedgerTransaction (totalAmount)');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix_decimal_data.ts
LINE: 26
TYPE: Console Statement Left In
CODE: `console.log(`✅ Updated ${txUpdate} ledger transactions.`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix_decimal_data.ts
LINE: 29
TYPE: Console Statement Left In
CODE: `console.log('... Updating LedgerAccount (balance)');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix_decimal_data.ts
LINE: 34
TYPE: Console Statement Left In
CODE: `console.log(`✅ Updated ${accUpdate} ledger accounts.`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix_decimal_data.ts
LINE: 36
TYPE: Console Statement Left In
CODE: `console.log('\n✨ Correction Complete! All values have been divided by 100.');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix_ledger_magnitude.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log('🚀 Re-running Magnitude Correction (Raw SQL Mode)...');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix_ledger_magnitude.ts
LINE: 11
TYPE: Console Statement Left In
CODE: `console.log('... Updating LedgerEntry (debitAmount/creditAmount) where >= 10000'...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix_ledger_magnitude.ts
LINE: 25
TYPE: Console Statement Left In
CODE: `console.log(`✅ Updated Debits: ${resDebit}, Credits: ${resCredit}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix_ledger_magnitude.ts
LINE: 28
TYPE: Console Statement Left In
CODE: `console.log('... Updating LedgerTransaction (totalAmount) where >= 10000');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix_ledger_magnitude.ts
LINE: 34
TYPE: Console Statement Left In
CODE: `console.log(`✅ Updated Transactions: ${resTx}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix_ledger_magnitude.ts
LINE: 39
TYPE: Console Statement Left In
CODE: `console.log('🔄 Recalculating ALL LedgerAccount Balances...');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix_ledger_magnitude.ts
LINE: 69
TYPE: Console Statement Left In
CODE: `console.log(`Updated ${acc.code}: ${newBalance}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix_ledger_magnitude.ts
LINE: 72
TYPE: Console Statement Left In
CODE: `console.log('✨ All corrections complete.');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix_receivables.js
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log("Fixing 'RECIEVABLES' account...")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix_receivables.js
LINE: 20
TYPE: Console Statement Left In
CODE: `console.log("✅ Updated Account 1200:", acc)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-account-type.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('--- FIX ACCOUNT TYPE ---')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-account-type.ts
LINE: 17
TYPE: Console Statement Left In
CODE: `console.log(`Updating Account ${mapping.account.code} (${mapping.account.id})`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-account-type.ts
LINE: 18
TYPE: Console Statement Left In
CODE: `console.log(`Current Type: ${mapping.account.type}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-account-type.ts
LINE: 26
TYPE: Console Statement Left In
CODE: `console.log('Updated to EQUITY')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-account-type.ts
LINE: 30
TYPE: Console Statement Left In
CODE: `console.log(`New Type: ${fresh?.type}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-accounting-mappings.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log('--- STARTING ACCOUNTING FIXUP ---');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-accounting-mappings.ts
LINE: 9
TYPE: Console Statement Left In
CODE: `console.log('Step 1: Updating account 4100 type to REVENUE...');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-accounting-mappings.ts
LINE: 16
TYPE: Console Statement Left In
CODE: `console.log('Step 2: Updating EVENT_LOAN_DISBURSEMENT mapping to 1310 (Loan Port...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-accounting-mappings.ts
LINE: 28
TYPE: Console Statement Left In
CODE: `console.log('Step 3: Migrating ledger entries for LN005...');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-accounting-mappings.ts
LINE: 56
TYPE: Console Statement Left In
CODE: `console.log(`Found ${entriesToFix.length} entries to move to Portfolio.`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-accounting-mappings.ts
LINE: 65
TYPE: Console Statement Left In
CODE: `console.log('--- FIXUP COMPLETE ---');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-bad-links.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log('🔍 Scanning for Invalid LoanTransaction -> LedgerTransaction links....`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-bad-links.ts
LINE: 28
TYPE: Console Statement Left In
CODE: `console.log(`[ORPHAN LINK] TX ${tx.id} points to non-existent LedgerTx ${tx.refe...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-bad-links.ts
LINE: 37
TYPE: Console Statement Left In
CODE: `console.log(`[MISMATCH DETECTED] TX ${tx.id} (${tx.type}) -> LedgerTx ${ledgerTx...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-bad-links.ts
LINE: 40
TYPE: Console Statement Left In
CODE: `console.log(`   -> Correcting LoanTransaction Type to DISBURSEMENT`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-bad-links.ts
LINE: 50
TYPE: Console Statement Left In
CODE: `console.log(`   -> DELETING Phantom Repayment LoanTransaction`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-bad-links.ts
LINE: 60
TYPE: Console Statement Left In
CODE: `console.log(`\n✅ Scan Complete.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-bad-links.ts
LINE: 61
TYPE: Console Statement Left In
CODE: `console.log(`   Found Bad Links: ${badLinks}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-bad-links.ts
LINE: 62
TYPE: Console Statement Left In
CODE: `console.log(`   Fixed (Type Update): ${updates}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-bad-links.ts
LINE: 63
TYPE: Console Statement Left In
CODE: `console.log(`   Fixed (Deleted): ${deletions}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-contributions-type.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('Fixing Contributions Account Type...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-contributions-type.ts
LINE: 19
TYPE: Console Statement Left In
CODE: `console.log(`Current Type: ${account.type}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-contributions-type.ts
LINE: 22
TYPE: Console Statement Left In
CODE: `console.log('Updating to EQUITY...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-contributions-type.ts
LINE: 30
TYPE: Console Statement Left In
CODE: `console.log('✅ Updated Account 1200 to EQUITY.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-contributions-type.ts
LINE: 32
TYPE: Console Statement Left In
CODE: `console.log('Account is already correct (not ASSET).')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-contributions-type.ts
LINE: 37
TYPE: Console Statement Left In
CODE: `console.log('New Type:', updated?.type)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-dupes.ts
LINE: 11
TYPE: Console Statement Left In
CODE: `console.log(`Deleting duplicate transaction ${tx.id}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-dupes.ts
LINE: 14
TYPE: Console Statement Left In
CODE: `console.log('Duplicate transaction not found');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-dupes.ts
LINE: 22
TYPE: Console Statement Left In
CODE: `console.log('LN005 Re-synced');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-gl-accounts.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('🔧 Fixing GL Account Definitions...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-gl-accounts.ts
LINE: 43
TYPE: Console Statement Left In
CODE: `console.log(`Processing ${account.code}...`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-gl-accounts.ts
LINE: 60
TYPE: Console Statement Left In
CODE: `console.log(`✓ Updated ${result.code}: ${result.name}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-gl-accounts.ts
LINE: 64
TYPE: Console Statement Left In
CODE: `console.log('\n🔍 Verification Table:')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-gl-accounts.ts
LINE: 70
TYPE: Console Statement Left In
CODE: `console.table(verified)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-gl-accounts.ts
LINE: 72
TYPE: Console Statement Left In
CODE: `console.log('✅ GL Accounts fixed successfully!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-inconsistent-reversals.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log('--- Repair Script: Syncing Wallet Reversals to Loan ---')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-inconsistent-reversals.ts
LINE: 19
TYPE: Console Statement Left In
CODE: `console.log(`Found ${reversedWalletTxs.length} reversed wallet transactions link...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-inconsistent-reversals.ts
LINE: 38
TYPE: Console Statement Left In
CODE: `console.log(`[FIX] Found Inconsistent State!`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-inconsistent-reversals.ts
LINE: 39
TYPE: Console Statement Left In
CODE: `console.log(`- Wallet Tx: ${walletTx.id} (Reversed: true)`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-inconsistent-reversals.ts
LINE: 40
TYPE: Console Statement Left In
CODE: `console.log(`- Loan Tx:   ${loanTx.id} (Reversed: false)`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-inconsistent-reversals.ts
LINE: 78
TYPE: Console Statement Left In
CODE: `console.log(`[SUCCESS] Fixed Loan Tx ${loanTx.id}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-inconsistent-reversals.ts
LINE: 81
TYPE: Console Statement Left In
CODE: `// console.log(`[OK] Wallet Tx ${walletTx.id} has no conflicting active loan tx....`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-inconsistent-reversals.ts
LINE: 85
TYPE: Console Statement Left In
CODE: `console.log(`--- Sync Complete ---`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-inconsistent-reversals.ts
LINE: 86
TYPE: Console Statement Left In
CODE: `console.log(`Fixed ${fixedCount} inconsistencies.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-installments.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log(`--- Fixing Installments for ${loanNumber} ---`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-installments.ts
LINE: 27
TYPE: Console Statement Left In
CODE: `console.log(`Generated ${scheduleData.length} installments.`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-installments.ts
LINE: 40
TYPE: Console Statement Left In
CODE: `console.log('Saved.');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-ledger-reversals.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('--- Scanning for Inconsistent Reversals (Ledger Reversed, Domain Ac...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-ledger-reversals.ts
LINE: 17
TYPE: Console Statement Left In
CODE: `console.log(`Found ${reversedJournals.length} reversed journals. Checking domain...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-ledger-reversals.ts
LINE: 30
TYPE: Console Statement Left In
CODE: `console.log(`[FIXING] Loan Tx ${loanTx.id} (Journal Reversed, Domain Active)`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-ledger-reversals.ts
LINE: 41
TYPE: Console Statement Left In
CODE: `console.log(`[FIXING] Wallet Tx ${walletTx.id} (Journal Reversed, Domain Active)...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-ledger-reversals.ts
LINE: 49
TYPE: Console Statement Left In
CODE: `console.log(`\nScan Complete. Fixed ${fixedCount} inconsistencies.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-ledger-reversals.ts
LINE: 86
TYPE: Console Statement Left In
CODE: `console.log(`  -> Fixed Loan Tx ${loanTx.id}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-ledger-reversals.ts
LINE: 116
TYPE: Console Statement Left In
CODE: `console.log(`  -> Fixed Wallet Tx ${walletTx.id}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 12
TYPE: Console Statement Left In
CODE: `console.log('🔧 Fixing Loan LN013\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 13
TYPE: Console Statement Left In
CODE: `console.log('='.repeat(60))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 26
TYPE: Console Statement Left In
CODE: `console.log('❌ Loan LN013 not found')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 30
TYPE: Console Statement Left In
CODE: `console.log('\n📋 CURRENT LOAN DATA')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 31
TYPE: Console Statement Left In
CODE: `console.log('='.repeat(60))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 32
TYPE: Console Statement Left In
CODE: `console.log(`Loan Number: ${loan.loanApplicationNumber}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 33
TYPE: Console Statement Left In
CODE: `console.log(`Principal: KES ${Number(loan.amount).toLocaleString()}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 34
TYPE: Console Statement Left In
CODE: `console.log(`Interest Rate: ${loan.interestRate ? Number(loan.interestRate) : 0}...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 35
TYPE: Console Statement Left In
CODE: `console.log(`Installments (Duration): ${loan.installments} months`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 38
TYPE: Console Statement Left In
CODE: `console.log('\n❌ Loan product not found. Cannot fix.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 42
TYPE: Console Statement Left In
CODE: `console.log('\n📊 LOAN PRODUCT DATA')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 43
TYPE: Console Statement Left In
CODE: `console.log('='.repeat(60))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 44
TYPE: Console Statement Left In
CODE: `console.log(`Product: ${loan.loanProduct.name}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 45
TYPE: Console Statement Left In
CODE: `console.log(`Product Interest Rate Per Period: ${Number(loan.loanProduct.interes...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 46
TYPE: Console Statement Left In
CODE: `console.log(`Product Interest Type: ${loan.loanProduct.interestType}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 47
TYPE: Console Statement Left In
CODE: `console.log(`Product Max Repayment Terms: ${loan.loanProduct.maxRepaymentTerms} ...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 57
TYPE: Console Statement Left In
CODE: `console.log('\n✅ CORRECTED VALUES')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 58
TYPE: Console Statement Left In
CODE: `console.log('='.repeat(60))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 59
TYPE: Console Statement Left In
CODE: `console.log(`Interest Rate: ${correctInterestRate}%`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 60
TYPE: Console Statement Left In
CODE: `console.log(`Interest Type: ${correctInterestType}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 61
TYPE: Console Statement Left In
CODE: `console.log(`Installments: ${correctInstallments} months`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 64
TYPE: Console Statement Left In
CODE: `console.log('\n🔄 Updating loan...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 72
TYPE: Console Statement Left In
CODE: `console.log('✅ Loan updated')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 75
TYPE: Console Statement Left In
CODE: `console.log('\n📅 Generating repayment schedule...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 98
TYPE: Console Statement Left In
CODE: `console.log(`✅ Created ${scheduleItems.length} repayment installments`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 101
TYPE: Console Statement Left In
CODE: `console.log('\n📊 SCHEDULE SUMMARY')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 102
TYPE: Console Statement Left In
CODE: `console.log('='.repeat(60))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 107
TYPE: Console Statement Left In
CODE: `console.log(`Total Principal: KES ${totalPrincipal.toLocaleString()}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 108
TYPE: Console Statement Left In
CODE: `console.log(`Total Interest: KES ${totalInterest.toLocaleString()}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 109
TYPE: Console Statement Left In
CODE: `console.log(`Total Payable: KES ${(totalPrincipal + totalInterest).toLocaleStrin...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 111
TYPE: Console Statement Left In
CODE: `console.log('\nFirst 3 installments:')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 113
TYPE: Console Statement Left In
CODE: `console.log(`  Month ${index + 1}: Principal KES ${Number(item.principalDue).toL...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 116
TYPE: Console Statement Left In
CODE: `console.log('\n' + '='.repeat(60))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 117
TYPE: Console Statement Left In
CODE: `console.log('✅ Loan LN013 fixed successfully!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 118
TYPE: Console Statement Left In
CODE: `console.log('   The loan now has the correct interest rate and repayment schedul...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 119
TYPE: Console Statement Left In
CODE: `console.log('='.repeat(60))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-loan-ln013.ts
LINE: 124
TYPE: Console Statement Left In
CODE: `console.log('\n✅ Fix complete')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-missing-reversals.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('--- Repair Script: Fixing Missing Reversal Entries ---')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-missing-reversals.ts
LINE: 23
TYPE: Console Statement Left In
CODE: `console.log(`Found ${reversedTxs.length} reversed transactions. Checking for con...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-missing-reversals.ts
LINE: 37
TYPE: Console Statement Left In
CODE: `console.log(`[FIX] Missing Reversal Entry for Tx ID: ${tx.id} (${tx.type} - ${tx...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-missing-reversals.ts
LINE: 57
TYPE: Console Statement Left In
CODE: `console.log(`[FIX] Replaying transactions for Loan: ${tx.loanId}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-missing-reversals.ts
LINE: 68
TYPE: Console Statement Left In
CODE: `console.log(`[SKIP] Tx ${tx.id} (${tx.amount}) already has reversal: ${reversalE...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-missing-reversals.ts
LINE: 72
TYPE: Console Statement Left In
CODE: `console.log(`--- Repair Complete ---`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-missing-reversals.ts
LINE: 73
TYPE: Console Statement Left In
CODE: `console.log(`Fixed ${fixedCount} transactions.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-system-mappings.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('Fixing System Accounting Configuration...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-system-mappings.ts
LINE: 80
TYPE: Console Statement Left In
CODE: `console.log(`Mapped ${map.type} -> ${map.code}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/fix-system-mappings.ts
LINE: 83
TYPE: Console Statement Left In
CODE: `console.log('Configuration Fixed.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/force-cleanup.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('🧹 Force cleaning legacy mappings with RAW SQL...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/force-cleanup.ts
LINE: 15
TYPE: Console Statement Left In
CODE: `console.log(`✓ Deleted ${count} entries.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/force-cleanup.ts
LINE: 20
TYPE: Console Statement Left In
CODE: `console.log('✅ Force clean complete!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/force-enable-ledger.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log('Enabling Ledger Management permissions...');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/force-enable-ledger.ts
LINE: 35
TYPE: Console Statement Left In
CODE: `console.log(`Enabled ledger access for role: ${role}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/force-enable-ledger.ts
LINE: 62
TYPE: Console Statement Left In
CODE: `console.log(`Updated user permissions for: ${user.name} (${user.role})`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/force-enable-ledger.ts
LINE: 66
TYPE: Console Statement Left In
CODE: `console.log('Permission update complete.');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/global-entry-search.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log(`--- GLOBAL SEARCH: "${keyword}" ---`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/global-entry-search.ts
LINE: 18
TYPE: Console Statement Left In
CODE: `console.log(`ID: ${e.id} | Acc: ${e.ledgerAccount.code} (${e.ledgerAccount.type}...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-installments.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log(`--- RepaymentInstallments: ${loanNumber} ---`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-installments.ts
LINE: 24
TYPE: Console Statement Left In
CODE: `console.log(`[${i.dueDate.toISOString().split('T')[0]}] Due: ${due.toString().pa...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-installments.ts
LINE: 26
TYPE: Console Statement Left In
CODE: `console.log(`\nTotal Due: ${totalDue}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-installments.ts
LINE: 27
TYPE: Console Statement Left In
CODE: `console.log(`Total Paid: ${totalPaid}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-installments.ts
LINE: 28
TYPE: Console Statement Left In
CODE: `console.log(`Outstanding: ${totalDue - totalPaid}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-ledger-ln012.ts
LINE: 18
TYPE: Console Statement Left In
CODE: `console.log('Ledger Tx NOT FOUND')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-ledger-ln012.ts
LINE: 22
TYPE: Console Statement Left In
CODE: `console.log(`Ledger Tx: ${tx.id} | Ref: ${tx.referenceId} | Type: ${tx.reference...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-ledger-ln012.ts
LINE: 23
TYPE: Console Statement Left In
CODE: `console.log('Entries:')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-ledger-ln012.ts
LINE: 25
TYPE: Console Statement Left In
CODE: `console.log(`  [${entry.ledgerAccount.code} - ${entry.ledgerAccount.name} (${ent...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-ledger-tx.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log(`--- LedgerTransaction: ${txId} ---`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-ledger-tx.ts
LINE: 17
TYPE: Console Statement Left In
CODE: `console.log('Transaction not found');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-ledger-tx.ts
LINE: 21
TYPE: Console Statement Left In
CODE: `console.log(`Date: ${tx.transactionDate}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-ledger-tx.ts
LINE: 22
TYPE: Console Statement Left In
CODE: `console.log(`Type: ${tx.referenceType}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-ledger-tx.ts
LINE: 23
TYPE: Console Statement Left In
CODE: `console.log(`RefID: ${tx.referenceId}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-ledger-tx.ts
LINE: 24
TYPE: Console Statement Left In
CODE: `console.log(`Description: ${tx.description}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-ledger-tx.ts
LINE: 27
TYPE: Console Statement Left In
CODE: `console.log(`  Account: ${e.ledgerAccount.code} (${e.ledgerAccount.name}) | DR: ...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-ledger.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log(`--- Debugging Loan: ${loanNumber} ---`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-ledger.ts
LINE: 20
TYPE: Console Statement Left In
CODE: `console.log('Loan not found');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-ledger.ts
LINE: 24
TYPE: Console Statement Left In
CODE: `console.log(`ID: ${loan.id}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-ledger.ts
LINE: 25
TYPE: Console Statement Left In
CODE: `console.log(`Status: ${loan.status}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-ledger.ts
LINE: 26
TYPE: Console Statement Left In
CODE: `console.log(`Table Outstanding Balance: ${loan.outstandingBalance}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-ledger.ts
LINE: 28
TYPE: Console Statement Left In
CODE: `console.log('\n--- Ledger Entries (Source of Truth) ---');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-ledger.ts
LINE: 63
TYPE: Console Statement Left In
CODE: `console.log(`[${entry.ledgerTransaction.transactionDate.toISOString().split('T')...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-ledger.ts
LINE: 66
TYPE: Console Statement Left In
CODE: `console.log(`\nCalculated Asset Balance: ${runningBalance}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-ledger.ts
LINE: 68
TYPE: Console Statement Left In
CODE: `console.log('\n--- Related Top-Ups ---');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-ledger.ts
LINE: 70
TYPE: Console Statement Left In
CODE: `console.log(`TU -> Old Loan: ${tu.oldLoanNumber}, Principal: ${tu.principalBalan...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-ln012.ts
LINE: 19
TYPE: Console Statement Left In
CODE: `console.log(`Loan ${loan.loanApplicationNumber} (${loan.id})`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-ln012.ts
LINE: 20
TYPE: Console Statement Left In
CODE: `console.log(`Status: ${loan.status}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-ln012.ts
LINE: 21
TYPE: Console Statement Left In
CODE: `console.log(`Stored Balance: ${loan.outstandingBalance}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-ln012.ts
LINE: 23
TYPE: Console Statement Left In
CODE: `console.log('\n--- Transactions ---')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-ln012.ts
LINE: 32
TYPE: Console Statement Left In
CODE: `console.log(`[${tx.type}] ${tx.amount} | Reversed: ${tx.isReversed} | Ref: ${tx....`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-ln012.ts
LINE: 34
TYPE: Console Statement Left In
CODE: `console.log(`    -> LedgerTx: ${ledgerTx.id} | Reversed: ${ledgerTx.isReversed}`...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-ln012.ts
LINE: 36
TYPE: Console Statement Left In
CODE: `console.log('    ⚠️  MISMATCH DETECTED!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-ln012.ts
LINE: 39
TYPE: Console Statement Left In
CODE: `if (tx.referenceId) console.log('    ⚠️  Ledger Tx NOT FOUND!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-ln017.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('🔍 Inspecting LN017...\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-ln017.ts
LINE: 24
TYPE: Console Statement Left In
CODE: `console.log(`Loan ID: ${loan.id}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-ln017.ts
LINE: 25
TYPE: Console Statement Left In
CODE: `console.log(`Status: ${loan.status}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-ln017.ts
LINE: 26
TYPE: Console Statement Left In
CODE: `console.log(`Amount: ${loan.amount}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-ln017.ts
LINE: 27
TYPE: Console Statement Left In
CODE: `console.log(`Stored Balance: ${loan.outstandingBalance}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-ln017.ts
LINE: 30
TYPE: Console Statement Left In
CODE: `console.log(`Ledger Balance: ${ledgerBalance}\n`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-ln017.ts
LINE: 32
TYPE: Console Statement Left In
CODE: `console.log('=== TRANSACTIONS ===')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-ln017.ts
LINE: 38
TYPE: Console Statement Left In
CODE: `console.log(`${tx.postedAt.toISOString().split('T')[0]} | ${tx.type.padEnd(12)} ...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-ln017.ts
LINE: 41
TYPE: Console Statement Left In
CODE: `console.log(`\nTransaction Sum: ${runningTotal.toFixed(2)}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-ln017.ts
LINE: 43
TYPE: Console Statement Left In
CODE: `console.log('\n=== INSTALLMENTS ===')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-ln017.ts
LINE: 45
TYPE: Console Statement Left In
CODE: `console.log(`Fully Paid Installments: ${paidInstallments.length} / ${loan.repaym...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-transactions.ts
LINE: 13
TYPE: Console Statement Left In
CODE: `console.log('🔍 Inspecting Loan Transactions...\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-transactions.ts
LINE: 31
TYPE: Console Statement Left In
CODE: `console.log(`\n${'='.repeat(60)}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-transactions.ts
LINE: 32
TYPE: Console Statement Left In
CODE: `console.log(`Loan: ${loan.loanApplicationNumber} - ${loan.member.name}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-transactions.ts
LINE: 33
TYPE: Console Statement Left In
CODE: `console.log(`Status: ${loan.status}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-transactions.ts
LINE: 34
TYPE: Console Statement Left In
CODE: `console.log(`Amount: ${loan.amount}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-transactions.ts
LINE: 35
TYPE: Console Statement Left In
CODE: `console.log(`DB Outstanding Balance: ${loan.outstandingBalance}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-transactions.ts
LINE: 36
TYPE: Console Statement Left In
CODE: `console.log(`Transaction Count: ${loan.transactions.length}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-transactions.ts
LINE: 37
TYPE: Console Statement Left In
CODE: `console.log(`${'='.repeat(60)}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-transactions.ts
LINE: 40
TYPE: Console Statement Left In
CODE: `console.log('⚠️  No transactions found!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-transactions.ts
LINE: 44
TYPE: Console Statement Left In
CODE: `console.log('\nTransaction History:')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-transactions.ts
LINE: 45
TYPE: Console Statement Left In
CODE: `console.log('Date                 | Type          | Amount      | Description')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-transactions.ts
LINE: 46
TYPE: Console Statement Left In
CODE: `console.log('-'.repeat(80))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-transactions.ts
LINE: 59
TYPE: Console Statement Left In
CODE: `console.log(`⚠️  Unknown transaction type: ${type}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-transactions.ts
LINE: 63
TYPE: Console Statement Left In
CODE: `console.log(`${date} | ${type.padEnd(13)} | ${amount.toFixed(2).padStart(11)} | ...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-transactions.ts
LINE: 66
TYPE: Console Statement Left In
CODE: `console.log('-'.repeat(80))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-transactions.ts
LINE: 67
TYPE: Console Statement Left In
CODE: `console.log(`Calculated Balance: ${runningBalance.toFixed(2)}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-transactions.ts
LINE: 68
TYPE: Console Statement Left In
CODE: `console.log(`DB Balance:         ${Number(loan.outstandingBalance).toFixed(2)}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-transactions.ts
LINE: 69
TYPE: Console Statement Left In
CODE: `console.log(`Difference:         ${(Number(loan.outstandingBalance) - runningBal...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-transactions.ts
LINE: 72
TYPE: Console Statement Left In
CODE: `console.log('\n' + '='.repeat(60))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-tx.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log(`--- LoanTransaction Sub-Ledger: ${loanNumber} ---`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-loan-tx.ts
LINE: 18
TYPE: Console Statement Left In
CODE: `console.log(`[${tx.postedAt.toISOString().split('T')[0]}] ${tx.type.padEnd(15)} ...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/inspect-members.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log(JSON.stringify(members.map(m => ({ id: m.id, name: m.name, status: m...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/invalidate-cache.ts
LINE: 5
TYPE: Console Statement Left In
CODE: `console.log('🔄 Invalidating RBAC cache...');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/invalidate-cache.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('✅ Cache invalidated.');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/link_wallets.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('Linking Wallets to Global Parent Account...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/link_wallets.ts
LINE: 21
TYPE: Console Statement Left In
CODE: `console.log(`Global Wallet Account: ${mapping.account.code} - ${mapping.account....`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/link_wallets.ts
LINE: 28
TYPE: Console Statement Left In
CODE: `console.log(`Found ${wallets.length} wallets.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/link_wallets.ts
LINE: 35
TYPE: Console Statement Left In
CODE: `console.warn(`Wallet ${wallet.id} has no ledger account!`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/link_wallets.ts
LINE: 41
TYPE: Console Statement Left In
CODE: `console.warn(` - Wallet for Member ${wallet.memberId} points to GLOBAL account. ...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/link_wallets.ts
LINE: 47
TYPE: Console Statement Left In
CODE: `// console.log(` - ${account.code} already linked.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/link_wallets.ts
LINE: 56
TYPE: Console Statement Left In
CODE: `console.log(` - Linked ${account.code} (${account.name}) to Parent.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/link_wallets.ts
LINE: 60
TYPE: Console Statement Left In
CODE: `console.log(`Link Complete. Updated ${updatedCount} accounts.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/link-orphaned-transactions.ts
LINE: 8
TYPE: Console Statement Left In
CODE: `console.log(`🔗 Link Orphaned Transactions (${dryRun ? 'DRY RUN' : 'LIVE MODE'})...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/link-orphaned-transactions.ts
LINE: 19
TYPE: Console Statement Left In
CODE: `console.log(`Found ${orphans.length} orphaned transactions\n`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/link-orphaned-transactions.ts
LINE: 22
TYPE: Console Statement Left In
CODE: `console.log('✅ No orphans found!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/link-orphaned-transactions.ts
LINE: 31
TYPE: Console Statement Left In
CODE: `console.log(`Processing TX on ${tx.loan.loanApplicationNumber} (${tx.type} - ${t...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/link-orphaned-transactions.ts
LINE: 39
TYPE: Console Statement Left In
CODE: `console.log(`  ⚠️ Unknown type ${tx.type}, skipping`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/link-orphaned-transactions.ts
LINE: 58
TYPE: Console Statement Left In
CODE: `console.log(`  ✅ Found matching LedgerTransaction ${match.id}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/link-orphaned-transactions.ts
LINE: 65
TYPE: Console Statement Left In
CODE: `console.log(`  📝 [DRY RUN] Would link to ${match.id}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/link-orphaned-transactions.ts
LINE: 69
TYPE: Console Statement Left In
CODE: `console.log(`  ⚠️ No matching LedgerTransaction found. Needs Backfill.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/link-orphaned-transactions.ts
LINE: 104
TYPE: Console Statement Left In
CODE: `console.log(`  ✅ Backfilled Ledger Entry`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/link-orphaned-transactions.ts
LINE: 106
TYPE: Console Statement Left In
CODE: `console.log(`  📝 [DRY RUN] Would backfill ledger entry`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/link-orphaned-transactions.ts
LINE: 141
TYPE: Console Statement Left In
CODE: `console.log(`  ✅ Backfilled Ledger Entry (Interest)`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/link-orphaned-transactions.ts
LINE: 143
TYPE: Console Statement Left In
CODE: `console.log(`  📝 [DRY RUN] Would backfill ledger entry (Interest)`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/link-orphaned-transactions.ts
LINE: 199
TYPE: Console Statement Left In
CODE: `console.log(`  ✅ Backfilled Ledger Entry`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/link-orphaned-transactions.ts
LINE: 201
TYPE: Console Statement Left In
CODE: `console.log(`  📝 [DRY RUN] Would backfill ledger entry`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/link-orphaned-transactions.ts
LINE: 205
TYPE: Console Statement Left In
CODE: `console.log(`  ❌ Cannot auto-backfill type ${tx.type}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/link-orphaned-transactions.ts
LINE: 210
TYPE: Console Statement Left In
CODE: `console.log('\n' + '='.repeat(50))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/link-orphaned-transactions.ts
LINE: 211
TYPE: Console Statement Left In
CODE: `console.log(`Linked: ${linkedCount}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/link-orphaned-transactions.ts
LINE: 212
TYPE: Console Statement Left In
CODE: `console.log(`Created: ${createdCount}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/link-orphaned-transactions.ts
LINE: 213
TYPE: Console Statement Left In
CODE: `console.log(`Unresolved: ${orphans.length - linkedCount - createdCount}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/link-orphaned-transactions.ts
LINE: 224
TYPE: Console Statement Left In
CODE: `console.log('\n✅ Cleanup complete')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/list-accounts.ts
LINE: 9
TYPE: Console Statement Left In
CODE: `console.log('Code | Name'.padEnd(40) + ' | Type'.padEnd(10) + ' | Balance');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/list-accounts.ts
LINE: 10
TYPE: Console Statement Left In
CODE: `console.log('-'.repeat(60));`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/list-accounts.ts
LINE: 12
TYPE: Console Statement Left In
CODE: `console.log(`${acc.code.padEnd(4)} | ${acc.name.padEnd(31)} | ${acc.type.padEnd(...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/list-mappings.ts
LINE: 9
TYPE: Console Statement Left In
CODE: `console.log('Type'.padEnd(30) + ' | Code | Account Name');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/list-mappings.ts
LINE: 10
TYPE: Console Statement Left In
CODE: `console.log('-'.repeat(60));`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/list-mappings.ts
LINE: 12
TYPE: Console Statement Left In
CODE: `console.log(`${m.type.padEnd(30)} | ${m.account.code.padEnd(4)} | ${m.account.na...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/list-modules.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log(JSON.stringify(modules, null, 2));`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/list-users.js
LINE: 12
TYPE: Console Statement Left In
CODE: `console.log('\n📋 All Users in Database:\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/list-users.js
LINE: 15
TYPE: Console Statement Left In
CODE: `console.log('❌ No users found in database')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/list-users.js
LINE: 20
TYPE: Console Statement Left In
CODE: `console.log(`${index + 1}. ${user.email}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/list-users.js
LINE: 21
TYPE: Console Statement Left In
CODE: `console.log(`   Role: ${user.role}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/list-users.js
LINE: 22
TYPE: Console Statement Left In
CODE: `console.log(`   Member: ${user.member?.name || 'No member linked'} (#${user.memb...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/list-users.js
LINE: 23
TYPE: Console Statement Left In
CODE: `console.log(`   Created: ${user.createdAt.toISOString().split('T')[0]}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/list-users.js
LINE: 24
TYPE: Console Statement Left In
CODE: `console.log('')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/list-users.js
LINE: 29
TYPE: Console Statement Left In
CODE: `console.log('✅ Admin/Chairperson found:')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/list-users.js
LINE: 30
TYPE: Console Statement Left In
CODE: `console.log(`   Email: ${adminUser.email}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/list-users.js
LINE: 31
TYPE: Console Statement Left In
CODE: `console.log(`   Member: ${adminUser.member?.name}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/list-users.js
LINE: 32
TYPE: Console Statement Left In
CODE: `console.log('\n💡 You can use this account to login')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/list-users.js
LINE: 34
TYPE: Console Statement Left In
CODE: `console.log('⚠️  No CHAIRPERSON role found')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate_wallet_entries.ts
LINE: 8
TYPE: Console Statement Left In
CODE: `console.log('Migrating Wallet Entries to Unique Accounts...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate_wallet_entries.ts
LINE: 21
TYPE: Console Statement Left In
CODE: `console.log(`Global Wallet Account ID: ${globalAccountId}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate_wallet_entries.ts
LINE: 29
TYPE: Console Statement Left In
CODE: `console.log(`Found ${members.length} members.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate_wallet_entries.ts
LINE: 32
TYPE: Console Statement Left In
CODE: `console.log(`Processing ${member.name} (${member.id})...`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate_wallet_entries.ts
LINE: 40
TYPE: Console Statement Left In
CODE: `console.log(' - Creating missing wallet...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate_wallet_entries.ts
LINE: 46
TYPE: Console Statement Left In
CODE: `console.warn(` - Wallet ${wallet.accountRef} points to GLOBAL account. This migh...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate_wallet_entries.ts
LINE: 68
TYPE: Console Statement Left In
CODE: `console.log(` - Fixed Wallet to point to new account ${newAccount.id}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate_wallet_entries.ts
LINE: 85
TYPE: Console Statement Left In
CODE: `console.log(` - Found ${entries.length} entries in Global Account. Moving...`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate_wallet_entries.ts
LINE: 95
TYPE: Console Statement Left In
CODE: `console.log(` - Moved ${updated.count} entries.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate_wallet_entries.ts
LINE: 97
TYPE: Console Statement Left In
CODE: `console.log(' - No global entries found.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate_wallet_entries.ts
LINE: 101
TYPE: Console Statement Left In
CODE: `console.log('Migration Complete.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-contributions-asset.ts
LINE: 14
TYPE: Console Statement Left In
CODE: `console.log('=== MIGRATING MEMBER CONTRIBUTIONS TO ASSET ===\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-contributions-asset.ts
LINE: 27
TYPE: Console Statement Left In
CODE: `console.log(`Found Account: ${account.name} (Type: ${account.type})`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-contributions-asset.ts
LINE: 36
TYPE: Console Statement Left In
CODE: `console.log(`Found ${lines.length} journal lines to migrate.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-contributions-asset.ts
LINE: 39
TYPE: Console Statement Left In
CODE: `console.log('Swapping Debit/Credit values...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-contributions-asset.ts
LINE: 49
TYPE: Console Statement Left In
CODE: `console.log(`Updated Account Type to ASSET`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-contributions-asset.ts
LINE: 64
TYPE: Console Statement Left In
CODE: `console.log(`Successfully migrated ${updatedCount} lines.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-contributions-asset.ts
LINE: 65
TYPE: Console Statement Left In
CODE: `console.log('\n=== VERIFICATION ===')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-contributions-asset.ts
LINE: 76
TYPE: Console Statement Left In
CODE: `console.log(`Entry: ${line.journalEntry.description}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-contributions-asset.ts
LINE: 77
TYPE: Console Statement Left In
CODE: `console.log(`Type: ${line.journalEntry.referenceType}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-contributions-asset.ts
LINE: 78
TYPE: Console Statement Left In
CODE: `console.log(`New Debit: ${line.debitAmount}, New Credit: ${line.creditAmount}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-contributions-asset.ts
LINE: 79
TYPE: Console Statement Left In
CODE: `console.log('---')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-expense-status.ts
LINE: 13
TYPE: Console Statement Left In
CODE: `console.log('🔄 Starting ExpenseStatus migration...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-expense-status.ts
LINE: 27
TYPE: Console Statement Left In
CODE: `console.log(`  ✅ ${sql}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-expense-status.ts
LINE: 29
TYPE: Console Statement Left In
CODE: `console.log(`  ⏭️  Skipped (already exists): ${e.message?.slice(0, 60)}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-expense-status.ts
LINE: 37
TYPE: Console Statement Left In
CODE: `console.log(`  📦 Migrated ${pendingCount} PENDING → PENDING_APPROVAL`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-expense-status.ts
LINE: 42
TYPE: Console Statement Left In
CODE: `console.log(`  📦 Migrated ${approvedCount} APPROVED → CLOSED`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-expense-status.ts
LINE: 55
TYPE: Console Statement Left In
CODE: `console.log(`  ✅ ${sql}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-expense-status.ts
LINE: 57
TYPE: Console Statement Left In
CODE: `console.log(`  ⏭️  Skipped: ${e.message?.slice(0, 60)}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-expense-status.ts
LINE: 70
TYPE: Console Statement Left In
CODE: `console.log(`  ✅ ${sql}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-expense-status.ts
LINE: 72
TYPE: Console Statement Left In
CODE: `console.log(`  ⏭️  Skipped: ${e.message?.slice(0, 60)}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-expense-status.ts
LINE: 86
TYPE: Console Statement Left In
CODE: `console.log(`  ✅ Created enum`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-expense-status.ts
LINE: 88
TYPE: Console Statement Left In
CODE: `console.log(`  ⏭️  Skipped: ${e.message?.slice(0, 60)}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-expense-status.ts
LINE: 92
TYPE: Console Statement Left In
CODE: `console.log('\n✅ Migration complete! Now safe to run: npx prisma db push')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-legacy-contributions.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log("🚀 Starting Legacy Contribution Migration...")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-legacy-contributions.ts
LINE: 11
TYPE: Console Statement Left In
CODE: `console.log("Creating Account 3000 - Opening Balance Equity...")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-legacy-contributions.ts
LINE: 60
TYPE: Console Statement Left In
CODE: `console.log(`Migrating ${m.memberNumber}: Legacy=${legacyVal}, Ledger=${ledgerRa...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-legacy-contributions.ts
LINE: 114
TYPE: Console Statement Left In
CODE: `console.log(`   > Created Tx: ${transaction.id}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-legacy-contributions.ts
LINE: 121
TYPE: Console Statement Left In
CODE: `console.log(`\nMigration Complete. Processed ${migratedCount} members.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-installments.ts
LINE: 15
TYPE: Console Statement Left In
CODE: `console.log('🚀 Starting loan installments migration...\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-installments.ts
LINE: 35
TYPE: Console Statement Left In
CODE: `console.log(`📊 Found ${loansWithoutInstallments.length} loans without installme...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-installments.ts
LINE: 38
TYPE: Console Statement Left In
CODE: `console.log('✅ No loans need migration. All done!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-installments.ts
LINE: 49
TYPE: Console Statement Left In
CODE: `console.log(`Processing Loan: ${loan.loanApplicationNumber || loan.id}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-installments.ts
LINE: 61
TYPE: Console Statement Left In
CODE: `console.log(`  - Generating ${durationMonths} installments...`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-installments.ts
LINE: 79
TYPE: Console Statement Left In
CODE: `console.log(`  - Created ${installments.length} installments`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-installments.ts
LINE: 83
TYPE: Console Statement Left In
CODE: `console.log(`  - Replaying ${loan.transactions.length} existing transactions...`...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-installments.ts
LINE: 87
TYPE: Console Statement Left In
CODE: `console.log(`  - Updated ${replayResult.installmentsUpdated} installments`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-installments.ts
LINE: 91
TYPE: Console Statement Left In
CODE: `console.log(`  ✅ Success\n`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-installments.ts
LINE: 102
TYPE: Console Statement Left In
CODE: `console.log('\n' + '='.repeat(60))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-installments.ts
LINE: 103
TYPE: Console Statement Left In
CODE: `console.log('📈 Migration Summary')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-installments.ts
LINE: 104
TYPE: Console Statement Left In
CODE: `console.log('='.repeat(60))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-installments.ts
LINE: 105
TYPE: Console Statement Left In
CODE: `console.log(`Total Loans Processed: ${loansWithoutInstallments.length}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-installments.ts
LINE: 106
TYPE: Console Statement Left In
CODE: `console.log(`✅ Successful: ${successCount}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-installments.ts
LINE: 107
TYPE: Console Statement Left In
CODE: `console.log(`❌ Failed: ${errorCount}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-installments.ts
LINE: 110
TYPE: Console Statement Left In
CODE: `console.log('\n❌ Errors:')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-installments.ts
LINE: 112
TYPE: Console Statement Left In
CODE: `console.log(`  - Loan ${loanId}: ${error}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-installments.ts
LINE: 116
TYPE: Console Statement Left In
CODE: `console.log('\n✨ Migration complete!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-installments.ts
LINE: 127
TYPE: Console Statement Left In
CODE: `console.log('\n👋 Exiting...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-status.ts
LINE: 16
TYPE: Console Statement Left In
CODE: `console.log('🔍 Starting Loan Status Migration...\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-status.ts
LINE: 19
TYPE: Console Statement Left In
CODE: `console.log('📊 Current Loan Status Distribution:')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-status.ts
LINE: 26
TYPE: Console Statement Left In
CODE: `console.log(`   ${status}: ${_count}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-status.ts
LINE: 28
TYPE: Console Statement Left In
CODE: `console.log('')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-status.ts
LINE: 44
TYPE: Console Statement Left In
CODE: `console.log(`📋 Found ${disbursedLoans.length} loans with DISBURSED status\n`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-status.ts
LINE: 47
TYPE: Console Statement Left In
CODE: `console.log('✅ No DISBURSED loans found. Migration not needed.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-status.ts
LINE: 52
TYPE: Console Statement Left In
CODE: `console.log('Loans to be updated:')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-status.ts
LINE: 54
TYPE: Console Statement Left In
CODE: `console.log(`   ${index + 1}. ${loan.loanApplicationNumber} - ${loan.member.name...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-status.ts
LINE: 55
TYPE: Console Statement Left In
CODE: `console.log(`      Amount: ${loan.amount}, Outstanding: ${loan.outstandingBalanc...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-status.ts
LINE: 57
TYPE: Console Statement Left In
CODE: `console.log('')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-status.ts
LINE: 63
TYPE: Console Statement Left In
CODE: `console.log(`⚠️  Warning: ${zeroBalanceLoans.length} loans have zero balance and...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-status.ts
LINE: 65
TYPE: Console Statement Left In
CODE: `console.log(`   - ${loan.loanApplicationNumber} (${loan.member.name})`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-status.ts
LINE: 67
TYPE: Console Statement Left In
CODE: `console.log('')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-status.ts
LINE: 71
TYPE: Console Statement Left In
CODE: `console.log('🔄 Updating DISBURSED → ACTIVE...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-status.ts
LINE: 83
TYPE: Console Statement Left In
CODE: `console.log(`✅ Updated ${updateResult.count} loans to ACTIVE status\n`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-status.ts
LINE: 87
TYPE: Console Statement Left In
CODE: `console.log('🔄 Updating zero-balance loans → CLEARED...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-status.ts
LINE: 99
TYPE: Console Statement Left In
CODE: `console.log(`✅ Updated ${clearedResult.count} loans to CLEARED status\n`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-status.ts
LINE: 103
TYPE: Console Statement Left In
CODE: `console.log('📊 Final Loan Status Distribution:')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-status.ts
LINE: 110
TYPE: Console Statement Left In
CODE: `console.log(`   ${status}: ${_count}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-status.ts
LINE: 112
TYPE: Console Statement Left In
CODE: `console.log('')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-status.ts
LINE: 115
TYPE: Console Statement Left In
CODE: `console.log('🔍 Checking for potential issues...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-status.ts
LINE: 126
TYPE: Console Statement Left In
CODE: `console.log(`⚠️  Warning: ${activeZeroBalance} ACTIVE loans have zero balance (s...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-status.ts
LINE: 138
TYPE: Console Statement Left In
CODE: `console.log(`⚠️  Warning: ${clearedNonZero} CLEARED loans have non-zero balance`...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-status.ts
LINE: 142
TYPE: Console Statement Left In
CODE: `console.log('✅ No issues found. All loans are consistent.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/migrate-loan-status.ts
LINE: 145
TYPE: Console Statement Left In
CODE: `console.log('\n✨ Migration completed successfully!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/patch-ln015.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('--- Patching LN015 Reversals ---')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/patch-ln015.ts
LINE: 20
TYPE: Console Statement Left In
CODE: `console.log(`Found ${ledgerTxs.length} Ledger Transactions today.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/patch-ln015.ts
LINE: 33
TYPE: Console Statement Left In
CODE: `console.log(`Found ${potentialReversals.length} potential Reversal Tx in Ledger....`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/patch-ln015.ts
LINE: 36
TYPE: Console Statement Left In
CODE: `console.log(`Ledger Tx: ${ltx.id} | Desc: ${ltx.description} | Ref: ${ltx.refere...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/patch-ln015.ts
LINE: 46
TYPE: Console Statement Left In
CODE: `console.log(`[FOUND MISMATCH] Ledger Reversal ${ltx.id} points to Active LoanTx ...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/patch-ln015.ts
LINE: 60
TYPE: Console Statement Left In
CODE: `console.log(`Creating Contra Entry for ${loanTx.id}...`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/patch-ln015.ts
LINE: 79
TYPE: Console Statement Left In
CODE: `console.log(`LoanTx ${loanTx.id} is already reversed. Checking Contra...`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/patch-ln015.ts
LINE: 85
TYPE: Console Statement Left In
CODE: `console.log(`Creating Contra Entry for ${loanTx.id}...`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/patch-ln015.ts
LINE: 105
TYPE: Console Statement Left In
CODE: `console.log(`Warning: Reference ID ${ltx.referenceId} not found in LoanTransacti...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/patch-ln015.ts
LINE: 110
TYPE: Console Statement Left In
CODE: `console.log(`Match! Reference ID is Loan ID: ${loan.loanApplicationNumber}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/patch-ln015.ts
LINE: 112
TYPE: Console Statement Left In
CODE: `console.log(`Looking for Loan Tx with Amount: ${amount} (Total Ledger Amount)......`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/patch-ln015.ts
LINE: 125
TYPE: Console Statement Left In
CODE: `console.log(`[FUZZY MATCH] Found Candidate Tx: ${candidateTx.id} (${candidateTx....`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/patch-ln015.ts
LINE: 126
TYPE: Console Statement Left In
CODE: `console.log(`Fixing Loan Tx ${candidateTx.id}...`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/patch-ln015.ts
LINE: 151
TYPE: Console Statement Left In
CODE: `console.log(`Fixed successfully.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/patch-ln015.ts
LINE: 153
TYPE: Console Statement Left In
CODE: `console.log(`No active repayment transaction found with amount ${amount} for thi...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/prime-loan-cache.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log("Starting Loan Cache Priming...");`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/prime-loan-cache.ts
LINE: 14
TYPE: Console Statement Left In
CODE: `console.log(`Found ${loans.length} loans to cache.`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/prime-loan-cache.ts
LINE: 18
TYPE: Console Statement Left In
CODE: `console.log(`Generating cache for ${loan.loanApplicationNumber}...`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/prime-loan-cache.ts
LINE: 25
TYPE: Console Statement Left In
CODE: `console.log("Done.");`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/purge_non_core_ledgers.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('Running DESTRUCTIVE purge of non-core ledgers...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/purge_non_core_ledgers.ts
LINE: 31
TYPE: Console Statement Left In
CODE: `console.log(`Targeting ${targets.length} accounts for deletion.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/purge_non_core_ledgers.ts
LINE: 34
TYPE: Console Statement Left In
CODE: `console.log('No accounts to delete.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/purge_non_core_ledgers.ts
LINE: 50
TYPE: Console Statement Left In
CODE: `console.log(`Deleting ${transactionIds.length} transactions involving target acc...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/purge_non_core_ledgers.ts
LINE: 68
TYPE: Console Statement Left In
CODE: `console.log(`Deleted ${sysMapResult.count} system mappings.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/purge_non_core_ledgers.ts
LINE: 74
TYPE: Console Statement Left In
CODE: `console.log(`Deleted ${prodMapResult.count} product mappings.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/purge_non_core_ledgers.ts
LINE: 82
TYPE: Console Statement Left In
CODE: `console.log(`Deleted ${walletTransactionsDelete.count} wallet transactions.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/purge_non_core_ledgers.ts
LINE: 87
TYPE: Console Statement Left In
CODE: `console.log(`Deleted ${walletResult.count} test wallets.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/purge_non_core_ledgers.ts
LINE: 93
TYPE: Console Statement Left In
CODE: `console.log(`Deleted ${expenseResult.count} expenses linked to deleted accounts....`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/purge_non_core_ledgers.ts
LINE: 104
TYPE: Console Statement Left In
CODE: `console.log('Deleted transfer requests involving target accounts.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/purge_non_core_ledgers.ts
LINE: 112
TYPE: Console Statement Left In
CODE: `console.log('Remapped Welfare Types to LIABILITIES.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/purge_non_core_ledgers.ts
LINE: 119
TYPE: Console Statement Left In
CODE: `console.log(`✅ Successfully deleted ${deleteResult.count} accounts.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/purge_non_core_ledgers.ts
LINE: 120
TYPE: Console Statement Left In
CODE: `console.log('The system now contains ONLY the 5 core ledgers.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/recalc-balance.ts
LINE: 8
TYPE: Console Statement Left In
CODE: `console.log('Recalculating Ledger Account Balances...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/recalc-balance.ts
LINE: 39
TYPE: Console Statement Left In
CODE: `console.log(`Account ${account.code} (${account.type}):`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/recalc-balance.ts
LINE: 40
TYPE: Console Statement Left In
CODE: `console.log(`  Lines: ${lines.length}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/recalc-balance.ts
LINE: 41
TYPE: Console Statement Left In
CODE: `console.log(`  Old Balance: ${account.balance}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/recalc-balance.ts
LINE: 42
TYPE: Console Statement Left In
CODE: `console.log(`  New Balance: ${balance}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/recalc-balance.ts
LINE: 45
TYPE: Console Statement Left In
CODE: `console.log('  -> UPDATING...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/recalc-balance.ts
LINE: 50
TYPE: Console Statement Left In
CODE: `console.log('  -> DONE')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/recalc-balance.ts
LINE: 52
TYPE: Console Statement Left In
CODE: `console.log('  -> OK')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/recalc-balance.ts
LINE: 54
TYPE: Console Statement Left In
CODE: `console.log('---')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reconcile-ledger-vs-stored.ts
LINE: 16
TYPE: Console Statement Left In
CODE: `console.log('🔍 Reconciling Ledger vs Stored Balances\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reconcile-ledger-vs-stored.ts
LINE: 29
TYPE: Console Statement Left In
CODE: `console.log(`📋 Reconciling ${loans.length} active loans\n`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reconcile-ledger-vs-stored.ts
LINE: 64
TYPE: Console Statement Left In
CODE: `console.log('='.repeat(80))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reconcile-ledger-vs-stored.ts
LINE: 65
TYPE: Console Statement Left In
CODE: `console.log('📊 RECONCILIATION SUMMARY')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reconcile-ledger-vs-stored.ts
LINE: 66
TYPE: Console Statement Left In
CODE: `console.log('='.repeat(80))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reconcile-ledger-vs-stored.ts
LINE: 72
TYPE: Console Statement Left In
CODE: `console.log(`\n✅ Perfect Matches: ${matches} (${((matches / results.length) * 10...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reconcile-ledger-vs-stored.ts
LINE: 73
TYPE: Console Statement Left In
CODE: `console.log(`📌 Minor Differences (<1%): ${minorDiffs}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reconcile-ledger-vs-stored.ts
LINE: 74
TYPE: Console Statement Left In
CODE: `console.log(`🚨 Major Differences (>1%): ${majorDiffs}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reconcile-ledger-vs-stored.ts
LINE: 76
TYPE: Console Statement Left In
CODE: `console.log(`\n💰 Total Stored Balance: ${totalStoredBalance.toLocaleString()}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reconcile-ledger-vs-stored.ts
LINE: 77
TYPE: Console Statement Left In
CODE: `console.log(`💰 Total Ledger Balance: ${totalLedgerBalance.toLocaleString()}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reconcile-ledger-vs-stored.ts
LINE: 78
TYPE: Console Statement Left In
CODE: `console.log(`💰 Total Difference: ${(totalLedgerBalance - totalStoredBalance).to...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reconcile-ledger-vs-stored.ts
LINE: 82
TYPE: Console Statement Left In
CODE: `console.log('\n' + '='.repeat(80))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reconcile-ledger-vs-stored.ts
LINE: 83
TYPE: Console Statement Left In
CODE: `console.log('🚨 MAJOR DIFFERENCES (>1%)')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reconcile-ledger-vs-stored.ts
LINE: 84
TYPE: Console Statement Left In
CODE: `console.log('='.repeat(80))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reconcile-ledger-vs-stored.ts
LINE: 91
TYPE: Console Statement Left In
CODE: `console.log(`\n${r.loanNumber}:`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reconcile-ledger-vs-stored.ts
LINE: 92
TYPE: Console Statement Left In
CODE: `console.log(`  Stored: ${r.storedBalance.toLocaleString()}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reconcile-ledger-vs-stored.ts
LINE: 93
TYPE: Console Statement Left In
CODE: `console.log(`  Ledger: ${r.ledgerBalance.toLocaleString()}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reconcile-ledger-vs-stored.ts
LINE: 94
TYPE: Console Statement Left In
CODE: `console.log(`  Diff: ${r.difference.toLocaleString()} (${r.percentDiff.toFixed(2...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reconcile-ledger-vs-stored.ts
LINE: 114
TYPE: Console Statement Left In
CODE: `console.log('\n📄 Full report saved to: reconciliation-report.json')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reconcile-ledger-vs-stored.ts
LINE: 122
TYPE: Console Statement Left In
CODE: `console.log('\n✅ Reconciliation complete')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/ref-search.ts
LINE: 9
TYPE: Console Statement Left In
CODE: `console.log(`--- REF SEARCH: "${loan.id}" (${loanNo}) ---`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/ref-search.ts
LINE: 18
TYPE: Console Statement Left In
CODE: `console.log(`ID: ${e.id} | Acc: ${e.ledgerAccount.code} (${e.ledgerAccount.type}...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/refine-ledger.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log('--- REFINING LEDGER PATHS ---');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/refine-ledger.ts
LINE: 24
TYPE: Console Statement Left In
CODE: `console.log(`Moving ${walletEntries.length} Wallet entries back to account 2200....`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/refine-ledger.ts
LINE: 42
TYPE: Console Statement Left In
CODE: `console.log(`Moving ${feeEntries.length} Fee entries back to account 4100...`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/refine-ledger.ts
LINE: 50
TYPE: Console Statement Left In
CODE: `console.log('--- REFINEMENT COMPLETE ---');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/repair-loan-ledger.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log('--- STARTING GLOBAL LOAN LEDGER REPAIR ---');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/repair-loan-ledger.ts
LINE: 8
TYPE: Console Statement Left In
CODE: `console.log('Step 1: Identifying all loans...');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/repair-loan-ledger.ts
LINE: 13
TYPE: Console Statement Left In
CODE: `console.log('Step 2: Fetching asset accounts...');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/repair-loan-ledger.ts
LINE: 22
TYPE: Console Statement Left In
CODE: `console.log('Step 3: Finding mis-mapped entries...');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/repair-loan-ledger.ts
LINE: 59
TYPE: Console Statement Left In
CODE: `console.log(`Analyzing ${entries.length} entries...`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/repair-loan-ledger.ts
LINE: 78
TYPE: Console Statement Left In
CODE: `console.log(`Migrating entry ${e.id} for ${loanNum}: Moving to ${targetAccId ===...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/repair-loan-ledger.ts
LINE: 86
TYPE: Console Statement Left In
CODE: `console.log('--- REPAIR COMPLETE ---');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/repair-loan-transactions.ts
LINE: 13
TYPE: Console Statement Left In
CODE: `console.log('🔧 Starting Data Repair: Backfilling Loan Transactions...\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/repair-loan-transactions.ts
LINE: 30
TYPE: Console Statement Left In
CODE: `console.log(`📋 Found ${loansNeedingRepair.length} loans without transaction his...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/repair-loan-transactions.ts
LINE: 33
TYPE: Console Statement Left In
CODE: `console.log('✅ All loans have transaction history. No repair needed.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/repair-loan-transactions.ts
LINE: 38
TYPE: Console Statement Left In
CODE: `console.log('Loans to be repaired:')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/repair-loan-transactions.ts
LINE: 40
TYPE: Console Statement Left In
CODE: `console.log(`   ${index + 1}. ${loan.loanApplicationNumber} - ${loan.member.name...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/repair-loan-transactions.ts
LINE: 41
TYPE: Console Statement Left In
CODE: `console.log(`      Amount: ${loan.amount}, Outstanding: ${loan.outstandingBalanc...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/repair-loan-transactions.ts
LINE: 43
TYPE: Console Statement Left In
CODE: `console.log('')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/repair-loan-transactions.ts
LINE: 48
TYPE: Console Statement Left In
CODE: `console.log(`🔧 Repairing ${loan.loanApplicationNumber}...`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/repair-loan-transactions.ts
LINE: 69
TYPE: Console Statement Left In
CODE: `console.log(`   ✓ Created DISBURSEMENT: ${amount}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/repair-loan-transactions.ts
LINE: 84
TYPE: Console Statement Left In
CODE: `console.log(`   ✓ Created REPAYMENT: ${repaid}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/repair-loan-transactions.ts
LINE: 93
TYPE: Console Statement Left In
CODE: `console.log(`   ✓ Updated status to CLEARED`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/repair-loan-transactions.ts
LINE: 98
TYPE: Console Statement Left In
CODE: `console.log(`   ✅ Successfully repaired ${loan.loanApplicationNumber}\n`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/repair-loan-transactions.ts
LINE: 105
TYPE: Console Statement Left In
CODE: `console.log(`\n✨ Repair completed: ${repaired}/${loansNeedingRepair.length} loan...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/repair-loan-transactions.ts
LINE: 108
TYPE: Console Statement Left In
CODE: `console.log('🔍 Verifying repairs...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/repair-loan-transactions.ts
LINE: 117
TYPE: Console Statement Left In
CODE: `console.log('✅ All active loans now have transaction history!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/repair-loan-transactions.ts
LINE: 119
TYPE: Console Statement Left In
CODE: `console.log(`⚠️  ${stillMissing} loans still missing transaction history`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/repair-reversals.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('--- Starting Enhanced Reversal Repair Script ---')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/repair-reversals.ts
LINE: 15
TYPE: Console Statement Left In
CODE: `console.log(`Checking ${allLoanTxs.length} active transactions for Ledger discre...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/repair-reversals.ts
LINE: 33
TYPE: Console Statement Left In
CODE: `console.log(`[MISMATCH FOUND] Tx ${tx.id} (${tx.type}) is Active, but Ledger is ...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/repair-reversals.ts
LINE: 63
TYPE: Console Statement Left In
CODE: `console.log(`--- Sync Check Complete. Fixed ${fixedCount} mismatches. ---`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/repair-reversals.ts
LINE: 69
TYPE: Console Statement Left In
CODE: `console.log(`Checking ${reversedTxs.length} reversed transactions for missing Co...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/repair-reversals.ts
LINE: 78
TYPE: Console Statement Left In
CODE: `console.log(`[FIXING] Missing Reversal for Tx ${tx.id}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/repair-reversals.ts
LINE: 98
TYPE: Console Statement Left In
CODE: `console.log(`Fixed ${missingContraCount} missing contra entries.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reproduce-cascading-reversal.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('--- Testing Cascading Reversal (Wallet -> Loan) ---')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reproduce-cascading-reversal.ts
LINE: 20
TYPE: Console Statement Left In
CODE: `console.log('No active loan/wallet found for test.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reproduce-cascading-reversal.ts
LINE: 24
TYPE: Console Statement Left In
CODE: `console.log(`Using Loan: ${existingLoan.loanApplicationNumber} (${existingLoan.i...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reproduce-cascading-reversal.ts
LINE: 44
TYPE: Incomplete Marker
CODE: `balanceAfter: 0, // Placeholder`
IMPACT: Lingering technical debt or incomplete feature
FIX: Implement the missing logic or remove the comment if already done

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reproduce-cascading-reversal.ts
LINE: 49
TYPE: Console Statement Left In
CODE: `console.log(`Created Wallet Tx: ${walletTx.id}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reproduce-cascading-reversal.ts
LINE: 61
TYPE: Console Statement Left In
CODE: `console.log(`Created Loan Tx: ${loanTx.id}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reproduce-cascading-reversal.ts
LINE: 70
TYPE: Console Statement Left In
CODE: `console.log('--- Executing Reversal on WALLET Transaction ---')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reproduce-cascading-reversal.ts
LINE: 78
TYPE: Console Statement Left In
CODE: `console.log('Reversal Result:', result)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reproduce-cascading-reversal.ts
LINE: 85
TYPE: Console Statement Left In
CODE: `console.log('--- Verification ---')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reproduce-cascading-reversal.ts
LINE: 86
TYPE: Console Statement Left In
CODE: `console.log(`Loan Tx Is Reversed: ${updatedLoanTx?.isReversed}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reproduce-cascading-reversal.ts
LINE: 89
TYPE: Console Statement Left In
CODE: `console.log('SUCCESS: Cascading reversal worked!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reset-passwords.ts
LINE: 18
TYPE: Console Statement Left In
CODE: `console.log('🔐 Emergency Password Reset Tool')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reset-passwords.ts
LINE: 19
TYPE: Console Statement Left In
CODE: `console.log('='.repeat(50))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reset-passwords.ts
LINE: 20
TYPE: Console Statement Left In
CODE: `console.log(`⚠️  This will reset ALL user passwords to: ${TEMP_PASSWORD}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reset-passwords.ts
LINE: 21
TYPE: Console Statement Left In
CODE: `console.log('⚠️  Users will be required to change password on next login\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reset-passwords.ts
LINE: 32
TYPE: Console Statement Left In
CODE: `console.log('✅ Password hash verified\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reset-passwords.ts
LINE: 43
TYPE: Console Statement Left In
CODE: `console.log(`📋 Found ${users.length} users to reset:\n`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reset-passwords.ts
LINE: 56
TYPE: Console Statement Left In
CODE: `console.log(`   ✅ Reset: ${user.email} (${user.name})`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reset-passwords.ts
LINE: 59
TYPE: Console Statement Left In
CODE: `console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reset-passwords.ts
LINE: 60
TYPE: Console Statement Left In
CODE: `console.log('🎉 Password Reset Complete!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reset-passwords.ts
LINE: 61
TYPE: Console Statement Left In
CODE: `console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reset-passwords.ts
LINE: 62
TYPE: Console Statement Left In
CODE: `console.log(`📧 Temporary Password: ${TEMP_PASSWORD}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reset-passwords.ts
LINE: 63
TYPE: Console Statement Left In
CODE: `console.log('⚠️  All users will be prompted to change password on login')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reset-passwords.ts
LINE: 64
TYPE: Console Statement Left In
CODE: `console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reset-user-by-id.ts
LINE: 11
TYPE: Console Statement Left In
CODE: `console.log(`🔍 Searching for user with ID: ${targetUserId}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reset-user-by-id.ts
LINE: 22
TYPE: Console Statement Left In
CODE: `console.log(`✅ User found: ${user.name} (${user.email})`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reset-user-by-id.ts
LINE: 23
TYPE: Console Statement Left In
CODE: `console.log(`🔒 Resetting password to: ${newPassword}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reset-user-by-id.ts
LINE: 36
TYPE: Console Statement Left In
CODE: `console.log('✅ Password reset successfully.');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reset-user-by-id.ts
LINE: 37
TYPE: Console Statement Left In
CODE: `console.log('✅ Account unlocked.');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reset-user-by-id.ts
LINE: 38
TYPE: Console Statement Left In
CODE: `console.log(`👉 Please login with: ${user.email} / ${newPassword}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reset-users.ts
LINE: 8
TYPE: Console Statement Left In
CODE: `console.log('🚀 Starting bulk user reset...');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reset-users.ts
LINE: 14
TYPE: Console Statement Left In
CODE: `console.log(`🔑 Resetting passwords to default: ${defaultPassword}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reset-users.ts
LINE: 15
TYPE: Console Statement Left In
CODE: `console.log('🔒 Enforcing password change on next login...');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reset-users.ts
LINE: 26
TYPE: Console Statement Left In
CODE: `console.log(`✅ Successfully updated password and status for ${updateResult.count...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reset-users.ts
LINE: 29
TYPE: Console Statement Left In
CODE: `console.log('📧 Sanitizing emails to lowercase...');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reset-users.ts
LINE: 35
TYPE: Console Statement Left In
CODE: `console.log(`✅ Sanitized emails. (Rows affected: ${emailUpdateCount})`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/reset-users.ts
LINE: 37
TYPE: Console Statement Left In
CODE: `console.log('🎉 Reset complete!');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/revert-migration.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log(`Reverting transaction ${txId}...`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/revert-migration.ts
LINE: 16
TYPE: Console Statement Left In
CODE: `console.log("Transaction not found (already deleted?)")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/revert-migration.ts
LINE: 74
TYPE: Console Statement Left In
CODE: `console.log("Reverted successfully.")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/seed_liquidity.ts
LINE: 8
TYPE: Console Statement Left In
CODE: `console.log('Seeding Liquidity Pool (Account 1200)...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/seed_liquidity.ts
LINE: 13
TYPE: Console Statement Left In
CODE: `console.log('Creating Account 1200...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/seed_liquidity.ts
LINE: 28
TYPE: Console Statement Left In
CODE: `console.log('Creating Account 3000...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/seed_liquidity.ts
LINE: 43
TYPE: Console Statement Left In
CODE: `console.log(`Injecting KES ${amount.toLocaleString()} into ${pool.name}...`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/seed_liquidity.ts
LINE: 68
TYPE: Console Statement Left In
CODE: `console.log('Success! Journal Entry created:', je.id)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/seed_standard_subaccounts.js
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log("Creating Standard Sub-Accounts...")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/seed_standard_subaccounts.js
LINE: 13
TYPE: Console Statement Left In
CODE: `console.log(`❌ Parent ${parentCode} not found for ${name}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/seed_standard_subaccounts.js
LINE: 29
TYPE: Console Statement Left In
CODE: `console.log(`✅ ${code} - ${name} [${type}]`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/seed_standard_subaccounts.js
LINE: 41
TYPE: Commented-Out Code
CODE: `// We will stick to the requested ones for now.`
IMPACT: Dead code bloats the codebase and causes confusion
FIX: Remove the commented out code or restore it if needed

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/seed_standard_subaccounts.js
LINE: 46
TYPE: Console Statement Left In
CODE: `console.log("\nMapping System Events...")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/seed_standard_subaccounts.js
LINE: 54
TYPE: Console Statement Left In
CODE: `console.log(`🔗 Mapped ${type} -> ${accountId}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/seed-current-month-paid.ts
LINE: 8
TYPE: Console Statement Left In
CODE: `console.log("🛠️ Seeding Current Month Status...")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/seed-current-month-paid.ts
LINE: 16
TYPE: Console Statement Left In
CODE: `console.log(`User: ${targetMember.name}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/seed-current-month-paid.ts
LINE: 47
TYPE: Console Statement Left In
CODE: `console.log("✅ Current Month Marked as PAID:", tracker)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/seed-modules.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('🌱 Seeding System Modules...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/seed-modules.ts
LINE: 35
TYPE: Console Statement Left In
CODE: `console.log(`✅ Module synced: ${mod.name} (${mod.key})`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/seed-modules.ts
LINE: 44
TYPE: Console Statement Left In
CODE: `console.log(`\n👮 Seeding permissions for ${role}...`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/seed-modules.ts
LINE: 60
TYPE: Console Statement Left In
CODE: `console.log(`   - Granted ${moduleKey}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/seed-modules.ts
LINE: 65
TYPE: Console Statement Left In
CODE: `console.log(`\n👤 Seeding permissions for MEMBER (FULL ACCESS)...`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/seed-modules.ts
LINE: 83
TYPE: Console Statement Left In
CODE: `console.log(`   - Granted ${moduleKey}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/seed-modules.ts
LINE: 87
TYPE: Console Statement Left In
CODE: `console.log('\n👑 Seeding permissions for SYSTEM_ADMIN...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/seed-modules.ts
LINE: 105
TYPE: Console Statement Left In
CODE: `console.log(`   - Granted ALL modules`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/seed-modules.ts
LINE: 107
TYPE: Console Statement Left In
CODE: `console.log('✨ System Modules & Permissions seeding completed.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/setup_cash_at_hand_hierarchy.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('Setting up "Cash at Hand" Core Ledger Hierarchy...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/setup_cash_at_hand_hierarchy.ts
LINE: 27
TYPE: Console Statement Left In
CODE: `console.log(`Created Root Account: ${rootCode} - ${rootName}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/setup_cash_at_hand_hierarchy.ts
LINE: 29
TYPE: Console Statement Left In
CODE: `console.log(`Root Account exists: ${rootCode}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/setup_cash_at_hand_hierarchy.ts
LINE: 33
TYPE: Console Statement Left In
CODE: `console.log('Updated Root Account to LIABILITY.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/setup_cash_at_hand_hierarchy.ts
LINE: 47
TYPE: Console Statement Left In
CODE: `console.log(`Linked Member Wallet Control (${walletMapping.account.code}) to Roo...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/setup_cash_at_hand_hierarchy.ts
LINE: 49
TYPE: Console Statement Left In
CODE: `console.warn('MEMBER_WALLET mapping not found.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/setup_cash_at_hand_hierarchy.ts
LINE: 60
TYPE: Console Statement Left In
CODE: `console.log(`Linked Cash/Mpesa (${cashMapping.account.code}) to Root.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/setup_cash_at_hand_hierarchy.ts
LINE: 69
TYPE: Console Statement Left In
CODE: `console.log(`Linked Account 1000 (Cash?) to Root.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/setup_cash_at_hand_hierarchy.ts
LINE: 85
TYPE: Console Statement Left In
CODE: `console.log(`Linked Bank Account (${bank.code} - ${bank.name}) to Root.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/setup_cash_at_hand_hierarchy.ts
LINE: 101
TYPE: Console Statement Left In
CODE: `console.log(`Linked Mpesa Account (${mpesa.code} - ${mpesa.name}) to Root.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/setup_cash_at_hand_hierarchy.ts
LINE: 105
TYPE: Console Statement Left In
CODE: `console.log('Hierarchy Setup Complete.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/setup-admin.js
LINE: 16
TYPE: Console Statement Left In
CODE: `console.log('✅ Admin user already exists!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/setup-admin.js
LINE: 17
TYPE: Console Statement Left In
CODE: `console.log('📧 Email:', existingUser.email)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/setup-admin.js
LINE: 18
TYPE: Console Statement Left In
CODE: `console.log('👤 Role:', existingUser.role)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/setup-admin.js
LINE: 19
TYPE: Console Statement Left In
CODE: `console.log('🔢 Member Number:', existingUser.member?.memberNumber)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/setup-admin.js
LINE: 20
TYPE: Console Statement Left In
CODE: `console.log('\n🔑 Default Password: Admin@123')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/setup-admin.js
LINE: 21
TYPE: Console Statement Left In
CODE: `console.log('⚠️  If you changed it, use your new password')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/setup-admin.js
LINE: 39
TYPE: Console Statement Left In
CODE: `console.log('✅ Created new member #1')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/setup-admin.js
LINE: 41
TYPE: Console Statement Left In
CODE: `console.log('✅ Found existing member #1:', member.name)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/setup-admin.js
LINE: 66
TYPE: Console Statement Left In
CODE: `console.log('\n✅ Admin user created successfully!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/setup-admin.js
LINE: 67
TYPE: Console Statement Left In
CODE: `console.log('📧 Email:', adminEmail)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/setup-admin.js
LINE: 68
TYPE: Console Statement Left In
CODE: `console.log('🔑 Password: Admin@123')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/setup-admin.js
LINE: 69
TYPE: Console Statement Left In
CODE: `console.log('👤 Role:', user.role)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/setup-admin.js
LINE: 70
TYPE: Console Statement Left In
CODE: `console.log('🔢 Member Number:', member.memberNumber)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/setup-admin.js
LINE: 71
TYPE: Console Statement Left In
CODE: `console.log('\n⚠️  Please change the password after first login!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simple-test.ts
LINE: 11
TYPE: Console Statement Left In
CODE: `console.log('🧪 Simple Loan Services Test\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simple-test.ts
LINE: 25
TYPE: Console Statement Left In
CODE: `console.log(`Found ${loans.length} active loans\n`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simple-test.ts
LINE: 28
TYPE: Console Statement Left In
CODE: `console.log(`📋 Loan: ${loan.loanApplicationNumber || loan.id}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simple-test.ts
LINE: 29
TYPE: Console Statement Left In
CODE: `console.log(`   Status: ${loan.status}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simple-test.ts
LINE: 30
TYPE: Console Statement Left In
CODE: `console.log(`   Amount: KES ${Number(loan.amount).toLocaleString()}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simple-test.ts
LINE: 34
TYPE: Console Statement Left In
CODE: `console.log(`   Outstanding: KES ${balance.totals.totalOutstanding.toLocaleStrin...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simple-test.ts
LINE: 38
TYPE: Console Statement Left In
CODE: `console.log(`   Total Due: KES ${due.totalDue.toLocaleString()}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simple-test.ts
LINE: 39
TYPE: Console Statement Left In
CODE: `console.log(`   Overdue: ${due.isOverdue ? 'Yes' : 'No'}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simple-test.ts
LINE: 43
TYPE: Console Statement Left In
CODE: `console.log(`   Completion: ${lifecycle.completionPercentage}%`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simple-test.ts
LINE: 44
TYPE: Console Statement Left In
CODE: `console.log()`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simple-test.ts
LINE: 47
TYPE: Console Statement Left In
CODE: `console.log('✅ All services working correctly!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simulate-mpesa-callback.ts
LINE: 15
TYPE: Console Statement Left In
CODE: `console.log("No PENDING transactions found. Creating a dummy one...");`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simulate-mpesa-callback.ts
LINE: 32
TYPE: Console Statement Left In
CODE: `console.log(`Created Dummy Transaction: ${transaction.id}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simulate-mpesa-callback.ts
LINE: 35
TYPE: Console Statement Left In
CODE: `console.log(`Found Pending Transaction: ${transaction.id}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simulate-mpesa-callback.ts
LINE: 36
TYPE: Console Statement Left In
CODE: `console.log(`CheckoutRequestID: ${transaction.checkoutRequestId}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simulate-mpesa-callback.ts
LINE: 37
TYPE: Console Statement Left In
CODE: `console.log(`Amount: ${transaction.amount}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simulate-mpesa-callback.ts
LINE: 64
TYPE: Console Statement Left In
CODE: `console.log(`Sending callback to ${url}...`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simulate-mpesa-callback.ts
LINE: 73
TYPE: Console Statement Left In
CODE: `console.log("Response:", response.status, data);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simulate-mpesa-callback.ts
LINE: 76
TYPE: Console Statement Left In
CODE: `console.log("\n✅ Simulation Successful!");`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simulate-mpesa-callback.ts
LINE: 77
TYPE: Console Statement Left In
CODE: `console.log(`Transaction ${transaction.id} should now be COMPLETED.`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simulate-mpesa-callback.ts
LINE: 78
TYPE: Console Statement Left In
CODE: `console.log(`Receipt: ${receiptNumber}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simulate-statement-reversal.ts
LINE: 8
TYPE: Console Statement Left In
CODE: `console.log('--- Simulation: Loan Statement Reversal ---')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simulate-statement-reversal.ts
LINE: 26
TYPE: Console Statement Left In
CODE: `console.log('\n[1] Fetching Initial Statement...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simulate-statement-reversal.ts
LINE: 27
TYPE: Console Statement Left In
CODE: `console.log('Function Source:', getLoanStatement.toString().substring(0, 200))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simulate-statement-reversal.ts
LINE: 29
TYPE: Console Statement Left In
CODE: `console.log('Statement Keys:', Object.keys(statement || {}))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simulate-statement-reversal.ts
LINE: 37
TYPE: Console Statement Left In
CODE: `console.log(`Initial Running Balance: ${initialBalance}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simulate-statement-reversal.ts
LINE: 41
TYPE: Console Statement Left In
CODE: `console.log(`\n[2] Simulating Repayment of ${repaymentAmount}...`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simulate-statement-reversal.ts
LINE: 76
TYPE: Console Statement Left In
CODE: `console.log('\n[3] Fetching Statement after Repayment...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simulate-statement-reversal.ts
LINE: 79
TYPE: Console Statement Left In
CODE: `console.log(`Post-Repayment Balance: ${postRepaymentBalance}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simulate-statement-reversal.ts
LINE: 84
TYPE: Console Statement Left In
CODE: `console.log('SUCCESS: Balance decreased as expected.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simulate-statement-reversal.ts
LINE: 88
TYPE: Console Statement Left In
CODE: `console.log(`\n[4] Reversing the Repayment (Cascading)...`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simulate-statement-reversal.ts
LINE: 104
TYPE: Console Statement Left In
CODE: `console.log('\n[5] Fetching Statement after Reversal...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simulate-statement-reversal.ts
LINE: 107
TYPE: Console Statement Left In
CODE: `console.log(`Final Running Balance: ${finalBalance}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simulate-statement-reversal.ts
LINE: 111
TYPE: Console Statement Left In
CODE: `console.log('SUCCESS: Balance returned to initial state (approx).')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simulate-statement-reversal.ts
LINE: 113
TYPE: Console Statement Left In
CODE: `console.log(`WARNING: Balance mismatch. Initial: ${initialBalance}, Final: ${fin...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simulate-statement-reversal.ts
LINE: 114
TYPE: Console Statement Left In
CODE: `console.log('Note: Interest recalculation might cause slight differences dependi...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simulate-statement-reversal.ts
LINE: 118
TYPE: Console Statement Left In
CODE: `console.log('\n--- Transaction Trail (Last 5) ---')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/simulate-statement-reversal.ts
LINE: 120
TYPE: Console Statement Left In
CODE: `console.table(trail.map((t: any) => ({`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-all-balances.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('--- SYNCING LOAN BALANCES ---');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-all-balances.ts
LINE: 14
TYPE: Console Statement Left In
CODE: `console.log(`Found ${loans.length} loans to sync.`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-all-balances.ts
LINE: 19
TYPE: Console Statement Left In
CODE: `console.log(`Synced ${loan.loanApplicationNumber}: ${newBalance}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-all-balances.ts
LINE: 25
TYPE: Console Statement Left In
CODE: `console.log('--- SYNC COMPLETE ---');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-ledger-to-stored.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('🔄 Syncing Ledger Balances to Stored Field...\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-ledger-to-stored.ts
LINE: 13
TYPE: Console Statement Left In
CODE: `console.log(`Found ${loans.length} active/overdue loans`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-ledger-to-stored.ts
LINE: 25
TYPE: Console Statement Left In
CODE: `console.log(`[UPDATE] ${loan.loanApplicationNumber}: Stored ${storedBalance.toFi...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-ledger-to-stored.ts
LINE: 38
TYPE: Console Statement Left In
CODE: `// console.log(`[SKIP] ${loan.loanApplicationNumber} is in sync`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-ledger-to-stored.ts
LINE: 46
TYPE: Console Statement Left In
CODE: `console.log(`\n✅ Sync Complete. Updated: ${updated}, Skipped: ${skipped}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-loan-balances.ts
LINE: 36
TYPE: Console Statement Left In
CODE: `console.log('🔄 Synchronizing Loan Balances from Transaction History...\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-loan-balances.ts
LINE: 53
TYPE: Console Statement Left In
CODE: `console.log(`📋 Processing ${loans.length} loans\n`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-loan-balances.ts
LINE: 80
TYPE: Console Statement Left In
CODE: `console.log(`🔧 ${loan.loanApplicationNumber} - ${loan.member.name}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-loan-balances.ts
LINE: 81
TYPE: Console Statement Left In
CODE: `console.log(`   Current: Balance=${dbBalance.toFixed(2)}, Status=${loan.status}`...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-loan-balances.ts
LINE: 82
TYPE: Console Statement Left In
CODE: `console.log(`   Correct: Balance=${calculatedBalance.toFixed(2)}, Status=${corre...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-loan-balances.ts
LINE: 94
TYPE: Console Statement Left In
CODE: `console.log(`   ✓ Updated balance: ${dbBalance.toFixed(2)} → ${calculatedBalance...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-loan-balances.ts
LINE: 99
TYPE: Console Statement Left In
CODE: `console.log(`   ✓ Updated status: ${loan.status} → ${correctStatus}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-loan-balances.ts
LINE: 103
TYPE: Console Statement Left In
CODE: `console.log('')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-loan-balances.ts
LINE: 110
TYPE: Console Statement Left In
CODE: `console.log('\n📊 Summary:')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-loan-balances.ts
LINE: 111
TYPE: Console Statement Left In
CODE: `console.log(`   Total Loans Processed: ${loans.length}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-loan-balances.ts
LINE: 112
TYPE: Console Statement Left In
CODE: `console.log(`   Already Correct: ${alreadyCorrect}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-loan-balances.ts
LINE: 113
TYPE: Console Statement Left In
CODE: `console.log(`   Balance Updates: ${updated}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-loan-balances.ts
LINE: 114
TYPE: Console Statement Left In
CODE: `console.log(`   Status Changes: ${statusChanged}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-loan-balances.ts
LINE: 117
TYPE: Console Statement Left In
CODE: `console.log('\n✅ All loans are already synchronized!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-loan-balances.ts
LINE: 119
TYPE: Console Statement Left In
CODE: `console.log('\n✨ Synchronization completed successfully!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-loan-balances.ts
LINE: 123
TYPE: Console Statement Left In
CODE: `console.log('\n🔍 Final Verification:')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-loan-balances.ts
LINE: 132
TYPE: Console Statement Left In
CODE: `console.log(`⚠️  ${stillIncorrect} ACTIVE/OVERDUE loans still have zero balance`...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-loan-balances.ts
LINE: 134
TYPE: Console Statement Left In
CODE: `console.log('✅ No ACTIVE/OVERDUE loans with zero balance')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-loan-balances.ts
LINE: 145
TYPE: Console Statement Left In
CODE: `console.log(`⚠️  ${clearedWithBalance} CLEARED loans have non-zero balance`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-loan-balances.ts
LINE: 147
TYPE: Console Statement Left In
CODE: `console.log('✅ No CLEARED loans with non-zero balance')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-mappings.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('Syncing System Account Mappings...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-mappings.ts
LINE: 31
TYPE: Console Statement Left In
CODE: `console.log(`Ensured Account ${acc.code} exists.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-mappings.ts
LINE: 49
TYPE: Console Statement Left In
CODE: `console.log(`Creating missing mapping: ${type} -> ${code}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-mappings.ts
LINE: 58
TYPE: Console Statement Left In
CODE: `console.log('Sync complete.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-reversal-status.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log('🔄 Syncing Reversal Status (Ledger -> LoanTransaction)...\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-reversal-status.ts
LINE: 34
TYPE: Console Statement Left In
CODE: `console.log(`Found ${reversedJournalIds.length} reversed journals.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-reversal-status.ts
LINE: 43
TYPE: Console Statement Left In
CODE: `console.log(`Found ${transactionsToFix.length} loan transactions needing reversa...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-reversal-status.ts
LINE: 46
TYPE: Console Statement Left In
CODE: `console.log(`[FIX] marking LoanTx ${tx.id} (${tx.type}) as REVERSED`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/sync-reversal-status.ts
LINE: 53
TYPE: Console Statement Left In
CODE: `console.log('\n✅ Reversal Sync Complete.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_email.ts
LINE: 17
TYPE: Console Statement Left In
CODE: `console.log(`\n📧 Attempting to send test email...`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_email.ts
LINE: 18
TYPE: Console Statement Left In
CODE: `console.log(`To: ${recipient}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_email.ts
LINE: 19
TYPE: Console Statement Left In
CODE: `console.log(`SMTP Host: ${process.env.SMTP_HOST || 'Not set (using default/fallb...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_email.ts
LINE: 20
TYPE: Console Statement Left In
CODE: `console.log(`SMTP User: ${process.env.SMTP_USER || 'Not set'}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_email.ts
LINE: 38
TYPE: Console Statement Left In
CODE: `console.log('\n✅ Email sent successfully!');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_intasend.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('🚀 Starting IntaSend Connectivity Test...');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_intasend.ts
LINE: 13
TYPE: Console Statement Left In
CODE: `console.log(`Environment: ${isTest ? 'TEST' : 'LIVE'}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_intasend.ts
LINE: 14
TYPE: Console Statement Left In
CODE: `console.log(`Publishable Key Present: ${!!publishableKey}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_intasend.ts
LINE: 15
TYPE: Console Statement Left In
CODE: `console.log(`Secret Key Present: ${!!secretKey}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_intasend.ts
LINE: 30
TYPE: Console Statement Left In
CODE: `console.log(`\nAttempting Sample STK Push to ${PHONE_NUMBER} for KES ${AMOUNT}.....`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_intasend.ts
LINE: 32
TYPE: Console Statement Left In
CODE: `console.log('⚠️  Using dummy number. Pass a real number like: npx tsx scripts/te...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_intasend.ts
LINE: 45
TYPE: Console Statement Left In
CODE: `console.log('Sending Payload:', JSON.stringify(payload, null, 2));`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_intasend.ts
LINE: 50
TYPE: Console Statement Left In
CODE: `console.log('\n✅ IntaSend Response Received:');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_intasend.ts
LINE: 51
TYPE: Console Statement Left In
CODE: `console.log(JSON.stringify(response, null, 2));`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_intasend.ts
LINE: 54
TYPE: Console Statement Left In
CODE: `console.log('\n🎉 SUCCESS: Connection established and Invoice created.');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_intasend.ts
LINE: 55
TYPE: Console Statement Left In
CODE: `console.log(`Invoice ID: ${response.invoice.invoice_id}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_intasend.ts
LINE: 56
TYPE: Console Statement Left In
CODE: `console.log(`State: ${response.invoice.state}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_intasend.ts
LINE: 58
TYPE: Console Statement Left In
CODE: `console.log('\n⚠️ Response received but no invoice details found. Check output a...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_intasend.ts
LINE: 72
TYPE: Console Statement Left In
CODE: `console.log('Response Status:', error.response.status);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_intasend.ts
LINE: 73
TYPE: Console Statement Left In
CODE: `console.log('Response Headers:', error.response.headers);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_registration.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('🧪 Testing Atomic Registration & Schema Constraints...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_registration.ts
LINE: 15
TYPE: Console Statement Left In
CODE: `console.log(`✅ Found Liability Account: ${liabilityAccount.name} (${liabilityAcc...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_registration.ts
LINE: 18
TYPE: Console Statement Left In
CODE: `console.log('--- Registering Member A ---')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_registration.ts
LINE: 46
TYPE: Console Statement Left In
CODE: `console.log(`✅ Created Member A (#${resultA.member.memberNumber}) with Wallet li...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_registration.ts
LINE: 50
TYPE: Console Statement Left In
CODE: `console.log('--- Registering Member B ---')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_registration.ts
LINE: 78
TYPE: Console Statement Left In
CODE: `console.log(`✅ Created Member B (#${resultB.member.memberNumber}) with Wallet li...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_registration.ts
LINE: 79
TYPE: Console Statement Left In
CODE: `console.log("🎉 SUCCESS: Multiple wallets mapped to single Liability Account.")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_registration.ts
LINE: 90
TYPE: Console Statement Left In
CODE: `console.log('--- Cleaning Up ---')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test_registration.ts
LINE: 101
TYPE: Console Statement Left In
CODE: `console.log('✅ Changes Reverted.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test-universal-reversal.ts
LINE: 11
TYPE: Hardcoded Placeholder
CODE: `if (process.argv.includes('--run-mock')) {`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/test-universal-reversal.ts
LINE: 12
TYPE: Hardcoded Placeholder
CODE: `console.log('Mock run not implemented safely yet. Exiting.')`
IMPACT: Production system will use dummy configuration, potentially causing data leaks or systemic failures
FIX: Replace hardcoded value with dynamic data or environment variables

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/trace-balance-calc.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log('🔍 Tracing Balance for LN017 (NO FILTER)...\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/trace-balance-calc.ts
LINE: 15
TYPE: Console Statement Left In
CODE: `console.log(`Loan ID: ${loanId}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/trace-balance-calc.ts
LINE: 28
TYPE: Console Statement Left In
CODE: `console.log(`\nfound ${refEntries.length} by Reference ID`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/trace-balance-calc.ts
LINE: 29
TYPE: Console Statement Left In
CODE: `refEntries.forEach(e => console.log(`[REF] ${e.amount} (${e.debitAmount} - ${e.c...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/trace-balance-calc.ts
LINE: 40
TYPE: Console Statement Left In
CODE: `console.log(`\nfound ${keywordEntries.length} by Keyword`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/trace-balance-calc.ts
LINE: 41
TYPE: Console Statement Left In
CODE: `keywordEntries.forEach(e => console.log(`[KEY] ${e.amount} (${e.debitAmount} - $...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/trace-balance-calc.ts
LINE: 51
TYPE: Console Statement Left In
CODE: `console.log('\n=== CALCULATION ===')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/trace-balance-calc.ts
LINE: 57
TYPE: Console Statement Left In
CODE: `console.log(`+ ${val.toFixed(2)} ${rev} (${line.description})`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/trace-balance-calc.ts
LINE: 60
TYPE: Console Statement Left In
CODE: `console.log(`\nTOTAL: ${total.toFixed(2)}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/trigger-callback.ts
LINE: 23
TYPE: Console Statement Left In
CODE: `console.log('Sending callback to http://localhost:3000/api/mpesa/callback...');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/trigger-callback.ts
LINE: 32
TYPE: Console Statement Left In
CODE: `console.log(`Status: ${response.status}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/trigger-callback.ts
LINE: 34
TYPE: Console Statement Left In
CODE: `console.log(`Response: ${text}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/upgrade-to-chairperson.js
LINE: 17
TYPE: Console Statement Left In
CODE: `console.log('❌ User not found:', userEmail)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/upgrade-to-chairperson.js
LINE: 21
TYPE: Console Statement Left In
CODE: `console.log('📋 Current User Details:')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/upgrade-to-chairperson.js
LINE: 22
TYPE: Console Statement Left In
CODE: `console.log('   Email:', user.email)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/upgrade-to-chairperson.js
LINE: 23
TYPE: Console Statement Left In
CODE: `console.log('   Current Role:', user.role)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/upgrade-to-chairperson.js
LINE: 24
TYPE: Console Statement Left In
CODE: `console.log('   Member:', user.member?.name)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/upgrade-to-chairperson.js
LINE: 34
TYPE: Console Statement Left In
CODE: `console.log('\n✅ User upgraded successfully!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/upgrade-to-chairperson.js
LINE: 35
TYPE: Console Statement Left In
CODE: `console.log('   New Role:', updatedUser.role)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/upgrade-to-chairperson.js
LINE: 36
TYPE: Console Statement Left In
CODE: `console.log('\n💡 This user now has full administrative access')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-balances.ts
LINE: 16
TYPE: Console Statement Left In
CODE: `console.log('🔍 Starting loan balance validation...\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-balances.ts
LINE: 37
TYPE: Console Statement Left In
CODE: `console.log(`📊 Validating ${loans.length} loans\n`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-balances.ts
LINE: 97
TYPE: Console Statement Left In
CODE: `console.log(`${icon} ${loan.loanApplicationNumber || loan.id.substring(0, 8)}: O...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-balances.ts
LINE: 114
TYPE: Console Statement Left In
CODE: `console.log('\n' + '='.repeat(60))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-balances.ts
LINE: 115
TYPE: Console Statement Left In
CODE: `console.log('📊 Validation Summary')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-balances.ts
LINE: 116
TYPE: Console Statement Left In
CODE: `console.log('='.repeat(60))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-balances.ts
LINE: 122
TYPE: Console Statement Left In
CODE: `console.log(`Total Loans: ${results.length}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-balances.ts
LINE: 123
TYPE: Console Statement Left In
CODE: `console.log(`✅ Passed: ${passCount} (${((passCount / results.length) * 100).toFi...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-balances.ts
LINE: 124
TYPE: Console Statement Left In
CODE: `console.log(`⚠️  Warnings: ${warnCount} (${((warnCount / results.length) * 100)....`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-balances.ts
LINE: 125
TYPE: Console Statement Left In
CODE: `console.log(`❌ Failed: ${failCount} (${((failCount / results.length) * 100).toFi...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-balances.ts
LINE: 130
TYPE: Console Statement Left In
CODE: `console.log('\n❌ Failed Loans:')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-balances.ts
LINE: 132
TYPE: Console Statement Left In
CODE: `console.log(`  - ${f.loanNumber}: ${f.details}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-balances.ts
LINE: 139
TYPE: Console Statement Left In
CODE: `console.log('\n⚠️  Warnings:')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-balances.ts
LINE: 141
TYPE: Console Statement Left In
CODE: `console.log(`  - ${w.loanNumber}: ${w.details}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-balances.ts
LINE: 145
TYPE: Console Statement Left In
CODE: `console.log('\n✨ Validation complete!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-balances.ts
LINE: 149
TYPE: Console Statement Left In
CODE: `console.log('\n⚠️  Some loans failed validation. Please review.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-balances.ts
LINE: 162
TYPE: Console Statement Left In
CODE: `console.log('\n👋 Exiting...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-ledger-integrity.ts
LINE: 16
TYPE: Console Statement Left In
CODE: `console.log('🔍 Starting Loan Ledger Integrity Validation...\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-ledger-integrity.ts
LINE: 34
TYPE: Console Statement Left In
CODE: `console.log(`📋 Found ${loans.length} loans to validate\n`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-ledger-integrity.ts
LINE: 37
TYPE: Console Statement Left In
CODE: `console.log(`Checking ${loan.loanApplicationNumber}...`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-ledger-integrity.ts
LINE: 113
TYPE: Console Statement Left In
CODE: `console.log('\n' + '='.repeat(80))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-ledger-integrity.ts
LINE: 114
TYPE: Console Statement Left In
CODE: `console.log('📊 VALIDATION SUMMARY')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-ledger-integrity.ts
LINE: 115
TYPE: Console Statement Left In
CODE: `console.log('='.repeat(80))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-ledger-integrity.ts
LINE: 121
TYPE: Console Statement Left In
CODE: `console.log(`\n🚨 CRITICAL Issues: ${criticalIssues.length}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-ledger-integrity.ts
LINE: 122
TYPE: Console Statement Left In
CODE: `console.log(`⚠️  HIGH Issues: ${highIssues.length}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-ledger-integrity.ts
LINE: 123
TYPE: Console Statement Left In
CODE: `console.log(`📌 MEDIUM Issues: ${mediumIssues.length}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-ledger-integrity.ts
LINE: 124
TYPE: Console Statement Left In
CODE: `console.log(`\n✅ Clean Loans: ${loans.length - new Set(issues.map(i => i.loanId)...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-ledger-integrity.ts
LINE: 128
TYPE: Console Statement Left In
CODE: `console.log('\n' + '='.repeat(80))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-ledger-integrity.ts
LINE: 129
TYPE: Console Statement Left In
CODE: `console.log('📋 DETAILED ISSUES')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-ledger-integrity.ts
LINE: 130
TYPE: Console Statement Left In
CODE: `console.log('='.repeat(80))`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-ledger-integrity.ts
LINE: 139
TYPE: Console Statement Left In
CODE: `console.log(`\n### ${type} (${typeIssues.length} occurrences)`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-ledger-integrity.ts
LINE: 141
TYPE: Console Statement Left In
CODE: `console.log(`  - ${issue.loanNumber}: ${issue.details}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-ledger-integrity.ts
LINE: 142
TYPE: Console Statement Left In
CODE: `console.log(`    Fix: ${issue.suggestedFix}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-ledger-integrity.ts
LINE: 145
TYPE: Console Statement Left In
CODE: `console.log(`  ... and ${typeIssues.length - 5} more`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-ledger-integrity.ts
LINE: 165
TYPE: Console Statement Left In
CODE: `console.log(`\n📄 Full report saved to: ${reportPath}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-ledger-integrity.ts
LINE: 175
TYPE: Console Statement Left In
CODE: `console.log('\n✅ All loans passed validation!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/validate-loan-ledger-integrity.ts
LINE: 177
TYPE: Console Statement Left In
CODE: `console.log(`\n⚠️  Found ${issues.length} issues requiring attention`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify_accounting_health.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('🏥 Starting Accounting Health Check...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify_accounting_health.ts
LINE: 12
TYPE: Console Statement Left In
CODE: `console.log('\n1️⃣ Checking Active Accounts...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify_accounting_health.ts
LINE: 17
TYPE: Console Statement Left In
CODE: `console.log(`   Found ${accounts.length} active accounts.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify_accounting_health.ts
LINE: 22
TYPE: Console Statement Left In
CODE: `console.log('   ✅ Account count correct.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify_accounting_health.ts
LINE: 26
TYPE: Console Statement Left In
CODE: `console.log('\n2️⃣ Checking System Mappings...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify_accounting_health.ts
LINE: 30
TYPE: Console Statement Left In
CODE: `console.log(`   Found ${mappings.length} system mappings.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify_accounting_health.ts
LINE: 42
TYPE: Console Statement Left In
CODE: `console.warn(`   ⚠️  Missing mapping for ${type}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify_accounting_health.ts
LINE: 49
TYPE: Console Statement Left In
CODE: `console.log('   Mappings check complete.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify_accounting_health.ts
LINE: 52
TYPE: Console Statement Left In
CODE: `console.log('\n3️⃣ Checking Logic & Balances...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify_accounting_health.ts
LINE: 62
TYPE: Console Statement Left In
CODE: `console.warn(`   ⚠️  Found ${orphanedEntries} ledger entries linked to inactive/...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify_accounting_health.ts
LINE: 63
TYPE: Console Statement Left In
CODE: `console.warn('       (This is expected if you deleted accounts but kept history ...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify_accounting_health.ts
LINE: 70
TYPE: Console Statement Left In
CODE: `console.log('   ✅ No orphaned ledger entries found.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify_accounting_health.ts
LINE: 74
TYPE: Console Statement Left In
CODE: `console.log('\n4️⃣ Checking Wallet Integrity...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify_accounting_health.ts
LINE: 87
TYPE: Console Statement Left In
CODE: `console.warn(`   ⚠️  Wallet ${w.id} is mapped to ${w.glAccount.code} (Expected 2...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify_accounting_health.ts
LINE: 91
TYPE: Console Statement Left In
CODE: `if (badWallets === 0 && warnings === 0) console.log('   ✅ All wallets mapped cor...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify_accounting_health.ts
LINE: 94
TYPE: Console Statement Left In
CODE: `console.log('\n===========================================')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify_accounting_health.ts
LINE: 96
TYPE: Console Statement Left In
CODE: `console.log('✅ HEALTH CHECK PASSED')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify_accounting_health.ts
LINE: 97
TYPE: Console Statement Left In
CODE: `if (warnings > 0) console.log(`with ${warnings} warnings.`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify_active_ledgers.ts
LINE: 12
TYPE: Console Statement Left In
CODE: `console.log('Active Accounts:', activeAccounts)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify_active_ledgers.ts
LINE: 14
TYPE: Console Statement Left In
CODE: `console.log('✅ Verification Passed: Exactly 5 active accounts.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify_active_ledgers.ts
LINE: 16
TYPE: Console Statement Left In
CODE: `console.log(`❌ Verification Failed: Found ${activeAccounts.length} active accoun...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-audit-schema.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log('Verifying AuditLog Schema...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-audit-schema.ts
LINE: 12
TYPE: Console Statement Left In
CODE: `console.warn('⚠️ No users found. Skipping.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-audit-schema.ts
LINE: 16
TYPE: Console Statement Left In
CODE: `console.log(`Found User: ${user.id}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-audit-schema.ts
LINE: 39
TYPE: Console Statement Left In
CODE: `console.log('✅ Success: Created AuditLog with new fields!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-audit-schema.ts
LINE: 40
TYPE: Console Statement Left In
CODE: `console.log('Log ID:', log.id)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-full-reversal-flow.ts
LINE: 11
TYPE: Console Statement Left In
CODE: `console.log("Starting End-to-End Reversal Verification...")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-full-reversal-flow.ts
LINE: 20
TYPE: Console Statement Left In
CODE: `console.log(`Using Loan: ${loan.loanApplicationNumber}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-full-reversal-flow.ts
LINE: 25
TYPE: Console Statement Left In
CODE: `console.log("No installments found. Creating dummy installment for testing...")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-full-reversal-flow.ts
LINE: 87
TYPE: Console Statement Left In
CODE: `console.log(`Created Repayment TX: ${tx.id}. Verifying Statement BEFORE Reversal...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-full-reversal-flow.ts
LINE: 99
TYPE: Console Statement Left In
CODE: `console.log(`[Before] TX Found. reversed: ${rowBefore.isReversed}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-full-reversal-flow.ts
LINE: 103
TYPE: Console Statement Left In
CODE: `console.log(`[Before Reversal] Outstanding Balance: ${loanBefore?.outstandingBal...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-full-reversal-flow.ts
LINE: 107
TYPE: Console Statement Left In
CODE: `console.log("Executing Reversal...")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-full-reversal-flow.ts
LINE: 120
TYPE: Console Statement Left In
CODE: `console.log("GL Reversal Executed.")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-full-reversal-flow.ts
LINE: 129
TYPE: Console Statement Left In
CODE: `console.log("Verifying Statement AFTER Reversal...")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-full-reversal-flow.ts
LINE: 134
TYPE: Console Statement Left In
CODE: `console.log(`[After Reversal] Outstanding Balance: ${loanAfter?.outstandingBalan...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-full-reversal-flow.ts
LINE: 137
TYPE: Console Statement Left In
CODE: `console.log(`[Result] Balance Change: ${delta}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-full-reversal-flow.ts
LINE: 140
TYPE: Console Statement Left In
CODE: `console.log("SUCCESS: Outstanding Balance increased by the reversed amount (Liab...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-full-reversal-flow.ts
LINE: 151
TYPE: Console Statement Left In
CODE: `console.log(`[After] TX Found. Description: "${rowAfter.description}", isVoided:...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-full-reversal-flow.ts
LINE: 152
TYPE: Console Statement Left In
CODE: `console.log(`[After] Row Data: Debit: ${rowAfter.debit}, Credit: ${rowAfter.cred...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-full-reversal-flow.ts
LINE: 164
TYPE: Console Statement Left In
CODE: `console.log(`[After] Prev Row Balance: ${prevRow.runningBalance}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-full-reversal-flow.ts
LINE: 165
TYPE: Console Statement Left In
CODE: `console.log(`[After] This Row Balance: ${rowAfter.runningBalance}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-full-reversal-flow.ts
LINE: 170
TYPE: Console Statement Left In
CODE: `console.log("SUCCESS: Running Balance is unchanged by this transaction (Effectiv...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-full-reversal-flow.ts
LINE: 176
TYPE: Console Statement Left In
CODE: `console.log(`GL Reversed? ${glCheck?.isReversed}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-full-reversal-flow.ts
LINE: 179
TYPE: Console Statement Left In
CODE: `console.log("SUCCESS: End-to-End Reversal Verified.")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-ledger-integrity.ts
LINE: 8
TYPE: Console Statement Left In
CODE: `console.log('🔍 Starting Ledger Integrity Verification...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-ledger-integrity.ts
LINE: 9
TYPE: Console Statement Left In
CODE: `console.log('==========================================')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-ledger-integrity.ts
LINE: 30
TYPE: Console Statement Left In
CODE: `console.log('ℹ️ No control accounts found with children.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-ledger-integrity.ts
LINE: 37
TYPE: Console Statement Left In
CODE: `console.log(`\nEvaluating Control Account: ${parent.code} - ${parent.name}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-ledger-integrity.ts
LINE: 47
TYPE: Console Statement Left In
CODE: `console.log(`- Parent Balance:   ${parentBalance.toFixed(2)}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-ledger-integrity.ts
LINE: 48
TYPE: Console Statement Left In
CODE: `console.log(`- Sum of ${parent.children.length} Children: ${childrenSum.toFixed(...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-ledger-integrity.ts
LINE: 54
TYPE: Console Statement Left In
CODE: `console.log(`✅ Integrity Verified (Match)`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-ledger-integrity.ts
LINE: 58
TYPE: Console Statement Left In
CODE: `console.log('\n--- Summary ---')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-ledger-integrity.ts
LINE: 60
TYPE: Console Statement Left In
CODE: `console.log('✅ ALL CONTROL ACCOUNTS ARE IN BALANCE.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-ledger-integrity.ts
LINE: 62
TYPE: Console Statement Left In
CODE: `console.warn(`⚠️ FOUND ${totalDiscrepancies} DISCREPANCIES. Investigation requir...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-loan-balance.ts
LINE: 8
TYPE: Console Statement Left In
CODE: `console.log('🧪 Starting Loan Balance Service Verification...');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-loan-balance.ts
LINE: 50
TYPE: Console Statement Left In
CODE: `console.log(`📝 Created Test Loan: ${loan.id}`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-loan-balance.ts
LINE: 54
TYPE: Console Statement Left In
CODE: `console.log(`Check 1: Initial Balance: ${bal1} (Expected: 0)`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-loan-balance.ts
LINE: 82
TYPE: Console Statement Left In
CODE: `console.log(`Check 2: Post-Disbursement: ${bal2} (Expected: 1000)`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-loan-balance.ts
LINE: 110
TYPE: Console Statement Left In
CODE: `console.log(`Check 3: Post-Repayment: ${bal3} (Expected: 800)`);`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-loan-balance.ts
LINE: 118
TYPE: Console Statement Left In
CODE: `console.log('✅ Verification Successful! (Changes rolled back)');`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-loan-balances.ts
LINE: 41
TYPE: Console Statement Left In
CODE: `console.log('🔍 Verifying Loan Balances...\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-loan-balances.ts
LINE: 58
TYPE: Console Statement Left In
CODE: `console.log(`📋 Checking ${activeLoans.length} active loans\n`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-loan-balances.ts
LINE: 70
TYPE: Console Statement Left In
CODE: `console.log(`${status} ${loan.loanApplicationNumber} - ${loan.member.name}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-loan-balances.ts
LINE: 71
TYPE: Console Statement Left In
CODE: `console.log(`   DB Balance: ${dbBalance.toFixed(2)}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-loan-balances.ts
LINE: 72
TYPE: Console Statement Left In
CODE: `console.log(`   Calculated: ${calculatedBalance.toFixed(2)}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-loan-balances.ts
LINE: 75
TYPE: Console Statement Left In
CODE: `console.log(`   Difference: ${difference.toFixed(2)}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-loan-balances.ts
LINE: 85
TYPE: Console Statement Left In
CODE: `console.log('')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-loan-balances.ts
LINE: 89
TYPE: Console Statement Left In
CODE: `console.log('📊 Summary:')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-loan-balances.ts
LINE: 90
TYPE: Console Statement Left In
CODE: `console.log(`   Total Loans Checked: ${activeLoans.length}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-loan-balances.ts
LINE: 91
TYPE: Console Statement Left In
CODE: `console.log(`   Exact Matches: ${exactMatches}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-loan-balances.ts
LINE: 92
TYPE: Console Statement Left In
CODE: `console.log(`   Discrepancies (>= 0.01): ${discrepancies}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-loan-balances.ts
LINE: 95
TYPE: Console Statement Left In
CODE: `console.log('\n⚠️  Warning: Some loans have balance discrepancies!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-loan-balances.ts
LINE: 96
TYPE: Console Statement Left In
CODE: `console.log('   Consider running LoanBalanceService.updateLoanBalance() for affe...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-loan-balances.ts
LINE: 98
TYPE: Console Statement Left In
CODE: `console.log('\n✅ All loan balances are accurate!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-loan-balances.ts
LINE: 108
TYPE: Console Statement Left In
CODE: `console.log(`\n⚠️  ${shouldBeCleared.length} loans have zero balance but are not...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-loan-balances.ts
LINE: 110
TYPE: Console Statement Left In
CODE: `console.log(`   - ${loan.loanApplicationNumber} (${loan.member.name})`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-permissions.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('🕵️ Verifying Module Access...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-permissions.ts
LINE: 15
TYPE: Console Statement Left In
CODE: `console.log(`📚 Found ${allModuleKeys.length} System Modules: ${allModuleKeys.jo...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-permissions.ts
LINE: 18
TYPE: Console Statement Left In
CODE: `console.log(`\n👤 Checking Role: ${role}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-permissions.ts
LINE: 33
TYPE: Console Statement Left In
CODE: `console.log(`   ✅ FULL ACCESS CONFIRMED (${accessibleModules.length} modules)`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-permissions.ts
LINE: 35
TYPE: Console Statement Left In
CODE: `console.log(`   ❌ MISSING MODULES: ${missingModules.join(', ')}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-permissions.ts
LINE: 36
TYPE: Console Statement Left In
CODE: `console.log(`   ⚠️  Accessible: ${accessibleModules.join(', ')}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-reversal.ts
LINE: 13
TYPE: Console Statement Left In
CODE: `console.log('--- Starting Reversal Verification ---')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-reversal.ts
LINE: 31
TYPE: Console Statement Left In
CODE: `console.log('No eligible loan with installments and repayments found.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-reversal.ts
LINE: 42
TYPE: Console Statement Left In
CODE: `console.log('No eligible repayment found for testing.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-reversal.ts
LINE: 46
TYPE: Console Statement Left In
CODE: `console.log(`Target Transaction: ${transaction.id} | Amount: ${transaction.amoun...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-reversal.ts
LINE: 47
TYPE: Console Statement Left In
CODE: `console.log(`Loan Balance BEFORE: ${transaction.loan.outstandingBalance}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-reversal.ts
LINE: 62
TYPE: Console Statement Left In
CODE: `console.log('STEP A: Transaction marked as reversed.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-reversal.ts
LINE: 77
TYPE: Console Statement Left In
CODE: `console.log('STEP B: GL Entry reversed.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-reversal.ts
LINE: 78
TYPE: Console Statement Left In
CODE: `console.log('STEP B: No linked GL entry found. Skipping GL reversal.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-reversal.ts
LINE: 98
TYPE: Console Statement Left In
CODE: `console.log('STEP A2: Created Explicit REVERSAL Transaction.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-reversal.ts
LINE: 102
TYPE: Console Statement Left In
CODE: `console.log('STEP C: Transactions replayed.', result)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-reversal.ts
LINE: 110
TYPE: Console Statement Left In
CODE: `console.log(`Loan Balance AFTER: ${updatedLoan?.outstandingBalance}`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-reversal.ts
LINE: 121
TYPE: Console Statement Left In
CODE: `console.log(`Balance Change: ${change} (Expected ~${transaction.amount})`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-reversal.ts
LINE: 124
TYPE: Console Statement Left In
CODE: `console.log('SUCCESS: Balance updated correctly.')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-reversal.ts
LINE: 125
TYPE: Console Statement Left In
CODE: `console.log('WARNING: Balance change does not match transaction amount exactly. ...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-reversal.ts
LINE: 140
TYPE: Console Statement Left In
CODE: `console.log(`SUCCESS: REVERSAL transaction created: ${reversalTx.id} | Amount: $...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-status.ts
LINE: 6
TYPE: Console Statement Left In
CODE: `console.log("🧪 Starting Contribution Status Verification...")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-status.ts
LINE: 15
TYPE: Console Statement Left In
CODE: `console.log("⚠️ No active members found. Creating temporary test member...")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-status.ts
LINE: 37
TYPE: Console Statement Left In
CODE: `console.log(`👤 Testing with Member: ${member.name} (${member.memberNumber})`)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-status.ts
LINE: 64
TYPE: Console Statement Left In
CODE: `console.log(`📊 Initial Status: Due: ${initial.monthlyDue}, Paid: ${initial.tota...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-status.ts
LINE: 67
TYPE: Console Statement Left In
CODE: `console.log("💸 Simulating Payment of 500...")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-status.ts
LINE: 83
TYPE: Console Statement Left In
CODE: `console.log(`📊 Post-Payment Status: Due: ${afterPayment.monthlyDue}, Paid: ${af...`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-status.ts
LINE: 87
TYPE: Console Statement Left In
CODE: `console.log("✅ SUCCESS: Payment correctly reflected in status calculation.")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-status.ts
LINE: 96
TYPE: Console Statement Left In
CODE: `console.log("🧹 Cleaning up test data...")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-status.ts
LINE: 101
TYPE: Console Statement Left In
CODE: `console.log("🧹 Deleting temporary test member...")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-status.ts
LINE: 105
TYPE: Console Statement Left In
CODE: `console.log("✨ Test Complete.")`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-user.ts
LINE: 7
TYPE: Console Statement Left In
CODE: `console.log('🔍 Checking user credentials...\n')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-user.ts
LINE: 15
TYPE: Console Statement Left In
CODE: `console.log('❌ User not found!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-user.ts
LINE: 16
TYPE: Console Statement Left In
CODE: `console.log('Run: npx tsx prisma/seed-user.ts')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-user.ts
LINE: 20
TYPE: Console Statement Left In
CODE: `console.log('✅ User found in database:')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-user.ts
LINE: 21
TYPE: Console Statement Left In
CODE: `console.log('   Email:', user.email)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-user.ts
LINE: 22
TYPE: Console Statement Left In
CODE: `console.log('   Name:', user.name)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-user.ts
LINE: 23
TYPE: Console Statement Left In
CODE: `console.log('   Role:', user.role)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-user.ts
LINE: 24
TYPE: Console Statement Left In
CODE: `console.log('   Member ID:', user.memberId)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-user.ts
LINE: 25
TYPE: Console Statement Left In
CODE: `console.log('   Member:', user.member?.name)`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-user.ts
LINE: 26
TYPE: Console Statement Left In
CODE: `console.log('')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-user.ts
LINE: 33
TYPE: Console Statement Left In
CODE: `console.log('✅ Password verification: SUCCESS')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-user.ts
LINE: 34
TYPE: Console Statement Left In
CODE: `console.log('   The password "Admin123!" is correct!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-user.ts
LINE: 36
TYPE: Console Statement Left In
CODE: `console.log('❌ Password verification: FAILED')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-user.ts
LINE: 37
TYPE: Console Statement Left In
CODE: `console.log('   The stored password hash does not match "Admin123!"')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-user.ts
LINE: 38
TYPE: Console Statement Left In
CODE: `console.log('   Resetting password...')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-user.ts
LINE: 47
TYPE: Console Statement Left In
CODE: `console.log('✅ Password reset to: Admin123!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-user.ts
LINE: 50
TYPE: Console Statement Left In
CODE: `console.log('')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-user.ts
LINE: 51
TYPE: Console Statement Left In
CODE: `console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-user.ts
LINE: 52
TYPE: Console Statement Left In
CODE: `console.log('📋 Login Credentials:')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-user.ts
LINE: 53
TYPE: Console Statement Left In
CODE: `console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-user.ts
LINE: 54
TYPE: Console Statement Left In
CODE: `console.log('📧 Email:    admin@capitalcrew.com')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-user.ts
LINE: 55
TYPE: Console Statement Left In
CODE: `console.log('🔑 Password: Admin123!')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-user.ts
LINE: 56
TYPE: Console Statement Left In
CODE: `console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-user.ts
LINE: 57
TYPE: Console Statement Left In
CODE: `console.log('')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

FILE: C:/Users/Hp/Downloads/Capital Crew/capital-crew/scripts/verify-user.ts
LINE: 58
TYPE: Console Statement Left In
CODE: `console.log('🌐 Login URL: http://localhost:3000/login')`
IMPACT: Leaks data into terminal stdout and clutters production logs
FIX: Remove console statement or replace with proper logging framework

---

