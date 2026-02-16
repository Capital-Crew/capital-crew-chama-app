'use client'

import React, { useState } from 'react'
import { updateUserRights } from '@/app/actions/user-rights-actions'
import { toggleMemberApprovalRight } from '@/app/loan-approval-actions'
import { updateUserPermissions } from '@/app/actions/user-permissions'
import { UserRole } from '@prisma/client'
import { Search, Shield, Edit2, AlertCircle, CheckCircle, XCircle, Key, Lock, Wallet, User as UserIcon, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { assignUsername } from '@/app/actions/user-actions'

// Define Permission Types locally or import if available
interface UserPermissions {
    canViewAll: boolean
    canAddData: boolean
    canApprove: boolean
    canManageSettings: boolean
    canViewReports: boolean
    canViewAudit: boolean
    canManageUserRights: boolean
    canExemptFees: boolean
    canReverse: boolean
    canEnrollMembers: boolean
    canApproveMember: boolean
    canActivateMember: boolean
    canManageLedger: boolean
}

// Default permissions object
const defaultPermissions: UserPermissions = {
    canViewAll: false,
    canAddData: false,
    canApprove: false,
    canManageSettings: false,
    canViewReports: false,
    canViewAudit: false,
    canManageUserRights: false,
    canExemptFees: false,
    canReverse: false,
    canEnrollMembers: false,
    canApproveMember: false,
    canActivateMember: false,
    canManageLedger: false
};

interface User {
    id: string
    name: string
    contact?: string
    username?: string | null
    email: string
    role: string
    permissions?: any // Validated via type casting usage
    member?: {
        id: string
        memberNumber: string
        canApproveLoan: boolean
        wallet?: {
            id: string
            accountRef: string
        }
    }
    image?: string | null
    isActive?: boolean
}

interface UserRightsTableProps {
    users: User[]
}

export function UserRightsTable({ users: initialUsers }: UserRightsTableProps) {
    const router = useRouter()
    const [users, setUsers] = useState(initialUsers)
    const [searchTerm, setSearchTerm] = useState('')

    // Role Edit State
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [selectedRole, setSelectedRole] = useState<UserRole | ''>('')

    // Permission Edit State
    const [permUser, setPermUser] = useState<User | null>(null)
    const [currentPerms, setCurrentPerms] = useState<UserPermissions>(defaultPermissions)

    // Username Assign State
    const [usernameUser, setUsernameUser] = useState<User | null>(null)
    const [newUsername, setNewUsername] = useState('')

    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState('')
    const [successMsg, setSuccessMsg] = useState('')

    // Permission Definitions
    const permissionDefinitions = [
        { key: 'canViewAll', label: 'View All Data', description: 'Access to view all members, loans, and financial records' },
        { key: 'canAddData', label: 'Add Data', description: 'Create new members, loans, and transactions' },
        { key: 'canApprove', label: 'Approve Loans', description: 'Vote on loan applications and approvals' },
        { key: 'canManageSettings', label: 'Manage Settings', description: 'Modify SACCO settings and loan products' },
        { key: 'canViewReports', label: 'View Reports', description: 'Access financial reports and analytics' },
        { key: 'canViewAudit', label: 'View Audit Logs', description: 'View system audit trail and activity logs' },
        { key: 'canManageUserRights', label: 'Manage User Rights', description: 'Grant or revoke permissions for other users' },
        { key: 'canExemptFees', label: 'Exempt Fees', description: 'Waive or reduce fees on loan applications' },
        { key: 'canReverse', label: 'Reverse Journal Entries', description: 'Void and correct financial journal entries' },
        { key: 'canEnrollMembers', label: 'Enroll Members', description: 'Register new members and create their wallets' },
        { key: 'canApproveMember', label: 'Approve Members', description: 'Approve pending members after enrollment' },
        { key: 'canActivateMember', label: 'Activate Members', description: 'Activate approved members to start using the system' },
        { key: 'canManageLedger', label: 'Manage General Ledger', description: 'Configure hierarchical COA, approve ledgers, and open/close accounting periods' }
    ];

    // Filter Logic
    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // --- Role Management Handlers ---
    const handleEditClick = (user: User) => {
        setEditingUser(user)
        setSelectedRole(user.role as UserRole)
        setError('')
    }

    const handleSaveRole = async () => {
        if (!editingUser || !selectedRole) return
        setIsSaving(true)
        setError('')

        try {
            const result = await updateUserRights(editingUser.id, selectedRole as UserRole)
            if (result.success) {
                setUsers(users.map(u => u.id === editingUser.id ? { ...u, role: selectedRole } : u))
                setEditingUser(null)
                router.refresh()
            } else {
                setError(result.error || 'Failed to update user')
            }
        } catch (e) {
            setError('An unexpected error occurred')
        } finally {
            setIsSaving(false)
        }
    }

    const handleToggleApproval = async (user: User) => {
        if (!user.member) return

        // Optimistic Update
        const updatedUsers = users.map(u => {
            if (u.id === user.id && u.member) {
                return { ...u, member: { ...u.member, canApproveLoan: !u.member.canApproveLoan } }
            }
            return u
        })
        setUsers(updatedUsers)

        try {
            await toggleMemberApprovalRight(user.member.id)
            router.refresh()
        } catch (error) {
            setUsers(users) // Revert
        }
    }

    // --- Permission Management Handlers ---
    const handleManagePermissions = (user: User) => {
        setPermUser(user)
        setCurrentPerms({ ...defaultPermissions, ...(user.permissions || {}) })
        setError('')
        setSuccessMsg('')
    }

    const togglePermission = (key: keyof UserPermissions) => {
        setCurrentPerms(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const handleSavePermissions = async () => {
        if (!permUser) return
        setIsSaving(true)
        setError('')

        try {
            await updateUserPermissions({
                userId: permUser.id,
                permissions: currentPerms
            })
            // Update local state
            setUsers(users.map(u => u.id === permUser.id ? { ...u, permissions: currentPerms } : u))
            setSuccessMsg('Permissions updated successfully')
            setTimeout(() => {
                setPermUser(null)
                setSuccessMsg('')
            }, 1000)
            router.refresh()
        } catch (err: any) {
            setError(err.message || 'Failed to save permissions')
        } finally {
            setIsSaving(false)
        }
    }

    // --- Username Assignment Handlers ---
    const handleAssignUsernameClick = (user: User) => {
        setUsernameUser(user)
        setNewUsername(user.username || '') // Pre-fill if exists (though will be disabled)
        setError('')
    }

    const handleSaveUsername = async () => {
        if (!usernameUser) return
        setIsSaving(true)
        setError('')

        const formData = new FormData()
        formData.append('userId', usernameUser.id)
        formData.append('username', newUsername)
        if (usernameUser.member) {
            // @ts-ignore
            formData.append('memberNumber', usernameUser.member.memberNumber)
        }

        try {
            const result = await assignUsername(formData)
            if (result.success) {
                setUsers(users.map(u => u.id === usernameUser.id ? { ...u, username: newUsername } : u))
                setSuccessMsg('Username assigned successfully')
                setTimeout(() => {
                    setUsernameUser(null)
                    setSuccessMsg('')
                }, 1000)
                router.refresh()
            } else {
                setError(result.error || 'Failed to assign username')
            }
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred')
        } finally {
            setIsSaving(false)
        }
    }

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'SYSTEM_ADMIN': return 'badge-primary'
            case 'CHAIRPERSON': return 'badge-secondary'
            case 'TREASURER': return 'badge-accent'
            case 'SECRETARY': return 'badge-info'
            default: return 'badge-ghost'
        }
    }

    return (
        <div className="space-y-6">
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 text-slate-700">
                    <Shield className="w-5 h-5 text-[#00c2e0]" />
                    <h2 className="font-bold text-lg">User Access Rights</h2>
                </div>
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        className="input input-bordered input-sm w-full pl-10 rounded-lg focus:border-[#00c2e0] focus:ring-1 focus:ring-[#00c2e0]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-100">
                <table className="table w-full">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                            <th className="py-4 pl-6">User / Member Info</th>
                            <th>Role & Access</th>
                            <th>Wallet Status</th>
                            <th>Can Approve Loans?</th>
                            <th>Permissions</th>
                            <th className="text-right pr-6">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredUsers.map((user) => {
                            const activePermsCount = Object.values(user.permissions || {}).filter(Boolean).length;

                            return (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="avatar placeholder">
                                                <div className="bg-slate-100 text-slate-500 rounded-full w-10">
                                                    <span className="text-sm font-bold">{user.name.charAt(0)}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800">{user.name}</div>
                                                <div className="text-xs text-slate-500">{user.email}</div>
                                                {user.username && (
                                                    <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md w-fit mt-0.5">
                                                        @{user.username}
                                                    </div>
                                                )}
                                                {user.member && (
                                                    <div className="text-[10px] text-[#00c2e0] font-mono mt-0.5">
                                                        Member #{user.member.memberNumber}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={`badge ${getRoleBadgeColor(user.role)} gap-2 font-medium text-xs py-3`}>
                                            {user.role.replace('_', ' ')}
                                        </div>
                                    </td>
                                    <td>
                                        {user.member ? (
                                            <label className="swap swap-flip text-xs cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={user.member.canApproveLoan}
                                                    onChange={() => handleToggleApproval(user)}
                                                />
                                                <div className="swap-on flex items-center gap-1 text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full font-bold shadow-sm">
                                                    <CheckCircle className="w-3.5 h-3.5" /> Yes
                                                </div>
                                                <div className="swap-off flex items-center gap-1 text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full font-bold shadow-sm group-hover:bg-slate-100 transition-colors">
                                                    <XCircle className="w-3.5 h-3.5" /> No
                                                </div>
                                            </label>
                                        ) : (
                                            <span className="text-xs text-slate-300 italic">N/A</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${activePermsCount > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                            {activePermsCount} Active
                                        </span>
                                    </td>
                                    <td className="text-right pr-6">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                className="btn btn-ghost btn-xs text-slate-500 hover:text-[#00c2e0] hover:bg-cyan-50"
                                                onClick={() => handleManagePermissions(user)}
                                                title="Manage Permissions"
                                            >
                                                <Key className="w-4 h-4" />
                                            </button>
                                            <button
                                                className={`btn btn-ghost btn-xs ${user.username ? 'text-indigo-400' : 'text-slate-500 hover:text-[#00c2e0] hover:bg-cyan-50'}`}
                                                onClick={() => handleAssignUsernameClick(user)}
                                                title={user.username ? "View Username" : "Assign Username"}
                                            >
                                                <UserIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-xs text-slate-500 hover:text-[#00c2e0] hover:bg-cyan-50"
                                                onClick={() => handleEditClick(user)}
                                                title="Change Role"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Edit Role Modal */}
            {editingUser && (
                <dialog className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-warning" />
                            Modify System Role
                        </h3>
                        <div className="space-y-4">
                            <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border">
                                Editing role for <span className="font-bold text-slate-800">{editingUser.name}</span>
                            </div>
                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text font-medium">Assign Role</span>
                                </label>
                                <select
                                    className="select select-bordered w-full"
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                                >
                                    {Object.values(UserRole).filter(r => r !== 'MEMBER').map((role) => (
                                        <option key={role} value={role}>{role.replace('_', ' ')}</option>
                                    ))}
                                    <option value="MEMBER">MEMBER</option>
                                </select>
                            </div>
                            {error && <div className="alert alert-error text-sm py-2"><span>{error}</span></div>}
                        </div>
                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={() => setEditingUser(null)} disabled={isSaving}>Cancel</button>
                            <button className="btn btn-primary bg-[#00c2e0] border-none text-white" onClick={handleSaveRole} disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </dialog>
            )}

            {/* Manage Permissions Modal */}
            {permUser && (
                <dialog className="modal modal-open">
                    <div className="modal-box w-11/12 max-w-3xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                <Lock className="w-6 h-6 text-[#00c2e0]" />
                                Granular Permissions
                            </h3>
                            <div className="text-right">
                                <p className="text-sm font-bold text-slate-800">{permUser.name}</p>
                                <p className="text-xs text-slate-500">{permUser.role}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
                            {permissionDefinitions.map((def) => (
                                <div key={def.key} className="flex items-start gap-3 p-4 border rounded-xl hover:bg-slate-50 transition-all cursor-pointer" onClick={() => togglePermission(def.key as keyof UserPermissions)}>
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-primary mt-1"
                                        checked={currentPerms[def.key as keyof UserPermissions]}
                                        readOnly
                                    />
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-700">{def.label}</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">{def.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {error && <div className="alert alert-error text-sm mt-4"><span>{error}</span></div>}
                        {successMsg && <div className="alert alert-success text-sm mt-4 text-white"><span>{successMsg}</span></div>}

                        <div className="modal-action mt-6">
                            <button className="btn btn-ghost" onClick={() => setPermUser(null)} disabled={isSaving}>Close</button>
                            <button className="btn btn-primary bg-[#00c2e0] border-none text-white px-8" onClick={handleSavePermissions} disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Permissions'}
                            </button>
                        </div>
                    </div>
                    <form method="dialog" className="modal-backdrop">
                        <button onClick={() => setPermUser(null)}>close</button>
                    </form>
                </dialog>
            )}

            {/* Username Assignment Modal */}
            {usernameUser && (
                <dialog className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <UserIcon className="w-5 h-5 text-[#00c2e0]" />
                            Assign Username
                        </h3>

                        {/* Integrity Guard Viz */}
                        <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Identity Integrity Check</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600">Member Record found</span>
                                    {usernameUser.member ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600">Wallet Linked</span>
                                    {usernameUser.member?.wallet ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                                </div>
                                {usernameUser.member?.wallet && (
                                    <div className="mt-2 text-xs font-mono text-emerald-600 bg-emerald-50 p-1.5 rounded text-center border border-emerald-100">
                                        Wallet ID: {usernameUser.member.wallet.accountRef}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text font-medium">Username</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    placeholder="Enter username"
                                    disabled={!!usernameUser.username} // Immutable if set
                                />
                                {usernameUser.username && (
                                    <p className="text-[10px] text-amber-600 font-bold mt-1">
                                        Username is permanent and cannot be changed.
                                    </p>
                                )}
                            </div>
                        </div>
                        {error && <div className="alert alert-error text-sm py-2"><span>{error}</span></div>}
                        {successMsg && <div className="alert alert-success text-sm py-2 text-white"><span>{successMsg}</span></div>}

                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={() => setUsernameUser(null)} disabled={isSaving}>Cancel</button>
                            <button
                                className="btn btn-primary bg-[#00c2e0] border-none text-white"
                                onClick={handleSaveUsername}
                                disabled={isSaving || !usernameUser.member?.wallet || !!usernameUser.username}
                                title={!usernameUser.member?.wallet ? "Cannot assign username: Missing Wallet" : (usernameUser.username ? "Username already set" : "")}
                            >
                                {isSaving ? 'Saving...' : 'Save Username'}
                            </button>
                        </div>
                    </div>
                </dialog>
            )}
        </div>
    )
}
