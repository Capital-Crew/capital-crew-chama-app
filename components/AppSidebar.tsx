
'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    DashboardIcon, MembersIcon, LoansIcon, ReportsIcon, BellIcon,
    AuditLogIcon, SettingsIcon, XIcon, UserRightsIcon
} from './icons';
import { UserRole } from '@/lib/types'; // Assuming types alias

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    href: string;
    active: boolean;
    hidden?: boolean;
    badge?: number;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, href, active, hidden, badge }) => {
    if (hidden) return null;
    return (
        <Link href={href} className={`w-full flex items-center justify-between gap-4 px-6 py-3.5 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${active ? 'bg-cyan-500 text-white shadow-xl shadow-cyan-500/20 translate-x-1' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}>
            <div className="flex items-center gap-4">{icon} <span>{label}</span></div>
            {badge ? <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${active ? 'bg-white text-cyan-500' : 'bg-cyan-500/10 text-cyan-500'}`}>{badge}</span> : null}
        </Link>
    );
};

export function AppSidebar({ user }: { user: { name: string, role: string } }) {
    const pathname = usePathname();

    // Basic role check (can strictly implement permissions if User object passed full)
    const isAdmin = user.role !== 'Member';

    return (
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 z-30 print-hidden shadow-2xl shadow-slate-200/50">
            <div className="p-10">
                <h1 className="text-3xl font-black text-cyan-500 tracking-tighter italic uppercase">CapitalCrew</h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Governance & Ops</p>
            </div>
            <nav className="flex-1 px-6 space-y-1">
                <NavItem icon={<DashboardIcon className="w-5 h-5" />} label="Portfolio" href="/dashboard" active={pathname === '/dashboard'} />
                <NavItem icon={<MembersIcon className="w-5 h-5" />} label="Members" href="/members" active={pathname === '/members'} />
                <NavItem icon={<LoansIcon className="w-5 h-5" />} label="Loans" href="/loans" active={pathname === '/loans'} />
                <NavItem icon={<ReportsIcon className="w-5 h-5" />} label="Intelligence" href="/reports" active={pathname === '/reports'} />

                <div className="pt-4 pb-2"><p className="px-6 text-[8px] font-black text-slate-300 uppercase tracking-widest">Admin Control</p></div>

                <NavItem icon={<BellIcon className="w-5 h-5" />} label="Alerts" href="/notifications" active={pathname === '/notifications'} />
                <NavItem icon={<AuditLogIcon className="w-5 h-5" />} label="Audit Trail" href="/audit" active={pathname === '/audit'} hidden={!isAdmin} />
                <NavItem icon={<SettingsIcon className="w-5 h-5" />} label="Settings" href="/settings" active={pathname === '/settings'} />
            </nav>
            <div className="p-8 border-t border-slate-100 mt-auto bg-slate-50/50">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center font-black text-cyan-500 shadow-inner">
                        {user.name.charAt(0)}
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-900">{user.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.role}</p>
                    </div>
                </div>

                {/* SignOut is usually a form/server action in Next.js */}
                <form action={async () => {
                    // await signOut() // Need to import signOut 
                }}>
                    <button className="w-full text-xs font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors flex items-center gap-2 px-2">
                        <XIcon className="w-4 h-4" /> Sign Out
                    </button>
                </form>
            </div>
        </aside>
    );
}
