'use client'

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { HeartHandshake, Menu, X, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
    DashboardIcon, MembersIcon, LoansIcon,
    AuditLogIcon, SettingsIcon, UserRightsIcon, IncomeIcon as WalletIcon, FileTextIcon
} from '@/components/icons';

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
                "group relative flex items-center justify-between px-6 py-4 mx-2 rounded-2xl transition-all duration-300",
                active
                    ? 'bg-[#00c2e0] text-white shadow-lg shadow-[#00c2e0]/20'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white',
                isPending && !active && "opacity-70 pointer-events-none"
            )}
        >
            <div className="flex items-center gap-4 relative z-10">
                <div className={cn(
                    "p-2 rounded-xl transition-all duration-300",
                    active ? 'bg-white/20 text-white' : 'bg-transparent text-slate-500 group-hover:text-[#00c2e0]'
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
                    "font-bold text-xs tracking-wider uppercase transition-all",
                    active ? 'text-white' : 'font-semibold'
                )}>
                    {label}
                </span>
            </div>
            {badge ? (
                <span className={cn(
                    "flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black",
                    active ? 'bg-white text-[#00c2e0]' : 'bg-rose-600 text-white'
                )}>
                    {badge}
                </span>
            ) : null}
        </a>
    );
};

export function MobileNav({ user, approvalCount = 0 }: { user: { name: string, role: string }, approvalCount?: number }) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const { canAccess } = useModuleAccess();
    const { push, isPending } = useNavigate();
    const [targetHref, setTargetHref] = useState<string | null>(null);

    const handleNavigate = (href: string) => {
        setTargetHref(href);
        push(href);
        // We don't close immediately to let the user see the pending indicator
        // But for UX, we should close once the transition is done.
        // useNavigate's isPending will turn false when transition finishes.
    };

    // Close sheet when navigation finishes
    React.useEffect(() => {
        if (!isPending && targetHref) {
            setOpen(false);
            setTargetHref(null);
        }
    }, [isPending, targetHref]);

    const renderNavItem = (props: Omit<NavItemProps, 'onNavigate' | 'isPending'>) => (
        <NavItem
            {...props}
            onNavigate={handleNavigate}
            isPending={isPending && targetHref === props.href}
        />
    );

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <button
                    className="md:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 focus:outline-none transition-transform active:scale-90"
                    aria-label={open ? "Close navigation menu" : "Open navigation menu"}
                >
                    {open ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
                </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80 bg-[#0A192F] border-r border-white/10 text-white flex flex-col h-full font-sans">
                <SheetHeader className="pt-10 pb-4 px-8 text-left shrink-0">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00c2e0] to-[#00ffcc] shadow-[0_0_15px_rgba(0,194,224,0.3)]" />
                        <SheetTitle className="text-2xl font-black italic tracking-tighter text-white">
                            CAPITAL<span className="text-[#00c2e0]">CREW</span>
                        </SheetTitle>
                    </div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] opacity-80">
                        Operational Excellence
                    </p>
                </SheetHeader>

                <nav id="mobile-navigation" className="flex-1 overflow-y-auto py-4 space-y-1 scrollbar-hide no-scrollbar">
                    {canAccess('DASHBOARD') && renderNavItem({ icon: <DashboardIcon />, label: "Dashboard", href: "/dashboard", active: pathname === '/dashboard' })}
                    {canAccess('APPROVALS') && renderNavItem({ icon: <UserRightsIcon />, label: "Approvals", href: "/admin/approvals", active: pathname === '/admin/approvals', badge: approvalCount > 0 ? approvalCount : undefined })}
                    {canAccess('MEMBERS') && renderNavItem({ icon: <MembersIcon />, label: "Members", href: "/members", active: pathname.startsWith('/members') })}
                    {canAccess('LOANS') && renderNavItem({ icon: <LoansIcon />, label: "Loans", href: "/loans", active: pathname === '/loans' })}
                    {canAccess('WALLET') && renderNavItem({ icon: <WalletIcon />, label: "Wallet", href: "/wallet", active: pathname === '/wallet' })}
                    {canAccess('WELFARE') && renderNavItem({ icon: <HeartHandshake />, label: "Welfare", href: "/welfare", active: pathname.startsWith('/welfare') })}

                    {(canAccess('ACCOUNTS') || canAccess('ADMIN') || canAccess('AUDIT')) && (
                        <>
                            <div className="mt-6 mb-3 px-8 pt-6 border-t border-white/5">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Administrative</p>
                            </div>
                            {["SYSTEM_ADMIN", "CHAIRPERSON"].includes(user.role) && renderNavItem({
                                icon: <UserRightsIcon />,
                                label: "User Rights",
                                href: "/admin/user-rights",
                                active: pathname === '/admin/user-rights'
                            })}
                            {canAccess('ACCOUNTS') && renderNavItem({ icon: <FileTextIcon />, label: "Accounts", href: "/accounts", active: pathname === '/accounts' })}
                            {canAccess('ADMIN') && renderNavItem({ icon: <SettingsIcon />, label: "System", href: "/admin/system", active: pathname === '/admin/system' })}
                            {canAccess('AUDIT') && renderNavItem({ icon: <AuditLogIcon />, label: "Audit Log", href: "/audit", active: pathname === '/audit' })}
                        </>
                    )}
                    <div className="h-8"></div>
                </nav>

                <div className="shrink-0 p-8 bg-[#001E2B]/50 backdrop-blur border-t border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00c2e0] to-cyan-700 flex items-center justify-center text-white font-black text-sm shadow-lg border border-white/10">
                            {user.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-white truncate uppercase tracking-tight">{user.name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{user.role}</p>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
