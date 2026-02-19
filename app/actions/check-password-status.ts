import { db as prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function checkPasswordStatus() {
    const session = await auth();
    if (!session?.user?.id) return { mustChange: false };

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { mustChangePassword: true }
    });

    return { mustChange: user?.mustChangePassword || false };
}
