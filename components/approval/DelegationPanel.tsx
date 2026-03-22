'use client'

import { useState, useEffect } from 'react'
import { delegateApproval, revokeDelegation, getMyDelegations, getApprovers } from '@/app/actions/approval-delegation'
import { toast } from '@/lib/toast'
import { Loader2, UserPlus, X, Calendar, Trash2 } from 'lucide-react'
import { EntityType } from '@prisma/client'

interface DelegationPanelProps {
    isOpen: boolean
    onClose: () => void
}

export function DelegationPanel({ isOpen, onClose }: DelegationPanelProps) {
    const [loading, setLoading] = useState(true)
    const [delegatedFrom, setDelegatedFrom] = useState<any[]>([])
    const [delegatedTo, setDelegatedTo] = useState<any[]>([])
    const [approvers, setApprovers] = useState<any[]>([])
    const [showCreateForm, setShowCreateForm] = useState(false)

    // Form state
    const [selectedUser, setSelectedUser] = useState('')
    const [entityType, setEntityType] = useState<EntityType | ''>('')
    const [expiresAt, setExpiresAt] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (isOpen) {
            loadData()
        }
    }, [isOpen])

    const loadData = async () => {
        setLoading(true)
        try {
            const [delegations, approversList] = await Promise.all([
                getMyDelegations(),
                getApprovers()
            ])

            if ('error' in delegations) {
                toast.error(delegations.error || 'Unknown error')
            } else {
                setDelegatedFrom(delegations.delegatedFrom || [])
                setDelegatedTo(delegations.delegatedTo || [])
            }

            if (!('error' in approversList)) {
                setApprovers(approversList)
            }
        } catch (error) {
            toast.error('Failed to load delegations')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateDelegation = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedUser) {
            toast.error('Please select a user')
            return
        }

        setSubmitting(true)
        try {
            const result = await delegateApproval(
                selectedUser,
                entityType || undefined,
                undefined,
                expiresAt ? new Date(expiresAt) : undefined
            )

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Delegation created successfully')
                setShowCreateForm(false)
                setSelectedUser('')
                setEntityType('')
                setExpiresAt('')
                loadData()
            }
        } catch (error) {
            toast.error('Failed to create delegation')
        } finally {
            setSubmitting(false)
        }
    }

    const handleRevoke = async (delegationId: string) => {
        if (!confirm('Are you sure you want to revoke this delegation?')) return

        try {
            const result = await revokeDelegation(delegationId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Delegation revoked')
                loadData()
            }
        } catch (error) {
            toast.error('Failed to revoke delegation')
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[60] flex justify-end">
            {}
            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={onClose} />

            {}
            <div className="relative w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
                {}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                    <div>
                        <h3 className="font-bold text-xl text-slate-800">Approval Delegations</h3>
                        <p className="text-sm text-slate-500 mt-1">Manage who can approve on your behalf</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {}
                            {!showCreateForm && (
                                <button
                                    onClick={() => setShowCreateForm(true)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-lg font-bold uppercase text-sm hover:bg-slate-800 transition-colors"
                                >
                                    <UserPlus className="w-5 h-5" />
                                    Create New Delegation
                                </button>
                            )}

                            {}
                            {showCreateForm && (
                                <form onSubmit={handleCreateDelegation} className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                                    <h4 className="font-bold text-slate-700">New Delegation</h4>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-600 mb-2">Delegate To</label>
                                        <select
                                            value={selectedUser}
                                            onChange={(e) => setSelectedUser(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                            required
                                        >
                                            <option value="">Select user...</option>
                                            {approvers.map(user => (
                                                <option key={user.id} value={user.id}>
                                                    {user.name} ({user.role})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-600 mb-2">Entity Type (Optional)</label>
                                        <select
                                            value={entityType}
                                            onChange={(e) => setEntityType(e.target.value as EntityType | '')}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                        >
                                            <option value="">All Types</option>
                                            <option value="LOAN">Loans Only</option>
                                            <option value="MEMBER">Members Only</option>
                                            <option value="EXPENSE">Expenses Only</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-600 mb-2">Expires At (Optional)</label>
                                        <input
                                            type="datetime-local"
                                            value={expiresAt}
                                            onChange={(e) => setExpiresAt(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 disabled:opacity-50"
                                        >
                                            {submitting ? 'Creating...' : 'Create'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowCreateForm(false)}
                                            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-300"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}

                            {}
                            <div>
                                <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                    Delegations I've Given ({delegatedFrom.length})
                                </h4>
                                {delegatedFrom.length === 0 ? (
                                    <p className="text-sm text-slate-400 italic">No active delegations</p>
                                ) : (
                                    <div className="space-y-2">
                                        {delegatedFrom.map(delegation => (
                                            <div key={delegation.id} className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-slate-800">{delegation.toUser.name}</p>
                                                    <p className="text-xs text-slate-500">{delegation.toUser.email}</p>
                                                    <div className="flex gap-2 mt-2">
                                                        {delegation.entityType && (
                                                            <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold">
                                                                {delegation.entityType}
                                                            </span>
                                                        )}
                                                        {delegation.expiresAt && (
                                                            <span className="text-[10px] px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-bold flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {new Date(delegation.expiresAt).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRevoke(delegation.id)}
                                                    className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                                                    title="Revoke delegation"
                                                >
                                                    <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-600" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {}
                            <div>
                                <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    Delegations I've Received ({delegatedTo.length})
                                </h4>
                                {delegatedTo.length === 0 ? (
                                    <p className="text-sm text-slate-400 italic">No active delegations</p>
                                ) : (
                                    <div className="space-y-2">
                                        {delegatedTo.map(delegation => (
                                            <div key={delegation.id} className="bg-green-50 p-4 rounded-lg border border-green-200">
                                                <p className="font-bold text-slate-800">From: {delegation.fromUser.name}</p>
                                                <p className="text-xs text-slate-500">{delegation.fromUser.email}</p>
                                                <div className="flex gap-2 mt-2">
                                                    {delegation.entityType && (
                                                        <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">
                                                            {delegation.entityType}
                                                        </span>
                                                    )}
                                                    {delegation.expiresAt && (
                                                        <span className="text-[10px] px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-bold flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(delegation.expiresAt).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
