import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function getUserSettings() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: {
            member: true // Get member details for personal info
        }
    });

    return user;
}
