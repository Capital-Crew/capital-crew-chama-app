'use client';

import React from 'react';
import { ChevronRight, Users, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MembersListProps {
    members: any[];
    selectedId?: string;
    onSelect: (id: string) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

export function MembersList({ members, selectedId, onSelect, searchQuery, onSearchChange }: MembersListProps) {

    // Filter logic
    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.memberNumber.toString().includes(searchQuery)
    );

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            {}
            <div className="p-4 sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-10">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search members..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full bg-slate-100 border-none rounded-xl pl-10 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-slate-400"
                    />
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3 px-1">
                    {filteredMembers.length} Members Found
                </div>
            </div>

            {}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
                {filteredMembers.length === 0 ? (
                    <div className="py-12 text-center px-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Users className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-xs font-bold text-slate-400">No members match your search.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredMembers.map(m => (
                            <button
                                type="button"
                                key={m.id}
                                onClick={() => onSelect(m.id)}
                                className={cn(
                                    "w-full px-5 py-4 flex items-center justify-between transition-all active:bg-slate-100 text-left group",
                                    selectedId === m.id ? "bg-white border-l-4 border-l-cyan-500 shadow-sm" : "hover:bg-white"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all",
                                        selectedId === m.id
                                            ? "bg-gradient-to-br from-cyan-400 to-cyan-500 text-white shadow-cyan-200 shadow-lg scale-110"
                                            : "bg-white border border-slate-100 text-slate-400"
                                    )}>
                                        {m.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className={cn(
                                            "font-bold text-sm leading-tight transition-colors",
                                            selectedId === m.id ? "text-cyan-700" : "text-slate-700 group-hover:text-slate-900"
                                        )}>
                                            {m.name}
                                        </p>
                                        <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                                            #{m.memberNumber}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className={cn(
                                    "w-4 h-4 transition-all",
                                    selectedId === m.id ? "text-cyan-500 translate-x-1" : "text-slate-200"
                                )} />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
