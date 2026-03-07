'use client'

import React, { useState } from 'react';
import { UserRole } from '@prisma/client';
import { Checkbox } from "@/components/ui/checkbox";
import { togglePermission } from '@/app/actions/rbac-actions';
import { toast } from 'sonner';
import { Loader2, Lock } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface Module {
    key: string;
    name: string;
    description: string | null;
}

interface Permission {
    role: UserRole;
    moduleKey: string;
    canAccess: boolean;
}

interface PermissionsMatrixProps {
    modules: Module[];
    initialPermissions: Permission[];
}

export function PermissionsMatrix({ modules, initialPermissions }: PermissionsMatrixProps) {
    // We can use optimistic state here, but for simplicity/robustness we'll just use local state seeded from server
    const [permissions, setPermissions] = useState<Permission[]>(initialPermissions);
    const [loading, setLoading] = useState<Record<string, boolean>>({});

    const allRoles: UserRole[] = ['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'MEMBER'];
    // SYSTEM_ADMIN is separated as it's the master role

    const getPermission = (role: UserRole, moduleKey: string) => {
        return permissions.find(p => p.role === role && p.moduleKey === moduleKey)?.canAccess ?? false;
    };

    const handleToggle = async (role: UserRole, moduleKey: string, checked: boolean) => {
        const id = `${role}-${moduleKey}`;
        setLoading(prev => ({ ...prev, [id]: true }));

        // Optimistic update
        const previousState = [...permissions];

        // Update local state immediately
        const existingIdx = permissions.findIndex(p => p.role === role && p.moduleKey === moduleKey);
        if (existingIdx >= 0) {
            const newPerms = [...permissions];
            newPerms[existingIdx] = { ...newPerms[existingIdx], canAccess: checked };
            setPermissions(newPerms);
        } else {
            setPermissions([...permissions, { role, moduleKey, canAccess: checked, id: 'temp', createdAt: new Date(), updatedAt: new Date() } as any]);
        }

        try {
            const result = await togglePermission(role, moduleKey, checked);
            if (result.error) {
                throw new Error(result.error);
            }
            toast.success("Permission updated");
        } catch (error) {
            toast.error("Failed to update permission");
            setPermissions(previousState); // Revert on error
        } finally {
            setLoading(prev => {
                const newState = { ...prev };
                delete newState[id];
                return newState;
            });
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 font-bold tracking-wider">Module / Feature</th>
                            {/* System Admin Column (Locked) */}
                            <th className="px-6 py-4 text-center bg-slate-100/50 border-x border-slate-100 min-w-[120px]">
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-[#00c2e0]">System Admin</span>
                                    <Badge variant="outline" className="text-[10px] h-5 bg-white border-slate-200 text-slate-400 gap-1">
                                        <Lock className="w-3 h-3" /> Locked
                                    </Badge>
                                </div>
                            </th>
                            {/* Other Role Columns */}
                            {allRoles.map(role => (
                                <th key={role} className="px-6 py-4 text-center font-bold tracking-wider min-w-[120px]">
                                    {role.replace('_', ' ')}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {modules.map((module) => (
                            <tr key={module.key} className="hover:bg-slate-50/50 transition-colors">
                                {/* Checkbox Row Header */}
                                <td className="px-6 py-4 font-medium text-slate-700">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold">{module.name}</span>
                                        <span className="text-[10px] text-slate-400 uppercase tracking-widest">{module.key}</span>
                                        {module.description && (
                                            <span className="text-xs text-slate-500 mt-1">{module.description}</span>
                                        )}
                                    </div>
                                </td>

                                {/* System Admin Cell (Always Checked & Disabled) */}
                                <td className="px-6 py-4 text-center bg-slate-50/30 border-x border-slate-100">
                                    <div className="flex justify-center">
                                        <Checkbox checked={true} disabled className="data-[state=checked]:bg-slate-300 data-[state=checked]:border-slate-300 cursor-not-allowed opacity-50" />
                                    </div>
                                </td>

                                {/* Dynamic Role Cells */}
                                {allRoles.map((role) => {
                                    const isAllowed = getPermission(role, module.key);
                                    const isLoading = loading[`${role}-${module.key}`];

                                    return (
                                        <td key={`${role}-${module.key}`} className="px-6 py-4 text-center">
                                            <div className="flex justify-center items-center h-6">
                                                {isLoading ? (
                                                    <Loader2 className="w-4 h-4 animate-spin text-[#00c2e0]" />
                                                ) : (
                                                    <Checkbox
                                                        checked={isAllowed}
                                                        onCheckedChange={(checked) => handleToggle(role, module.key, checked as boolean)}
                                                        className="data-[state=checked]:bg-[#00c2e0] data-[state=checked]:border-[#00c2e0]"
                                                    />
                                                )}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                <span>Total Modules: {modules.length}</span>
                <div className="flex items-center gap-2">
                    <Lock className="w-3 h-3" />
                    <span>System Admin permissions are immutable for safety.</span>
                </div>
            </div>
        </div>
    );
}
