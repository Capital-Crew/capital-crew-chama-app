
'use client'

import React, { useState } from 'react';
import { Member } from '@/lib/types';
import { PlusCircleIcon } from '@/components/icons';
import { createMember } from '@/app/actions';

export function MemberRegistry({ members }: { members: Member[] }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div><h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Member Directory</h2></div>
                <button onClick={() => setIsOpen(true)} className="bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg"><PlusCircleIcon className="w-5 h-5" /> Enroll Member</button>
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest text-[10px]">
                        <tr><th className="px-6 py-4">ID</th><th className="px-6 py-4">Name</th><th className="px-6 py-4">Contact</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold">
                        {members.map(m => (
                            <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-slate-400 font-mono">{m.memberNumber}</td>
                                <td className="px-6 py-4 text-slate-900">{m.name}</td>
                                <td className="px-6 py-4 text-slate-500">{m.contact}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-8">
                        <h3 className="text-xl font-black text-slate-900 mb-4">New Membership Enrollment</h3>
                        <form action={async (formData) => {
                            await createMember(formData);
                            setIsOpen(false);
                        }} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Full Name</label>
                                <input name="name" required className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-black" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Contact / Email</label>
                                <input name="contact" required className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-black" />
                            </div>
                            <button type="submit" className="w-full bg-cyan-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-cyan-500/20 hover:bg-cyan-600 transition-all">Finalize Enrollment</button>
                            <button type="button" onClick={() => setIsOpen(false)} className="w-full text-center text-xs font-bold text-slate-400 mt-2">Cancel</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
