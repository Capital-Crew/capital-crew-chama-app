
import { auth } from "@/auth"
import { PrismaClient } from "@prisma/client"
import { redirect, notFound } from "next/navigation"
import { LoanProductWizard } from "@/components/products/LoanProductWizard"
import { LoanProductWizardValues } from "@/lib/schemas/loan-product-schema"

// Use local Prisma for raw query
const prisma = new PrismaClient();

export default async function EditLoanProductPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session?.user) return redirect("/auth/login")

    const { id } = await params;

    // 1. Fetch Product via RAW SQL (Bypassing Stale Client)
    // We selecting * to get all columns including new ones like shortCode
    const rawProduct = await prisma.$queryRaw<any[]>`
        SELECT * FROM "LoanProduct" WHERE id = ${id} LIMIT 1
    `;

    if (!rawProduct || rawProduct.length === 0) {
        return notFound();
    }

    const product = rawProduct[0];

    // 2. Fetch Mappings via RAW SQL
    const rawMappings = await prisma.$queryRaw<any[]>`
        SELECT * FROM "ProductAccountingMapping" WHERE "productId" = ${id}
    `;

    // 3. Fetch Accounts for Dropdowns
    const accounts = await prisma.$queryRaw<any[]>`
        SELECT * FROM "Account" WHERE "isActive" = true
    `;

    // 3. Transform to Wizard Values
    // Note: Postgres returns columns in case usually preserved if quoted in creation, but here standard behavior applies.
    // We assume columns match schema names because we created them.

    // Helper to find account ID by type
    const findAccount = (type: string) => rawMappings.find((m: any) => m.accountType === type)?.accountId || "";

    const initialData: Partial<LoanProductWizardValues> = {
        name: product.name,
        shortCode: product.shortCode, // Valid in DB
        description: product.description || "",
        currency: product.currency,

        principal: Number(product.principal),
        minPrincipal: Number(product.minPrincipal),
        maxPrincipal: Number(product.maxPrincipal),

        numberOfRepayments: product.numberOfRepayments,
        minRepaymentTerms: product.minRepaymentTerms,
        maxRepaymentTerms: product.maxRepaymentTerms,

        repaymentEvery: product.repaymentEvery,
        // Map ENUM back if necessary (DB might return "MONTHS", form expects "MONTHLY"?) 
        // Form schema expects "MONTHLY". DB has "MONTHS". 
        // We need REVERSE MAPPING.
        repaymentFrequencyType: (product.repaymentFrequencyType === 'MONTHS' ? 'MONTHLY' : product.repaymentFrequencyType === 'WEEKS' ? 'WEEKLY' : product.repaymentFrequencyType) as any,

        interestRatePerPeriod: Number(product.interestRatePerPeriod),
        interestType: product.interestType as any,
        interestCalculationPeriodType: product.interestCalculationPeriodType as any,
        amortizationType: product.amortizationType as any,

        defaultPenaltyRate: Number(product.defaultPenaltyRate),
        gracePeriod: product.gracePeriod,

        // Mappings
        fundSourceAccountId: findAccount('FUND_SOURCE'),
        loanPortfolioAccountId: findAccount('LOAN_PORTFOLIO'),
        interestIncomeAccountId: findAccount('INTEREST_INCOME'),
        interestReceivableAccountId: findAccount('INTEREST_RECEIVABLE'),
        penaltyIncomeAccountId: findAccount('PENALTY_INCOME'),
        penaltyReceivableAccountId: findAccount('PENALTY_RECEIVABLE'),
    };

    return (
        <div className="max-w-5xl mx-auto py-10 space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Edit Product</h1>
                <p className="text-slate-500 font-medium">Modify loan terms and configuration.{product.shortCode ? ` (${product.shortCode})` : ''}</p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
                <LoanProductWizard initialData={initialData} productId={id} accounts={accounts} />
            </div>
        </div>
    )
}
