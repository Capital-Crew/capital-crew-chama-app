'use server'

import { auth } from "@/auth"
import { PrismaClient } from "@prisma/client"
import { randomUUID } from "crypto"
// import { db as prisma } from "@/lib/db" // BYPASSING SINGLETON
import { loanProductWizardSchema, LoanProductWizardValues } from "@/lib/schemas/loan-product-schema"
import { ProductAccountingType } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createLoanProductWizard(data: LoanProductWizardValues) {
    const prisma = new PrismaClient(); // LOCAL INSTANCE for debugging
    const session = await auth()

    // Authorization
    if (!session?.user?.role || !['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN'].includes(session.user.role)) {
        throw new Error("Unauthorized: Only Admins can create loan products")
    }

    // Validation
    const validated = loanProductWizardSchema.safeParse(data);
    if (!validated.success) {
        throw new Error("Validation Failed: " + validated.error.message);
    }

    const {
        // Step 1
        name, shortCode, description, currency,
        // Step 2
        principal, minPrincipal, maxPrincipal,
        numberOfRepayments, minRepaymentTerms, maxRepaymentTerms,
        repaymentEvery, repaymentFrequencyType,
        // Step 3
        interestRatePerPeriod, interestType, interestCalculationPeriodType, amortizationType,
        defaultPenaltyRate, gracePeriod,
        // Step 4
        fundSourceAccountId, loanPortfolioAccountId, interestIncomeAccountId,
        interestReceivableAccountId, penaltyIncomeAccountId, penaltyReceivableAccountId
    } = validated.data;

    // Transactional Creation (Manual)
    try {

        // Use Raw SQL to bypass Stale Client Validation
        // We use UUID for ID or let DB generate if default is supported, but safe to generate.
        const id = crypto.randomUUID();
        const now = new Date();

        // Cast enums to string for SQL
        // charges is empty array

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

        const newProduct = { id }; // Mock object for next steps

        // 2. Create Accounting Mappings
        const createMapping = async (type: ProductAccountingType, accountId: string) => {
            const mappingId = randomUUID();
            await prisma.$executeRaw`
                INSERT INTO "ProductAccountingMapping" ("id", "productId", "accountId", "accountType")
                VALUES (${mappingId}, ${newProduct.id}, ${accountId}, ${type}::"ProductAccountingType")
            `;
        }

        await createMapping("FUND_SOURCE", fundSourceAccountId);
        await createMapping("LOAN_PORTFOLIO", loanPortfolioAccountId);
        await createMapping("INTEREST_INCOME", interestIncomeAccountId);
        await createMapping("INTEREST_RECEIVABLE", interestReceivableAccountId);
        await createMapping("PENALTY_INCOME", penaltyIncomeAccountId);
        await createMapping("PENALTY_RECEIVABLE", penaltyReceivableAccountId);

        // Audit
        await prisma.auditLog.create({
            data: {
                userId: session.user.id!,
                action: "PRODUCT_CREATED",
                details: `Created Loan Product: ${name} (${shortCode}) with full accounting mapping.`
            }
        });

        await prisma.$disconnect();
        revalidatePath('/admin/system');
        return { success: true, productId: newProduct.id };

    } catch (error: any) {

        await prisma.$disconnect();

        if (error.code === 'P2002' && error.meta?.target?.includes('shortCode')) {
            throw new Error("Short Code must be unique. '" + shortCode + "' is already taken.");
        }
        // Unique constraint error from Raw SQL might look different.
        if (error.message?.includes('UNIQUE constraint failed') || error.message?.includes('LoanProduct_shortCode_key')) {
            throw new Error("Short Code must be unique. '" + shortCode + "' is already taken.");
        }


        throw new Error(error.message + "\n\n(See Server Console for formatting)");
    }
}

export async function updateLoanProductWizard(id: string, data: LoanProductWizardValues) {
    const session = await auth()
    if (!session?.user) redirect("/auth/login")

    const prisma = new PrismaClient(); // LOCAL INSTANCE for update action

    // Validate Input
    const validated = loanProductWizardSchema.safeParse(data);
    if (!validated.success) {
        const errorMsg = validated.error.issues?.[0]?.message || "Validation failed";
        throw new Error(errorMsg);
    }

    const {
        name, shortCode, description, currency,
        principal, minPrincipal, maxPrincipal,
        numberOfRepayments, minRepaymentTerms, maxRepaymentTerms,
        repaymentEvery, repaymentFrequencyType,
        interestRatePerPeriod, interestType, interestCalculationPeriodType, amortizationType,
        defaultPenaltyRate, gracePeriod,
        fundSourceAccountId, loanPortfolioAccountId, interestIncomeAccountId,
        interestReceivableAccountId, penaltyIncomeAccountId, penaltyReceivableAccountId
    } = validated.data;

    try {

        const now = new Date();

        // Raw SQL Update
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


        // 2. Update Accounting Mappings (Delete & Recreate)
        // Using transaction if possible? Raw queries are separate.
        // Isolation is okay here.

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
        await createMapping("INTEREST_INCOME", interestIncomeAccountId);
        await createMapping("INTEREST_RECEIVABLE", interestReceivableAccountId);
        await createMapping("PENALTY_INCOME", penaltyIncomeAccountId);
        await createMapping("PENALTY_RECEIVABLE", penaltyReceivableAccountId);

        // Audit
        await prisma.auditLog.create({
            data: {
                userId: session.user.id!,
                action: "PRODUCT_UPDATED",
                details: `Updated Loan Product: ${name} (${shortCode})`
            }
        });

        await prisma.$disconnect();
        revalidatePath('/admin/system');
        return { success: true, productId: id };

    } catch (error: any) {
        await prisma.$disconnect();

        // Check for unique constraint on shortCode if changed
        if (error.message?.includes('UNIQUE constraint failed') || error.message?.includes('LoanProduct_shortCode_key')) {
            throw new Error("Short Code must be unique. '" + shortCode + "' is already taken.");
        }

        throw new Error(error.message + "\n\n(See Server Console)");
    }
}


export async function toggleLoanProductStatus(productId: string, isActive: boolean) {
    const session = await auth();
    if (!session?.user) redirect("/auth/login");

    const prisma = new PrismaClient(); // LOCAL INSTANCE

    try {

        // Raw SQL Update
        await prisma.$executeRaw`
            UPDATE "LoanProduct"
            SET "isActive" = ${isActive}
            WHERE "id" = ${productId}
        `;

        await prisma.auditLog.create({
            data: {
                userId: session.user.id!,
                action: "PRODUCT_UPDATED",
                details: `Set Loan Product ${productId} status to ${isActive ? 'ACTIVE' : 'INACTIVE'}`
            }
        });

        await prisma.$disconnect();
        revalidatePath('/admin/system');
        return { success: true };
    } catch (error: any) {
        await prisma.$disconnect();
        throw new Error("Failed to update status");
    }
}
