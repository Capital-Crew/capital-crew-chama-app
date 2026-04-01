'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Member } from '@/lib/types';
import { toast } from '@/lib/toast';
import { directLoadContribution } from '@/app/actions/direct-contribution-loader-action';
import { XIcon, CheckCircle2Icon, Loader2Icon, AlertCircleIcon, SearchIcon, ChevronDownIcon } from 'lucide-react';

interface DirectContributionLoaderProps {
    members: Member[];
    isOpen: boolean;
    onClose: () => void;
}

/** Inline searchable dropdown — no portals, no z-index conflicts inside modals */
function InlineSelect({
    options,
    value,
    onChange,
    placeholder,
}: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selected = options.find(o => o.value === value);
    const filtered = options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()));

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => { setOpen(o => !o); setQuery(''); }}
                className="w-full flex items-center justify-between bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-cyan-500 transition-all text-left"
            >
                <span className={selected ? 'text-slate-900' : 'text-slate-400 font-medium'}>
                    {selected ? selected.label : (placeholder ?? 'Select...')}
                </span>
                <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute left-0 right-0 z-[200] mt-2 bg-white border-2 border-slate-100 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="p-2 border-b border-slate-50">
                        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                            <SearchIcon className="w-4 h-4 text-slate-400 shrink-0" />
                            <input
                                autoFocus
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search..."
                                className="flex-1 bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
                            />
                        </div>
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <p className="text-center text-xs text-slate-400 py-4 font-bold">No results found</p>
                        ) : (
                            filtered.map(o => (
                                <button
                                    key={o.value}
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        onChange(o.value);
                                        setOpen(false);
                                        setQuery('');
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors hover:bg-cyan-50 hover:text-cyan-700 flex items-center gap-2 ${value === o.value ? 'bg-cyan-50 text-cyan-700' : 'text-slate-700'}`}
                                >
                                    {value === o.value && <CheckCircle2Icon className="w-4 h-4 text-cyan-500 shrink-0" />}
                                    <span className="truncate">{o.label}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export function DirectContributionLoader({ members, isOpen, onClose }: DirectContributionLoaderProps) {
    const [memberId, setMemberId] = useState('');
    const [amount, setAmount] = useState('');
    const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('Balance Brought Forward');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!memberId || !amount || !effectiveDate) {
            toast.error("Please fill all required fields");
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await directLoadContribution({
                memberId,
                amount: parseFloat(amount),
                effectiveDate,
                description
            });

            if (result.success) {
                toast.success(`Success! Contribution balance loaded.`);
                setMemberId(''); setAmount('');
                onClose();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to load contribution");
        } finally {
            setIsSubmitting(false);
        }
    };

    const memberOptions = members.map(m => ({ value: m.id, label: `${m.name}${m.memberNumber ? ` (${m.memberNumber})` : ''}` }));

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl border-4 border-white overflow-visible animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
                {/* Header */}
                <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-center rounded-t-[2.5rem]">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white shadow-lg shadow-teal-200">
                                <CheckCircle2Icon className="w-5 h-5" />
                            </span>
                            Direct Contribution Loader
                        </h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Administrative Injection Tool</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 text-slate-400 transition-all hover:text-slate-900">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                        <AlertCircleIcon className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-700 font-bold leading-relaxed">
                            <span className="uppercase tracking-wider mr-1 text-amber-800">Note:</span>
                            This tool securely injects a historical contribution balance directly into the Member's equity and the core General Ledger.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Member */}
                        <div className="col-span-full space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Member</label>
                            <InlineSelect options={memberOptions} value={memberId} onChange={setMemberId} placeholder="Search for a member..." />
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Total Balance Brought Forward</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">KES</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-black text-slate-900 focus:outline-none focus:border-teal-500 transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        {/* Effective Date */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Effective Date</label>
                            <input
                                type="date"
                                value={effectiveDate}
                                onChange={(e) => setEffectiveDate(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-teal-500 transition-all"
                            />
                        </div>

                        {/* Description */}
                        <div className="col-span-full space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Description</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Balance Brought Forward"
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-teal-500 transition-all"
                            />
                        </div>
                    </div>

                    <button
                        disabled={isSubmitting}
                        className="w-full bg-slate-900 text-white rounded-[1.5rem] py-5 font-black uppercase tracking-tighter italic text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <><Loader2Icon className="w-6 h-6 animate-spin text-teal-400" /> Injecting...</>
                        ) : (
                            <><CheckCircle2Icon className="w-6 h-6 text-teal-400" /> Inject Contribution Balance</>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
