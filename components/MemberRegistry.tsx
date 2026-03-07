
'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { Member } from '@/lib/types';
import { PlusCircleIcon } from '@/components/icons';
import { createUserAccount } from '@/app/actions';
import { MemberDetailModal } from './member/MemberDetailModal';
import { getMemberFullDetail } from '@/app/actions/member-dashboard-actions';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, scaleIn } from '@/lib/animation-variants';
import { getNextMemberNumber } from '@/app/actions/member-helper';
import { Wallet, CheckCircle } from 'lucide-react';

export function MemberRegistry({ members, userRole }: { members: Member[], userRole?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState('');

    // Modal State
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [selectedMemberDetail, setSelectedMemberDetail] = useState<any>(null);

    // Live Prediction State
    const [nextMemberNumber, setNextMemberNumber] = useState<number | null>(null);

    React.useEffect(() => {
        if (isOpen) {
            getNextMemberNumber().then(res => {
                if (res.success && res.nextNumber) setNextMemberNumber(res.nextNumber);
            });
        }
    }, [isOpen]);

    const canEnroll = userRole === 'CHAIRPERSON';

    const handleViewDetail = async (memberId: string) => {
        setLoadingDetail(true);
        try {
            const detail = await getMemberFullDetail(memberId);
            setSelectedMemberDetail(detail);
            setIsDetailOpen(true);
        } catch (err) {
            alert("Failed to load member details. Please try again.");
        } finally {
            setLoadingDetail(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div><h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Member Directory</h2></div>
                {canEnroll && (
                    <button onClick={() => setIsOpen(true)} className="bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg">
                        <PlusCircleIcon className="w-5 h-5" /> Enroll Member
                    </button>
                )}
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest text-[10px]">
                        <tr><th className="px-6 py-4">ID</th><th className="px-6 py-4">Name</th><th className="px-6 py-4">Contact</th><th className="px-6 py-4 text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold">
                        {members.map(m => (
                            <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4 text-slate-400 font-mono">{m.memberNumber}</td>
                                <td className="px-6 py-4 text-slate-900 cursor-pointer hover:text-cyan-600" onClick={() => handleViewDetail(m.id)}>
                                    {m.name}
                                </td>
                                <td className="px-6 py-4 text-slate-500">{m.contact}</td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleViewDetail(m.id)}
                                        disabled={loadingDetail}
                                        className="text-cyan-600 hover:text-cyan-700 bg-cyan-50 hover:bg-cyan-100 px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {loadingDetail ? 'Loading...' : 'View Profile'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Member Detail Modal */}
            {selectedMemberDetail && (
                <MemberDetailModal
                    isOpen={isDetailOpen}
                    onClose={() => setIsDetailOpen(false)}
                    member={selectedMemberDetail.member}
                    stats={selectedMemberDetail.stats}
                    contributions={selectedMemberDetail.contributions}
                    loans={selectedMemberDetail.loans}
                    nextOfKin={selectedMemberDetail.nextOfKin}
                />
            )}

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={fadeIn}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                    >
                        <motion.div
                            variants={scaleIn}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-8"
                        >
                            <h3 className="text-xl font-black text-slate-900 mb-4">New Member Account</h3>
                            {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm font-bold">{error}</div>}
                            <form action={async (formData) => {
                                try {
                                    setError('');
                                    await createUserAccount(formData);
                                    setIsOpen(false);
                                } catch (e: any) {
                                    setError(e.message || 'Failed to create account');
                                }
                            }} className="space-y-4">
                                {nextMemberNumber && (
                                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl mb-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="p-1 bg-emerald-100 rounded-full"><CheckCircle className="w-4 h-4 text-emerald-600" /></div>
                                            <span className="text-xs font-black text-emerald-700 uppercase tracking-wide">Live Identity Verification</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-emerald-600">Member Number</label>
                                                <div className="text-lg font-black text-emerald-800">{String(nextMemberNumber).padStart(6, '0')}</div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-emerald-600 flex items-center gap-1">
                                                    Assigned Wallet ID
                                                </label>
                                                <div className="text-lg font-black text-emerald-800 font-mono">WAL-{String(nextMemberNumber).padStart(6, '0')}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Full Name</label>
                                    <input name="name" required className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-black" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Contact / Phone</label>
                                    <input name="contact" required className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-black" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Email Address</label>
                                    <input name="email" type="email" required className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-black" />
                                </div>

                                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                                    <p className="text-[10px] font-bold text-blue-600">
                                        A default password <span className="font-mono bg-blue-100 px-1 rounded">CapitalCrew@2024</span> will be assigned. The member must change it upon first login.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Role</label>
                                    <select name="role" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-black">
                                        <option value="MEMBER">Member</option>
                                        <option value="SECRETARY">Secretary</option>
                                        <option value="TREASURER">Treasurer</option>
                                        <option value="CHAIRPERSON">Chairperson</option>
                                    </select>
                                </div>
                                <button type="submit" className="w-full bg-cyan-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-cyan-500/20 hover:bg-cyan-600 transition-all">Create Account</button>
                                <button type="button" onClick={() => { setIsOpen(false); setError(''); }} className="w-full text-center text-xs font-bold text-slate-400 mt-2">Cancel</button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
