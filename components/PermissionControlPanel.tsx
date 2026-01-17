/**
 * Permission Control Panel Component
 * 
 * Comprehensive UI for managing user permissions and roles.
 * To be integrated into the Settings Module's User Rights tab.
 */

'use client';

import { useState, useEffect } from 'react';
import { getAllUsersWithPermissions, updateUserPermissions, updateUserRole } from '@/app/actions/user-permissions';
import type { UserPermissions, UserRole } from '@/lib/types';

interface UserWithPermissions {
    id: string;
    email: string;
    name: string | null;
    memberNumber: number | undefined;
    role: UserRole;
    permissions: UserPermissions;
}

export function PermissionControlPanel() {
    const [users, setUsers] = useState<UserWithPermissions[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Permission definitions with descriptions
    const permissionDefinitions = [
        {
            key: 'canViewAll' as keyof UserPermissions,
            label: 'View All Data',
            description: 'Access to view all members, loans, and financial records'
        },
        {
            key: 'canAddData' as keyof UserPermissions,
            label: 'Add Data',
            description: 'Create new members, loans, and transactions'
        },
        {
            key: 'canApprove' as keyof UserPermissions,
            label: 'Approve Loans',
            description: 'Vote on loan applications and approvals'
        },
        {
            key: 'canManageSettings' as keyof UserPermissions,
            label: 'Manage Settings',
            description: 'Modify SACCO settings and loan products'
        },
        {
            key: 'canViewReports' as keyof UserPermissions,
            label: 'View Reports',
            description: 'Access financial reports and analytics'
        },
        {
            key: 'canViewAudit' as keyof UserPermissions,
            label: 'View Audit Logs',
            description: 'View system audit trail and activity logs'
        },
        {
            key: 'canManageUserRights' as keyof UserPermissions,
            label: 'Manage User Rights',
            description: 'Grant or revoke permissions for other users'
        },
        {
            key: 'canExemptFees' as keyof UserPermissions,
            label: 'Exempt Fees',
            description: 'Waive or reduce fees on loan applications'
        },
        {
            key: 'canReverse' as keyof UserPermissions,
            label: 'Reverse Journal Entries',
            description: 'Void and correct financial journal entries'
        },
        {
            key: 'canEnrollMembers' as keyof UserPermissions,
            label: 'Enroll Members',
            description: 'Register new members and create their wallets'
        }
    ];

    // Load users on mount
    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await getAllUsersWithPermissions();
            setUsers(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenPermissions = (user: UserWithPermissions) => {
        setSelectedUser(user);
        setIsModalOpen(true);
        setError(null);
        setSuccess(null);
    };

    const handlePermissionToggle = (permissionKey: keyof UserPermissions) => {
        if (!selectedUser) return;

        setSelectedUser({
            ...selectedUser,
            permissions: {
                ...selectedUser.permissions,
                [permissionKey]: !selectedUser.permissions[permissionKey]
            }
        });
    };

    const handleSavePermissions = async () => {
        if (!selectedUser) return;

        try {
            setSaving(true);
            setError(null);

            await updateUserPermissions({
                userId: selectedUser.id,
                permissions: selectedUser.permissions
            });

            setSuccess('Permissions updated successfully');
            await loadUsers();

            setTimeout(() => {
                setIsModalOpen(false);
                setSuccess(null);
            }, 1500);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update permissions');
        } finally {
            setSaving(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
            return;
        }

        try {
            await updateUserRole(userId, newRole);
            await loadUsers();
            setSuccess(`Role updated to ${newRole}`);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update role');
            setTimeout(() => setError(null), 5000);
        }
    };

    const getRoleBadgeColor = (role: UserRole) => {
        switch (role) {
            case 'CHAIRPERSON':
                return 'bg-purple-100 text-purple-700';
            case 'TREASURER':
                return 'bg-blue-100 text-blue-700';
            case 'SECRETARY':
                return 'bg-green-100 text-green-700';
            default:
                return 'bg-slate-100 text-slate-600';
        }
    };

    const countActivePermissions = (permissions: UserPermissions) => {
        return Object.values(permissions).filter(Boolean).length;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-slate-400">Loading users...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Success/Error Messages */}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-bold">
                    ✓ {success}
                </div>
            )}

            {error && !isModalOpen && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-bold">
                    ✗ {error}
                </div>
            )}

            {/* Header */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Permission Control Panel
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                    Manage user roles and granular permissions for system access
                </p>
            </div>

            {/* Users Table */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest text-[10px]">
                        <tr>
                            <th className="px-6 py-4">Member #</th>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Active Permissions</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-slate-400 font-mono">
                                    {user.memberNumber || 'N/A'}
                                </td>
                                <td className="px-6 py-4 text-slate-900">
                                    {user.name || 'Unnamed User'}
                                </td>
                                <td className="px-6 py-4 text-slate-500">
                                    {user.email}
                                </td>
                                <td className="px-6 py-4">
                                    <select
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border-none ${getRoleBadgeColor(user.role)}`}
                                    >
                                        <option value="MEMBER">Member</option>
                                        <option value="SECRETARY">Secretary</option>
                                        <option value="TREASURER">Treasurer</option>
                                        <option value="CHAIRPERSON">Chairperson</option>
                                        <option value="SYSTEM_ADMIN">System Admin</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-[10px] font-black">
                                        {countActivePermissions(user.permissions)} / 8
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => handleOpenPermissions(user)}
                                        className="px-4 py-2 bg-cyan-100 text-cyan-700 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-cyan-200 transition-colors"
                                    >
                                        Manage Permissions
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Permission Modal */}
            {isModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-6 text-white">
                            <h3 className="text-xl font-black">Manage Permissions</h3>
                            <p className="text-sm opacity-90 mt-1">
                                {selectedUser.name || selectedUser.email} • {selectedUser.role}
                            </p>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-bold mb-4">
                                    ✗ {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                {permissionDefinitions.map(({ key, label, description }) => (
                                    <div
                                        key={key}
                                        className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <h4 className="text-sm font-black text-slate-900">{label}</h4>
                                            <p className="text-xs text-slate-500 mt-1">{description}</p>
                                        </div>
                                        <button
                                            onClick={() => handlePermissionToggle(key)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${selectedUser.permissions[key]
                                                ? 'bg-cyan-500'
                                                : 'bg-slate-300'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${selectedUser.permissions[key]
                                                    ? 'translate-x-6'
                                                    : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-slate-50 p-6 flex gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                disabled={saving}
                                className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSavePermissions}
                                disabled={saving}
                                className="flex-1 px-6 py-3 bg-cyan-500 text-white rounded-xl font-bold hover:bg-cyan-600 transition-colors disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
