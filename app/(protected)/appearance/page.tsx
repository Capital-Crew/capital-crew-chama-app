import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/settings/theme-toggle"

export default function AppearancePage() {
    return (
        <div className="max-w-4xl mx-auto space-y-6 p-10">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Appearance</h2>
                <p className="text-slate-600 dark:text-slate-400">
                    Customize the appearance of the app. Automatically switch between day and night themes.
                </p>
            </div>
            <Separator className="dark:bg-slate-700" />
            <ThemeToggle />
        </div>
    )
}
