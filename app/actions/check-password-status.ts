import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function checkPasswordStatus() {
    const session = await auth();
    if (!session?.user?.id) return { mustChange: false };

    // TODO: Add mustChangePassword field to User model if needed
    // For now, return false as the field doesn't exist in the schema
    return { mustChange: false };
}
