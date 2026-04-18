'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HeartHandshake, Activity, Mail, Loader2, TrendingUpIcon } from 'lucide-react';

import {
    DashboardIcon, MembersIcon, LoansIcon, ExpensesIcon,
    AuditLogIcon, SettingsIcon, UserRightsIcon, IncomeIcon as WalletIcon, FileTextIcon, ReportsIcon
} from './icons';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { useNavigate } from '@/hooks/useNavigate';
import { cn } from '@/lib/utils';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    href: string;
    active: boolean;
    hidden?: boolean;
    badge?: number;
    isPending?: boolean;
    onNavigate: (href: string) => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, href, active, hidden, badge, isPending, onNavigate }) => {
    if (hidden) return null;

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        onNavigate(href);
    };

    return (
        <a
            href={href}
            onClick={handleClick}
            className={cn(
                "group relative flex items-center justify-between px-6 py-4 mx-4 rounded-2xl transition-all duration-300 ease-out cursor-pointer",
                active
                    ? 'bg-[#001E2B]/80 text-[#00c2e0] border border-[#00c2e0]/20 shadow-[0_10px_30px_-10px_rgba(0,194,224,0.2)]'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white',
                isPending && !active && "opacity-70 pointer-events-none"
            )}
        >
            <div className="flex items-center gap-4 relative z-10">
                <div className={cn(
                    "p-2 rounded-xl transition-all duration-300",
                    active ? 'bg-[#00c2e0]/10 text-[#00c2e0] shadow-[0_0_15px_rgba(0,194,224,0.1)]' : 'bg-transparent text-slate-500 group-hover:text-[#00c2e0] group-hover:bg-white/5'
                )}>
                    {isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        React.isValidElement(icon)
                            ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-5 h-5" })
                            : icon
                    )}
                </div>

                <span className={cn(
                    "font-bold text-xs tracking-wider uppercase transition-colors",
                    active ? 'text-[#00c2e0]' : 'font-semibold'
                )}>
                    {label}
                </span>
            </div>

            {badge ? (
                <span className={cn(
                    "flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black shadow-sm",
                    active ? 'bg-[#00c2e0] text-white' : 'bg-rose-600 text-white group-hover:scale-110 transition-transform'
                )}>
                    {badge}
                </span>
            ) : null}

            {active && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#00c2e0] rounded-l-full shadow-[0_0_15px_rgba(0,194,224,0.5)]" />
            )}
        </a>
    );
};

