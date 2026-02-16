import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { getCurrentUserPermissions } from '@/app/actions/user-permissions';

export default async function DebugLedgerPage() {
    const session = await auth();
    const modules = await prisma.systemModule.findMany();
    const user = await prisma.user.findUnique({
        where: { id: session?.user?.id },
        include: { extensions: true }
    });

    // Explicitly check role permissions table
    const rolePermissions = await prisma.rolePermission.findMany({
        where: { role: user?.role }
    });

    const calculatedPermissions = await getCurrentUserPermissions();

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 font-mono text-sm">
            <h1 className="text-2xl font-bold">Ledger Debug Dashboard</h1>

            <section className="space-y-2">
                <h2 className="text-xl font-bold bg-slate-100 p-2">1. Environment & Database</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>Database URL Set:</div>
                    <div className="font-bold">{process.env.DATABASE_URL ? 'YES' : 'NO'}</div>
                </div>
            </section>

            <section className="space-y-2">
                <h2 className="text-xl font-bold bg-slate-100 p-2">2. System Modules (DB)</h2>
                <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-auto">
                    {JSON.stringify(modules, null, 2)}
                </pre>
                {modules.find(m => m.key === 'ledger') ? (
                    <div className="text-green-600 font-bold">✅ Ledger Module Found</div>
                ) : (
                    <div className="text-red-600 font-bold">❌ Ledger Module MISSING from DB</div>
                )}
            </section>

            <section className="space-y-2">
                <h2 className="text-xl font-bold bg-slate-100 p-2">3. Current User</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>User ID:</div>
                    <div>{session?.user?.id}</div>
                    <div>Role:</div>
                    <div>{user?.role}</div>
                </div>
            </section>

            <section className="space-y-2">
                <h2 className="text-xl font-bold bg-slate-100 p-2">4. Role Permissions (DB)</h2>
                <pre className="bg-slate-900 text-yellow-400 p-4 rounded-lg overflow-auto">
                    {JSON.stringify(rolePermissions, null, 2)}
                </pre>
            </section>

            <section className="space-y-2">
                <h2 className="text-xl font-bold bg-slate-100 p-2">5. Calculated Permissions (App Level)</h2>
                <pre className="bg-slate-900 text-cyan-400 p-4 rounded-lg overflow-auto">
                    {JSON.stringify(calculatedPermissions, null, 2)}
                </pre>
                {calculatedPermissions?.permissions?.canManageLedger ? (
                    <div className="text-green-600 font-bold">✅ App thinks you have access</div>
                ) : (
                    <div className="text-red-600 font-bold">❌ App thinks you DO NOT have access</div>
                )}
            </section>
        </div>
    );
}
