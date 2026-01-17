'use client'

import React, { useState, useMemo } from 'react';
import { Search, UserPlus, Users, ChevronRight } from 'lucide-react';
import { MemberDetailView } from './MemberDetailView';
import { getMemberFullDetail } from '@/app/actions/member-dashboard-actions';
import { createUserAccount } from '@/app/actions';
import { PlusCircleIcon } from '@/components/icons';

interface MemberManagementMasterProps {
    initialMembers: any[];
    initialDetail: any;
    userRole?: string;
}

export function MemberManagementMaster({ initialMembers, initialDetail, userRole }: MemberManagementMasterProps) {
    const [members, setMembers] = useState(initialMembers);
    const [selectedDetail, setSelectedDetail] = useState(initialDetail);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [isEnrollOpen, setIsEnrollOpen] = useState(false);
    const [enrollError, setEnrollError] = useState('');

    const canEnroll = ['CHAIRPERSON', 'SYSTEM_ADMIN'].includes(userRole || '');

    const filteredMembers = useMemo(() => {
        return members.filter(m =>
            m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.memberNumber.toString().includes(searchQuery)
        );
    }, [members, searchQuery]);

    const handleSelectMember = async (memberId: string) => {
        if (memberId === selectedDetail?.member?.id) return;

        setLoadingId(memberId);
        try {
            const detail = await getMemberFullDetail(memberId);
            setSelectedDetail(detail);
        } catch (err) {
            console.error("Failed to load member detail:", err);
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-160px)] bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Member Management</h1>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1.5 ml-0.5">Manage Directory & Profiles</p>
                    </div>
                </div>

                <div className="flex-1 max-w-md mx-8">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name or member number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-3.5 text-xs font-bold focus:ring-4 focus:ring-cyan-500/10 transition-all placeholder:text-slate-300"
                        />
                    </div>
                </div>

                {canEnroll && (
                    <button
                        onClick={() => setIsEnrollOpen(true)}
                        className="bg-cyan-500 text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-cyan-500/20 hover:bg-cyan-600 transition-all flex items-center gap-2"
                    >
                        <UserPlus className="w-4 h-4" /> Enroll Member
                    </button>
                )}
            </header>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Master List (Sidebar-like) */}
                <aside className="w-80 bg-slate-50/30 border-r border-slate-100 flex flex-col">
                    <div className="p-4 px-6 border-b border-slate-100 bg-white/50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {filteredMembers.length} Members Found
                        </p>
                    </div>
                    <div className="flex-1 overflow-y-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        {filteredMembers.map(m => (
                            <button
                                key={m.id}
                                onClick={() => handleSelectMember(m.id)}
                                className={`w-full p-5 flex items-center justify-between transition-all border-b border-slate-50/50 group ${selectedDetail?.member?.id === m.id
                                    ? 'bg-white border-r-4 border-r-cyan-500 shadow-[inset_0_0_20px_rgba(0,0,0,0.02)]'
                                    : 'hover:bg-white/60'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs transition-all ${selectedDetail?.member?.id === m.id
                                        ? 'bg-gradient-to-br from-cyan-400 to-cyan-500 text-white shadow-lg shadow-cyan-500/20 rotate-3'
                                        : 'bg-white text-slate-400 border border-slate-100 group-hover:border-cyan-200'
                                        }`}>
                                        {m.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="text-left">
                                        <p className={`text-sm font-black tracking-tight leading-tight ${selectedDetail?.member?.id === m.id ? 'text-cyan-600' : 'text-slate-700'
                                            }`}>
                                            {m.name}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-300 mt-0.5">#{m.memberNumber}</p>
                                    </div>
                                </div>
                                {loadingId === m.id ? (
                                    <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <ChevronRight className={`w-4 h-4 transition-all ${selectedDetail?.member?.id === m.id ? 'text-cyan-500 translate-x-1' : 'text-slate-200 group-hover:text-slate-400'
                                        }`} />
                                )}
                            </button>
                        ))}
                        {filteredMembers.length === 0 && (
                            <div className="p-12 text-center">
                                <Users className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                                <p className="text-[11px] font-bold text-slate-400 italic">No members found</p>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Detail View (Main Area) */}
                <main className="flex-1 overflow-y-auto bg-white scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {selectedDetail ? (
                        <div className="p-8">
                            <MemberDetailView
                                member={selectedDetail.member}
                                stats={selectedDetail.stats}
                                contributions={selectedDetail.contributions}
                                loans={selectedDetail.loans}
                                nextOfKin={selectedDetail.nextOfKin}
                                showHeader={true}
                            />
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-6">
                                <Users className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Select a Member</h2>
                            <p className="text-slate-400 font-bold max-w-sm">Choose a member from the list on the left to view their detailed profile, financials, and history.</p>
                        </div>
                    )}
                </main>
            </div>

            {/* Enroll Modal (Copied from Registry) */}
            {isEnrollOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-8 animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-black text-slate-900 mb-4 tracking-tight uppercase italic">New Member Enrollment</h3>
                        {enrollError && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm font-bold border border-red-100">{enrollError}</div>}
                        <form action={async (formData) => {
                            try {
                                setEnrollError('');
                                await createUserAccount(formData);
                                setIsEnrollOpen(false);
                                // Refresh list would be good here, but for now we rely on revalidate
                                window.location.reload();
                            } catch (e: any) {
                                setEnrollError(e.message || 'Failed to create account');
                            }
                        }} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Full Name</label>
                                <input name="name" required className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-black focus:ring-4 focus:ring-cyan-500/10 transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Contact / Phone</label>
                                <input name="contact" required className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-black focus:ring-4 focus:ring-cyan-500/10 transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Email Address</label>
                                <input name="email" type="email" required className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-black focus:ring-4 focus:ring-cyan-500/10 transition-all" />
                            </div>

                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                                <div className="text-blue-500 shrink-0 mt-1">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                </div>
                                <p className="text-[10px] font-bold text-blue-600 leading-normal">
                                    A default password <span className="font-mono bg-blue-100 px-1 rounded">CapitalCrew@2024</span> will be assigned. The member must change it upon first login.
                                </p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Member Role</label>
                                <select name="role" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-black focus:ring-4 focus:ring-cyan-500/10 transition-all appearance-none cursor-pointer">
                                    <option value="MEMBER">Active Member</option>
                                    <option value="SECRETARY">Secretary</option>
                                    <option value="TREASURER">Treasurer</option>
                                    <option value="CHAIRPERSON">Chairperson</option>
                                </select>
                            </div>
                            <div className="flex gap-4 pt-2">
                                <button type="button" onClick={() => { setIsEnrollOpen(false); setEnrollError(''); }} className="flex-1 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Cancel</button>
                                <button type="submit" className="flex-[2] bg-cyan-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-cyan-500/20 hover:bg-cyan-600 transition-all">Enroll Member</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
