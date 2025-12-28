
'use client'

import React, { useState } from 'react';
import { LoanProduct, ChargeTemplate } from '@/lib/types'; // Uses Prisma types + Json
import { PlusCircleIcon } from '@/components/icons';
import { createLoanProduct, createChargeTemplate } from '@/app/actions';

interface SettingsProps {
    products: LoanProduct[];
    chargeTemplates: ChargeTemplate[];
}

export function SettingsModule({ products, chargeTemplates }: SettingsProps) {
    const [activeTab, setActiveTab] = useState('products');
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Configuration Engine</h2>
                <p className="text-sm text-slate-500">Fine-tune the lending logic and fees.</p>
            </div>

            <div className="flex border-b border-slate-200">
                <button onClick={() => setActiveTab('products')} className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'products' ? 'text-cyan-500 border-cyan-500' : 'text-slate-400 border-transparent'}`}>Loan Products</button>
                <button onClick={() => setActiveTab('charges')} className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'charges' ? 'text-cyan-500 border-cyan-500' : 'text-slate-400 border-transparent'}`}>Charge Templates</button>
            </div>

            {activeTab === 'products' && (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg"><PlusCircleIcon className="w-5 h-5" /> Design Product</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map(p => (
                            <div key={p.id} className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
                                <h3 className="text-lg font-black text-slate-900">{p.name}</h3>
                                <div className="mt-4 space-y-2 text-xs">
                                    <p className="font-bold text-slate-500">Rate: <span className="text-cyan-500">{p.interestRatePerPeriod}%</span></p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'charges' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-3xl border border-slate-200">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Create Template</h3>
                        <form action={createChargeTemplate} className="space-y-4">
                            <input name="name" placeholder="Charge Name" className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold" />
                            <input name="amount" type="number" placeholder="Amount" className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold" />
                            <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest">Create</button>
                        </form>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest text-[10px]"><tr><th className="px-6 py-4">Name</th><th className="px-6 py-4">Amount</th></tr></thead>
                            <tbody className="divide-y divide-slate-100 font-bold">
                                {chargeTemplates.map(ct => (
                                    <tr key={ct.id}><td className="px-6 py-4">{ct.name}</td><td className="px-6 py-4">{ct.amount}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-lg">
                        <h3 className="text-xl font-black mb-4">New Product</h3>
                        <form action={async (fd) => { await createLoanProduct(fd); setIsModalOpen(false); }} className="space-y-4">
                            <input name="name" placeholder="Name" className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm font-bold" />
                            <input name="principal" type="number" placeholder="Default Principal" className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm font-bold" />
                            <input name="interestRatePerPeriod" type="number" placeholder="Rate %" className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm font-bold" />
                            <select name="interestType" className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm font-bold"><option value="FLAT">Flat</option><option value="DECLINING_BALANCE">Declining</option></select>
                            <button className="w-full bg-cyan-500 text-white py-4 rounded-xl font-black uppercase">Create</button>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-center text-xs text-slate-400 mt-2">Cancel</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
