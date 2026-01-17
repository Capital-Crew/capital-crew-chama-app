"use client"

import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
    const { setTheme, theme } = useTheme()

    return (
        <div className="grid max-w-3xl grid-cols-1 gap-8 sm:grid-cols-3">
            {/* LIGHT MODE */}
            <div onClick={() => setTheme("light")} className="cursor-pointer">
                <div className={cn("items-center rounded-md border-2 border-muted p-1 hover:border-accent", theme === "light" && "border-primary")}>
                    <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                        <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                            <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
                            <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                            <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                            <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                            <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                            <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                        </div>
                    </div>
                </div>
                <span className="block w-full p-2 text-center font-normal">Light</span>
            </div>

            {/* DARK MODE */}
            <div onClick={() => setTheme("dark")} className="cursor-pointer">
                <div className={cn("items-center rounded-md border-2 border-muted bg-slate-950 p-1 hover:border-accent", theme === "dark" && "border-primary")}>
                    <div className="space-y-2 rounded-sm bg-slate-800 p-2">
                        <div className="space-y-2 rounded-md bg-slate-950 p-2 shadow-sm">
                            <div className="h-2 w-[80px] rounded-lg bg-slate-800" />
                            <div className="h-2 w-[100px] rounded-lg bg-slate-800" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-slate-950 p-2 shadow-sm">
                            <div className="h-4 w-4 rounded-full bg-slate-800" />
                            <div className="h-2 w-[100px] rounded-lg bg-slate-800" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-slate-950 p-2 shadow-sm">
                            <div className="h-4 w-4 rounded-full bg-slate-800" />
                            <div className="h-2 w-[100px] rounded-lg bg-slate-800" />
                        </div>
                    </div>
                </div>
                <span className="block w-full p-2 text-center font-normal">Dark</span>
            </div>

            {/* SYSTEM MODE */}
            <div onClick={() => setTheme("system")} className="cursor-pointer">
                <div className={cn("items-center rounded-md border-2 border-muted bg-slate-950 p-1 hover:border-accent", theme === "system" && "border-primary")}>
                    <div className="space-y-2 rounded-sm bg-slate-800 p-2">
                        <div className="space-y-2 rounded-md bg-slate-950 p-2 shadow-sm">
                            <div className="h-2 w-[80px] rounded-lg bg-slate-800" />
                            <div className="h-2 w-[100px] rounded-lg bg-slate-800" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-slate-950 p-2 shadow-sm">
                            <div className="h-4 w-4 rounded-full bg-slate-800" />
                            <div className="h-2 w-[100px] rounded-lg bg-slate-800" />
                        </div>
                        <div className="flex items-center space-x-2 rounded-md bg-slate-950 p-2 shadow-sm">
                            <div className="h-4 w-4 rounded-full bg-slate-800" />
                            <div className="h-2 w-[100px] rounded-lg bg-slate-800" />
                        </div>
                    </div>
                </div>
                <span className="block w-full p-2 text-center font-normal">System</span>
            </div>
        </div>
    )
}
