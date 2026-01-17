import { ProfileForm } from "@/components/settings/profile-form"
import { Separator } from "@/components/ui/separator"
import { getUserSettings } from "@/app/actions/get-user-settings"

export default async function ProfilePage() {
    const user = await getUserSettings();

    return (
        <div className="max-w-4xl mx-auto space-y-6 p-10">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Profile</h2>
                <p className="text-muted-foreground">
                    This is how others will see you on the site.
                </p>
            </div>
            <Separator />
            <ProfileForm user={user} />
        </div>
    )
}
