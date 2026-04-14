'use client'

import React, { useState, useMemo } from 'react';
import { LoanNote, LoanNoteSubscription, User } from '@/lib/types';
import { GlassCard } from '@/components/ui/glass-card';
import { Money } from '@/components/Money';
import { LoanNoteCard } from './LoanNoteCard';
import { PremiumTabs } from '@/components/shared/PremiumTabs';
import { 
    SearchIcon, FilterIcon, PlusCircleIcon, 
    TrendingUpIcon, WalletIcon, Activity,
    BarChart3Icon
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { IssueNoteWizard } from './IssueNoteWizard';

interface LoanNoteMarketProps {
    notes: LoanNote[];
    userSubscriptions: LoanNoteSubscription[];
    userId: string;
}

export function LoanNoteMarket({ notes, userSubscriptions, userId }: LoanNoteMarketProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'market' | 'my-portfolio' | 'admin'>('market');
    const [isIssuing, setIsIssuing] = useState(false);

    // 1. Calculate Market Stats
    const stats = useMemo(() => {
        const activeNotes = notes.filter(n => n.status === 'ACTIVE' || n.status === 'OPEN');
        const totalVolume = activeNotes.reduce((sum, n) => sum + Number(n.totalAmount), 0);
        const myInvested = userSubscriptions.reduce((sum, s) => sum + Number(s.amount), 0);
        const avgROI = activeNotes.length > 0 
            ? activeNotes.reduce((sum, n) => sum + Number(n.interestRate), 0) / activeNotes.length 
            : 0;

        return { totalVolume, myInvested, avgROI, activeCount: activeNotes.length };
    }, [notes, userSubscriptions]);

    // 2. Filter Logic
    const filteredNotes = useMemo(() => {
        return notes.filter(n => {
            if (activeTab === 'market') return n.status === 'OPEN' || (n.status === 'ACTIVE' && n.floaterId === userId);
            if (activeTab === 'my-portfolio') return userSubscriptions.some(s => s.loanNoteId === n.id);
            if (activeTab === 'admin') return true; // Show all for admin view
            return false;
        }).filter(n => 
            n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.referenceNo.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [notes, searchTerm, activeTab, userSubscriptions, userId]);

    return (
        <div className="space-y-8 pb-20 bg-[#F0F2F5] min-h-screen -mx-4 px-4 pt-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter mb-1">
                        LOAN NOTE <span className="text-[#4F46E5]">MARKET</span>
                    </h1>
                    <p className="text-[#64748B] font-black text-[10px] uppercase tracking-[0.3em]">
                        High-Yield Peer-to-Peer Investment Portal
                    </p>
                </div>
                <Button 
                    onClick={() => setIsIssuing(true)}
                    className="rounded-2xl h-14 px-8 bg-[#312E81] text-white font-black tracking-tight hover:scale-105 transition-all duration-500 shadow-xl shadow-indigo-200"
                >
                    <PlusCircleIcon className="w-5 h-5 mr-3" />
                    ISSUE NEW NOTE
                </Button>
            </div>

            {/* Market Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {[
                    { label: 'Market Volume', value: stats.totalVolume, icon: <Activity className="text-indigo-600" />, bg: 'bg-indigo-50', border: 'border-indigo-100', prefix: 'KES' },
                    { label: 'Avg. ROI', value: stats.avgROI.toFixed(1) + '%', icon: <TrendingUpIcon className="text-emerald-600" />, bg: 'bg-emerald-50', border: 'border-emerald-100' },
                    { label: 'Opportunities', value: stats.activeCount, icon: <BarChart3Icon className="text-amber-600" />, bg: 'bg-amber-50', border: 'border-amber-100' },
                    { label: 'My Total', value: stats.myInvested, icon: <WalletIcon className="text-indigo-600" />, bg: 'bg-indigo-50', border: 'border-indigo-100', prefix: 'KES' },
                ].map((stat, i) => (
                    <div key={i} className="p-4 md:p-6 bg-white rounded-[24px] md:rounded-[32px] border border-slate-200 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] md:text-[11px] font-black text-[#64748B] uppercase tracking-widest leading-none mb-1 md:mb-2">{stat.label}</p>
                                <div className="text-xl md:text-2xl font-black text-[#0F172A]">
                                    {stat.prefix === 'KES' ? <Money amount={stat.value as number} /> : stat.value}
                                </div>
                            </div>
                            <div className={`p-2 md:p-3 ${stat.bg} ${stat.border} rounded-xl md:rounded-2xl border`}>
                                {stat.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter & Tab Section */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                <div className="w-full md:w-auto bg-slate-200/50 p-1.5 rounded-[24px]">
                    <PremiumTabs 
                        activeTab={activeTab} 
                        onChange={setActiveTab as any}
                        tabs={[
                            { id: 'market', label: 'Market Feed' },
                            { id: 'my-portfolio', label: 'My Portfolio' },
                            { id: 'admin', label: 'Registry' },
                        ]}
                    />
                </div>

                <div className="relative w-full md:w-80 group">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#4F46E5] transition-colors" />
                    <Input 
                        placeholder="Search notes or issuers..."
                        className="bg-white border-slate-200 rounded-2xl pl-12 h-14 text-[#0F172A] font-bold text-sm focus:ring-[#4F46E5]/10 transition-all placeholder:text-slate-400 shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Dialog open={isIssuing} onOpenChange={setIsIssuing}>
                <DialogContent className="max-w-[95vw] md:max-w-6xl max-h-[90vh] overflow-hidden p-0 rounded-[32px] border-none shadow-[0_32px_64px_rgba(0,0,0,0.2)]">
                    <div className="h-full max-h-[90vh] overflow-y-auto bg-[#F8FAFC]">
                        <IssueNoteWizard 
                            onCancel={() => setIsIssuing(false)} 
                            onComplete={() => setIsIssuing(false)} 
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Market Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                <AnimatePresence mode='popLayout'>
                    {filteredNotes.length > 0 ? (
                        filteredNotes.map((note) => (
                            <motion.div
                                key={note.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.4 }}
                            >
                                <LoanNoteCard note={note as any} userId={userId} />
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center">
                            <div className="p-12 bg-white rounded-[40px] border border-slate-200 inline-block shadow-sm">
                                <PlusCircleIcon className="w-16 h-16 text-[#64748B] mx-auto mb-6 opacity-10" />
                                <h3 className="text-xl font-black text-[#0F172A] tracking-tighter uppercase">
                                    No Current Opportunities
                                </h3>
                                <p className="text-[#64748B] font-black text-[10px] uppercase tracking-[0.2em] mt-3">
                                    Check back later for high-yield notes
                                </p>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
