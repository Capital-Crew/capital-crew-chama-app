'use client'

import React, { useState, useTransition } from 'react'
import { updateLoanProductLimit, toggleLoanProductLimitStatus } from '@/app/actions/loan-limit-actions'
import { toast } from 'sonner'
import {
    Shield, ShieldCheck, ShieldOff, Save, Package,
    CheckCircle, XCircle, Infinity, Pencil, X, Loader2
} from 'lucide-react'

interface ProductLimit {
    id: string
    name: string
    shortCode: string
    isActive: boolean
    maxConcurrentLoans: number
    concurrentLimitActive: boolean
    activeLoansCount: number
}

interface Props {
    products: ProductLimit[]
}

export function LoanLimitsManager({ products }: Props) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValue, setEditValue] = useState<number>(0)
    const [isPending, startTransition] = useTransition()
    const [togglingId, setTogglingId] = useState<string | null>(null)

    const startEdit = (product: ProductLimit) => {
        setEditingId(product.id)
        setEditValue(product.maxConcurrentLoans)
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditValue(0)
    }

    const saveEdit = (product: ProductLimit) => {
        startTransition(async () => {
            try {
                await updateLoanProductLimit(product.id, editValue, product.concurrentLimitActive)
                toast.success(`Limit updated for ${product.name}`)
                setEditingId(null)
            } catch (err: any) {
                toast.error(err.message || 'Failed to update limit')
            }
        })
    }

    const handleToggle = (product: ProductLimit) => {
        setTogglingId(product.id)
        startTransition(async () => {
            try {
                await toggleLoanProductLimitStatus(product.id)
                toast.success(
                    `${product.name} limit ${product.concurrentLimitActive ? 'disabled' : 'enabled'}`
                )
            } catch (err: any) {
                toast.error(err.message || 'Failed to toggle status')
            } finally {
                setTogglingId(null)
            }
        })
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-700 text-white px-8 py-12 rounded-2xl shadow-xl mb-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />

                <div className="relative flex items-center gap-4 mb-3 z-10">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-inner border border-white/10">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm md:text-3xl font-black tracking-tight text-white drop-shadow-sm">
                            Concurrent Loan Limits
                        </h1>
                        <p className="text-violet-100 mt-1 font-medium text-xs md:text-lg opacity-90">
                            Control how many active loans of each product type a borrower can hold
                        </p>
                    </div>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 mb-8 flex gap-4 items-start">
                <div className="p-2 bg-amber-100 rounded-xl shrink-0">
                    <ShieldCheck className="w-5 h-5 text-amber-600" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-black text-amber-900 uppercase tracking-wide">How It Works</p>
                    <p className="text-xs text-amber-800 leading-relaxed font-medium">
                        Set the maximum number of active loans a single member can hold for each product.
                        <strong className="text-amber-900"> 0 = Unlimited</strong> (no cap enforced).
                        Toggle the status to enable or disable enforcement without deleting the configuration.
                        Active loan statuses counted: <strong>ACTIVE</strong> and <strong>APPROVED</strong>.
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Product
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Code
                                </th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Active Loans
                                </th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Max Allowed
                                </th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Enforcement
                                </th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {products.map((product) => (
                                <tr
                                    key={product.id}
                                    className={`hover:bg-slate-50/80 transition-colors group ${!product.isActive ? 'opacity-50' : ''}`}
                                >
                                    {/* Product Name */}
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl ${product.isActive ? 'bg-cyan-50' : 'bg-slate-100'}`}>
                                                <Package className={`w-4 h-4 ${product.isActive ? 'text-cyan-600' : 'text-slate-400'}`} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{product.name}</p>
                                                {!product.isActive && (
                                                    <span className="text-[10px] font-black text-slate-400 uppercase">Product Inactive</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Short Code */}
                                    <td className="px-6 py-5">
                                        <span className="inline-flex items-center px-3 py-1.5 bg-slate-100 rounded-lg font-mono text-xs font-bold text-slate-700 tracking-wide">
                                            {product.shortCode}
                                        </span>
                                    </td>

                                    {/* Active Loans Count */}
                                    <td className="px-6 py-5 text-center">
                                        <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-black text-sm ${
                                            product.activeLoansCount > 0
                                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                : 'bg-slate-50 text-slate-400 border border-slate-200'
                                        }`}>
                                            {product.activeLoansCount}
                                        </span>
                                    </td>

                                    {/* Max Allowed */}
                                    <td className="px-6 py-5 text-center">
                                        {editingId === product.id ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(Math.max(0, parseInt(e.target.value) || 0))}
                                                    className="w-20 h-10 bg-white border-2 border-violet-300 rounded-xl text-center font-black text-sm focus:ring-4 focus:ring-violet-100 focus:border-violet-500 transition-all outline-none"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') saveEdit(product)
                                                        if (e.key === 'Escape') cancelEdit()
                                                    }}
                                                />
                                                <button
                                                    onClick={() => saveEdit(product)}
                                                    disabled={isPending}
                                                    className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg border border-green-200 transition-all disabled:opacity-50"
                                                    title="Save"
                                                >
                                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    className="p-2 bg-slate-50 text-slate-400 hover:bg-slate-100 rounded-lg border border-slate-200 transition-all"
                                                    title="Cancel"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center">
                                                {product.maxConcurrentLoans === 0 ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-black uppercase border border-emerald-200">
                                                        <Infinity className="w-3.5 h-3.5" />
                                                        Unlimited
                                                    </span>
                                                ) : (
                                                    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-black text-sm ${
                                                        product.concurrentLimitActive
                                                            ? 'bg-violet-50 text-violet-700 border-2 border-violet-200'
                                                            : 'bg-slate-50 text-slate-500 border border-slate-200'
                                                    }`}>
                                                        {product.maxConcurrentLoans}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>

                                    {/* Enforcement Status */}
                                    <td className="px-6 py-5 text-center">
                                        {product.concurrentLimitActive ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase border border-green-200">
                                                <CheckCircle className="w-3 h-3" />
                                                Enforced
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase border border-slate-200">
                                                <XCircle className="w-3 h-3" />
                                                Disabled
                                            </span>
                                        )}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => startEdit(product)}
                                                disabled={editingId === product.id}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-cyan-600 border border-cyan-200 hover:bg-cyan-50 rounded-lg font-bold text-xs transition-all shadow-sm disabled:opacity-50"
                                                title="Edit max concurrent limit"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleToggle(product)}
                                                disabled={isPending && togglingId === product.id}
                                                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs transition-all shadow-sm border ${
                                                    product.concurrentLimitActive
                                                        ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                                        : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                                                } disabled:opacity-50`}
                                                title={product.concurrentLimitActive ? 'Disable enforcement' : 'Enable enforcement'}
                                            >
                                                {isPending && togglingId === product.id ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : product.concurrentLimitActive ? (
                                                    <ShieldOff className="w-3.5 h-3.5" />
                                                ) : (
                                                    <ShieldCheck className="w-3.5 h-3.5" />
                                                )}
                                                {product.concurrentLimitActive ? 'Disable' : 'Enable'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {products.length === 0 && (
                    <div className="text-center py-20 px-6">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">No Loan Products</h3>
                        <p className="text-slate-600 text-sm">Create loan products first, then configure their concurrent limits here.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
