"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
    const { theme = "system" } = useTheme()

    return (
        <Sonner
            theme={theme as ToasterProps["theme"]}
            position="top-center"
            expand={true}
            richColors={false}
            closeButton
            className="toaster group"
            gap={12}
            toastOptions={{
                unstyled: true,
                classNames: {
                    toast:
                        "group toast w-full min-w-[400px] max-w-[500px] rounded-2xl border shadow-2xl p-4 flex items-start gap-3 " +
                        "backdrop-blur-md transition-all duration-300 ease-out " +
                        "data-[type=default]:bg-white/80 data-[type=default]:border-gray-200/50 data-[type=default]:text-slate-900 " +
                        "dark:data-[type=default]:bg-black/80 dark:data-[type=default]:border-gray-800/50 dark:data-[type=default]:text-white " +
                        "data-[type=success]:bg-emerald-50/90 data-[type=success]:border-emerald-200/60 data-[type=success]:text-emerald-900 " +
                        "dark:data-[type=success]:bg-emerald-950/90 dark:data-[type=success]:border-emerald-800/60 dark:data-[type=success]:text-emerald-100 " +
                        "data-[type=error]:bg-red-50/90 data-[type=error]:border-red-300/70 data-[type=error]:text-red-900 " +
                        "dark:data-[type=error]:bg-red-950/90 dark:data-[type=error]:border-red-800/70 dark:data-[type=error]:text-red-100 " +
                        "data-[type=warning]:bg-amber-50/90 data-[type=warning]:border-amber-200/60 data-[type=warning]:text-amber-900 " +
                        "dark:data-[type=warning]:bg-amber-950/90 dark:data-[type=warning]:border-amber-800/60 dark:data-[type=warning]:text-amber-100 " +
                        "data-[type=info]:bg-cyan-50/90 data-[type=info]:border-cyan-200/60 data-[type=info]:text-cyan-900 " +
                        "dark:data-[type=info]:bg-cyan-950/90 dark:data-[type=info]:border-cyan-800/60 dark:data-[type=info]:text-cyan-100",

                    title: "text-sm font-semibold leading-tight",

                    description: "text-sm opacity-90 mt-1 leading-relaxed",

                    actionButton:
                        "ml-auto px-3 py-1.5 rounded-lg text-sm font-medium transition-colors " +
                        "bg-white/50 hover:bg-white/80 text-slate-900 " +
                        "dark:bg-white/10 dark:hover:bg-white/20 dark:text-white " +
                        "backdrop-blur-sm border border-white/20",

                    cancelButton:
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors " +
                        "bg-black/5 hover:bg-black/10 text-slate-700 " +
                        "dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300",

                    closeButton:
                        "!bg-transparent !border-0 hover:!bg-black/5 dark:hover:!bg-white/10 " +
                        "!text-slate-500 dark:!text-slate-400 transition-colors",

                    icon: "w-5 h-5 shrink-0 mt-0.5",
                },
                duration: 4000,
            }}
            {...props}
        />
    )
}

export { Toaster }
