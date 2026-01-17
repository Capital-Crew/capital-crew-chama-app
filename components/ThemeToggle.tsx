"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Moon, Sun, Laptop, Shield } from "lucide-react"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <button className="btn btn-ghost btn-circle loading"></button>
    }

    return (
        <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost m-1">
                Theme
                <svg width="12px" height="12px" className="h-2 w-2 fill-current opacity-60 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048"><path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path></svg>
            </div>
            <ul tabIndex={0} className="dropdown-content z-[1] p-2 shadow-2xl bg-base-300 rounded-box w-52">
                <li>
                    <button
                        className={`btn btn-sm btn-block btn-ghost justify-start ${theme === 'light' ? 'bg-base-content/10' : ''}`}
                        onClick={() => setTheme("light")}
                    >
                        <Sun className="h-4 w-4 mr-2" /> Light
                    </button>
                </li>
                <li>
                    <button
                        className={`btn btn-sm btn-block btn-ghost justify-start ${theme === 'dark' ? 'bg-base-content/10' : ''}`}
                        onClick={() => setTheme("dark")}
                    >
                        <Moon className="h-4 w-4 mr-2" /> Dark
                    </button>
                </li>
                <li>
                    <button
                        className={`btn btn-sm btn-block btn-ghost justify-start ${theme === 'capital-crew' ? 'bg-base-content/10' : ''}`}
                        onClick={() => setTheme("capital-crew")}
                    >
                        <Shield className="h-4 w-4 mr-2" /> Capital Crew
                    </button>
                </li>
                <li>
                    <button
                        className={`btn btn-sm btn-block btn-ghost justify-start ${theme === 'system' ? 'bg-base-content/10' : ''}`}
                        onClick={() => setTheme("system")}
                    >
                        <Laptop className="h-4 w-4 mr-2" /> System
                    </button>
                </li>
            </ul>
        </div>
    )
}
