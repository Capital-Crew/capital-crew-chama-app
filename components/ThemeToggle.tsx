"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Moon, Sun, Laptop, Shield } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <Button variant="ghost" size="icon" className="loading" disabled />
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="m-1 font-bold">
                    Theme
                    <svg width="12px" height="12px" className="ml-2 h-2 w-2 fill-current opacity-60 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048"><path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path></svg>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 p-2 bg-white/95 backdrop-blur-sm border-slate-200 rounded-2xl shadow-2xl z-[1100]">
                <DropdownMenuItem
                    className={`cursor-pointer px-3 py-2 rounded-xl font-bold text-sm transition-all duration-200 ${theme === 'light' ? 'bg-cyan-50 text-cyan-700' : 'hover:bg-slate-50'}`}
                    onClick={() => setTheme("light")}
                >
                    <Sun className="h-4 w-4 mr-2" /> Light
                </DropdownMenuItem>
                <DropdownMenuItem
                    className={`cursor-pointer px-3 py-2 rounded-xl font-bold text-sm transition-all duration-200 ${theme === 'dark' ? 'bg-cyan-50 text-cyan-700' : 'hover:bg-slate-50'}`}
                    onClick={() => setTheme("dark")}
                >
                    <Moon className="h-4 w-4 mr-2" /> Dark
                </DropdownMenuItem>
                <DropdownMenuItem
                    className={`cursor-pointer px-3 py-2 rounded-xl font-bold text-sm transition-all duration-200 ${theme === 'capital-crew' ? 'bg-cyan-50 text-cyan-700' : 'hover:bg-slate-50'}`}
                    onClick={() => setTheme("capital-crew")}
                >
                    <Shield className="h-4 w-4 mr-2" /> Capital Crew
                </DropdownMenuItem>
                <DropdownMenuItem
                    className={`cursor-pointer px-3 py-2 rounded-xl font-bold text-sm transition-all duration-200 ${theme === 'system' ? 'bg-cyan-50 text-cyan-700' : 'hover:bg-slate-50'}`}
                    onClick={() => setTheme("system")}
                >
                    <Laptop className="h-4 w-4 mr-2" /> System
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
