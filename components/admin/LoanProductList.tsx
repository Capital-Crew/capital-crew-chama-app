'use client'

import React from 'react'
import Link from 'next/link'
import { LoanProduct } from '@/lib/types'
import { Package, PlusCircle, TrendingUp, CheckCircle, XCircle, Edit } from 'lucide-react'
import { toggleLoanProductStatus } from '@/app/actions/loan-product'

interface LoanProductListProps {
    products: LoanProduct[]
}

export function LoanProductList({ products }: LoanProductListProps) {
    const handleToggleStatus = async (productId: string, currentStatus: boolean) => {
        if (confirm(`Are you sure you want to ${currentStatus ? 'DEACTIVATE' : 'ACTIVATE'} this product?`)) {
            await toggleLoanProductStatus(productId, !currentStatus);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Loan Products</h2>
                    <p className="text-slate-600 mt-1">Manage and configure your loan product offerings</p>
                </div>
                <Link
                    href="/admin/products/create"
                    className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all duration-200"
                >
                    <PlusCircle className="w-5 h-5" />
                    Create Product
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(p => (
                    <div
                        key={p.id}
                        className={`group bg-white border-2 border-slate-200 rounded-2xl shadow-sm hover:shadow-xl hover:border-cyan-300 transition-all duration-300 overflow-hidden ${!p.isActive ? 'opacity-60' : ''
                            }`}
                    >
                        {}
                        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 border-b border-slate-200">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                        <Package className="w-5 h-5 text-cyan-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
                                </div>
                                {!p.isActive && (
                                    <span className="px-3 py-1 bg-slate-200 text-slate-600 text-xs font-bold uppercase rounded-full">
                                        Inactive
                                    </span>
                                )}
                                {p.isActive && (
                                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase rounded-full flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        Active
                                    </span>
                                )}
                            </div>

                            {}
                            <div className="flex items-baseline gap-2">
                                <TrendingUp className="w-4 h-4 text-cyan-600" />
                                <span className="text-sm font-medium text-slate-600">Monthly Rate:</span>
                                <span className="text-2xl font-bold text-cyan-600">{String(p.interestRatePerPeriod)}%</span>
                            </div>
                        </div>

                        {}
                        <div className="p-6 flex gap-3">
                            <button
                                onClick={() => handleToggleStatus(p.id, p.isActive)}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${p.isActive
                                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border-2 border-red-200'
                                    : 'bg-green-50 text-green-600 hover:bg-green-100 border-2 border-green-200'
                                    }`}
                            >
                                {p.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                {p.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <Link
                                href={`/admin/products/${p.id}/edit`}
                                className="flex-1 flex items-center justify-center gap-2 bg-cyan-50 text-cyan-600 hover:bg-cyan-100 px-4 py-2.5 rounded-lg font-semibold text-sm border-2 border-cyan-200 transition-all duration-200"
                            >
                                <Edit className="w-4 h-4" />
                                Edit
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {products.length === 0 && (
                <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-300">
                    <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No loan products yet</h3>
                    <p className="text-slate-600 mb-6">Get started by creating your first loan product</p>
                    <Link
                        href="/admin/products/create"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-xl transition-all"
                    >
                        <PlusCircle className="w-5 h-5" />
                        Create Product
                    </Link>
                </div>
            )}
        </div>
    )
}
