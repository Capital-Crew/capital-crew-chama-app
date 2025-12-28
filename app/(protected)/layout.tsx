
import { auth } from "@/auth"
import { AppSidebar } from "@/components/AppSidebar"
import { redirect } from "next/navigation"

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const session = await auth()
    if (!session?.user) redirect("/login")

    return (
        <div className="min-h-screen bg-slate-50 flex text-slate-800 font-sans">
            <AppSidebar user={session.user as any} />
            <main className="flex-1 ml-72 p-12 max-w-7xl mx-auto w-full">
                {children}
            </main>
        </div>
    )
}
