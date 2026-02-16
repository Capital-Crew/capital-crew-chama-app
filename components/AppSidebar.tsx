'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HeartHandshake } from 'lucide-react';

import {
    DashboardIcon, MembersIcon, LoansIcon,
    AuditLogIcon, SettingsIcon, UserRightsIcon, IncomeIcon as WalletIcon, FileTextIcon
} from './icons';
import { useModuleAccess } from '@/hooks/useModuleAccess';

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
        <Link
            href={href}
            className={`
                group relative flex items-center justify-between px-6 py-4 mx-4 rounded-2xl transition-all duration-300 ease-out
                ${active
                    ? 'bg-[#00c2e0] text-white shadow-[0_10px_30px_-10px_rgba(0,194,224,0.4)] translate-x-2'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white hover:translate-x-1'
                }
            `}
        >
            <div className="flex items-center gap-4 relative z-10">
                {/* Icon Container */}
                <div className={`
                    p-2 rounded-xl transition-all duration-300
                    ${active ? 'bg-white/20 text-white' : 'bg-transparent text-slate-500 group-hover:text-[#00c2e0] group-hover:bg-white/10'}
                `}>
                    {React.isValidElement(icon)
                        ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-5 h-5" })
                        : icon
                    }
                </div>

                {/* Label */}
                <span className={`
                    font-bold text-xs tracking-wider uppercase
                    ${active ? 'text-white' : 'font-semibold'}
                `}>
                    {label}
                </span>
            </div>

            {/* Badge */}
            {badge ? (
                <span className={`
                    flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black shadow-sm
                    ${active ? 'bg-white text-rose-600' : 'bg-rose-600 text-white group-hover:scale-110 transition-transform'}
                `}>
                    {badge}
                </span>
            ) : null}

            {/* Active Indicator Bar (Optional, if we want a line on the left instead of full pill) - keeping pill for "young" look */}
        </Link>
    );
};

export function AppSidebar({ user, approvalCount = 0, pendingLoanCount = 0 }: { user: { name: string, role: string }, approvalCount?: number, pendingLoanCount?: number }) {
    const pathname = usePathname();
    const { canAccess } = useModuleAccess();

    return (
        <aside className="hidden md:flex w-80 h-screen fixed inset-y-0 left-0 z-40 bg-[#0A192F] border-r border-white/10 shadow-2xl flex-col font-sans selection:bg-[#00c2e0] selection:text-white">
            {/* Header / Brand */}
            <div className="pt-10 pb-8 px-8">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00c2e0] to-[#00ffcc] flex-shrink-0" />
                    <h1 className="text-2xl font-black italic tracking-tighter text-white">
                        CAPITAL<span className="text-[#00c2e0]">CREW</span>
                    </h1>
                </div>
                <p className="pl-10 text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] opacity-80">
                    Governance OS
                </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 space-y-2 scrollbar-hide">
                <div className="px-8 pb-3 pt-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Main Menu</p>
                </div>

                {canAccess('DASHBOARD') && (
                    <NavItem icon={<DashboardIcon className="w-5 h-5" />} label="Dashboard" href="/dashboard" active={pathname === '/dashboard'} />
                )}

                {canAccess('APPROVALS') && (
                    <NavItem
                        icon={<UserRightsIcon className="w-5 h-5" />}
                        label="Approvals"
                        href="/admin/approvals"
                        active={pathname === '/admin/approvals'}
                        badge={approvalCount > 0 ? approvalCount : undefined}
                    />
                )}

                {canAccess('MEMBERS') && (
                    <NavItem icon={<MembersIcon className="w-5 h-5" />} label="Members" href="/members" active={pathname.startsWith('/members')} />
                )}

                {canAccess('LOANS') && (
                    <NavItem
                        icon={<LoansIcon className="w-5 h-5" />}
                        label="Loans"
                        href="/loans"
                        active={pathname === '/loans'}
                        badge={pendingLoanCount > 0 ? pendingLoanCount : undefined}
                    />
                )}

                {canAccess('WALLET') && (
                    <NavItem icon={<WalletIcon className="w-5 h-5" />} label="Wallet" href="/wallet" active={pathname === '/wallet'} />
                )}

                {canAccess('WELFARE') && (
                    <NavItem icon={<HeartHandshake className="w-5 h-5" />} label="Welfare" href="/welfare" active={pathname.startsWith('/welfare')} />
                )}

                <NavItem icon={<Activity className="w-5 h-5" />} label="Meetings" href="/meetings/report/new" active={pathname.startsWith('/meetings')} />

                {/* Admin Section - Dynamic Rendering */}
                {(canAccess('ACCOUNTS') || canAccess('ADMIN') || canAccess('AUDIT')) && (
                    <>
                        <div className="mt-8 mb-3 px-8 pt-6 border-t border-white/10">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Administration</p>
                        </div>

                        {canAccess('ACCOUNTS') && (
                            <NavItem icon={<FileTextIcon className="w-5 h-5" />} label="Chart of Accounts" href="/accounts" active={pathname === '/accounts'} />
                        )}

                        {canAccess('ADMIN') && (
                            <NavItem icon={<SettingsIcon className="w-5 h-5" />} label="System Admin" href="/admin/system" active={pathname === '/admin/system'} />
                        )}

                        {canAccess('AUDIT') && (
                            <NavItem icon={<AuditLogIcon className="w-5 h-5" />} label="Audit Trail" href="/audit" active={pathname === '/audit'} />
                        )}
                    </>
                )}
            </nav>

            {/* User Profile / Footer */}
            <div className="p-6 mt-auto">
                <div className="bg-white/5 backdrop-blur-md rounded-3xl p-4 border border-white/10 flex items-center gap-4 group cursor-pointer hover:bg-white/10 transition-all duration-300">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00c2e0] to-cyan-600 flex items-center justify-center text-white font-black text-sm shadow-md group-hover:scale-105 transition-transform">
                        {user.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate group-hover:text-[#00c2e0] transition-colors">{user.name || 'User'}</p>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{user.role}</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-[#00ffcc] shadow-[0_0_10px_rgba(0,255,204,0.6)] animate-pulse" />
                </div>
            </div>
        </aside>
    );
}
