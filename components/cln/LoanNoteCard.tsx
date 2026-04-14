import React from 'react';
import { Money } from '@/components/Money';
import { NoteStatusBadge } from './NoteStatusBadge';
import { CalendarIcon, TrendingUpIcon, UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface LoanNoteCardProps {
    note: {
        id: string;
        referenceNo: string;
        title: string;
        totalAmount: number;
        subscribedAmount: number;
        interestRate: number;
        tenorValue: number;
        tenorUnit: string;
        status: string;
        repaymentMode: string;
        floaterId: string;
    },
    userId?: string;
}

export function LoanNoteCard({ note, userId }: LoanNoteCardProps) {
    const progress = (note.subscribedAmount / note.totalAmount) * 100;
    const isFloater = note.floaterId === userId;

    return (
        <div className="group hover:scale-[1.02] transition-all duration-500 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl">
            <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-[#4F46E5] uppercase tracking-widest mb-1">
                            {note.referenceNo}
                        </span>
                        <h3 className="text-xl font-black text-[#0F172A] tracking-tighter group-hover:text-[#4F46E5] transition-colors leading-tight">
                            {note.title}
                        </h3>
                    </div>
                    <NoteStatusBadge status={note.status} />
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest leading-none">ROI (Annual)</p>
                        <div className="flex items-center gap-2">
                            <TrendingUpIcon className="w-4 h-4 text-emerald-600" />
                            <span className="text-xl font-black text-[#0F172A]">{note.interestRate}%</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest leading-none">Tenor</p>
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-indigo-600" />
                            <span className="text-xl font-black text-[#0F172A]">{note.tenorValue} {note.tenorUnit}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 mb-8">
                    <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-[#64748B] uppercase tracking-tight text-[10px]">Funding Progress</span>
                        <span className="text-[#4F46E5]">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div 
                            className="h-full bg-gradient-to-r from-[#4F46E5] to-[#0F172A] rounded-full transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight">
                        <div className="flex items-center gap-1 text-[#64748B]">
                           <UsersIcon className="w-3 h-3" />
                           <span>Subscribed</span>
                        </div>
                        <Money amount={note.subscribedAmount} className="text-[#0F172A]" />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight border-t border-slate-100 pt-2 mt-2">
                        <span className="text-[#64748B]">Target Goal</span>
                        <Money amount={note.totalAmount} className="text-[#0F172A]" />
                    </div>
                </div>

                <div className="flex gap-3">
                    <Link href={`/loan-notes/${note.id}`} className="flex-1">
                        <Button className="w-full rounded-2xl h-14 bg-slate-50 hover:bg-[#0F172A] text-[#0F172A] hover:text-white border-slate-200 font-black tracking-tight transition-all duration-500 shadow-sm border">
                            VIEW DETAILS
                        </Button>
                    </Link>
                    
                    {isFloater && note.status === 'ACTIVE' && (
                         <Button 
                            className="h-14 rounded-2xl px-6 bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-black tracking-tight shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
                            onClick={(e) => {
                                e.preventDefault();
                                window.location.href = `/loan-notes/${note.id}?action=post-returns`;
                            }}
                         >
                            POST RETURNS
                         </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
