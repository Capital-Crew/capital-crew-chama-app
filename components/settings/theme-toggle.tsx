"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sun, Citrus, Monitor, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
    const router = useRouter()
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null
    }

    const themes = [
        {
            id: "light",
            name: "Light",
            icon: Sun,
            description: "Clean and bright interface"
        },
        {
            id: "lemon",
            name: "Lemon",
            icon: Citrus,
            description: "Fresh and zesty vibes"
        },
        {
            id: "system",
            name: "System",
            icon: Monitor,
            description: "Follows your device settings"
        }
    ]

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2"
            >
                <ChevronLeft className="h-4 w-4" />
                Back to Dashboard
            </Button>

            {/* Theme Cards */}
            <div className="grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
                {themes.map((themeOption) => {
                    const Icon = themeOption.icon
                    const isActive = theme === themeOption.id

                    return (
                        <button
                            key={themeOption.id}
                            onClick={() => setTheme(themeOption.id)}
                            className={cn(
                                "relative flex flex-col items-center gap-4 rounded-2xl border-2 p-6 transition-all hover:scale-105",
                                "focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2",
                                isActive
                                    ? "border-yellow-500 bg-yellow-50 lemon:bg-yellow-100 shadow-lg"
                                    : "border-slate-200 lemon:border-yellow-300 hover:border-yellow-300 bg-white lemon:bg-yellow-50"
                            )}
                        >
                            {/* Icon */}
                            <div className={cn(
                                "rounded-full p-4 transition-colors",
                                isActive
                                    ? "bg-yellow-500 text-white"
                                    : "bg-slate-100 lemon:bg-yellow-200 text-slate-600 lemon:text-yellow-800"
                            )}>
                                <Icon className="h-8 w-8" />
                            </div>

                            {/* Theme Name */}
                            <div className="text-center">
                                <h3 className={cn(
                                    "font-bold text-lg",
                                    isActive
                                        ? "text-yellow-700 lemon:text-yellow-900"
                                        : "text-slate-900 lemon:text-yellow-900"
                                )}>
                                    {themeOption.name}
                                </h3>
                                <p className="text-xs text-slate-500 lemon:text-yellow-700 mt-1">
                                    {themeOption.description}
                                </p>
                            </div>

                            {/* Active Indicator */}
                            {isActive && (
                                <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-1.5 shadow-lg">
                                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Current Theme Display */}
            <div className="mt-8 p-4 bg-slate-100 lemon:bg-yellow-100 rounded-xl border border-slate-200 lemon:border-yellow-300">
                <p className="text-sm text-slate-600 lemon:text-yellow-800">
                    <span className="font-bold">Active theme:</span> {theme || 'system'}
                </p>
            </div>
        </div>
    )
}
