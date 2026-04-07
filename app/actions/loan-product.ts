'use server'

import { auth } from "@/auth"
import { PrismaClient, AuditLogAction } from "@prisma/client"
import { randomUUID } from "crypto"
// import { db as prisma } from "@/lib/db" // BYPASSING SINGLETON
import { loanProductWizardSchema, LoanProductWizardValues } from "@/lib/schemas/loan-product-schema"
import { ProductAccountingType } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { withAudit } from "@/lib/with-audit"

export const createLoanProductWizard = withAudit(
    { actionType: AuditLogAction.PRODUCT_CREATED, domain: 'LOANS', apiRoute: '/api/loans/products/wizard/create' },
    async (ctx, data: LoanProductWizardValues) => {
        ctx.beginStep('Verify Authorization');
        const prisma = new PrismaClient();
        const session = await auth()

        if (!session?.user?.role || !['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN'].includes(session.user.role)) {
            ctx.setErrorCode('FORBIDDEN');
            throw new Error("Unauthorized: Only Admins can create loan products")
        }
        ctx.endStep('Verify Authorization');

        ctx.beginStep('Validate Input and Data');
        const validated = loanProductWizardSchema.safeParse(data);
        if (!validated.success) {
            ctx.setErrorCode('VALIDATION_FAILED');
            throw new Error("Validation Failed: " + validated.error.message);
        }

        const {
            name, shortCode, description, currency,
            principal, minPrincipal, maxPrincipal,
            numberOfRepayments, minRepaymentTerms, maxRepaymentTerms,
            repaymentEvery, repaymentFrequencyType,
            interestRatePerPeriod, interestType, interestCalculationPeriodType, amortizationType,
            defaultPenaltyRate, gracePeriod,
            fundSourceAccountId, loanPortfolioAccountId, interestRevenueAccountId,
            interestReceivableAccountId, penaltyRevenueAccountId, penaltyReceivableAccountId
        } = validated.data;
        ctx.endStep('Validate Input and Data');

        try {
            ctx.beginStep('Insert Loan Product');
            const id = crypto.randomUUID();
            const now = new Date();

            await prisma.$executeRaw`
                INSERT INTO "LoanProduct" (
                    "id", "name", "shortCode", "description", "currency",
                    "principal", "minPrincipal", "maxPrincipal",
                    "numberOfRepayments", "minRepaymentTerms", "maxRepaymentTerms",
                    "repaymentEvery", "repaymentFrequencyType",
                    "interestRatePerPeriod", "interestType", "interestCalculationPeriodType", "amortizationType",
                    "defaultPenaltyRate", "gracePeriod",
                    "charges", "isActive", "updatedAt", "createdAt"
                ) VALUES (
                    ${id}, ${name}, ${shortCode}, ${description}, ${currency},
                    ${principal}, ${minPrincipal}, ${maxPrincipal},
                    ${numberOfRepayments}, ${minRepaymentTerms}, ${maxRepaymentTerms},
                    ${repaymentEvery}, ${(repaymentFrequencyType === 'MONTHLY' ? 'MONTHS' : repaymentFrequencyType === 'WEEKLY' ? 'WEEKS' : repaymentFrequencyType)}::"RepaymentFrequencyType",
                    ${interestRatePerPeriod}, ${interestType}::"InterestType", ${interestCalculationPeriodType}::"InterestCalculationPeriodType", ${amortizationType}::"AmortizationType",
                    ${defaultPenaltyRate}, ${gracePeriod},
                    '[]', ${true}, ${now}, ${now}
                )
            `;

            const newProduct = { id };
            ctx.captureAfter(validated.data);
            ctx.endStep('Insert Loan Product');

            ctx.beginStep('Create Accounting Mappings');
            const createMapping = async (type: ProductAccountingType, accountId: string) => {
                const mappingId = randomUUID();
                await prisma.$executeRaw`
                    INSERT INTO "ProductAccountingMapping" ("id", "productId", "accountId", "accountType")
                    VALUES (${mappingId}, ${newProduct.id}, ${accountId}, ${type}::"ProductAccountingType")
                `;
            }

            await createMapping("FUND_SOURCE", fundSourceAccountId);
            await createMapping("LOAN_PORTFOLIO", loanPortfolioAccountId);
            await createMapping("INTEREST_REVENUE", interestRevenueAccountId);
            await createMapping("INTEREST_RECEIVABLE", interestReceivableAccountId);
            await createMapping("PENALTY_REVENUE", penaltyRevenueAccountId);
            await createMapping("PENALTY_RECEIVABLE", penaltyReceivableAccountId);
            ctx.endStep('Create Accounting Mappings');

            await prisma.$disconnect();
            revalidatePath('/admin/system');
            return { success: true, productId: newProduct.id };

        } catch (error: any) {
            await prisma.$disconnect();
            ctx.setErrorCode('DATABASE_ERROR');
            if (error.code === 'P2002' && error.meta?.target?.includes('shortCode')) {
                throw new Error("Short Code must be unique. '" + shortCode + "' is already taken.");
            }
            if (error.message?.includes('UNIQUE constraint failed') || error.message?.includes('LoanProduct_shortCode_key')) {
                throw new Error("Short Code must be unique. '" + shortCode + "' is already taken.");
            }
            throw new Error(error.message);
        }
    }
);

