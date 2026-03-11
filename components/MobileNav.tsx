'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HeartHandshake, Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
    DashboardIcon, MembersIcon, LoansIcon,
    AuditLogIcon, SettingsIcon, UserRightsIcon, IncomeIcon as WalletIcon, FileTextIcon
} from '@/components/icons';

import { useModuleAccess } from '@/hooks/useModuleAccess';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    href: string;
    active: boolean;
    hidden?: boolean;
    badge?: number;
    onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, href, active, hidden, badge, onClick }) => {
    if (hidden) return null;
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`
                group relative flex items-center justify-between px-6 py-4 mx-2 rounded-2xl transition-all duration-300
                ${active
                    ? 'bg-[#00c2e0] text-white shadow-md'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                }
            `}
        >
            <div className="flex items-center gap-4 relative z-10">
                <div className={`
                    p-2 rounded-xl transition-all duration-300
                    ${active ? 'bg-white/20 text-white' : 'bg-transparent text-slate-500 group-hover:text-[#00c2e0]'}
                `}>
                    {React.isValidElement(icon)
                        ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-5 h-5" })
                        : icon
                    }
                </div>
                <span className={`font-bold text-xs tracking-wider uppercase ${active ? 'text-white' : 'font-semibold'}`}>
                    {label}
                </span>
            </div>
            {badge ? (
                <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black ${active ? 'bg-white text-rose-600' : 'bg-rose-600 text-white'}`}>
                    {badge}
                </span>
            ) : null}
        </Link>
    );
};

export function MobileNav({ user, approvalCount = 0 }: { user: { name: string, role: string }, approvalCount?: number }) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const { canAccess } = useModuleAccess();

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {/* LIGHTHOUSE FIX 2.1: Add aria labels and control attributes to mobile menu button */}
                <button
                    className="md:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 focus:outline-none"
                    aria-label={open ? "Close navigation menu" : "Open navigation menu"}
                    aria-expanded={open}
                    aria-controls="mobile-navigation"
                >
                    {open ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
                </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80 bg-[#0A192F] border-r border-white/10 text-white flex flex-col h-full">
                <SheetHeader className="pt-10 pb-4 px-8 text-left shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00c2e0] to-[#00ffcc]" />
                        <SheetTitle className="text-2xl font-black italic tracking-tighter text-white">
                            CAPITAL<span className="text-[#00c2e0]">CREW</span>
                        </SheetTitle>
                    </div>
                </SheetHeader>

                {/* LIGHTHOUSE FIX 2.1: Provide matching ID for mobile menu controller */}
                <nav id="mobile-navigation" aria-hidden={!open} className="flex-1 overflow-y-auto py-4 space-y-1 scrollbar-hide">
                    {canAccess('DASHBOARD') && <NavItem icon={<DashboardIcon />} label="Dashboard" href="/dashboard" active={pathname === '/dashboard'} onClick={() => setOpen(false)} />}
                    {canAccess('APPROVALS') && <NavItem icon={<UserRightsIcon />} label="Approvals" href="/admin/approvals" active={pathname === '/admin/approvals'} badge={approvalCount > 0 ? approvalCount : undefined} onClick={() => setOpen(false)} />}
                    {canAccess('MEMBERS') && <NavItem icon={<MembersIcon />} label="Members" href="/members" active={pathname.startsWith('/members')} onClick={() => setOpen(false)} />}
                    {canAccess('LOANS') && <NavItem icon={<LoansIcon />} label="Loans" href="/loans" active={pathname === '/loans'} onClick={() => setOpen(false)} />}
                    {canAccess('WALLET') && <NavItem icon={<WalletIcon />} label="Wallet" href="/wallet" active={pathname === '/wallet'} onClick={() => setOpen(false)} />}
                    {canAccess('WELFARE') && <NavItem icon={<HeartHandshake />} label="Welfare" href="/welfare" active={pathname.startsWith('/welfare')} onClick={() => setOpen(false)} />}

                    {(canAccess('ACCOUNTS') || canAccess('ADMIN') || canAccess('AUDIT')) && (
                        <>
                            <div className="mt-6 mb-3 px-8 pt-6 border-t border-white/10">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Administration</p>
                            </div>
                            {canAccess('ACCOUNTS') && <NavItem icon={<FileTextIcon />} label="Chart of Accounts" href="/accounts" active={pathname === '/accounts'} onClick={() => setOpen(false)} />}
                            {canAccess('ADMIN') && <NavItem icon={<SettingsIcon />} label="System Admin" href="/admin/system" active={pathname === '/admin/system'} onClick={() => setOpen(false)} />}

                            {canAccess('AUDIT') && <NavItem icon={<AuditLogIcon />} label="Audit Trail" href="/audit" active={pathname === '/audit'} onClick={() => setOpen(false)} />}
                        </>
                    )}
                    {/* Spacer to Ensure Scrolling clears footer if needed, though flex should handle it */}
                    <div className="h-4"></div>
                </nav>

                <div className="shrink-0 p-6 bg-white/5 backdrop-blur border-t border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00c2e0] to-cyan-600 flex items-center justify-center text-white font-black text-xs">
                            {user.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{user.name}</p>
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{user.role}</p>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
