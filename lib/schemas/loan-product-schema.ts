import { z } from "zod";

// Enum constants to match Prisma Enums (ensure these match your actual Prisma schema Enums)
export const RepaymentFrequencyType = z.enum(["MONTHLY", "WEEKLY", "DAILY"]);
export const InterestType = z.enum(["FLAT", "DECLINING_BALANCE"]);
export const InterestCalculationPeriodType = z.enum(["SAME_AS_REPAYMENT", "DAILY", "DUE_DATE"]); // Adjust if needed
export const AmortizationType = z.enum(["EQUAL_INSTALLMENTS", "EQUAL_PRINCIPAL"]);

// --- Wizard Step Schemas ---

// Step 1: General Identity
export const step1Schema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters").max(100),
    shortCode: z.string().min(2, "Short code must be 2-4 chars").max(10).regex(/^[A-Z0-9]+$/, "Alphanumeric only"),
    description: z.string().optional(),
    currency: z.string().default("KES"),
});

// Step 2: Terms & Limits
export const step2Schema = z.object({
    principal: z.coerce.number().min(1, "Default principal required"),
    minPrincipal: z.coerce.number().min(0),
    maxPrincipal: z.coerce.number().min(1),

    numberOfRepayments: z.coerce.number().min(1, "Default terms required"),
    minRepaymentTerms: z.coerce.number().min(1),
    maxRepaymentTerms: z.coerce.number().min(1),

    repaymentEvery: z.coerce.number().default(1),
    repaymentFrequencyType: RepaymentFrequencyType.default("MONTHLY"),
}).refine(data => data.minPrincipal <= data.principal && data.principal <= data.maxPrincipal, {
    message: "Default principal must be between Min and Max",
    path: ["principal"]
}).refine(data => data.minRepaymentTerms <= data.numberOfRepayments && data.numberOfRepayments <= data.maxRepaymentTerms, {
    message: "Default terms must be between Min and Max",
    path: ["numberOfRepayments"]
});

// Step 3: Engine Configuration
export const step3Schema = z.object({
    interestRatePerPeriod: z.coerce.number().min(0, "Interest rate cannot be negative"),
    interestType: InterestType.default("DECLINING_BALANCE"),
    interestCalculationPeriodType: InterestCalculationPeriodType.default("SAME_AS_REPAYMENT"),
    amortizationType: AmortizationType.default("EQUAL_INSTALLMENTS"),

    defaultPenaltyRate: z.coerce.number().min(0).default(0),
    gracePeriod: z.coerce.number().min(0).default(0),
});

// Step 4: Accounting Mapping
export const step4Schema = z.object({
    // We expect Account IDs (UUIDs or CUIDs)
    fundSourceAccountId: z.string().min(1, "Fund Source is required"),
    loanPortfolioAccountId: z.string().min(1, "Loan Portfolio is required"),
    interestIncomeAccountId: z.string().min(1, "Interest Income is required"),
    interestReceivableAccountId: z.string().min(1, "Interest Receivable is required"),
    penaltyIncomeAccountId: z.string().min(1, "Penalty Income is required"),
    penaltyReceivableAccountId: z.string().min(1, "Penalty Receivable is required"),
});

// --- Combined Schema ---
export const loanProductWizardSchema = step1Schema
    .merge(step2Schema)
    .merge(step3Schema)
    .merge(step4Schema);

export type LoanProductWizardValues = z.infer<typeof loanProductWizardSchema>;
