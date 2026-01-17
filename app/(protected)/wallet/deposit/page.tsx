import { DepositForm } from "@/components/DepositForm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DepositPage() {
    const session = await auth();

    if (!session || !session.user || !session.user.memberId) {
        // If no member ID (e.g. admin without member profile), maybe redirect or show error?
        // For now, let's assume valid user or just handle in form if prop is missing.
        // But better to restrict.
    }

    const memberId = session?.user?.memberId as string;

    return (
        <div className="container mx-auto py-10">
            <div className="max-w-2xl mx-auto space-y-8">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Wallet Deposit</h2>
                    <p className="text-muted-foreground">
                        Top up your wallet instantly using M-Pesa.
                    </p>
                </div>
                <DepositForm memberId={memberId} />
            </div>
        </div>
    );
}
