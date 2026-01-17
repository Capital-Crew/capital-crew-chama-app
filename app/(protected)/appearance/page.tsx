import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/settings/theme-toggle"

export default function AppearancePage() {
    return (
        <div className="max-w-4xl mx-auto space-y-6 p-10">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Appearance</h2>
                <p className="text-muted-foreground">
                    Customize the appearance of the app. Automatically switch between day and night themes.
                </p>
            </div>
            <Separator />
            <ThemeToggle />
        </div>
    )
}
