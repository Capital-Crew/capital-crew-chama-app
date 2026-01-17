'use client'

import { handleSignOut } from '@/app/auth-actions'
import { LogOut, User as UserIcon, Palette, Shield } from 'lucide-react'
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

export function SiteHeader({ user }: { user: { name: string, email?: string | null, image?: string | null, avatarPreset?: string | null } }) {
    const [isPending, startTransition] = useTransition();

    const handleLogout = () => {
        startTransition(async () => {
            await handleSignOut();
        });
    };

    const avatarUrl = getAvatarUrl(user);
    const initials = getInitials(user.name);

    return (
        <header className="flex justify-end items-center mb-6 relative z-50">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-12 w-12 rounded-full ring-2 ring-slate-100 hover:ring-cyan-200 transition-all">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={avatarUrl || ""} alt={user.name} />
                            <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-cyan-600 text-white font-black text-sm">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 z-[9999] shadow-2xl border-slate-200 rounded-2xl p-2" align="end" forceMount sideOffset={8}>
                    <DropdownMenuLabel className="font-normal px-3 py-3">
                        <div className="flex flex-col space-y-1.5">
                            <p className="text-sm font-black text-slate-800 tracking-tight">{user.name}</p>
                            <p className="text-xs font-bold text-slate-400">{user.email}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-100" />
                    <DropdownMenuItem asChild>
                        <Link href="/profile" className="cursor-pointer px-3 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors">
                            <UserIcon className="mr-3 h-4 w-4 text-slate-400" />
                            <span>Profile</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/appearance" className="cursor-pointer px-3 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors">
                            <Palette className="mr-3 h-4 w-4 text-slate-400" />
                            <span>Appearance</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/security" className="cursor-pointer px-3 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors">
                            <Shield className="mr-3 h-4 w-4 text-slate-400" />
                            <span>Security</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-100" />
                    <DropdownMenuItem
                        onClick={handleLogout}
                        disabled={isPending}
                        className="cursor-pointer px-3 py-2.5 rounded-xl font-bold text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors focus:bg-red-50 focus:text-red-700"
                    >
                        <LogOut className="mr-3 h-4 w-4" />
                        <span>{isPending ? 'Signing out...' : 'Log out'}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    )
}
