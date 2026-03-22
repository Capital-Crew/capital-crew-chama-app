import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { checkPasswordStatus } from "@/app/actions/check-password-status"
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm"

export default async function ForceChangePasswordPage() {
    const session = await auth()
    if (!session) redirect("/login")

    // Double-check if they actually need to change it
    // If not, send them back to dashboard (prevents manual access)
    const { mustChange } = await checkPasswordStatus()
    if (!mustChange) {
        redirect("/dashboard")
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
            <ChangePasswordForm />
        </div>
    )
}
