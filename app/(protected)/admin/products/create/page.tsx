import prisma from "@/lib/prisma";
import { LoanProductWizard } from "@/components/products/LoanProductWizard";

export default async function CreateProductPage() {
    const accounts = await prisma.ledgerAccount.findMany({
        where: { isActive: true },
        select: { id: true, name: true, code: true, type: true }
    });

    return (
        <div className="container mx-auto py-10 max-w-5xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create Loan Product</h1>
                <p className="text-slate-500 mt-2">Configure a new lending product with automated penalties, interest calculation, and accounting mapping.</p>
            </div>

            <LoanProductWizard accounts={accounts} />
        </div>
    )
}
