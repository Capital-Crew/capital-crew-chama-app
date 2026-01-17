
import { NotificationSettings } from '@/components/admin/NotificationSettings'
import { Separator } from '@/components/ui/separator'

export default function NotificationSettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Notification Settings</h3>
                <p className="text-sm text-muted-foreground">
                    Manage email alerts and mailing lists for system events.
                </p>
            </div>
            <Separator />
            <NotificationSettings />
        </div>
    )
}