export const updateLoanProductWizard = withAudit(
    { actionType: AuditLogAction.PRODUCT_UPDATED, domain: 'LOANS', apiRoute: '/api/loans/products/wizard/update' },
    async (ctx, id: string, data: LoanProductWizardValues) => {
        ctx.beginStep('Verify Authorization');
        const session = await auth()
        if (!session?.user) redirect("/auth/login")

        const prisma = new PrismaClient();
        ctx.endStep('Verify Authorization');

        ctx.beginStep('Validate Input and Data');
        const validated = loanProductWizardSchema.safeParse(data);
        if (!validated.success) {
            const errorMsg = validated.error.issues?.[0]?.message || "Validation failed";
            ctx.setErrorCode('VALIDATION_FAILED');
            throw new Error(errorMsg);
        }

        const {
            name, shortCode, description, currency,
            principal, minPrincipal, maxPrincipal,
            numberOfRepayments, minRepaymentTerms, maxRepaymentTerms,
            repaymentEvery, repaymentFrequencyType,
            interestRatePerPeriod, interestType, interestCalculationPeriodType, amortizationType,
            defaultPenaltyRate, gracePeriod,
            fundSourceAccountId, loanPortfolioAccountId, interestRevenueAccountId,
            interestReceivableAccountId, penaltyRevenueAccountId, penaltyReceivableAccountId
        } = validated.data;
        ctx.captureBefore('ProductData', id, { id }); // Metadata only, raw SQL bypasses fetch
        ctx.endStep('Validate Input and Data');

        try {
            ctx.beginStep('Update Loan Product');
            const now = new Date();

            await prisma.$executeRaw`
                UPDATE "LoanProduct" SET
                    "name" = ${name},
                    "shortCode" = ${shortCode},
                    "description" = ${description},
                    "currency" = ${currency},
                    "principal" = ${principal},
                    "minPrincipal" = ${minPrincipal},
                    "maxPrincipal" = ${maxPrincipal},
                    "numberOfRepayments" = ${numberOfRepayments},
                    "minRepaymentTerms" = ${minRepaymentTerms},
                    "maxRepaymentTerms" = ${maxRepaymentTerms},
                    "repaymentEvery" = ${repaymentEvery},
                    "repaymentFrequencyType" = ${(repaymentFrequencyType === 'MONTHLY' ? 'MONTHS' : repaymentFrequencyType === 'WEEKLY' ? 'WEEKS' : repaymentFrequencyType)}::"RepaymentFrequencyType",
                    "interestRatePerPeriod" = ${interestRatePerPeriod},
                    "interestType" = ${interestType}::"InterestType",
                    "interestCalculationPeriodType" = ${interestCalculationPeriodType}::"InterestCalculationPeriodType",
                    "amortizationType" = ${amortizationType}::"AmortizationType",
                    "defaultPenaltyRate" = ${defaultPenaltyRate},
                    "gracePeriod" = ${gracePeriod},
                    "updatedAt" = ${now}
                WHERE "id" = ${id}
            `;
            ctx.captureAfter(validated.data);
            ctx.endStep('Update Loan Product');

            ctx.beginStep('Update Accounting Mappings');
            await prisma.$executeRaw`DELETE FROM "ProductAccountingMapping" WHERE "productId" = ${id}`;

            const createMapping = async (type: ProductAccountingType, accountId: string) => {
                const mappingId = randomUUID();
                await prisma.$executeRaw`
                    INSERT INTO "ProductAccountingMapping" ("id", "productId", "accountId", "accountType")
                    VALUES (${mappingId}, ${id}, ${accountId}, ${type}::"ProductAccountingType")
                `;
            }

            await createMapping("FUND_SOURCE", fundSourceAccountId);
            await createMapping("LOAN_PORTFOLIO", loanPortfolioAccountId);
            await createMapping("INTEREST_REVENUE", interestRevenueAccountId);
            await createMapping("INTEREST_RECEIVABLE", interestReceivableAccountId);
            await createMapping("PENALTY_REVENUE", penaltyRevenueAccountId);
            await createMapping("PENALTY_RECEIVABLE", penaltyReceivableAccountId);
            ctx.endStep('Update Accounting Mappings');

            await prisma.$disconnect();
            revalidatePath('/admin/system');
            return { success: true, productId: id };

        } catch (error: any) {
            await prisma.$disconnect();
            ctx.setErrorCode('DATABASE_ERROR');
            if (error.message?.includes('UNIQUE constraint failed') || error.message?.includes('LoanProduct_shortCode_key')) {
                throw new Error("Short Code must be unique. '" + shortCode + "' is already taken.");
            }
            throw new Error(error.message);
        }
    }
);


export const toggleLoanProductStatus = withAudit(
    { actionType: AuditLogAction.PRODUCT_UPDATED, domain: 'LOANS', apiRoute: '/api/loans/products/toggle' },
    async (ctx, productId: string, isActive: boolean) => {
        ctx.beginStep('Verify Authorization');
        const session = await auth();
        if (!session?.user) redirect("/auth/login");

        const prisma = new PrismaClient();
        ctx.endStep('Verify Authorization');

        try {
            ctx.beginStep('Update Status');
            await prisma.$executeRaw`
                UPDATE "LoanProduct"
                SET "isActive" = ${isActive}
                WHERE "id" = ${productId}
            `;
            ctx.captureAfter({ productId, isActive });
            ctx.endStep('Update Status');

            await prisma.$disconnect();
            revalidatePath('/admin/system');
            return { success: true };
        } catch (error: any) {
            await prisma.$disconnect();
            ctx.setErrorCode('DATABASE_ERROR');
            throw new Error("Failed to update status");
        }
    }
);
