
import React from 'react';
import { getPermissionsMatrix } from '@/app/actions/rbac-actions';
import { PermissionsMatrix } from '@/components/admin/PermissionsMatrix';
import { ShieldCheck } from 'lucide-react';

export default async function AccessControlPage() {
    // Fetch data server-side
    const { modules, permissions } = await getPermissionsMatrix();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#00c2e0]/10 flex items-center justify-center text-[#00c2e0]">
                    <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Access Control Matrix</h1>
                    <p className="text-slate-500 font-medium">Manage role-based access to system modules.</p>
                </div>
            </div>

            <PermissionsMatrix modules={modules} initialPermissions={permissions} />
        </div>
    );
}
