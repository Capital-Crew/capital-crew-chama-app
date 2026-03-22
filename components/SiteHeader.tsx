'use client'

import { handleSignOut } from '@/app/auth-actions'
import { LogOut, User as UserIcon, Palette, Shield, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from 'next/link'
import { useTransition } from 'react'
import { getInitials, getAvatarUrl } from '@/lib/avatar-utils'

import { MobileNav } from '@/components/MobileNav'

export function SiteHeader({ user, approvalCount = 0 }: { user: { name: string, email?: string | null, image?: string | null, avatarPreset?: string | null, role: string }, approvalCount?: number }) {
    const [isPending, startTransition] = useTransition();

    const handleLogout = () => {
        startTransition(async () => {
            await handleSignOut();
        });
    };

    const avatarUrl = getAvatarUrl(user);
    const initials = getInitials(user.name);

    // Format role for display
    const formatRole = (role: string) => {
        return role.split('_').map(word =>
            word.charAt(0) + word.slice(1).toLowerCase()
        ).join(' ');
    };

    return (
        <header className="flex justify-between md:justify-end items-center mb-6 relative z-50">
            {}
            <div className="md:hidden">
                <MobileNav user={user as any} approvalCount={approvalCount} />
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="relative h-12 w-12 rounded-full ring-2 ring-slate-100 hover:ring-cyan-400 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={avatarUrl || ""} alt={user.name} />
                            <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-black text-sm">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    className="w-72 z-50 shadow-2xl border-slate-200 rounded-2xl p-2 backdrop-blur-sm bg-white/95"
                    align="end"
                    forceMount
                    sideOffset={12}
                >
                    {}
                    <DropdownMenuLabel className="font-normal p-0 mb-2">
                        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl p-4 text-white">
                            <div className="flex items-center gap-3 mb-3">
                                <Avatar className="h-12 w-12 ring-2 ring-white/30">
                                    <AvatarImage src={avatarUrl || ""} alt={user.name} />
                                    <AvatarFallback className="bg-white/20 text-white font-black">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black tracking-tight truncate">{user.name}</p>
                                    <span className="inline-block px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider mt-1">
                                        {formatRole(user.role)}
                                    </span>
                                </div>
                            </div>
                            {user.email && (
                                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
                                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span className="text-xs font-medium truncate">{user.email}</span>
                                </div>
                            )}
                        </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator className="bg-slate-100 my-2" />

                    {}
                    <DropdownMenuItem asChild>
                        <Link
                            href="/profile"
                            className="cursor-pointer px-3 py-2.5 rounded-xl font-bold text-sm hover:bg-cyan-50 hover:text-cyan-700 transition-all duration-200 group"
                        >
                            <UserIcon className="mr-3 h-4 w-4 text-slate-400 group-hover:text-cyan-600 transition-colors" />
                            <span>Profile Settings</span>
                        </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                        <Link
                            href="/appearance"
                            className="cursor-pointer px-3 py-2.5 rounded-xl font-bold text-sm hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 group"
                        >
                            <Palette className="mr-3 h-4 w-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
                            <span>Appearance</span>
                        </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                        <Link
                            href="/security"
                            className="cursor-pointer px-3 py-2.5 rounded-xl font-bold text-sm hover:bg-green-50 hover:text-green-700 transition-all duration-200 group"
                        >
                            <Shield className="mr-3 h-4 w-4 text-slate-400 group-hover:text-green-600 transition-colors" />
                            <span>Security</span>
                        </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-slate-100 my-2" />

                    {}
                    <DropdownMenuItem
                        onClick={handleLogout}
                        disabled={isPending}
                        className="cursor-pointer px-3 py-2.5 rounded-xl font-bold text-sm text-red-600 hover:bg-red-50 hover:text-red-700 hover:scale-[1.02] transition-all duration-200 focus:bg-red-50 focus:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <LogOut className="mr-3 h-4 w-4 group-hover:scale-110 transition-transform" />
                        <span>{isPending ? 'Signing out...' : 'Log out'}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    )
}
