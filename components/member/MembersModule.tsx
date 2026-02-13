'use client';

import React, { useState } from 'react';
import { MembersList } from './MembersList';
import { MemberProfileView } from './MemberProfileView';
import { getMemberFullDetail } from '@/app/actions/member-dashboard-actions';
import { createUserAccount } from '@/app/actions'; // For Enroll Modal
import { UserPlus, Users, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface MembersModuleProps {
    initialMembers: any[];
    initialDetail: any;
    userRole: string; // 'MEMBER' | 'ADMIN' etc
    currentUserId: string;
}

export function MembersModule({ initialMembers, initialDetail, userRole, currentUserId }: MembersModuleProps) {
    const isAdmin = ['SYSTEM_ADMIN', 'CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMINISTRATOR'].includes(userRole);
    const router = useRouter();

    // STATE
    const [selectedDetail, setSelectedDetail] = useState(initialDetail);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'LIST' | 'PROFILE'>('LIST'); // Mobile View Control
    const [isLoading, setIsLoading] = useState(false);
    const [isEnrollOpen, setIsEnrollOpen] = useState(false);
    const [enrollError, setEnrollError] = useState('');

    // HANDLERS
    const handleSelectMember = async (id: string) => {
        console.log(`[MembersModule] Selecting member: ${id}`);
        if (id === selectedDetail?.member?.id) {
            console.log(`[MembersModule] Member ${id} already selected`);
            // Already selected, just switch view on mobile
            setViewMode('PROFILE');
            return;
        }

        setIsLoading(true);
        try {
            console.log(`[MembersModule] Fetching details for ${id}`);
            const detail = await getMemberFullDetail(id);
            console.log(`[MembersModule] Received details for ${id}:`, detail ? 'Success' : 'Null');
            setSelectedDetail(detail);
            setViewMode('PROFILE');
        } catch (error) {
            console.error("Failed to fetch member details", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToList = () => {
        setViewMode('LIST');
    };

    // SCENARIO A: MEMBER (Direct Access)
    if (!isAdmin) {
        if (!initialDetail?.member) {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">Loading profile...</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-slate-50 p-4 md:p-8">
                <div className="max-w-5xl mx-auto bg-white rounded-[2rem] shadow-sm overflow-hidden border border-slate-100">
                    <MemberProfileView
                        member={initialDetail.member}
                        stats={initialDetail.stats}
                        contributions={initialDetail.contributions}
                        loans={initialDetail.loans}
                        contributionStatus={initialDetail.contributionStatus}
                        nextOfKin={initialDetail.nextOfKin}
                        currentUserRole={userRole}
                        currentUserId={currentUserId}
                    />
                </div>
            </div>
        );
    }

    // SCENARIO B: ADMIN (Master-Detail)
    return (
        <div className="h-[calc(100vh-100px)] md:h-[calc(100vh-120px)] flex flex-col md:flex-row gap-6 p-4 md:p-6 overflow-hidden">

            {/* LEFT PANEL: Member List (Visible on Mobile if LIST mode, Always visible on Desktop) */}
            <div className={cn(
                "w-full md:w-1/3 lg:w-80 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col",
                viewMode === 'PROFILE' ? "hidden md:flex" : "flex"
            )}>
                {/* Desktop "Enroll" Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                        <Users className="w-4 h-4 text-cyan-500" /> Directory
                    </h2>
                    <button
                        onClick={() => setIsEnrollOpen(true)}
                        className="bg-slate-900 hover:bg-slate-800 text-white p-2 rounded-lg transition-colors shadow-md"
                        title="Enroll New Member"
                    >
                        <UserPlus className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden">
                    <MembersList
                        members={initialMembers}
                        selectedId={selectedDetail?.member?.id}
                        onSelect={handleSelectMember}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                    />
                </div>
            </div>

            {/* RIGHT PANEL: Profile View (Visible on Mobile if PROFILE mode, Always visible on Desktop) */}
            <div className={cn(
                "flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative",
                viewMode === 'LIST' ? "hidden md:flex" : "flex"
            )}>
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
                        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
                    </div>
                ) : selectedDetail ? (
                    <div className="w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                        <MemberProfileView
                            member={selectedDetail.member}
                            stats={selectedDetail.stats}
                            contributions={selectedDetail.contributions}
                            contributionStatus={selectedDetail.contributionStatus}
                            loans={selectedDetail.loans}
                            nextOfKin={selectedDetail.nextOfKin}
                            currentUserRole={userRole}
                            currentUserId={currentUserId}
                            onBack={handleBackToList} // Passing Back Handler for Mobile
                        />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <Users className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-700">Select a Member</h3>
                        <p className="text-slate-400 font-medium">Choose from the list to view details.</p>
                    </div>
                )}
            </div>

            {/* Enroll Modal (Simplified for brevity, similar to previous implementation) */}
            {isEnrollOpen && (
                <EnrollModal onClose={() => setIsEnrollOpen(false)} />
            )}
        </div>
    );
}

// --- Enroll Modal Component ---
function EnrollModal({ onClose }: { onClose: () => void }) {
    const [enrollError, setEnrollError] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-8 animate-in zoom-in-95">
                <h3 className="text-xl font-black text-slate-900 mb-4 tracking-tight">New Member Enrollment</h3>
                {enrollError && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-4 text-xs font-bold border border-red-100">{enrollError}</div>}

                <form action={async (formData) => {
                    setIsSubmitting(true);
                    try {
                        setEnrollError('');
                        await createUserAccount(formData);
                        onClose();
                        window.location.reload();
                    } catch (e: any) {
                        setEnrollError(e.message || 'Failed to create account');
                    } finally {
                        setIsSubmitting(false);
                    }
                }} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Full Name</label>
                        <input name="name" required className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-black focus:ring-2 focus:ring-cyan-500/20 outline-none" placeholder="e.g. John Doe" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Contact / Phone</label>
                        <input name="contact" required className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-black focus:ring-2 focus:ring-cyan-500/20 outline-none" placeholder="e.g. +254 7..." />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Email Address</label>
                        <input name="email" type="email" required className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-black focus:ring-2 focus:ring-cyan-500/20 outline-none" placeholder="john@example.com" />
                    </div>

                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex gap-3 items-start">
                        <div className="text-blue-500 font-bold text-xs mt-0.5">ℹ️</div>
                        <p className="text-[10px] font-bold text-blue-600 leading-relaxed">
                            Default password: <span className="font-mono bg-blue-100 px-1 rounded">CapitalCrew@2024</span>. Member must change on first login.
                        </p>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Role</label>
                        <select name="role" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-black focus:ring-2 focus:ring-cyan-500/20 outline-none cursor-pointer">
                            <option value="MEMBER">Active Member</option>
                            <option value="SECRETARY">Secretary</option>
                            <option value="TREASURER">Treasurer</option>
                            <option value="CHAIRPERSON">Chairperson</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-3 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">Cancel</button>
                        <button disabled={isSubmitting} type="submit" className="flex-[2] bg-cyan-500 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-cyan-600 disabled:opacity-50 shadow-lg shadow-cyan-500/20">
                            {isSubmitting ? 'Enrolling...' : 'Enroll Member'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
