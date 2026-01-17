
'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

export async function getNotificationConfigs() {
    return await db.notificationConfig.findMany()
}

export async function updateNotificationConfig(
    event: string,
    data: { emails: string[], isActive: boolean }
) {
    const session = await auth()
    // Admin check
    if (!session?.user?.role || !['CHAIRPERSON', 'TREASURER', 'SECRETARY', 'SYSTEM_ADMIN'].includes(session.user.role)) {
        throw new Error("Unauthorized: Only Admins can manage notification settings")
    }

    // Upsert
    await db.notificationConfig.upsert({
        where: { event },
        update: {
            emails: data.emails,
            isActive: data.isActive
        },
        create: {
            event,
            emails: data.emails,
            isActive: data.isActive
        }
    })

    revalidatePath('/admin/settings') // Or wherever this page lives
}
