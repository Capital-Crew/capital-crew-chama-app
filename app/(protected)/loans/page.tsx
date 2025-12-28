
import prisma from "@/lib/prisma"
import { LoanManagement } from "@/components/LoanManagement"
import { auth } from "@/auth"

export default async function LoansPage() {
    const session = await auth()

    // Fetch critical data
    const [loans, members, products] = await Promise.all([
        prisma.loan.findMany({
            include: { member: true }, // Simple include, logic handled in component
            orderBy: { applicationDate: 'desc' }
        }),
        prisma.member.findMany({ orderBy: { name: 'asc' } }),
        prisma.loanProduct.findMany({ where: { isActive: true } })
    ])

    return (
        <LoanManagement
            loans={loans as any} // Cast because of Json fields
            members={members}
            products={products as any}
            currentUserId={session?.user?.id || ''}
            userRole={session?.user?.role || 'MEMBER'}
        />
    )
}