export function AppSidebar({ user, approvalCount = 0, pendingLoanCount = 0 }: { user: { name: string, role: string, memberId?: string }, approvalCount?: number, pendingLoanCount?: number }) {
    const pathname = usePathname();
    const { canAccess } = useModuleAccess();
    const { push, isPending } = useNavigate();
    const [targetHref, setTargetHref] = useState<string | null>(null);

    const handleNavigate = (href: string) => {
        setTargetHref(href);
        push(href);
    };

    const renderNavItem = (props: Omit<NavItemProps, 'onNavigate' | 'isPending'>) => (
        <NavItem
            {...props}
            onNavigate={handleNavigate}
            isPending={isPending && targetHref === props.href}
        />
    );

    return (
        <aside className="hidden md:flex w-80 h-screen fixed inset-y-0 left-0 z-40 bg-[#0A192F] border-r border-white/10 shadow-[20px_0_50px_rgba(0,0,0,0.3)] flex-col font-sans">
            {}
            <div className="pt-10 pb-8 px-8 flex flex-col items-center border-b border-white/5">
                <div className="flex items-center gap-3 mb-2 group">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00c2e0] to-[#008291] flex-shrink-0 shadow-[0_0_20px_rgba(0,194,224,0.3)] group-hover:scale-110 transition-transform duration-500" />
                    <h1 className="text-2xl font-black italic tracking-tighter text-white">
                        CAPITAL<span className="text-[#00c2e0]">CREW</span>
                    </h1>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00ffcc] animate-pulse" />
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] opacity-80">
                        Operational Excellence
                    </p>
                </div>
            </div>

            {}
            <nav className="flex-1 overflow-y-auto py-4 space-y-1 mt-4 scrollbar-hide no-scrollbar">
                <div className="px-10 pb-3 pt-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Navigation Hub</p>
                </div>

                {canAccess('DASHBOARD') && renderNavItem({ icon: <DashboardIcon />, label: "Dashboard", href: "/dashboard", active: pathname === '/dashboard' })}

                {canAccess('APPROVALS') && renderNavItem({
                    icon: <UserRightsIcon />,
                    label: "Approvals",
                    href: "/admin/approvals",
                    active: pathname === '/admin/approvals',
                    badge: approvalCount > 0 ? approvalCount : undefined
                })}

                {canAccess('MEMBERS') && renderNavItem({ icon: <MembersIcon />, label: "Members", href: "/members", active: pathname.startsWith('/members') })}

                {canAccess('LOANS') && renderNavItem({
                    icon: <LoansIcon />,
                    label: "Loans",
                    href: "/loans",
                    active: pathname === '/loans',
                    badge: pendingLoanCount > 0 ? pendingLoanCount : undefined
                })}

                {canAccess('WALLET') && renderNavItem({ icon: <WalletIcon />, label: "My Wallet", href: "/wallet", active: pathname === '/wallet' })}
                
                {canAccess('NOTE_MARKET') && renderNavItem({ icon: <TrendingUpIcon />, label: "Note Market", href: "/loan-notes", active: pathname === '/loan-notes' })}

                {canAccess('WELFARE') && renderNavItem({ icon: <HeartHandshake />, label: "Welfare", href: "/welfare", active: pathname.startsWith('/welfare') })}

                {canAccess('MEETINGS') && renderNavItem({ icon: <Activity />, label: "Meetings", href: "/meetings", active: pathname.startsWith('/meetings') })}
                
                {canAccess('EXPENSES') && renderNavItem({ icon: <ExpensesIcon />, label: "Expenses", href: "/expenses", active: pathname.startsWith('/expenses') })}

                {canAccess('REPORTS_HUB') && renderNavItem({ icon: <ReportsIcon />, label: "Reports", href: "/reports", active: pathname === '/reports' })}

                {}
                {(canAccess('ACCOUNTS') || canAccess('ADMIN') || canAccess('AUDIT') || ["SYSTEM_ADMIN", "CHAIRPERSON"].includes(user.role)) && (
                    <>
                        <div className="mt-8 mb-3 px-10 pt-6 border-t border-white/5">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Administrative</p>
                        </div>

                        {["SYSTEM_ADMIN", "CHAIRPERSON"].includes(user.role) && renderNavItem({ icon: <UserRightsIcon />, label: "User Rights", href: "/admin/user-rights", active: pathname === '/admin/user-rights' })}

                        {canAccess('ACCOUNTS') && renderNavItem({ icon: <FileTextIcon />, label: "Accounts", href: "/accounts", active: pathname === '/accounts' })}

                        {canAccess('ADMIN') && renderNavItem({ icon: <SettingsIcon />, label: "System", href: "/admin/system", active: pathname === '/admin/system' })}

                        {canAccess('AUDIT') && renderNavItem({ icon: <AuditLogIcon />, label: "Audit Log", href: "/audit", active: pathname === '/audit' })}
                    </>
                )}
            </nav>

            {}
            <div className="p-8 mt-auto border-t border-white/5 bg-[#001E2B]/30 backdrop-blur-md">
                <a
                    href={user.memberId ? `/members/${user.memberId}` : '#'}
                    onClick={(e) => {
                        e.preventDefault();
                        if (user.memberId) handleNavigate(`/members/${user.memberId}`);
                    }}
                    className={cn(
                        "group bg-white/5 rounded-[2rem] p-4 border border-white/5 flex items-center gap-4 cursor-pointer hover:bg-white/10 hover:border-[#00c2e0]/30 transition-all duration-500",
                        isPending && targetHref === `/members/${user.memberId}` && "opacity-70 animate-pulse"
                    )}
                >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00c2e0] to-cyan-800 flex items-center justify-center text-white font-black text-lg shadow-lg group-hover:rotate-12 transition-transform duration-500 border border-white/10">
                        {user.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-white truncate group-hover:text-[#00c2e0] transition-colors uppercase tracking-tight">{user.name || 'User'}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{user.role}</p>
                    </div>
                </a>
            </div>
        </aside>
    );
}
