import { db as prisma } from "@/lib/db"
import { auth } from "@/auth"
import { protectPage } from "@/lib/with-module-protection"
import { redirect } from "next/navigation"
import { LoanLimitsManager } from "@/components/admin/LoanLimitsManager"

export default async function LoanLimitsPage() {
    const session = await auth();

    if (!session?.user?.id) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 pt-20">
                <h1 className="text-2xl font-bold text-red-500">Authentication Required</h1>
                <p className="text-muted-foreground">Please log in to access loan limit settings.</p>
            </div>
        );
    }

    if (!await protectPage('ADMIN')) return redirect('/dashboard')

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    });

    const allowedRoles = ["CHAIRPERSON", "SYSTEM_ADMIN", "TREASURER", "SECRETARY"];
    if (!user?.role || !allowedRoles.includes(user.role)) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 pt-20">
                <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
                <p className="text-muted-foreground">You do not have permission to manage loan limits.</p>
            </div>
        );
    }

    const products = await prisma.loanProduct.findMany({
        orderBy: { name: 'asc' },
        select: {
            id: true,
            name: true,
            shortCode: true,
            isActive: true,
            maxConcurrentLoans: true,
            concurrentLimitActive: true,
            _count: {
                select: {
                    loans: {
                        where: {
                            status: { in: ['ACTIVE', 'APPROVED'] }
                        }
                    }
                }
            }
        }
    })

    const serializedProducts = products.map(p => ({
        id: p.id,
        name: p.name,
        shortCode: p.shortCode,
        isActive: p.isActive,
        maxConcurrentLoans: p.maxConcurrentLoans,
        concurrentLimitActive: p.concurrentLimitActive,
        activeLoansCount: p._count.loans,
    }))

    return (
        <div className="p-8">
            <LoanLimitsManager products={serializedProducts} />
        </div>
    )
}
