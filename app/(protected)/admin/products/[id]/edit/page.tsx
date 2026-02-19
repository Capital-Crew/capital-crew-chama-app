import { db as prisma } from "@/lib/db"
import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { LoanProductWizard } from "@/components/products/LoanProductWizard"
import { LoanProductWizardValues } from "@/lib/schemas/loan-product-schema"

export default async function EditLoanProductPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session?.user) return redirect("/auth/login")

    const { id } = await params;

    // 1. Fetch Product
    const product = await prisma.loanProduct.findUnique({
        where: { id }
    });

    if (!product) {
        return notFound();
    }

    // 2. Fetch Mappings
    const mappings = await prisma.productAccountingMapping.findMany({
        where: { productId: id }
    });

    // 3. Fetch Accounts for Dropdowns
    const accounts = await prisma.ledgerAccount.findMany({
        where: { isActive: true },
        select: { id: true, name: true, code: true, type: true }
    });

    // 4. Transform to Wizard Values
    const findAccount = (type: string) => mappings.find((m) => m.accountType === type)?.accountId || "";

    const initialData: Partial<LoanProductWizardValues> = {
        name: product.name,
        shortCode: product.shortCode || "",
        description: product.description || "",
        currency: product.currency,

        principal: Number(product.principal),
        minPrincipal: Number(product.minPrincipal),
        maxPrincipal: Number(product.maxPrincipal),

        numberOfRepayments: product.numberOfRepayments,
        minRepaymentTerms: product.minRepaymentTerms,
        maxRepaymentTerms: product.maxRepaymentTerms,

        repaymentEvery: product.repaymentEvery,
        // Prisma Enum to String mapping is automatic, but "MONTHS" vs "MONTHLY" needs check
        // If DB has "MONTHS", and Form expects "MONTHLY".
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
