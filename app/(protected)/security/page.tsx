import { Separator } from "@/components/ui/separator"
import { PasswordChangeForm } from "@/components/settings/PasswordChangeForm"

export default function SecurityPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-6 p-10">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Security</h2>
                <p className="text-muted-foreground">
                    Update your password and manage your account security.
                </p>
            </div>
            <Separator />

            <div>
                <h3 className="text-lg font-medium mb-2">Change Password</h3>
                <p className="text-sm text-muted-foreground mb-6">
                    Ensure your account is using a strong password to stay secure.
                </p>
                <PasswordChangeForm />
            </div>
        </div>
    )
}
